'use client';

import { useState, useCallback, useRef } from 'react';

interface UseStreamOptions {
  onDone?: (fullText: string) => void;
  onError?: (err: string) => void;
  timeoutMs?: number;
}

export function useStream({ onDone, onError, timeoutMs = 30000 }: UseStreamOptions = {}) {
  const [text, setText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const stream = useCallback(
    async (url: string, body: object) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      setText('');
      setIsStreaming(true);
      let accumulated = '';

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        if (!res.body) throw new Error('No response body');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              onDone?.(accumulated);
              return;
            }
            try {
              const text = JSON.parse(data) as string;
              accumulated += text;
              setText(accumulated);
            } catch {
              // partial chunk, skip
            }
          }
        }
        onDone?.(accumulated);
      } catch (err: unknown) {
        if ((err as Error).name !== 'AbortError') {
          const msg = err instanceof Error ? err.message : 'Stream failed';
          onError?.(msg);
        }
      } finally {
        clearTimeout(timeoutId);
        setIsStreaming(false);
      }
    },
    [onDone, onError, timeoutMs]
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return { text, isStreaming, stream, cancel, setText };
}
