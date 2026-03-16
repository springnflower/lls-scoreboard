import { NextRequest } from 'next/server';
import { prisma } from '@/lib/server/db';

export async function GET(request: NextRequest) {
  const month = request.nextUrl.searchParams.get('month')?.trim();
  const where = month && /^\d{4}-\d{2}$/.test(month) ? { month } : undefined;

  const rows = await prisma.salesFact.groupBy({
    by: ['sku'],
    where,
    _sum: {
      revenue: true,
      qty: true,
      netRevenue: true,
      contribution: true,
    },
    orderBy: { _sum: { revenue: 'desc' } },
  })

  return Response.json(rows)
}
