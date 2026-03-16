import { NextRequest } from 'next/server';
import { prisma } from '@/lib/server/db';

export async function GET(request: NextRequest) {
  const month = request.nextUrl.searchParams.get('month')?.trim();
  const where = month && /^\d{4}-\d{2}$/.test(month) ? { month } : undefined;

  const bySku = await prisma.salesFact.groupBy({
    by: ['sku'],
    where,
    _sum: { revenue: true },
    orderBy: { _sum: { revenue: 'desc' } },
  })

  const agg = await prisma.salesFact.aggregate({
    where,
    _sum: { revenue: true, netRevenue: true, contribution: true, adSpend: true },
  })

  const totalRevenue = bySku.reduce((sum, r) => sum + Number(r._sum.revenue ?? 0), 0)
  const top3Revenue = bySku.slice(0, 3).reduce((sum, r) => sum + Number(r._sum.revenue ?? 0), 0)
  const top10Revenue = bySku.slice(0, 10).reduce((sum, r) => sum + Number(r._sum.revenue ?? 0), 0)

  const top3Pct = totalRevenue > 0 ? (top3Revenue / totalRevenue) * 100 : 0
  const top10Pct = totalRevenue > 0 ? (top10Revenue / totalRevenue) * 100 : 0

  const totalContribution = Number(agg._sum.contribution ?? 0)
  const totalNetRevenue = Number(agg._sum.netRevenue ?? 0)
  let totalAdSpend = Number(agg._sum.adSpend ?? 0)
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
  const contributionMarginPct = totalNetRevenue > 0 ? (totalContribution / totalNetRevenue) * 100 : 0

  return Response.json({
    totalRevenue,
    top3Revenue,
    top10Revenue,
    top3Pct: Math.round(top3Pct * 10) / 10,
    top10Pct: Math.round(top10Pct * 10) / 10,
    totalContribution,
    contributionMarginPct: Math.round(contributionMarginPct * 10) / 10,
    totalAdSpend,
    month: where ? month : null,
  })
}
