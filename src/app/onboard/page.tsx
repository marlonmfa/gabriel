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
import { ArrowRight, Loader2 } from 'lucide-react';
import type { UserProfile } from '@/types';

const DEMO_PROFILE = {
  topic: 'Calculus — derivatives and integrals',
  goal: 'Understand the fundamentals well enough to pass my university exam',
  hours: 2,
  style: 'example-based' as const,
};

const STEPS = [
  { label: 'Setup' },
  { label: 'Diagnostic' },
  { label: 'Your Plan' },
  { label: 'Learn' },
];

function OnboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true';

  const { setProfileId, setProfile } = useGabriel();

  const [topic, setTopic] = useState('');
  const [goal, setGoal] = useState('');
  const [hours, setHours] = useState(2);
  const [style, setStyle] = useState<'visual' | 'textual' | 'example-based' | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isDemo) {
      setTopic(DEMO_PROFILE.topic);
      setGoal(DEMO_PROFILE.goal);
      setHours(DEMO_PROFILE.hours);
      setStyle(DEMO_PROFILE.style);
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
          availableHoursPerDay: hours,
          learnerStyle: style,
        }),
      });

      const data = await res.json();
      const profile: UserProfile = data.profile ?? {
        id: nanoid(),
        topic: topic.trim(),
        goal: goal.trim(),
        availableHoursPerDay: hours,
        learnerStyle: style!,
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
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-300">
              What do you want to learn?
            </label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder='e.g. "Calculus", "Spanish B2", "System Design"'
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500 rounded-xl"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-300">
              What&apos;s your goal?
            </label>
            <Input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder='e.g. "Pass my exam in 2 weeks"'
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500 rounded-xl"
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-slate-300">
                Hours available to study today
              </label>
              <span className="text-sm font-bold text-indigo-400">{hours}h</span>
            </div>
            <Slider
              value={[hours]}
              onValueChange={([v]) => setHours(v)}
              min={0.5}
              max={8}
              step={0.5}
              className="py-1"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>30 min</span>
              <span>8 hours</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-300">
              How do you learn best?
            </label>
            <LearnerStylePicker value={style} onChange={setStyle} />
          </div>

          <Button
            type="submit"
            disabled={!isValid || loading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-5 text-base font-semibold disabled:opacity-40 transition-all"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Setting up your profile...</>
            ) : (
              <>Start Diagnostic <ArrowRight className="w-4 h-4 ml-2" /></>
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
