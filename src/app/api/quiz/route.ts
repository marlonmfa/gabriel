import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { QuizSchema } from '@/lib/validators';
import { anthropic } from '@/lib/anthropic';
import { anthropicStreamToResponse } from '@/lib/stream-helpers';
import { getSession, updateSession } from '@/lib/session-store';
import {
  QUIZ_CONCEPTS,
  buildQuizQuestionPrompt,
  buildQuizEvalPrompt,
  EVALUATE_ANSWER_TOOL,
} from '@/lib/prompts/quiz';
import type { QuizTurn } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = QuizSchema.parse(body);

    const { profileId, profile, userAnswer, conceptIndex, concept } = data;

    // If there's an answer, evaluate it first (non-streaming, tool_use)
    if (userAnswer && concept) {
      const session = getSession(profileId);
      const lastQuestion =
        session?.quizHistory[session.quizHistory.length - 1]?.question ?? '';

      const evalResponse = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        tools: [EVALUATE_ANSWER_TOOL],
        tool_choice: { type: 'tool', name: 'evaluate_answer' },
        messages: [
          {
            role: 'user',
            content: buildQuizEvalPrompt(
              profile.topic,
              concept,
              lastQuestion,
              userAnswer
            ),
          },
        ],
      });

      const toolBlock = evalResponse.content.find(
        (b) => b.type === 'tool_use'
      );
      if (!toolBlock || toolBlock.type !== 'tool_use') {
        return NextResponse.json({ error: 'Eval failed' }, { status: 500 });
      }

      const evalResult = toolBlock.input as {
        score: number;
        evaluation: string;
        feedback: string;
      };

      // Persist this turn
      const turn: QuizTurn = {
        questionId: nanoid(),
        concept,
        question: lastQuestion,
        userAnswer,
        evaluation: evalResult.evaluation as QuizTurn['evaluation'],
        masteryScore: evalResult.score,
        feedbackGiven: evalResult.feedback,
      };

      updateSession(profileId, (s) => ({
        ...s,
        quizHistory: [...s.quizHistory, turn],
      }));

      return NextResponse.json({ evaluation: evalResult, turn });
    }

    // Otherwise stream the next question
    const session = getSession(profileId);
    const quizHistory = session?.quizHistory ?? [];
    const targetConcept =
      concept ?? QUIZ_CONCEPTS[conceptIndex % QUIZ_CONCEPTS.length];

    const previousTurns = quizHistory.map((t) => ({
      question: t.question,
      answer: t.userAnswer,
    }));

    const stream = anthropic.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: buildQuizQuestionPrompt(
            profile.topic,
            targetConcept,
            previousTurns
          ),
        },
      ],
    });

    return anthropicStreamToResponse(stream);
  } catch (err) {
    return NextResponse.json(
      { error: 'Quiz failed', detail: String(err) },
      { status: 500 }
    );
  }
}
