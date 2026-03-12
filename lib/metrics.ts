import type {
  DashboardFilters,
  GoalTargetInput,
  ProductCostMasterRow,
  InventoryPositionRow,
  MonthlyTargetRow,
  ScoreboardData,
  SalesRow,
  SettlementRow,
  KpiCard
} from './types';

const normalizeChannel = (raw: string) => {
  if (!raw) return '기타';
  if (raw.includes('스마트스토어') || raw.includes('네이버')) return '네이버';
  if (raw.includes('쿠팡')) return '쿠팡';
  if (raw.toLowerCase().includes('29')) return '29CM';
  if (raw.includes('자사몰') || raw.includes('공식몰') || raw.includes('언와인드') || raw.toLowerCase().includes('shopify')) return '자사몰';
  return raw;
};
const div = (a: number, b: number) => (!b ? 0 : a / b);
const has = (text: string, keyword: string) => (text || '').toLowerCase().includes(keyword.toLowerCase());
const isCanceledSale = (row: SalesRow) => ['취소', '환불', '반품'].some((k) => has(row.status, k));
const isCanceledSettlement = (row: SettlementRow) => row.settlementAmount < 0 || ['취소', '환불', '반품'].some((k) => has(`${row.cancelType} ${row.transactionType}`, k));

function matchCost(productName: string, category: string, masters: ProductCostMasterRow[]) {
  return masters
    .filter((m) => (!m.category || m.category === category) && has(productName, m.keyword))
    .sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100) || b.keyword.length - a.keyword.length)[0];
}

function matchInventory(productName: string, inventory: InventoryPositionRow[]) {
  return inventory.find((row) => has(productName, row.skuKeyword) || has(row.skuKeyword, productName));
}

function matchGoal(productName: string, goals: GoalTargetInput[]) {
  return goals.find((goal) => goal.scope === 'SKU' && has(productName, goal.label));
}

function matchMonthlyTarget(productName: string, month: string, monthlyTargets: MonthlyTargetRow[]) {
  return monthlyTargets.find((row) => row.scope === 'SKU' && row.month === month && has(productName, row.label));
}

