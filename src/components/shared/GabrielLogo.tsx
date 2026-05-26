'use client';

interface GabrielLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const sizes = {
  sm: { icon: 32, text: 'text-lg' },
  md: { icon: 48, text: 'text-2xl' },
  lg: { icon: 64, text: 'text-4xl' },
};

export function GabrielLogo({ size = 'md', showText = true }: GabrielLogoProps) {
  const { icon, text } = sizes[size];
  return (
    <div className="flex items-center gap-3">
      <div
        className="rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30"
        style={{ width: icon, height: icon }}
      >
        <span style={{ fontSize: icon * 0.5 }}>✦</span>
      </div>
      {showText && (
        <span className={`font-bold tracking-tight text-white ${text}`}>
          Gabriel
        </span>
      )}
    </div>
  );
}
