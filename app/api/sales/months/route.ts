import { prisma } from '@/lib/server/db';

/** SalesFact에 존재하는 월 목록 (YYYY-MM) 정렬 반환. 월별 필터 선택기용 */
export async function GET() {
  const rows = await prisma.salesFact.findMany({
    select: { month: true },
    distinct: ['month'],
    where: { month: { not: '' } },
    orderBy: { month: 'asc' },
  })
  const months = rows.map((r) => r.month).filter(Boolean) as string[]
  return Response.json(months)
}