export function getDashboardModel(data: ScoreboardData, filters: DashboardFilters, goals: GoalTargetInput[] = []) {
  const monthlyTargets = data.monthlyTargets ?? [];
  const feeRules = data.channelFeeRules ?? [];
  const mediaSources = data.mediaSources ?? [];
  const costMasters = data.costMasters ?? [];
  const inventory = data.inventoryPositions ?? [];
  const adSpends = (data.adSpends ?? []).map((row) => ({ ...row, channel: normalizeChannel(row.channel) }));

  const filteredSales = data.sales
    .map((row) => ({ ...row, channel: normalizeChannel(row.channel) }))
    .filter((row) => {
      if (filters.month !== 'all' && row.month !== filters.month) return false;
      if (filters.channel !== 'all' && row.channel !== filters.channel) return false;
      if (filters.category !== 'all' && row.category !== filters.category) return false;
      if (filters.search && !`${row.productName} ${row.orderId}`.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  const filteredSettlements = data.settlements
    .map((row) => ({ ...row, partner: normalizeChannel(row.partner) }))
    .filter((row) => {
      const month = row.settledAt?.slice(0, 7) || '';
      if (filters.month !== 'all' && month !== filters.month) return false;
      if (filters.channel !== 'all' && row.partner !== filters.channel) return false;
      if (filters.category !== 'all' && row.category !== filters.category) return false;
      return true;
    });

  const activeSales = filteredSales.filter((row) => !isCanceledSale(row));
  const netSales = activeSales.reduce((sum, row) => sum + row.consumerPrice, 0);
  const grossSales = filteredSales.reduce((sum, row) => sum + row.consumerPrice, 0);
  const canceledSales = grossSales - netSales;
  const netUnits = activeSales.reduce((sum, row) => sum + row.qty, 0);
  const settlement = filteredSettlements.filter((row) => !isCanceledSettlement(row)).reduce((sum, row) => sum + row.settlementAmount, 0);
  const feeTotal = filteredSettlements.reduce((sum, row) => sum + row.fee, 0);
  const adTotal = adSpends
    .filter((row) => (filters.month === 'all' || row.month === filters.month) && (filters.channel === 'all' || row.channel === filters.channel))
    .reduce((sum, row) => sum + row.spend, 0);

  const enrichedSales = activeSales.map((row) => {
    const cost = matchCost(row.productName, row.category, costMasters);
    const unitCost = (cost?.unitCost ?? 0) + (cost?.packageCost ?? 0) + (cost?.logisticsCost ?? 0);
    return { ...row, unitCost, cogs: unitCost * row.qty };
  });
  const productCost = enrichedSales.reduce((sum, row) => sum + row.cogs, 0);

  const totalGoal = goals.find((g) => g.scope === 'TOTAL');
  const totalGoalValue = totalGoal?.targetRevenue ?? 0;
  const remainingGoal = Math.max(totalGoalValue - netSales, 0);

  const invSummary = inventory.reduce((acc, row) => {
    const availableQty = Math.max(row.onHandQty - (row.reservedQty ?? 0), 0);
    acc.qty += availableQty;
    acc.asset += availableQty * row.unitCost;
    return acc;
  }, { qty: 0, asset: 0 });

  const monthlyMap = new Map<string, { month: string; sales: number; spend: number; target: number }>();
  enrichedSales.forEach((row) => {
    const current = monthlyMap.get(row.month) ?? { month: row.month, sales: 0, spend: 0, target: 0 };
    current.sales += row.consumerPrice;
    monthlyMap.set(row.month, current);
  });
  adSpends.forEach((row) => {
    if (filters.channel !== 'all' && row.channel !== filters.channel) return;
    const current = monthlyMap.get(row.month) ?? { month: row.month, sales: 0, spend: 0, target: 0 };
    current.spend += row.spend;
    monthlyMap.set(row.month, current);
  });
  monthlyTargets.forEach((row) => {
    if (row.scope !== 'TOTAL') return;
    const current = monthlyMap.get(row.month) ?? { month: row.month, sales: 0, spend: 0, target: 0 };
    current.target += row.targetRevenue;
    monthlyMap.set(row.month, current);
  });
  const monthlyTrend = Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month));

  const channelFeeMap = new Map<string, { channel: string; fee: number; settlement: number; expectedFee: number }>();
  filteredSettlements.forEach((row) => {
    const current = channelFeeMap.get(row.partner) ?? { channel: row.partner, fee: 0, settlement: 0, expectedFee: 0 };
    current.fee += row.fee;
    if (!isCanceledSettlement(row)) current.settlement += row.settlementAmount;
    channelFeeMap.set(row.partner, current);
  });
  const channelFeeTotals = Array.from(channelFeeMap.values()).map((row) => {
    const rule = feeRules.find((r) => r.channel === row.channel);
    const expectedFee = rule ? row.settlement * ((rule.baseRate ?? 0) + (rule.extraRate ?? 0)) + (rule.fixedFee ?? 0) : 0;
    return { ...row, feeRate: div(row.fee, row.settlement || 1), expectedFee, variance: row.fee - expectedFee };
  }).sort((a, b) => b.fee - a.fee);

  const mediaSpendTotals = Array.from(adSpends.reduce((map, row) => {
    if (filters.month !== 'all' && row.month !== filters.month) return map;
    if (filters.channel !== 'all' && row.channel !== filters.channel) return map;
    const current = map.get(row.media) ?? { media: row.media, spend: 0, enabledSourceCount: 0 };
    current.spend += row.spend;
    current.enabledSourceCount = mediaSources.filter((s) => s.media === row.media && s.enabled).length;
    map.set(row.media, current);
    return map;
  }, new Map<string, { media: string; spend: number; enabledSourceCount: number }>()).values()).map((row) => ({ ...row, share: div(row.spend, adTotal || 1) })).sort((a, b) => b.spend - a.spend);

  const skuAccumulator = new Map<string, any>();
  enrichedSales.forEach((row) => {
    const current = skuAccumulator.get(row.productName) ?? { productName: row.productName, category: row.category, sales: 0, units: 0, cogs: 0 };
    current.sales += row.consumerPrice;
    current.units += row.qty;
    current.cogs += row.cogs;
    skuAccumulator.set(row.productName, current);
  });
  const skuGoalTracker = Array.from(skuAccumulator.values()).map((row: any) => {
    const goal = matchGoal(row.productName, goals);
    const inv = matchInventory(row.productName, inventory);
    const availableQty = Math.max((inv?.onHandQty ?? 0) - (inv?.reservedQty ?? 0), 0);
    const asset = availableQty * (inv?.unitCost ?? (row.units ? row.cogs / row.units : 0));
    const avgPrice = row.units ? row.sales / row.units : 0;
    const months = monthlyTrend.length || 1;
    const monthlyRunRateQty = row.units / months;
    const weeksOfCover = monthlyRunRateQty ? availableQty / (monthlyRunRateQty / 4) : 0;
    const sellThrough = div(row.units, row.units + availableQty);
    const shortageAlert = goal ? goal.targetRevenue > row.sales && availableQty * avgPrice < goal.targetRevenue - row.sales : false;
    const excessAlert = weeksOfCover > 16;
    const reorderQty = shortageAlert ? Math.ceil(((goal?.targetRevenue ?? 0) - row.sales) / (avgPrice || 1)) - availableQty : 0;
    return {
      ...row,
      targetRevenue: goal?.targetRevenue ?? 0,
      achievementRate: goal?.targetRevenue ? div(row.sales, goal.targetRevenue) : 0,
      gapToTarget: goal?.targetRevenue ? Math.max(goal.targetRevenue - row.sales, 0) : 0,
      inventoryQty: availableQty,
      inventoryAsset: asset,
      sellThrough,
      weeksOfCover,
      shortageAlert,
      excessAlert,
      reorderQty: Math.max(reorderQty, 0)
    };
  }).sort((a, b) => (b.targetRevenue || b.sales) - (a.targetRevenue || a.sales));

  const inventoryTracker = inventory.map((row) => {
    const availableQty = Math.max(row.onHandQty - (row.reservedQty ?? 0), 0);
    const sku = skuGoalTracker.find((s: any) => has(s.productName, row.skuKeyword));
    const retailPotential = availableQty * (sku?.sales && sku?.units ? sku.sales / sku.units : 0);
    return { ...row, availableQty, assetValue: availableQty * row.unitCost, retailPotential, sellThrough: sku?.sellThrough ?? 0, weeksOfCover: sku?.weeksOfCover ?? 0, reorderQty: sku?.reorderQty ?? 0, shortageAlert: sku?.shortageAlert ?? false, excessAlert: sku?.excessAlert ?? false };
  }).sort((a, b) => b.assetValue - a.assetValue);

  const planningAlerts = [
    ...(skuGoalTracker.filter((row: any) => row.shortageAlert).slice(0, 5).map((row: any) => ({ type: 'stockout-risk', message: `${row.productName} 목표 대비 재고 부족 가능성`, severity: 'high' }))),
    ...(inventoryTracker.filter((row: any) => row.excessAlert).slice(0, 5).map((row: any) => ({ type: 'overstock-risk', message: `${row.skuKeyword} 재고 과잉 가능성`, severity: 'medium' }))),
    ...(channelFeeTotals.filter((row: any) => row.expectedFee > 0 && row.variance > 0).slice(0, 3).map((row: any) => ({ type: 'fee-variance', message: `${row.channel} 수수료가 룰 대비 높음`, severity: 'medium' })))
  ];

  const kpis: KpiCard[] = [
    { label: '전체 목표', value: totalGoalValue, unit: 'currency', description: 'TOTAL goal' },
    { label: '누적 순매출', value: netSales, unit: 'currency', description: '취소 제외 매출' },
    { label: '남은 목표', value: remainingGoal, unit: 'currency', description: `달성률 ${(div(netSales, totalGoalValue || 1) * 100).toFixed(1)}%` },
    { label: '채널 수수료 총합', value: feeTotal, unit: 'currency', description: '유통 채널 수수료 total' },
    { label: '광고비 총합', value: adTotal, unit: 'currency', description: '미디어별 집행 total (입력: 목표/광고비 페이지)' },
    { label: '재고 자산', value: invSummary.asset, unit: 'currency', description: '가용 재고 원가 기준 (입력: 재고 페이지)' },
    { label: '재고 가용수량', value: invSummary.qty, unit: 'count', description: '예약 제외 재고 (입력: 재고 페이지)' },
    { label: '원가 매칭률', value: div(enrichedSales.filter((r) => r.unitCost > 0).reduce((s, r) => s + r.qty, 0), netUnits || 1), unit: 'percent', description: 'sku 손익 계산 커버리지' }
  ];

  return {
    kpis,
    overallTarget: { totalTarget: totalGoalValue, achievedRevenue: netSales, remainingToTarget: remainingGoal, achievementRate: div(netSales, totalGoalValue || 1) },
    inventorySummary: invSummary,
    monthlyTrend,
    skuGoalTracker,
    channelFeeTotals,
    mediaSpendTotals,
    inventoryTracker,
    planningAlerts,
    options: {
      months: Array.from(new Set(data.sales.map((r) => r.month))).sort(),
      channels: Array.from(new Set(data.sales.map((r) => normalizeChannel(r.channel)))).sort(),
      categories: Array.from(new Set(data.sales.map((r) => r.category))).filter(Boolean).sort()
    }
  };
}
