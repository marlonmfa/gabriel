'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, ChevronRight } from 'lucide-react';
import type { StudyModule } from '@/types';

interface ModuleCardProps {
  module: StudyModule;
  index: number;
  isFirst?: boolean;
  onStart: (index: number) => void;
}

const difficultyColors: Record<StudyModule['difficulty'], string> = {
  foundation: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  core: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  advanced: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
};

export function ModuleCard({ module, index, isFirst, onStart }: ModuleCardProps) {
  return (
    <div
      className={`glass rounded-2xl p-5 flex flex-col gap-4 transition-all ${
        isFirst ? 'ring-2 ring-indigo-500/50' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            isFirst ? 'bg-indigo-500 text-white' : 'bg-white/10 text-slate-400'
          }`}>
            {index + 1}
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">{module.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="w-3 h-3 text-slate-500" />
              <span className="text-xs text-slate-500">{module.estimatedMinutes} min</span>
              <Badge className={`text-xs border ${difficultyColors[module.difficulty]}`}>
                {module.difficulty}
              </Badge>
            </div>
          </div>
        </div>
        {isFirst && (
          <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-xs border shrink-0">
            Start Here
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {module.concepts.map((c) => (
          <span key={c} className="text-xs px-2 py-1 rounded-full bg-white/5 text-slate-400">
            {c}
          </span>
        ))}
      </div>

      <Button
        onClick={() => onStart(index)}
        className={`w-full rounded-xl text-sm ${
          isFirst
            ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
            : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
        }`}
      >
        {isFirst ? 'Begin Session' : 'Start Module'} <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}
