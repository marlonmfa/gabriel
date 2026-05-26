'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GabrielLogo } from '@/components/shared/GabrielLogo';
import { StepIndicator } from '@/components/shared/StepIndicator';
import { ThinkingDots } from '@/components/shared/ThinkingDots';
import { TutorMessage } from '@/components/session/TutorMessage';
import { ConceptSidebar } from '@/components/session/ConceptSidebar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useGabriel } from '@/store/gabriel';
import { nanoid } from 'nanoid';
import { Send, Loader2, ArrowLeft } from 'lucide-react';
import type { ChatMessage } from '@/types';

const STEPS = [
  { label: 'Setup' },
  { label: 'Diagnostic' },
  { label: 'Your Plan' },
  { label: 'Learn' },
];

function SessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const moduleIndexParam = parseInt(searchParams.get('module') ?? '0');

  const {
    profileId,
    userProfile,
    knowledgeProfile,
    studyPlan,
    activeSession,
    addMessage,
    updateMastery,
  } = useGabriel();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [conceptMastery, setConceptMastery] = useState<Record<string, number>>({});

  const bottomRef = useRef<HTMLDivElement>(null);
  const hasOpened = useRef(false);

  const module = studyPlan?.modules[moduleIndexParam];

  const updateMsg = useCallback((id: string, content: string) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, content } : m)));
  }, []);

  // Open session with a welcome message
  useEffect(() => {
    if (!userProfile || !module || hasOpened.current) return;
    hasOpened.current = true;

    const fetchWelcome = async () => {
      setIsThinking(true);
      const msgId = nanoid();

      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          moduleId: module.id,
          moduleTitle: module.title,
          concepts: module.concepts,
          message: `Start the tutoring session for "${module.title}". Give me a warm personalized opening that acknowledges my learning goal and previews what we'll cover. End with a question about my current understanding of the first concept.`,
          history: [],
          profile: {
            topic: userProfile.topic,
            goal: userProfile.goal,
            lifeGoal: userProfile.lifeGoal,
            learnerStyle: userProfile.learnerStyle,
            urgency: userProfile.urgency,
            hasADHD: userProfile.hasADHD,
            gapAreas: knowledgeProfile?.gapAreas ?? [],
          },
          conceptMastery: activeSession?.conceptMastery ?? {},
        }),
      });

      setIsThinking(false);

      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      setMessages([{
        id: msgId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      }]);
      setStreamingId(msgId);
      setIsStreaming(true);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            setStreamingId(null);
            setIsStreaming(false);
            return;
          }
          try {
            const text = JSON.parse(data) as string;
            accumulated += text;
            updateMsg(msgId, accumulated);
          } catch { /* partial */ }
        }
      }
    };

    fetchWelcome();
  }, [userProfile, module]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming || isThinking || !userProfile || !module) return;

    const userText = input.trim();
    setInput('');

    const userMsg: ChatMessage = {
      id: nanoid(),
      role: 'user',
      content: userText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    const assistantId = nanoid();

    try {
      const history = messages.slice(-20).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          moduleId: module.id,
          moduleTitle: module.title,
          concepts: module.concepts,
          message: userText,
          history,
          profile: {
            topic: userProfile.topic,
            goal: userProfile.goal,
            lifeGoal: userProfile.lifeGoal,
            learnerStyle: userProfile.learnerStyle,
            urgency: userProfile.urgency,
            hasADHD: userProfile.hasADHD,
            gapAreas: knowledgeProfile?.gapAreas ?? [],
          },
          conceptMastery,
        }),
      });

      setIsThinking(false);

      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '', timestamp: new Date().toISOString() },
      ]);
      setStreamingId(assistantId);
      setIsStreaming(true);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            setStreamingId(null);
            setIsStreaming(false);

            // Optimistically increment mastery for the most-relevant concept
            const primaryConcept = module.concepts[0];
            if (primaryConcept) {
              const newScore = Math.min(1, (conceptMastery[primaryConcept] ?? 0) + 0.1);
              setConceptMastery((prev) => ({ ...prev, [primaryConcept]: newScore }));
              updateMastery(primaryConcept, newScore);

              // Fire-and-forget progress update
              fetch('/api/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  profileId,
                  moduleId: module.id,
                  conceptMastery: { [primaryConcept]: newScore },
                }),
              }).catch(() => {});
            }
            return;
          }
          try {
            const text = JSON.parse(data) as string;
            accumulated += text;
            updateMsg(assistantId, accumulated);
          } catch { /* partial */ }
        }
      }
    } catch {
      setIsThinking(false);
      setIsStreaming(false);
    }
  };

  if (!userProfile || !module) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p className="text-slate-400">Session not found.</p>
        <Button onClick={() => router.push('/plan')} className="bg-indigo-600 hover:bg-indigo-500 text-white">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Plan
        </Button>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col px-4 py-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <GabrielLogo size="sm" />
            <StepIndicator steps={STEPS} currentStep={3} />
          </div>
          <Button
            onClick={() => router.push('/plan')}
            variant="ghost"
            className="text-slate-400 hover:text-white text-xs"
          >
            <ArrowLeft className="w-3 h-3 mr-1" /> Plan
          </Button>
        </div>

        <div className="flex gap-4" style={{ height: 'calc(100vh - 140px)' }}>
          {/* Chat panel */}
          <div className="flex-1 glass rounded-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/5">
              <h2 className="text-sm font-semibold text-white">{module.title}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{module.concepts.join(' · ')}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {messages.map((msg) => (
                <TutorMessage
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

            <form onSubmit={handleSend} className="p-4 border-t border-white/5 flex gap-3">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                placeholder="Ask a question or share your thoughts..."
                disabled={isStreaming || isThinking}
                rows={2}
                className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500 rounded-xl resize-none"
              />
              <Button
                type="submit"
                disabled={isStreaming || isThinking || !input.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 self-end disabled:opacity-40"
              >
                {isThinking || isStreaming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
          </div>

          {/* Sidebar */}
          <div className="w-56 shrink-0 hidden md:block">
            <ConceptSidebar
              module={module}
              conceptMastery={conceptMastery}
              messageCount={messages.filter((m) => m.role === 'user').length}
              lastAssistantMessage={
                [...messages].reverse().find((m) => m.role === 'assistant' && m.content)?.content
              }
              isAudioLearner={userProfile?.learnerStyle === 'audio'}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SessionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <SessionContent />
    </Suspense>
  );
}
