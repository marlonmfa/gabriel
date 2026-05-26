import { NextRequest, NextResponse } from 'next/server';
import { TutorSchema } from '@/lib/validators';
import { anthropic } from '@/lib/anthropic';
import { openaiStreamToResponse } from '@/lib/stream-helpers';
import { buildTutorSystemPrompt } from '@/lib/prompts/tutor';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = TutorSchema.parse(body);

    const systemPrompt = buildTutorSystemPrompt({
      topic: data.profile.topic,
      goal: data.profile.goal,
      lifeGoal: (data.profile as { lifeGoal?: string }).lifeGoal,
      learnerStyle: data.profile.learnerStyle,
      urgency: (data.profile as { urgency?: string }).urgency,
      hasADHD: (data.profile as { hasADHD?: boolean }).hasADHD,
      gapAreas: data.profile.gapAreas ?? [],
      moduleTitle: data.moduleTitle,
      concepts: data.concepts,
      conceptMastery: data.conceptMastery as Record<string, number> | undefined,
    });

    const history = data.history.slice(-20);

    const stream = await anthropic.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1024,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: data.message },
      ],
    });

    return openaiStreamToResponse(stream);
  } catch (err) {
    return NextResponse.json(
      { error: 'Tutor failed', detail: String(err) },
      { status: 500 }
    );
  }
}
