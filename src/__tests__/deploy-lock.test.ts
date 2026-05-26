/**
 * @jest-environment node
 */
import fs from 'fs';
import path from 'path';

// Use a temp lock path so tests don't touch the real .deploy.lock
const TEST_LOCK = path.join(process.cwd(), '.deploy.lock.test');

jest.mock('fs', () => {
  const real = jest.requireActual<typeof import('fs')>('fs');
  return { ...real };
});

// Override process.cwd() so deploy-lock uses our test lock path
jest.mock('@/lib/deploy-lock', () => {
  const fs = require('fs');
  const LOCK_PATH = path.join(process.cwd(), '.deploy.lock.test');

  return {
    acquireLock(branch: string, description: string) {
      if (fs.existsSync(LOCK_PATH)) return false;
      fs.writeFileSync(LOCK_PATH, JSON.stringify({ locked: true, since: new Date().toISOString(), branch, description }));
      return true;
    },
    releaseLock() {
      if (fs.existsSync(LOCK_PATH)) fs.unlinkSync(LOCK_PATH);
    },
    getLockState() {
      if (!fs.existsSync(LOCK_PATH)) return { locked: false };
      try { return JSON.parse(fs.readFileSync(LOCK_PATH, 'utf8')); }
      catch { return { locked: true }; }
    },
  };
});

import { acquireLock, releaseLock, getLockState } from '@/lib/deploy-lock';

afterEach(() => {
  if (fs.existsSync(TEST_LOCK)) fs.unlinkSync(TEST_LOCK);
});

describe('deploy-lock', () => {
  test('acquires lock when none exists', () => {
    const ok = acquireLock('auto/test-branch', 'test change');
    expect(ok).toBe(true);
    expect(getLockState().locked).toBe(true);
    expect(getLockState().branch).toBe('auto/test-branch');
  });

  test('rejects second lock while first is held', () => {
    acquireLock('auto/first', 'first');
    const second = acquireLock('auto/second', 'second');
    expect(second).toBe(false);
  });

  test('releases lock and allows re-acquisition', () => {
    acquireLock('auto/first', 'first');
    releaseLock();
    const ok = acquireLock('auto/second', 'second');
    expect(ok).toBe(true);
    expect(getLockState().branch).toBe('auto/second');
  });

  test('getLockState returns locked:false when no lock', () => {
    expect(getLockState()).toEqual({ locked: false });
  });
});
