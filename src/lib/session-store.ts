import type { ServerSession } from '@/types';

// Module-scoped Map survives across requests within one Node.js process.
// On Vercel cold starts the Map is empty — routes always accept profile in
// the request body as a fallback so no data is lost.
const store = new Map<string, ServerSession>();

export function getSession(profileId: string): ServerSession | undefined {
  return store.get(profileId);
}

export function setSession(profileId: string, session: ServerSession): void {
  store.set(profileId, session);
}

export function updateSession(
  profileId: string,
  updater: (s: ServerSession) => ServerSession
): ServerSession | null {
  const existing = store.get(profileId);
  if (!existing) return null;
  const updated = updater(existing);
  store.set(profileId, updated);
  return updated;
}
