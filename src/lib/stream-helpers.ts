import type OpenAI from 'openai';

const encoder = new TextEncoder();

export function openaiStreamToResponse(
  stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>
): Response {
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content;
          if (text) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(text)}\n\n`)
            );
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify('[ERROR]')}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
      Connection: 'keep-alive',
    },
  });
}

// Keep old name as alias so existing imports still work
export const anthropicStreamToResponse = openaiStreamToResponse;
