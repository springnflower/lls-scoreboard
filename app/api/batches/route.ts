import { NextResponse } from 'next/server';
import { listBatchSummaries } from '@/lib/server/import-scoreboard';

export async function GET() {
  try {
    const payload = await listBatchSummaries();
    return NextResponse.json(payload);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'batch 목록 조회 실패' }, { status: 500 });
  }
}
