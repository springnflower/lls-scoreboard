import { NextRequest } from 'next/server';
import { prisma } from '@/lib/server/db';

export async function GET(request: NextRequest) {
  const month = request.nextUrl.searchParams.get('month')?.trim();
  const where = month && /^\d{4}-\d{2}$/.test(month) ? { month } : undefined;

  const agg = await prisma.salesFact.aggregate({
    where,
    _sum: {
      revenue: true,
      netRevenue: true,
      contribution: true,
      orders: true,
    },
  })

  const totalRevenue = Number(agg._sum.revenue ?? 0)
  const totalNetRevenue = Number(agg._sum.netRevenue ?? 0)
  const totalContribution = Number(agg._sum.contribution ?? 0)
  const totalOrders = Number(agg._sum.orders ?? 0)
  const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0

  return Response.json({
    totalRevenue,
    totalNetRevenue,
    totalContribution,
    totalOrders,
    aov: Math.round(aov),
    month: where ? month : null,
  })
}
