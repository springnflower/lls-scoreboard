import { prisma } from '@/lib/server/db';

export async function GET() {
  const data = await prisma.salesFact.groupBy({
    by: ['month'],
    _sum: {
      revenue: true,
      netRevenue: true,
      contribution: true,
      orders: true,
    },
  })

  return Response.json(data)
}
