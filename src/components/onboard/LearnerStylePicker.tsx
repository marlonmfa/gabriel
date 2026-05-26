'use client';

import { Eye, BookOpen, Code2 } from 'lucide-react';

type LearnerStyle = 'visual' | 'textual' | 'example-based';

interface Option {
  value: LearnerStyle;
  label: string;
  description: string;
  icon: React.ElementType;
}

const OPTIONS: Option[] = [
  {
    value: 'visual',
    label: 'Visual',
    description: 'Diagrams, tables, spatial structure',
    icon: Eye,
  },
  {
    value: 'textual',
    label: 'Textual',
    description: 'Clear prose, definitions, structured explanations',
    icon: BookOpen,
  },
  {
    value: 'example-based',
    label: 'By Example',
    description: 'Real cases and analogies first, theory second',
    icon: Code2,
  },
];

interface LearnerStylePickerProps {
  value: LearnerStyle | null;
  onChange: (v: LearnerStyle) => void;
}

export function LearnerStylePicker({ value, onChange }: LearnerStylePickerProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex flex-col gap-2 p-4 rounded-xl border text-left transition-all ${
              selected
                ? 'bg-indigo-600/20 border-indigo-500 text-white'
                : 'glass border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300'
            }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${selected ? 'bg-indigo-500/30' : 'bg-white/5'}`}>
              <Icon className={`w-5 h-5 ${selected ? 'text-indigo-300' : 'text-slate-400'}`} />
            </div>
            <div>
              <p className="font-semibold text-sm text-white">{opt.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{opt.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
