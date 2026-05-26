import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { QuizSchema } from '@/lib/validators';
import { anthropic } from '@/lib/anthropic';
import { openaiStreamToResponse } from '@/lib/stream-helpers';
import { getSession, updateSession } from '@/lib/session-store';
import {
  QUIZ_CONCEPTS,
  buildQuizQuestionPrompt,
  buildQuizEvalPrompt,
} from '@/lib/prompts/quiz';
import type { QuizTurn } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = QuizSchema.parse(body);
    const { profileId, profile, userAnswer, conceptIndex, concept } = data;

    // Evaluate answer (non-streaming, structured JSON via response_format)
    if (userAnswer && concept) {
      const session = getSession(profileId);
      const lastQuestion =
        session?.quizHistory[session.quizHistory.length - 1]?.question ?? '';

      const evalResponse = await anthropic.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 256,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'You evaluate student quiz answers. Always respond with valid JSON: { "score": number 0.0-1.0, "evaluation": "correct"|"partial"|"incorrect", "feedback": "one encouraging sentence" }',
          },
          {
            role: 'user',
            content: buildQuizEvalPrompt(profile.topic, concept, lastQuestion, userAnswer),
          },
        ],
      });

      const raw = evalResponse.choices[0]?.message?.content ?? '{}';
      const evalResult = JSON.parse(raw) as {
        score: number;
        evaluation: string;
        feedback: string;
      };

      const turn: QuizTurn = {
        questionId: nanoid(),
        concept,
        question: lastQuestion,
        userAnswer,
        evaluation: evalResult.evaluation as QuizTurn['evaluation'],
        masteryScore: evalResult.score ?? 0.5,
        feedbackGiven: evalResult.feedback ?? 'Good effort!',
      };

      updateSession(profileId, (s) => ({
        ...s,
        quizHistory: [...s.quizHistory, turn],
      }));

      return NextResponse.json({ evaluation: evalResult, turn });
    }

    // Stream next question
    const session = getSession(profileId);
    const quizHistory = session?.quizHistory ?? [];
    const targetConcept = concept ?? QUIZ_CONCEPTS[conceptIndex % QUIZ_CONCEPTS.length];

    const previousTurns = quizHistory.map((t) => ({
      question: t.question,
      answer: t.userAnswer,
    }));

    const stream = await anthropic.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 200,
      stream: true,
      messages: [
        {
          role: 'user',
          content: buildQuizQuestionPrompt(profile.topic, targetConcept, previousTurns),
        },
      ],
    });

    return openaiStreamToResponse(stream);
  } catch (err) {
    return NextResponse.json(
      { error: 'Quiz failed', detail: String(err) },
      { status: 500 }
    );
  }
}
