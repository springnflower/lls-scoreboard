import { prisma } from '@/lib/server/db';

function getThisAndLastMonth() {
  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const last = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonth = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}`
  return { thisMonth, lastMonth }
}

export async function GET() {
  const { thisMonth, lastMonth } = getThisAndLastMonth()

  const rows = await prisma.salesFact.groupBy({
    by: ['month'],
    where: { month: { in: [thisMonth, lastMonth] } },
    _sum: { revenue: true },
  })

  const byMonth = Object.fromEntries(rows.map((r) => [r.month, Number(r._sum.revenue ?? 0)]))
  const thisMonthRevenue = byMonth[thisMonth] ?? 0
  const lastMonthRevenue = byMonth[lastMonth] ?? 0

  return Response.json({
    thisMonth,
    lastMonth,
    thisMonthRevenue,
    lastMonthRevenue,
  })
}
