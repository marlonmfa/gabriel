/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

// Mock the deploy-lock and github modules
jest.mock('@/lib/deploy-lock', () => ({
  acquireLock: jest.fn(() => true),
  releaseLock: jest.fn(),
  getLockState: jest.fn(() => ({ locked: false })),
}));

jest.mock('@/lib/github', () => ({
  getMainSha: jest.fn(async () => 'abc123sha'),
  createBranch: jest.fn(async () => {}),
  pushFileChange: jest.fn(async () => {}),
  openPullRequest: jest.fn(async () => ({ number: 42, html_url: 'https://github.com/marlonmfa/gabriel/pull/42' })),
  mergePullRequest: jest.fn(async () => {}),
  deleteBranch: jest.fn(async () => {}),
}));

// Stub fetch (used for deploy webhook fire-and-forget)
global.fetch = jest.fn(async () => new Response('ok', { status: 200 }));

import { POST, GET } from '@/app/api/changes/route';
import { getLockState } from '@/lib/deploy-lock';
import { mergePullRequest, openPullRequest } from '@/lib/github';

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/changes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

describe('POST /api/changes', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rejects empty body', async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(422);
  });

  test('rejects if no files', async () => {
    const res = await POST(makeRequest({ description: 'test', files: [] }));
    expect(res.status).toBe(422);
  });

  test('returns 409 when lock is held', async () => {
    (getLockState as jest.Mock).mockReturnValueOnce({
      locked: true,
      branch: 'auto/prev',
      since: new Date().toISOString(),
    });
    const res = await POST(makeRequest({ description: 'change', files: [{ path: 'src/foo.ts', content: 'x' }] }));
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toBe('Deployment in progress');
  });

  test('full happy path: opens and merges PR', async () => {
    const res = await POST(makeRequest({
      description: 'update greeting',
      files: [{ path: 'src/app/page.tsx', content: 'export default function Page() { return <p>Hi</p>; }' }],
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.pr.number).toBe(42);
    expect(openPullRequest).toHaveBeenCalledTimes(1);
    expect(mergePullRequest).toHaveBeenCalledWith(42);
  });

  test('requires x-api-key when CHANGES_API_KEY env is set', async () => {
    process.env.CHANGES_API_KEY = 'secret-key';
    const res = await POST(makeRequest(
      { description: 'change', files: [{ path: 'src/foo.ts', content: 'x' }] },
      { 'x-api-key': 'wrong-key' }
    ));
    expect(res.status).toBe(401);
    delete process.env.CHANGES_API_KEY;
  });
});

describe('GET /api/changes', () => {
  test('returns lock state', async () => {
    (getLockState as jest.Mock).mockReturnValueOnce({ locked: false });
    const req = new NextRequest('http://localhost/api/changes');
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('locked');
  });
});
