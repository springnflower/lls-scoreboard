import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  saveGoals,
  saveAdSpends,
  saveCostMasters,
  saveInventoryPositions,
  saveMonthlyTargets,
  saveChannelFeeRules,
  saveMediaSources
} from '@/lib/server/import-scoreboard';

const goalSchema = z.object({
  scope: z.enum(['TOTAL', 'CATEGORY', 'CHANNEL', 'SKU']),
  label: z.string().min(1),
  targetRevenue: z.number().nonnegative(),
  targetMarginRate: z.number().min(0).max(1).nullable().optional()
});

const adSpendSchema = z.object({
  channel: z.string().min(1),
  media: z.string().min(1),
  month: z.string().min(1),
  spend: z.number().nonnegative(),
  memo: z.string().optional()
});

const costMasterSchema = z.object({
  keyword: z.string().min(1),
  category: z.string().optional(),
  unitCost: z.number().nonnegative(),
  packageCost: z.number().nonnegative().optional(),
  logisticsCost: z.number().nonnegative().optional(),
  memo: z.string().optional(),
  priority: z.number().int().nonnegative().optional()
});

const inventorySchema = z.object({
  skuKeyword: z.string().min(1),
  category: z.string().optional(),
  onHandQty: z.number().int().nonnegative(),
  reservedQty: z.number().int().nonnegative().optional(),
  unitCost: z.number().nonnegative(),
  memo: z.string().optional()
});

const monthlyTargetSchema = z.object({
  scope: z.enum(['TOTAL', 'SKU']),
  label: z.string().min(1),
  month: z.string().min(1),
  targetRevenue: z.number().nonnegative()
});

const feeRuleSchema = z.object({
  channel: z.string().min(1),
  baseRate: z.number().min(0).max(1),
  extraRate: z.number().min(0).max(1).optional(),
  fixedFee: z.number().nonnegative().optional(),
  note: z.string().optional()
});

const mediaSourceSchema = z.object({
  media: z.string().min(1),
  sourceType: z.enum(['manual', 'api']),
  accountId: z.string().optional(),
  enabled: z.boolean().optional(),
  note: z.string().optional()
});

export async function PUT(request: NextRequest, { params }: { params: { batchId: string } }) {
  try {
    const json = await request.json();

    if (json.type === 'goals') return NextResponse.json(await saveGoals(params.batchId, z.array(goalSchema).parse(json.items)));
    if (json.type === 'adSpends') return NextResponse.json(await saveAdSpends(params.batchId, z.array(adSpendSchema).parse(json.items)));
    if (json.type === 'costMasters') return NextResponse.json(await saveCostMasters(params.batchId, z.array(costMasterSchema).parse(json.items)));
    if (json.type === 'inventoryPositions') return NextResponse.json(await saveInventoryPositions(params.batchId, z.array(inventorySchema).parse(json.items)));
    if (json.type === 'monthlyTargets') return NextResponse.json(await saveMonthlyTargets(params.batchId, z.array(monthlyTargetSchema).parse(json.items)));
    if (json.type === 'channelFeeRules') return NextResponse.json(await saveChannelFeeRules(params.batchId, z.array(feeRuleSchema).parse(json.items)));
    if (json.type === 'mediaSources') return NextResponse.json(await saveMediaSources(params.batchId, z.array(mediaSourceSchema).parse(json.items)));

    return NextResponse.json({ message: '지원하지 않는 저장 타입입니다.' }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: '설정 저장 실패' }, { status: 500 });
  }
}
