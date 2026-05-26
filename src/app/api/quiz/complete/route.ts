import { NextRequest, NextResponse } from 'next/server';
import { QuizCompleteSchema } from '@/lib/validators';
import { updateSession } from '@/lib/session-store';
import type { KnowledgeProfile } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = QuizCompleteSchema.parse(body);
    const { profileId, quizHistory } = data;

    const conceptScores: Record<string, number> = {};
    for (const turn of quizHistory) {
      conceptScores[turn.concept] = turn.masteryScore;
    }

    const strengthAreas = quizHistory
      .filter((t) => t.masteryScore >= 0.7)
      .map((t) => t.concept);

    const gapAreas = quizHistory
      .filter((t) => t.masteryScore < 0.7)
      .sort((a, b) => a.masteryScore - b.masteryScore)
      .map((t) => t.concept);

    const knowledge: KnowledgeProfile = {
      userId: profileId,
      conceptScores,
      strengthAreas,
      gapAreas,
      recommendedStartingPoint: gapAreas[0] ?? quizHistory[0]?.concept ?? 'foundations',
      quizCompletedAt: new Date().toISOString(),
    };

    updateSession(profileId, (s) => ({ ...s, knowledge }));

    return NextResponse.json({ knowledgeProfile: knowledge });
  } catch (err) {
    return NextResponse.json(
      { error: 'Quiz complete failed', detail: String(err) },
      { status: 400 }
    );
  }
}
