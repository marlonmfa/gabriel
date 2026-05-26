import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { ChallengeSchema, ChallengeCompleteSchema } from '@/lib/validators';
import { anthropic } from '@/lib/anthropic';
import { getSession, updateSession } from '@/lib/session-store';
import type { DailyChallenge } from '@/types';

async function generateChallenges(
  topic: string,
  goal: string,
  lifeGoal: string | undefined,
  gapAreas: string[],
  hasADHD: boolean,
): Promise<DailyChallenge[]> {
  const today = new Date().toISOString().split('T')[0];
  const focusConcept = gapAreas[0] ?? topic;

  const prompt = `You are Gabriel, an AI tutor creating daily micro-challenges for a student.

Student topic: ${topic}
Goal: ${goal}${lifeGoal ? `\nLife goal: ${lifeGoal}` : ''}
Focus concept today: ${focusConcept}
${hasADHD ? 'ADHD: Keep challenges 5 minutes max, very concrete and actionable.' : ''}

Create 3 daily micro-challenges for today. Each challenge:
- Takes 5-15 minutes to complete
- Is a concrete action (solve a problem, write an explanation, watch a video and summarize, etc.)
- Directly builds toward their goal
- Gives XP: easy=10, medium=20, hard=30

Respond with a JSON array only, no other text:
[
  {
    "title": "Short action title",
    "description": "Clear 1-2 sentence description of exactly what to do",
    "concept": "which concept this trains",
    "estimatedMinutes": 10,
    "xp": 20
  }
]`;

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = (response.content[0] as { text: string }).text.trim();
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Invalid challenge response');

  const raw = JSON.parse(jsonMatch[0]) as Array<{
    title: string;
    description: string;
    concept: string;
    estimatedMinutes: number;
    xp: number;
  }>;

  return raw.map((c) => ({
    id: nanoid(),
    profileId: '',
    date: today,
    title: c.title,
    description: c.description,
    concept: c.concept,
    estimatedMinutes: c.estimatedMinutes,
    completed: false,
    xp: c.xp,
  }));
}

export async function GET(req: NextRequest) {
  const profileId = req.nextUrl.searchParams.get('profileId');
  if (!profileId) return NextResponse.json({ error: 'profileId required' }, { status: 400 });

  const session = getSession(profileId);
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

  const today = new Date().toISOString().split('T')[0];
  const existingToday = (session.challenges ?? []).filter((c) => c.date === today);

  if (existingToday.length > 0) {
    return NextResponse.json({ challenges: existingToday });
  }

  // Generate new challenges for today
  try {
    const challenges = await generateChallenges(
      session.profile.topic,
      session.profile.goal,
      session.profile.lifeGoal,
      session.knowledge?.gapAreas ?? [],
      session.profile.hasADHD,
    );

    const withProfileId = challenges.map((c) => ({ ...c, profileId }));

    updateSession(profileId, (s) => ({
      ...s,
      challenges: [...(s.challenges ?? []), ...withProfileId],
    }));

    return NextResponse.json({ challenges: withProfileId });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body as { action: string };

  if (action === 'complete') {
    const data = ChallengeCompleteSchema.parse(body);
    const session = getSession(data.profileId);
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    const challenge = (session.challenges ?? []).find((c) => c.id === data.challengeId);
    if (!challenge) return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });

    updateSession(data.profileId, (s) => ({
      ...s,
      challenges: (s.challenges ?? []).map((c) =>
        c.id === data.challengeId
          ? { ...c, completed: true, completedAt: new Date().toISOString() }
          : c
      ),
      totalXP: (s.totalXP ?? 0) + challenge.xp,
    }));

    return NextResponse.json({ ok: true, xpEarned: challenge.xp });
  }

  if (action === 'generate') {
    const { profileId } = ChallengeSchema.parse(body);
    const session = getSession(profileId);
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    try {
      const challenges = await generateChallenges(
        session.profile.topic,
        session.profile.goal,
        session.profile.lifeGoal,
        session.knowledge?.gapAreas ?? [],
        session.profile.hasADHD,
      );
      const withProfileId = challenges.map((c) => ({ ...c, profileId }));
      const today = new Date().toISOString().split('T')[0];
      updateSession(profileId, (s) => ({
        ...s,
        challenges: [...(s.challenges ?? []).filter((c) => c.date !== today), ...withProfileId],
      }));
      return NextResponse.json({ challenges: withProfileId });
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
