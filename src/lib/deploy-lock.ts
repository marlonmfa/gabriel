import fs from 'fs';
import path from 'path';

// Lock file lives in project root — survives Next.js hot-reloads and is visible to the deploy script
const LOCK_PATH = path.join(process.cwd(), '.deploy.lock');

export type LockState = {
  locked: boolean;
  since?: string;
  branch?: string;
  description?: string;
};

export function acquireLock(branch: string, description: string): boolean {
  if (fs.existsSync(LOCK_PATH)) return false;
  const state: LockState = { locked: true, since: new Date().toISOString(), branch, description };
  fs.writeFileSync(LOCK_PATH, JSON.stringify(state), 'utf8');
  return true;
}

export function releaseLock(): void {
  if (fs.existsSync(LOCK_PATH)) fs.unlinkSync(LOCK_PATH);
}

export function getLockState(): LockState {
  if (!fs.existsSync(LOCK_PATH)) return { locked: false };
  try {
    return JSON.parse(fs.readFileSync(LOCK_PATH, 'utf8'));
  } catch {
    return { locked: true };
  }
}
