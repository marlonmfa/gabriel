import { NextRequest, NextResponse } from 'next/server';
import { ProgressSchema } from '@/lib/validators';
import { updateSession } from '@/lib/session-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = ProgressSchema.parse(body);

    updateSession(data.profileId, (s) => ({
      ...s,
      activeSession: s.activeSession
        ? {
            ...s.activeSession,
            conceptMastery: {
              ...s.activeSession.conceptMastery,
              ...data.conceptMastery,
            },
            lastActivityAt: new Date().toISOString(),
          }
        : s.activeSession,
    }));

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: 'Progress update failed', detail: String(err) },
      { status: 400 }
    );
  }
}
