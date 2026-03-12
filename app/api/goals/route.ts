import { NextResponse } from 'next/server';
import { GoalScope } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/server/db';

const payloadSchema = z.object({
  batchId: z.string().min(1),
  goals: z.array(
    z.object({
      scope: z.nativeEnum(GoalScope),
      label: z.string().min(1),
      targetRevenue: z.number().nonnegative(),
      targetMarginRate: z.number().min(0).max(1).nullable().optional()
    })
  )
});

export async function POST(request: Request) {
  try {
    const payload = payloadSchema.parse(await request.json());

    await prisma.$transaction([
      prisma.goalTarget.deleteMany({ where: { batchId: payload.batchId } }),
      prisma.goalTarget.createMany({
        data: payload.goals.map((goal) => ({
          batchId: payload.batchId,
          scope: goal.scope,
          label: goal.label,
          targetRevenue: goal.targetRevenue,
          targetMarginRate: goal.targetMarginRate ?? null
        }))
      })
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'goal 저장 실패' }, { status: 500 });
  }
}
