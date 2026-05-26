import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { AudioSummarySchema } from '@/lib/validators';

const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });
const anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text } = AudioSummarySchema.parse(body);

    // Use Claude to rewrite the text as a podcast-style narration first
    const narratedMsg = await anthropicClient.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [
        {
          role: 'user',
          content: `Rewrite the following educational content as a natural spoken podcast narration (60-90 seconds when read aloud).
Make it conversational, engaging, and easy to follow by ear — no bullet points, no markdown.
Use natural transitions and a friendly tone, as if explaining to a friend.

Content to narrate:
${text}

Respond with ONLY the narration text, nothing else.`,
        },
      ],
    });

    const narratedText = (narratedMsg.content[0] as { text: string }).text.trim();

    // Convert narration to speech with OpenAI TTS
    const speechResponse = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'nova',
      input: narratedText,
      response_format: 'mp3',
    });

    const audioBuffer = await speechResponse.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
        'Content-Length': String(audioBuffer.byteLength),
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
