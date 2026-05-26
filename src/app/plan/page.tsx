'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { GabrielLogo } from '@/components/shared/GabrielLogo';
import { StepIndicator } from '@/components/shared/StepIndicator';
import { ModuleCard } from '@/components/plan/ModuleCard';
import { PlanSkeleton } from '@/components/plan/PlanSkeleton';
import { useGabriel } from '@/store/gabriel';
import { Sparkles } from 'lucide-react';

const STEPS = [
  { label: 'Setup' },
  { label: 'Diagnostic' },
  { label: 'Your Plan' },
  { label: 'Learn' },
];

export default function PlanPage() {
  const router = useRouter();
  const { profileId, userProfile, knowledgeProfile, studyPlan, setPlan, setActiveModuleIndex, startSession } = useGabriel();

  const [streamingText, setStreamingText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const hasStarted = useRef(false);

  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    if (!userProfile || !knowledgeProfile || hasStarted.current || studyPlan) return;
    hasStarted.current = true;

    const fetchPlan = async () => {
      let accumulated = '';
      setIsStreaming(true);
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          profile: {
            topic: userProfile.topic,
            goal: userProfile.goal,
            availableHoursPerDay: userProfile.availableHoursPerDay,
            learnerStyle: userProfile.learnerStyle,
          },
          gapAreas: knowledgeProfile.gapAreas,
          strengthAreas: knowledgeProfile.strengthAreas,
        }),
      });

      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            setIsStreaming(false);
            setIsParsing(true);
            try {
              const parseRes = await fetch('/api/plan/parse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profileId, userId: profileId, rawMarkdown: accumulated }),
              });
              const parsed = await parseRes.json();
              setPlan(parsed.studyPlan);
            } finally {
              setIsParsing(false);
            }
            return;
          }
          try {
            const text = JSON.parse(data) as string;
            accumulated += text;
            setStreamingText(accumulated);
          } catch { /* partial chunk */ }
        }
      }
    };

    fetchPlan();
  }, [userProfile, knowledgeProfile, studyPlan]);

  const handleStartModule = (index: number) => {
    if (!studyPlan) return;
    setActiveModuleIndex(index);
    startSession(studyPlan.modules[index].id);
    router.push(`/session?module=${index}`);
  };

  const isLoading = !studyPlan && (isStreaming || streamingText || isParsing);

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-xl flex flex-col gap-6">
        <div className="flex flex-col gap-4 items-center">
          <GabrielLogo size="sm" />
          <StepIndicator steps={STEPS} currentStep={2} />
        </div>

        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-bold text-white">
            {studyPlan ? 'Your Personalized Study Plan' : 'Building your plan...'}
          </h1>
          {studyPlan && knowledgeProfile && knowledgeProfile.gapAreas.length > 0 && (
            <p className="text-slate-400 text-sm">
              Focused on your gaps: <span className="text-indigo-300">{knowledgeProfile.gapAreas.slice(0, 2).join(', ')}</span>
            </p>
          )}
        </div>

        {isLoading ? (
          <PlanSkeleton streamingText={streamingText || undefined} />
        ) : studyPlan ? (
          <div className="flex flex-col gap-4">
            {studyPlan.modules.map((mod, i) => (
              <ModuleCard
                key={mod.id}
                module={mod}
                index={i}
                isFirst={i === 0}
                onStart={handleStartModule}
              />
            ))}

            <div className="glass rounded-2xl p-5 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
              <p className="text-sm text-slate-400">
                Total: <span className="text-white font-medium">{studyPlan.modules.reduce((s, m) => s + m.estimatedMinutes, 0)} min</span> em <span className="text-white font-medium">{studyPlan.modules.length} módulos</span> — {userProfile?.availableHoursPerDay}h/dia
              </p>
            </div>

            {/* Quick nav to challenges and progress */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => router.push('/challenges')}
                className="glass rounded-2xl p-4 flex items-center gap-3 border border-white/10 hover:border-yellow-500/30 transition-all text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0">
                  <span className="text-lg">⚡</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Desafios do dia</p>
                  <p className="text-xs text-slate-500">Micro-tarefas de 5-15 min</p>
                </div>
              </button>
              <button
                onClick={() => router.push('/progress')}
                className="glass rounded-2xl p-4 flex items-center gap-3 border border-white/10 hover:border-indigo-500/30 transition-all text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <span className="text-lg">📈</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Minha evolução</p>
                  <p className="text-xs text-slate-500">XP, nível e progresso</p>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div className="glass rounded-2xl p-8 text-center text-slate-400">
            <p>No plan generated yet.</p>
          </div>
        )}
      </div>
    </main>
  );
}
