'use client';

import { useRouter } from 'next/navigation';
import { GabrielLogo } from '@/components/shared/GabrielLogo';
import { Button } from '@/components/ui/button';
import { useGabriel } from '@/store/gabriel';
import {
  Trophy, Zap, BookOpen, Target, Brain, ArrowLeft,
  CheckCircle, TrendingUp, Calendar, Star
} from 'lucide-react';

function XPBar({ xp }: { xp: number }) {
  const level = Math.floor(xp / 100) + 1;
  const xpInLevel = xp % 100;
  const xpToNext = 100 - xpInLevel;

  const levelLabels: Record<number, string> = {
    1: 'Iniciante', 2: 'Explorador', 3: 'Estudante', 4: 'Aprendiz',
    5: 'Praticante', 6: 'Avançado', 7: 'Expert', 8: 'Mestre',
  };

  return (
    <div className="glass rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center">
            <Star className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Nível {level}</p>
            <p className="text-lg font-bold text-white">{levelLabels[Math.min(level, 8)] ?? 'Lendário'}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-yellow-400">{xp}</p>
          <p className="text-xs text-slate-500">XP total</p>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>Progresso nível {level}</span>
          <span>{xpInLevel}/100 XP (+{xpToNext} para nível {level + 1})</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-700"
            style={{ width: `${xpInLevel}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function ProgressPage() {
  const router = useRouter();
  const {
    userProfile,
    knowledgeProfile,
    studyPlan,
    challenges,
    totalXP,
    activeSession,
  } = useGabriel();

  const completedChallenges = challenges.filter((c) => c.completed);
  const today = new Date().toISOString().split('T')[0];
  const todayDone = challenges.filter((c) => c.date === today && c.completed).length;
  const todayTotal = challenges.filter((c) => c.date === today).length;

  const masteryAvg = activeSession?.conceptMastery
    ? Object.values(activeSession.conceptMastery).reduce((s, v) => s + v, 0) /
      Math.max(Object.values(activeSession.conceptMastery).length, 1)
    : 0;

  const modulesDone = studyPlan
    ? studyPlan.modules.filter((_, i) => {
        const mastery = activeSession?.conceptMastery ?? {};
        const moduleConcepts = studyPlan.modules[i]?.concepts ?? [];
        return moduleConcepts.every((c) => (mastery[c] ?? 0) >= 0.7);
      }).length
    : 0;

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p className="text-slate-400">Perfil não encontrado.</p>
        <Button onClick={() => router.push('/onboard')} className="bg-indigo-600 hover:bg-indigo-500 text-white">
          Começar
        </Button>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-6 py-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/3 w-48 h-48 bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GabrielLogo size="sm" showText={false} />
            <div>
              <h1 className="text-xl font-bold text-white">Minha Evolução</h1>
              {userProfile.lifeGoal && (
                <p className="text-xs text-indigo-400 mt-0.5 truncate max-w-[240px]">
                  → {userProfile.lifeGoal}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => router.push('/plan')}
            className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" /> Plano
          </button>
        </div>

        {/* XP bar */}
        <XPBar xp={totalXP} />

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              icon: CheckCircle,
              color: 'text-green-400',
              bg: 'bg-green-500/10',
              value: completedChallenges.length,
              label: 'Desafios concluídos',
            },
            {
              icon: TrendingUp,
              color: 'text-indigo-400',
              bg: 'bg-indigo-500/10',
              value: `${Math.round(masteryAvg * 100)}%`,
              label: 'Maestria média',
            },
            {
              icon: BookOpen,
              color: 'text-violet-400',
              bg: 'bg-violet-500/10',
              value: `${modulesDone}/${studyPlan?.modules.length ?? 0}`,
              label: 'Módulos concluídos',
            },
            {
              icon: Calendar,
              color: 'text-yellow-400',
              bg: 'bg-yellow-500/10',
              value: `${todayDone}/${todayTotal || '—'}`,
              label: 'Desafios hoje',
            },
          ].map(({ icon: Icon, color, bg, value, label }) => (
            <div key={label} className="glass rounded-2xl p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Profile badges */}
        <div className="glass rounded-2xl p-5 flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-white">Seu perfil de aprendizado</h3>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 rounded-full text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
              {userProfile.learnerStyle === 'audio' ? '🎧 Aprendiz áudio' :
               userProfile.learnerStyle === 'visual' ? '👁️ Visual' :
               userProfile.learnerStyle === 'example-based' ? '⚡ Exemplos práticos' :
               userProfile.learnerStyle === 'textual' ? '📚 Leitura' : '🎯 Misto'}
            </span>
            <span className={`px-3 py-1.5 rounded-full text-xs border ${
              userProfile.urgency === 'urgent' ? 'bg-orange-500/10 border-orange-500/20 text-orange-300' :
              userProfile.urgency === 'relaxed' ? 'bg-green-500/10 border-green-500/20 text-green-300' :
              'bg-slate-500/10 border-slate-500/20 text-slate-300'
            }`}>
              {userProfile.urgency === 'urgent' ? '🚀 Resultado rápido' :
               userProfile.urgency === 'relaxed' ? '🌱 Aprendizado profundo' : '⚖️ Ritmo moderado'}
            </span>
            {userProfile.hasADHD && (
              <span className="px-3 py-1.5 rounded-full text-xs bg-violet-500/10 border border-violet-500/20 text-violet-300">
                <Brain className="w-3 h-3 inline mr-1" />TDAH — sessões curtas
              </span>
            )}
            <span className="px-3 py-1.5 rounded-full text-xs bg-white/5 border border-white/10 text-slate-400">
              <Zap className="w-3 h-3 inline mr-1" />{userProfile.availableHoursPerDay}h/dia
            </span>
          </div>
        </div>

        {/* Knowledge gaps */}
        {knowledgeProfile && knowledgeProfile.gapAreas.length > 0 && (
          <div className="glass rounded-2xl p-5 flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-400" /> Pontos de foco
            </h3>
            <div className="flex flex-col gap-2">
              {knowledgeProfile.gapAreas.map((gap) => {
                const score = knowledgeProfile.conceptScores[gap] ?? 0;
                const mastery = activeSession?.conceptMastery[gap] ?? score;
                return (
                  <div key={gap} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-40 truncate">{gap}</span>
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all"
                        style={{ width: `${Math.round(mastery * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 w-8 text-right">{Math.round(mastery * 100)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="flex gap-3">
          <Button
            onClick={() => router.push('/challenges')}
            variant="outline"
            className="flex-1 border-white/10 text-slate-300 hover:bg-white/5"
          >
            <Trophy className="w-4 h-4 mr-2" /> Desafios
          </Button>
          <Button
            onClick={() => router.push('/session?module=0')}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            <BookOpen className="w-4 h-4 mr-2" /> Continuar estudando
          </Button>
        </div>
      </div>
    </main>
  );
}
