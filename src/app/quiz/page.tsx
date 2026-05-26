'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { GabrielLogo } from '@/components/shared/GabrielLogo';
import { StepIndicator } from '@/components/shared/StepIndicator';
import { ThinkingDots } from '@/components/shared/ThinkingDots';
import { QuizMessage } from '@/components/quiz/QuizMessage';
import { QuizProgress } from '@/components/quiz/QuizProgress';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useGabriel } from '@/store/gabriel';
import { useStream } from '@/hooks/useStream';
import { nanoid } from 'nanoid';
import { ArrowRight, Loader2, Send } from 'lucide-react';
import { QUIZ_CONCEPTS } from '@/lib/prompts/quiz';
import type { ChatMessage, QuizTurn } from '@/types';

const STEPS = [
  { label: 'Setup' },
  { label: 'Diagnostic' },
  { label: 'Your Plan' },
  { label: 'Learn' },
];

const TOTAL_QUESTIONS = 5;

type Phase = 'questioning' | 'awaiting-answer' | 'evaluating' | 'feedback' | 'done';

export default function QuizPage() {
  const router = useRouter();
  const { profileId, userProfile, addQuizTurn, setKnowledge } = useGabriel();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState<Phase>('questioning');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [currentConcept, setCurrentConcept] = useState(QUIZ_CONCEPTS[0]);
  const [isThinking, setIsThinking] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);

  const addMsg = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const updateLastMsg = useCallback((id: string, content: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content } : m))
    );
  }, []);

  const { stream } = useStream({
    onDone: (text) => {
      if (streamingId) updateLastMsg(streamingId, text);
      setStreamingId(null);
      setPhase('awaiting-answer');
    },
  });

  const askQuestion = useCallback(
    async (index: number) => {
      if (!userProfile) return;
      const concept = QUIZ_CONCEPTS[index % QUIZ_CONCEPTS.length];
      setCurrentConcept(concept);
      setPhase('questioning');

      const msgId = nanoid();
      addMsg({
        id: msgId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      });
      setStreamingId(msgId);

      await stream('/api/quiz', {
        profileId,
        profile: {
          topic: userProfile.topic,
          goal: userProfile.goal,
          learnerStyle: userProfile.learnerStyle,
        },
        conceptIndex: index,
        concept,
      });
    },
    [userProfile, profileId, addMsg, stream]
  );

  // Ask first question on mount
  useEffect(() => {
    if (!userProfile || hasStarted.current) return;
    hasStarted.current = true;
    askQuestion(0);
  }, [userProfile, askQuestion]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || phase !== 'awaiting-answer' || !userProfile) return;

    const answer = input.trim();
    setInput('');

    addMsg({
      id: nanoid(),
      role: 'user',
      content: answer,
      timestamp: new Date().toISOString(),
    });

    setPhase('evaluating');
    setIsThinking(true);

    try {
      const evalRes = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          profile: { topic: userProfile.topic, goal: userProfile.goal, learnerStyle: userProfile.learnerStyle },
          userAnswer: answer,
          concept: currentConcept,
          conceptIndex: questionIndex,
        }),
      });

      const evalData = await evalRes.json();
      const { evaluation } = evalData;

      const turn: QuizTurn = {
        questionId: nanoid(),
        concept: currentConcept,
        question: messages.findLast((m) => m.role === 'assistant')?.content ?? '',
        userAnswer: answer,
        evaluation: evaluation.evaluation,
        masteryScore: evaluation.score,
        feedbackGiven: evaluation.feedback,
      };
      addQuizTurn(turn);

      setIsThinking(false);
      setPhase('feedback');

      const feedbackId = nanoid();
      addMsg({
        id: feedbackId,
        role: 'assistant',
        content: evaluation.feedback,
        timestamp: new Date().toISOString(),
      });

      const nextIndex = questionIndex + 1;

      if (nextIndex >= TOTAL_QUESTIONS) {
        // Complete quiz
        setTimeout(async () => {
          setPhase('done');
          const allTurns = useGabriel.getState().quizHistory.concat(turn);

          const completeRes = await fetch('/api/quiz/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profileId, quizHistory: allTurns }),
          });
          const completeData = await completeRes.json();
          setKnowledge(completeData.knowledgeProfile);

          addMsg({
            id: nanoid(),
            role: 'assistant',
            content: "Great work! I've mapped your knowledge. Let me build your personalized study plan now...",
            timestamp: new Date().toISOString(),
          });

          setTimeout(() => router.push('/plan'), 2000);
        }, 1200);
      } else {
        setQuestionIndex(nextIndex);
        setTimeout(() => askQuestion(nextIndex), 1200);
      }
    } catch {
      setIsThinking(false);
      setPhase('awaiting-answer');
    }
  };

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">No profile found.</p>
          <Button onClick={() => router.push('/onboard')} className="bg-indigo-600 hover:bg-indigo-500 text-white">
            Start Over <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  const displayIndex = Math.min(questionIndex + 1, TOTAL_QUESTIONS);

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-xl flex flex-col gap-6">
        <div className="flex flex-col gap-4 items-center">
          <GabrielLogo size="sm" />
          <StepIndicator steps={STEPS} currentStep={1} />
        </div>

        <div className="glass rounded-2xl overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 280px)', minHeight: 400 }}>
          <div className="p-4 border-b border-white/5">
            <QuizProgress
              current={displayIndex}
              total={TOTAL_QUESTIONS}
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {messages.map((msg) => (
              <QuizMessage
                key={msg.id}
                role={msg.role}
                content={msg.content}
                isStreaming={msg.id === streamingId}
              />
            ))}
            {isThinking && (
              <div className="flex gap-3 items-start">
                <GabrielLogo size="sm" showText={false} />
                <div className="message-assistant rounded-2xl rounded-tl-sm">
                  <ThinkingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-4 border-t border-white/5 flex gap-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={phase === 'awaiting-answer' ? 'Type your answer...' : 'Waiting...'}
              disabled={phase !== 'awaiting-answer'}
              rows={2}
              className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500 rounded-xl resize-none"
            />
            <Button
              type="submit"
              disabled={phase !== 'awaiting-answer' || !input.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 self-end disabled:opacity-40"
            >
              {phase === 'evaluating' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500">
          Shift+Enter for new line · Enter to submit
        </p>
      </div>
    </main>
  );
}
