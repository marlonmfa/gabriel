'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { nanoid } from 'nanoid';
import { GabrielLogo } from '@/components/shared/GabrielLogo';
import { StepIndicator } from '@/components/shared/StepIndicator';
import { LearnerStylePicker } from '@/components/onboard/LearnerStylePicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useGabriel } from '@/store/gabriel';
import { ArrowRight, Loader2, Brain, Zap, Clock } from 'lucide-react';
import type { UserProfile, LearnerStyle, UrgencyLevel } from '@/types';

const DEMO_PROFILE = {
  topic: 'Análise Financeira e Mercado de Capitais',
  goal: 'Passar no processo seletivo para analista financeiro júnior em 60 dias',
  lifeGoal: 'Quero virar analista financeiro e trabalhar em gestora de fundos',
  hours: 0.5,
  style: 'audio' as LearnerStyle,
  urgency: 'urgent' as UrgencyLevel,
  hasADHD: true,
};

const STEPS = [
  { label: 'Setup' },
  { label: 'Diagnostic' },
  { label: 'Your Plan' },
  { label: 'Learn' },
];

const URGENCY_OPTIONS: { value: UrgencyLevel; label: string; description: string }[] = [
  { value: 'relaxed', label: 'Sem pressa', description: 'Aprendizado profundo, sem deadline' },
  { value: 'moderate', label: 'Moderado', description: 'Tenho algumas semanas' },
  { value: 'urgent', label: 'Resultado rápido', description: 'Preciso de resultado agora' },
];

function OnboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true';
  const { setProfileId, setProfile } = useGabriel();

  const [topic, setTopic] = useState('');
  const [goal, setGoal] = useState('');
  const [lifeGoal, setLifeGoal] = useState('');
  const [hours, setHours] = useState(1);
  const [style, setStyle] = useState<LearnerStyle | null>(null);
  const [urgency, setUrgency] = useState<UrgencyLevel>('moderate');
  const [hasADHD, setHasADHD] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isDemo) {
      setTopic(DEMO_PROFILE.topic);
      setGoal(DEMO_PROFILE.goal);
      setLifeGoal(DEMO_PROFILE.lifeGoal);
      setHours(DEMO_PROFILE.hours);
      setStyle(DEMO_PROFILE.style);
      setUrgency(DEMO_PROFILE.urgency);
      setHasADHD(DEMO_PROFILE.hasADHD);
    }
  }, [isDemo]);

  const isValid = topic.trim() && goal.trim() && style;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || loading) return;
    setLoading(true);

    try {
      const res = await fetch('/api/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          goal: goal.trim(),
          lifeGoal: lifeGoal.trim() || undefined,
          availableHoursPerDay: hours,
          learnerStyle: style,
          urgency,
          hasADHD,
        }),
      });

      const data = await res.json();
      const profile: UserProfile = data.profile ?? {
        id: nanoid(),
        topic: topic.trim(),
        goal: goal.trim(),
        lifeGoal: lifeGoal.trim() || undefined,
        availableHoursPerDay: hours,
        learnerStyle: style!,
        urgency,
        hasADHD,
        createdAt: new Date().toISOString(),
      };

      setProfileId(data.profileId ?? profile.id);
      setProfile(profile);
      router.push('/quiz');
    } catch {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-indigo-600/15 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-xl flex flex-col gap-8">
        <div className="flex flex-col gap-4 items-center text-center">
          <GabrielLogo size="sm" />
          <StepIndicator steps={STEPS} currentStep={0} />
          <div>
            <h1 className="text-2xl font-bold text-white">Vamos montar seu plano</h1>
            <p className="text-slate-400 text-sm mt-1">Quanto mais você compartilhar, mais preciso será seu caminho</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 flex flex-col gap-6">

          {/* Life goal — the big WHY */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              Qual é seu objetivo de vida? (opcional)
            </label>
            <Input
              value={lifeGoal}
              onChange={(e) => setLifeGoal(e.target.value)}
              placeholder='Ex: "Quero virar analista financeiro", "Trabalhar em startup de tech"'
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-yellow-500 rounded-xl"
            />
            <p className="text-xs text-slate-500">Usado para contextualizar todo o seu aprendizado</p>
          </div>

          {/* Topic */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-300">
              O que você quer aprender?
            </label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder='Ex: "Análise Financeira", "Python", "Excel avançado"'
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500 rounded-xl"
            />
          </div>

          {/* Goal */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-300">
              Qual é seu objetivo com isso?
            </label>
            <Input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder='Ex: "Passar no processo seletivo em 60 dias"'
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500 rounded-xl"
            />
          </div>

          {/* Hours */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                Tempo disponível por dia
              </label>
              <span className="text-sm font-bold text-indigo-400">
                {hours < 1 ? `${Math.round(hours * 60)} min` : `${hours}h`}
              </span>
            </div>
            <Slider
              value={[hours]}
              onValueChange={(vals) => setHours(Array.isArray(vals) ? vals[0] : vals)}
              min={0.25}
              max={8}
              step={0.25}
              className="py-1"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>15 min</span>
              <span>8 horas</span>
            </div>
          </div>

          {/* Urgency */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-slate-300">
              Qual a sua urgência?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {URGENCY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setUrgency(opt.value)}
                  className={`rounded-xl p-3 text-left transition-all border ${
                    urgency === opt.value
                      ? 'border-indigo-500 bg-indigo-600/20 text-white'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <p className="text-xs font-semibold">{opt.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-tight">{opt.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Learner style */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-300">
              Como você aprende melhor?
            </label>
            <LearnerStylePicker value={style} onChange={setStyle} />
          </div>

          {/* ADHD toggle */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
            <button
              type="button"
              onClick={() => setHasADHD(!hasADHD)}
              className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 ${
                hasADHD
                  ? 'bg-violet-600 border-violet-500'
                  : 'border-white/30 hover:border-white/50'
              }`}
            >
              {hasADHD && <span className="text-white text-xs">✓</span>}
            </button>
            <div>
              <p className="text-sm font-medium text-slate-200 flex items-center gap-2">
                <Brain className="w-4 h-4 text-violet-400" />
                Tenho TDAH ou dificuldade de concentração
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Gabriel vai criar sessões de 5-10 min com pausas, sem textos longos
              </p>
            </div>
          </div>

          <Button
            type="submit"
            disabled={!isValid || loading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-5 text-base font-semibold disabled:opacity-40 transition-all"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Configurando seu perfil...</>
            ) : (
              <>Iniciar Diagnóstico <ArrowRight className="w-4 h-4 ml-2" /></>
            )}
          </Button>
        </form>
      </div>
    </main>
  );
}

export default function OnboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <OnboardContent />
    </Suspense>
  );
}
