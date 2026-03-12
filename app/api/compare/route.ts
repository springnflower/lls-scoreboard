import { NextRequest, NextResponse } from 'next/server';
import { listBatchSummaries, getBatchDashboard } from '@/lib/server/import-scoreboard';

export async function GET(request: NextRequest) {
  try {
    const currentId = request.nextUrl.searchParams.get('currentId');
    const previousId = request.nextUrl.searchParams.get('previousId');
    const batches = await listBatchSummaries();

    const currentBatchId = currentId ?? batches[0]?.id;
    const previousBatchId = previousId ?? batches.find((batch) => batch.id !== currentBatchId)?.id;

    const [current, previous] = await Promise.all([
      currentBatchId ? getBatchDashboard(currentBatchId) : Promise.resolve(null),
      previousBatchId ? getBatchDashboard(previousBatchId) : Promise.resolve(null)
    ]);

    return NextResponse.json({ current, previous });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'batch 비교 조회 실패' }, { status: 500 });
  }
}
