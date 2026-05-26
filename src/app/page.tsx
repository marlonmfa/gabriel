'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { GabrielLogo } from '@/components/shared/GabrielLogo';
import { Button } from '@/components/ui/button';
import { ArrowRight, Brain, Target, Zap } from 'lucide-react';

function LandingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true';

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 min-h-screen">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-3xl gap-8">
        <GabrielLogo size="lg" />

        <div className="flex flex-col gap-4">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight">
            Learn anything.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
              Your way.
            </span>
          </h1>
          <p className="text-xl text-slate-400 max-w-lg mx-auto leading-relaxed">
            Gabriel is an AI tutor that understands how you think, finds your gaps, and builds a plan just for you.
          </p>
        </div>

        <Button
          onClick={() => router.push(isDemo ? '/onboard?demo=true' : '/onboard')}
          size="lg"
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-6 text-lg rounded-2xl shadow-xl shadow-indigo-600/30 transition-all hover:scale-105"
        >
          Start Learning <ArrowRight className="ml-2 w-5 h-5" />
        </Button>

        <div className="flex flex-wrap justify-center gap-3 mt-2">
          {[
            { icon: Brain, label: 'Identifies your gaps' },
            { icon: Target, label: 'Adapts to your style' },
            { icon: Zap, label: 'Generates your plan' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="glass flex items-center gap-2 px-4 py-2 rounded-full text-sm text-slate-300">
              <Icon className="w-4 h-4 text-indigo-400" />
              {label}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LandingContent />
    </Suspense>
  );
}
