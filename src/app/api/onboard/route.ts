import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { OnboardSchema } from '@/lib/validators';
import { setSession } from '@/lib/session-store';
import type { UserProfile } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = OnboardSchema.parse(body);

    const profile: UserProfile = {
      id: nanoid(),
      topic: data.topic,
      goal: data.goal,
      availableHoursPerDay: data.availableHoursPerDay,
      learnerStyle: data.learnerStyle,
      createdAt: new Date().toISOString(),
    };

    setSession(profile.id, {
      profile,
      quizHistory: [],
    });

    return NextResponse.json({ profileId: profile.id, profile });
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid request', detail: String(err) },
      { status: 400 }
    );
  }
}
