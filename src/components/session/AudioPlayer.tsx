'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Loader2, Headphones } from 'lucide-react';

interface AudioPlayerProps {
  text: string;
  label?: string;
}

export function AudioPlayer({ text, label = 'Ouvir resumo' }: AudioPlayerProps) {
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  async function loadAndPlay() {
    if (audioUrl) {
      audioRef.current?.play();
      setPlaying(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error('Audio generation failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.ontimeupdate = () => {
        setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
      };
      audio.onended = () => {
        setPlaying(false);
        setProgress(0);
      };

      await audio.play();
      setPlaying(true);
    } catch {
      // silent — user can retry
    } finally {
      setLoading(false);
    }
  }

  function togglePlay() {
    if (!audioRef.current) {
      loadAndPlay();
      return;
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  }

  return (
    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 w-full">
      <button
        onClick={togglePlay}
        disabled={loading}
        className="w-9 h-9 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 flex items-center justify-center transition-colors shrink-0"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 text-white animate-spin" />
        ) : playing ? (
          <Pause className="w-4 h-4 text-white" />
        ) : (
          <Play className="w-4 h-4 text-white ml-0.5" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Headphones className="w-3 h-3 text-indigo-400 shrink-0" />
          <span className="text-xs text-slate-400 truncate">{label}</span>
          {loading && <span className="text-xs text-slate-500">Gerando áudio...</span>}
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <Volume2 className="w-4 h-4 text-slate-500 shrink-0" />
    </div>
  );
}
