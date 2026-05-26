'use client';

import type { StudyModule } from '@/types';

interface ConceptSidebarProps {
  module: StudyModule;
  conceptMastery: Record<string, number>;
  messageCount: number;
}

export function ConceptSidebar({ module, conceptMastery, messageCount }: ConceptSidebarProps) {
  const totalMastery = module.concepts.length > 0
    ? module.concepts.reduce((s, c) => s + (conceptMastery[c] ?? 0), 0) / module.concepts.length
    : 0;

  const sessionProgress = Math.min(100, Math.round((messageCount / 10) * 100));

  return (
    <div className="glass rounded-2xl p-4 flex flex-col gap-5 h-full">
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Current Module</p>
        <p className="text-sm font-semibold text-white leading-snug">{module.title}</p>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center">
          <p className="text-xs text-slate-500">Session Progress</p>
          <span className="text-xs text-indigo-400 font-medium">{sessionProgress}%</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700"
            style={{ width: `${sessionProgress}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-xs text-slate-500 uppercase tracking-wider">Concepts</p>
        {module.concepts.map((concept) => {
          const mastery = conceptMastery[concept] ?? 0;
          const pct = Math.round(mastery * 100);
          return (
            <div key={concept} className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-300 truncate max-w-[80%]">{concept}</span>
                <span className="text-xs text-emerald-400 font-medium shrink-0">{pct}%</span>
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {totalMastery > 0.6 && (
        <div className="mt-auto glass rounded-xl p-3 text-center">
          <p className="text-xs text-emerald-400 font-medium">Good progress! 🎯</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {Math.round(totalMastery * 100)}% avg mastery
          </p>
        </div>
      )}
    </div>
  );
}
