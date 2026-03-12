import { prisma } from '@/lib/server/db';

function getThisAndLastMonth() {
  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const last = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonth = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}`
  return { thisMonth, lastMonth }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const channel = searchParams.get('channel') ?? '네이버'

  const { thisMonth, lastMonth } = getThisAndLastMonth()

  const rows = await prisma.salesFact.groupBy({
    by: ['channel', 'month'],
    where: {
      channel,
      month: { in: [thisMonth, lastMonth] },
    },
    _sum: { revenue: true },
  })

  const byMonth = Object.fromEntries(
    rows.filter((r) => r.channel === channel).map((r) => [r.month, Number(r._sum.revenue ?? 0)])
  )
  const thisMonthRevenue = byMonth[thisMonth] ?? 0
  const lastMonthRevenue = byMonth[lastMonth] ?? 0
  const momPct =
    lastMonthRevenue > 0
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : thisMonthRevenue > 0
        ? 100
        : 0

  return Response.json({
    channel,
    thisMonth,
    lastMonth,
    thisMonthRevenue,
    lastMonthRevenue,
    momPct: Math.round(momPct * 10) / 10,
  })
}
