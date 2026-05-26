'use client';

import { useCallback } from 'react';

export function useSession() {
  const get = useCallback(<T>(key: string): T | null => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }, []);

  const set = useCallback(<T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  }, []);

  const remove = useCallback((key: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  }, []);

  return { get, set, remove };
}
