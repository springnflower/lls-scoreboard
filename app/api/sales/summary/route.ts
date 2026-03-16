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
      adSpend: true,
      orders: true,
    },
  })

  const totalRevenue = Number(agg._sum.revenue ?? 0)
  const totalNetRevenue = Number(agg._sum.netRevenue ?? 0)
  const totalContribution = Number(agg._sum.contribution ?? 0)
  let totalAdSpend = Number(agg._sum.adSpend ?? 0)
  const totalOrders = Number(agg._sum.orders ?? 0)
  const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0

  if (totalAdSpend === 0) {
    const latestBatch = await prisma.importBatch.findFirst({
      orderBy: { importedAt: 'desc' },
      select: { id: true },
    })
    if (latestBatch) {
      const adWhere: { batchId: string; monthKey?: string } = { batchId: latestBatch.id }
      if (month && /^\d{4}-\d{2}$/.test(month)) adWhere.monthKey = month
      const adAgg = await prisma.adSpend.aggregate({
        where: adWhere,
        _sum: { spend: true },
      })
      totalAdSpend = Number(adAgg._sum.spend ?? 0)
    }
  }

  return Response.json({
    totalRevenue,
    totalNetRevenue,
    totalContribution,
    totalAdSpend,
    contributionAfterAdSpend: totalContribution - totalAdSpend,
    totalOrders,
    aov: Math.round(aov),
    month: where ? month : null,
  })
}
