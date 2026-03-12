import { NextRequest } from 'next/server';
import { prisma } from '@/lib/server/db';

/** SKU·월별 매출 (성장률·라이프사이클·신제품용) */
export async function GET(request: NextRequest) {
  const month = request.nextUrl.searchParams.get('month')?.trim();
  const where = month && /^\d{4}-\d{2}$/.test(month) ? { month } : undefined;

  const rows = await prisma.salesFact.groupBy({
    by: ['sku', 'month'],
    where,
    _sum: { revenue: true, netRevenue: true, qty: true, contribution: true },
    orderBy: [{ sku: 'asc' }, { month: 'asc' }],
  });

  return Response.json(rows);
}
