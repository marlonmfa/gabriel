'use client';

interface QuizProgressProps {
  current: number;
  total: number;
  label?: string;
}

export function QuizProgress({ current, total, label = 'Diagnosing your knowledge' }: QuizProgressProps) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center text-xs text-slate-400">
        <span>{label}</span>
        <span className="text-indigo-400 font-medium">
          Question {current} of {total}
        </span>
      </div>
      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
