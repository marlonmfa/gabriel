import { NextRequest, NextResponse } from 'next/server';
import { PlanSchema } from '@/lib/validators';
import { anthropic } from '@/lib/anthropic';
import { anthropicStreamToResponse } from '@/lib/stream-helpers';
import { buildPlanPrompt } from '@/lib/prompts/plan';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = PlanSchema.parse(body);

    const prompt = buildPlanPrompt({
      topic: data.profile.topic,
      goal: data.profile.goal,
      availableHoursPerDay: data.profile.availableHoursPerDay,
      learnerStyle: data.profile.learnerStyle,
      gapAreas: data.gapAreas,
      strengthAreas: data.strengthAreas,
    });

    const stream = anthropic.messages.stream({
      model: 'claude-opus-4-5',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    return anthropicStreamToResponse(stream);
  } catch (err) {
    return NextResponse.json(
      { error: 'Plan generation failed', detail: String(err) },
      { status: 500 }
    );
  }
}
