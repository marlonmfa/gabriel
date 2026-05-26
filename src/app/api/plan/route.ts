import { NextRequest, NextResponse } from 'next/server';
import { PlanSchema } from '@/lib/validators';
import { anthropic } from '@/lib/anthropic';
import { openaiStreamToResponse } from '@/lib/stream-helpers';
import { buildPlanPrompt } from '@/lib/prompts/plan';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = PlanSchema.parse(body);

    const prompt = buildPlanPrompt({
      topic: data.profile.topic,
      goal: data.profile.goal,
      lifeGoal: data.profile.lifeGoal,
      availableHoursPerDay: data.profile.availableHoursPerDay,
      learnerStyle: data.profile.learnerStyle,
      urgency: data.profile.urgency,
      hasADHD: data.profile.hasADHD,
      gapAreas: data.gapAreas,
      strengthAreas: data.strengthAreas,
    });

    const stream = await anthropic.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1500,
      stream: true,
      messages: [{ role: 'user', content: prompt }],
    });

    return openaiStreamToResponse(stream);
  } catch (err) {
    return NextResponse.json(
      { error: 'Plan generation failed', detail: String(err) },
      { status: 500 }
    );
  }
}
