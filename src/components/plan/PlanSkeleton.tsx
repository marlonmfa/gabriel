'use client';

import { StreamingCursor } from '@/components/session/StreamingCursor';

interface PlanSkeletonProps {
  streamingText?: string;
}

export function PlanSkeleton({ streamingText }: PlanSkeletonProps) {
  if (streamingText) {
    return (
      <div className="glass rounded-2xl p-6">
        <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
          {streamingText}
          <StreamingCursor />
        </pre>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="glass rounded-2xl p-5 flex flex-col gap-3 animate-pulse">
          <div className="flex gap-3 items-center">
            <div className="w-8 h-8 rounded-full bg-white/10" />
            <div className="flex-1">
              <div className="h-4 bg-white/10 rounded w-1/2" />
              <div className="h-3 bg-white/5 rounded w-1/3 mt-1" />
            </div>
          </div>
          <div className="flex gap-2">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="h-6 w-20 bg-white/5 rounded-full" />
            ))}
          </div>
          <div className="h-10 bg-white/5 rounded-xl" />
        </div>
      ))}
    </div>
  );
}
