import { NextRequest, NextResponse } from 'next/server';
import { getBatchDashboard, getLatestBatchDashboard } from '@/lib/server/import-scoreboard';

export async function GET(request: NextRequest) {
  try {
    const batchId = request.nextUrl.searchParams.get('batchId');
    const payload = batchId ? await getBatchDashboard(batchId) : await getLatestBatchDashboard();
    return NextResponse.json(payload);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'dashboard 조회 실패' }, { status: 500 });
  }
}
