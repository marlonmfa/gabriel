'use client';

interface Step {
  label: string;
  href?: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((step, i) => {
        const isCompleted = i < currentStep;
        const isCurrent = i === currentStep;
        return (
          <div key={i} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isCompleted
                    ? 'bg-emerald-500 text-white'
                    : isCurrent
                    ? 'bg-indigo-500 text-white ring-2 ring-indigo-300 ring-offset-1 ring-offset-slate-950'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {isCompleted ? '✓' : i + 1}
              </div>
              <span
                className={`text-xs font-medium ${
                  isCurrent ? 'text-white' : isCompleted ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-8 h-px ${isCompleted ? 'bg-emerald-500' : 'bg-slate-700'}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
