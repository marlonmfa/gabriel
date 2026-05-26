'use client';

import { Eye, BookOpen, Code2, Headphones, Layers } from 'lucide-react';
import type { LearnerStyle } from '@/types';

interface Option {
  value: LearnerStyle;
  label: string;
  description: string;
  icon: React.ElementType;
}

const OPTIONS: Option[] = [
  { value: 'visual', label: 'Visual', description: 'Diagramas e tabelas', icon: Eye },
  { value: 'textual', label: 'Leitura', description: 'Texto detalhado e preciso', icon: BookOpen },
  { value: 'example-based', label: 'Exemplos', description: 'Casos práticos primeiro', icon: Code2 },
  { value: 'audio', label: 'Áudio', description: 'Narração e podcast', icon: Headphones },
  { value: 'mixed', label: 'Misto', description: 'Adapta ao tema', icon: Layers },
];

interface LearnerStylePickerProps {
  value: LearnerStyle | null;
  onChange: (v: LearnerStyle) => void;
}

export function LearnerStylePicker({ value, onChange }: LearnerStylePickerProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex flex-col gap-2 p-3 rounded-xl border text-left transition-all ${
              selected
                ? 'bg-indigo-600/20 border-indigo-500 text-white'
                : 'glass border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selected ? 'bg-indigo-500/30' : 'bg-white/5'}`}>
              <Icon className={`w-4 h-4 ${selected ? 'text-indigo-300' : 'text-slate-400'}`} />
            </div>
            <div>
              <p className="font-semibold text-xs text-white">{opt.label}</p>
              <p className="text-xs text-slate-400 mt-0.5 leading-tight">{opt.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
