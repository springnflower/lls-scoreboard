import { prisma } from '@/lib/server/db';

export async function GET() {
  const rows = await prisma.$queryRaw<
    { sku: string; revenue: number }[]
  >`
    SELECT
      sku,
      SUM(revenue)::double precision AS revenue
    FROM "SalesFact"
    GROUP BY sku
    ORDER BY revenue DESC
  `

  return Response.json(rows)
}
