import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import path from 'path';
import { releaseLock } from '@/lib/deploy-lock';

export async function POST(req: NextRequest) {
  const secret = process.env.DEPLOY_WEBHOOK_SECRET;
  if (secret) {
    const provided = req.headers.get('x-webhook-secret');
    if (provided !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // execFile avoids shell — no injection risk even if paths contain special chars
  const scriptPath = path.join(process.cwd(), 'deploy.sh');

  execFile('bash', [scriptPath], (err, stdout, stderr) => {
    if (err) {
      console.error('[deploy webhook] deploy.sh failed:', err.message, stderr);
      releaseLock(); // fallback: release lock if script crashes before its EXIT trap
    } else {
      console.log('[deploy webhook] deploy.sh completed:', stdout.trim());
    }
  });

  return NextResponse.json({ ok: true, message: 'Deploy started' });
}
