import { NextResponse } from 'next/server';
import { getLockState } from '@/lib/deploy-lock';

export async function GET() {
  return NextResponse.json(getLockState());
}
