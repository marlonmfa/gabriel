import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { acquireLock, getLockState, releaseLock } from '@/lib/deploy-lock';
import {
  getMainSha,
  createBranch,
  pushFileChange,
  openPullRequest,
  mergePullRequest,
  deleteBranch,
} from '@/lib/github';

const ChangeSchema = z.object({
  description: z.string().min(1).max(500),
  files: z.array(
    z.object({
      path: z.string().min(1),
      content: z.string(),
    })
  ).min(1).max(20),
  // Optional: API key to authenticate change submissions
  apiKey: z.string().optional(),
});

export async function POST(req: NextRequest) {
  // Auth: require CHANGES_API_KEY if set
  const requiredKey = process.env.CHANGES_API_KEY;
  if (requiredKey) {
    const providedKey = req.headers.get('x-api-key');
    if (providedKey !== requiredKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = ChangeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', detail: parsed.error.flatten() }, { status: 422 });
  }

  const { description, files } = parsed.data;

  // Block if another deployment is already in-flight
  const lockState = getLockState();
  if (lockState.locked) {
    return NextResponse.json(
      {
        error: 'Deployment in progress',
        detail: `Branch "${lockState.branch}" is being deployed since ${lockState.since}. Try again after it completes.`,
      },
      { status: 409 }
    );
  }

  const branch = `auto/${Date.now()}-${description.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`;

  if (!acquireLock(branch, description)) {
    return NextResponse.json({ error: 'Could not acquire deploy lock' }, { status: 409 });
  }

  try {
    // 1. Get current HEAD of main
    const sha = await getMainSha();

    // 2. Create feature branch off main
    await createBranch(branch, sha);

    // 3. Push each changed file to the branch
    for (const file of files) {
      await pushFileChange({
        branch,
        filePath: file.path,
        content: file.content,
        message: `auto: ${description} — ${file.path}`,
      });
    }

    // 4. Open PR
    const pr = await openPullRequest({
      branch,
      title: `[auto] ${description}`,
      body: [
        `## Auto-generated change`,
        `**Description:** ${description}`,
        ``,
        `**Files changed:**`,
        files.map(f => `- \`${f.path}\``).join('\n'),
        ``,
        `*This PR was opened automatically and will be merged immediately.*`,
      ].join('\n'),
    });

    // 5. Merge PR (squash)
    await mergePullRequest(pr.number);

    // 6. Clean up branch
    await deleteBranch(branch).catch(() => {/* non-fatal */});

    // 7. Trigger deploy on VPS (fire-and-forget via webhook to itself)
    const deployWebhookUrl = `${process.env.DEPLOY_WEBHOOK_URL ?? 'http://localhost:3000'}/api/webhook/deploy`;
    fetch(deployWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': process.env.DEPLOY_WEBHOOK_SECRET ?? '',
      },
      body: JSON.stringify({ branch, prNumber: pr.number, description }),
    }).catch((err) => console.error('[changes] deploy webhook fire failed:', err));

    return NextResponse.json({
      ok: true,
      pr: { number: pr.number, url: pr.html_url },
      branch,
      message: 'Change merged. Deploy triggered — page will reload once build completes.',
    });
  } catch (err) {
    releaseLock();
    return NextResponse.json(
      { error: 'Pipeline failed', detail: String(err) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(getLockState());
}
