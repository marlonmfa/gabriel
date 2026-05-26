'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GabrielLogo } from '@/components/shared/GabrielLogo';
import { Button } from '@/components/ui/button';
import { useGabriel } from '@/store/gabriel';
import { Zap, Clock, CheckCircle, Circle, RefreshCw, ArrowLeft, Trophy } from 'lucide-react';
import type { DailyChallenge } from '@/types';

const XP_COLORS: Record<number, string> = {
  10: 'text-green-400',
  20: 'text-yellow-400',
  30: 'text-orange-400',
};

export default function ChallengesPage() {
  const router = useRouter();
  const { profileId, userProfile, challenges, totalXP, setChallenges, completeChallenge, addXP } = useGabriel();

  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const todayChallenges = challenges.filter((c) => c.date === today);

  useEffect(() => {
    if (!profileId) return;
    loadChallenges();
  }, [profileId]);

  async function loadChallenges() {
    if (!profileId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/challenges?profileId=${profileId}`);
      if (res.ok) {
        const data = await res.json();
        const allChallenges = [
          ...challenges.filter((c) => c.date !== today),
          ...(data.challenges as DailyChallenge[]),
        ];
        setChallenges(allChallenges);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleComplete(challenge: DailyChallenge) {
    if (challenge.completed || completing) return;
    setCompleting(challenge.id);

    try {
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete', profileId, challengeId: challenge.id }),
      });

      if (res.ok) {
        completeChallenge(challenge.id);
        addXP(challenge.xp);
      }
    } finally {
      setCompleting(null);
    }
  }

  async function handleRegenerate() {
    if (!profileId) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', profileId }),
      });
      if (res.ok) {
        const data = await res.json();
        const allChallenges = [
          ...challenges.filter((c) => c.date !== today),
          ...(data.challenges as DailyChallenge[]),
        ];
        setChallenges(allChallenges);
      }
    } finally {
      setGenerating(false);
    }
  }

  const completedToday = todayChallenges.filter((c) => c.completed).length;
  const totalToday = todayChallenges.length;
  const allDone = totalToday > 0 && completedToday === totalToday;

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p className="text-slate-400">Perfil não encontrado.</p>
        <Button onClick={() => router.push('/onboard')} className="bg-indigo-600 hover:bg-indigo-500 text-white">
          Começar <ArrowLeft className="ml-2 w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-6 py-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-yellow-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GabrielLogo size="sm" showText={false} />
            <div>
              <h1 className="text-xl font-bold text-white">Desafios do Dia</h1>
              <p className="text-xs text-slate-500">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/plan')}
            className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" /> Plano
          </button>
        </div>

        {/* XP strip */}
        <div className="glass rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">XP Total</p>
              <p className="text-2xl font-bold text-white">{totalXP}</p>
            </div>
          </div>
          {totalToday > 0 && (
            <div className="text-right">
              <p className="text-xs text-slate-500">Hoje</p>
              <p className="text-lg font-bold text-white">
                {completedToday}/{totalToday}
                <span className="text-xs text-slate-500 font-normal ml-1">desafios</span>
              </p>
            </div>
          )}
        </div>

        {/* All done banner */}
        {allDone && (
          <div className="glass border border-green-500/30 rounded-2xl p-4 flex items-center gap-3 bg-green-500/10">
            <CheckCircle className="w-6 h-6 text-green-400 shrink-0" />
            <div>
              <p className="font-semibold text-green-300">Todos os desafios de hoje concluídos!</p>
              <p className="text-xs text-slate-400 mt-0.5">Volte amanhã para novos desafios personalizados</p>
            </div>
          </div>
        )}

        {/* Challenges */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass rounded-2xl p-5 animate-pulse h-28" />
            ))}
          </div>
        ) : todayChallenges.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center flex flex-col gap-4">
            <p className="text-slate-400">Nenhum desafio gerado para hoje ainda.</p>
            <Button
              onClick={handleRegenerate}
              disabled={generating}
              className="bg-indigo-600 hover:bg-indigo-500 text-white mx-auto"
            >
              {generating ? 'Gerando...' : 'Gerar desafios'}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {todayChallenges.map((challenge) => (
              <div
                key={challenge.id}
                className={`glass rounded-2xl p-5 border transition-all ${
                  challenge.completed
                    ? 'border-green-500/20 opacity-60'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => handleComplete(challenge)}
                    disabled={challenge.completed || completing === challenge.id}
                    className="mt-0.5 shrink-0 transition-transform hover:scale-110"
                  >
                    {challenge.completed ? (
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    ) : completing === challenge.id ? (
                      <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Circle className="w-6 h-6 text-slate-500" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`font-semibold text-sm ${challenge.completed ? 'line-through text-slate-500' : 'text-white'}`}>
                        {challenge.title}
                      </h3>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs font-bold ${XP_COLORS[challenge.xp] ?? 'text-slate-400'}`}>
                          +{challenge.xp} XP
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{challenge.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {challenge.estimatedMinutes} min
                      </span>
                      <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                        {challenge.concept}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Regenerate button */}
        {todayChallenges.length > 0 && (
          <button
            onClick={handleRegenerate}
            disabled={generating}
            className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1.5 mx-auto transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Gerando novos desafios...' : 'Gerar novos desafios'}
          </button>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          <Button
            onClick={() => router.push('/plan')}
            variant="outline"
            className="flex-1 border-white/10 text-slate-300 hover:bg-white/5"
          >
            Ver Plano
          </Button>
          <Button
            onClick={() => router.push('/progress')}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            <Zap className="w-4 h-4 mr-2" /> Minha Evolução
          </Button>
        </div>
      </div>
    </main>
  );
}
