import { prisma } from './db';

export type SalesFactRow = {
  date: Date | string
  month: string
  channel: string
  sku: string
  category: string
  revenue: number
  netRevenue: number
  qty: number
  orders: number
  fee: number
  adSpend: number
  cost: number
}

const normalizeChannel = (raw: string) => {
  if (!raw) return '기타'
  if (raw.includes('스마트스토어') || raw.includes('네이버')) return '네이버'
  if (raw.includes('쿠팡')) return '쿠팡'
  if (raw.toLowerCase().includes('29')) return '29CM'
  if (raw.includes('자사몰') || raw.includes('공식몰') || raw.includes('언와인드') || raw.toLowerCase().includes('shopify')) return '자사몰'
  return raw
}

const normalizeForMatch = (s: string) => (s || '').replace(/[\s-]/g, '').toLowerCase()

function matchCost(
  productName: string,
  category: string,
  masters: BatchInput['costMasters']
): { unitCost: number; packageCost: number; logisticsCost: number } | null {
  if (!masters?.length) return null
  const nameNorm = normalizeForMatch(productName)
  const matched = masters
    .filter((m) => {
      if (m.category && m.category !== category) return false
      const kw = (m.keyword ?? '').trim()
      const kwNorm = normalizeForMatch(kw)
      return nameNorm.includes(kwNorm) || kwNorm.includes(nameNorm)
    })
    .sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100) || (b.keyword?.length ?? 0) - (a.keyword?.length ?? 0))[0]
  if (!matched) return null
  return {
    unitCost: Number(matched.unitCost) || 0,
    packageCost: Number(matched.packageCost) || 0,
    logisticsCost: Number(matched.logisticsCost) || 0
  }
}

const isCanceled = (status: string) =>
  ['취소', '환불', '반품'].some((k) => (status || '').toLowerCase().includes(k.toLowerCase()))

type BatchInput = {
  salesOrders: Array<{
    orderDate: Date | null
    monthKey: string
    channel: string
    productName: string
    category: string
    consumerPrice: unknown
    qty: number
    status: string
  }>
  settlements?: Array<{
    partner: string
    settledAt: Date | null
    fee: unknown
    settlementAmount?: unknown
    cancelType?: string
    transactionType?: string
  }>
  costMasters?: Array<{ keyword: string; category?: string; unitCost?: number | unknown; packageCost?: number | unknown; logisticsCost?: number | unknown; priority?: number }>
  adSpends?: Array<{ channel: string; media?: string; monthKey?: string; month?: string; spend: unknown }>
}

/** 채널·월별 수수료 합계 (정산 데이터). 채널별 매출·수수료 차트 등에서 사용 */
function feeByMonthChannel(settlements: BatchInput['settlements']): Map<string, number> {
  const map = new Map<string, number>()
  if (!settlements?.length) return map
  for (const s of settlements) {
    const channel = normalizeChannel(s.partner)
    const month = s.settledAt ? s.settledAt.toISOString().slice(0, 7) : ''
    if (!month || !/^\d{4}-\d{2}$/.test(month)) continue
    const key = `${month}|${channel}`
    const fee = Number(s.fee) || 0
    map.set(key, (map.get(key) ?? 0) + fee)
  }
  return map
}

/** 채널·월별 광고비 합계 (adSpends). 공헌이익 계산 시 사용 */
function adSpendByMonthChannel(adSpends: BatchInput['adSpends']): Map<string, number> {
  const map = new Map<string, number>()
  if (!adSpends?.length) return map
  for (const a of adSpends) {
    const channel = normalizeChannel(a.channel)
    const month = (a.monthKey ?? a.month ?? '').toString().trim()
    if (!month || !/^\d{4}-\d{2}$/.test(month)) continue
    const key = `${month}|${channel}`
    const spend = Number(a.spend) || 0
    map.set(key, (map.get(key) ?? 0) + spend)
  }
  return map
}

/** 단가·비용 상한: 원가 오입력 시 공헌이익이 수조 원으로 튀는 것 방지 (단가 5천만 원/개 상한) */
const MAX_UNIT_COST = 50_000_000
/** 행당 수수료/광고비는 해당 행 순매출의 이 배수까지만 인정 (비정상 배분 방지) */
const MAX_FEE_OR_ADSPEND_MULTIPLIER = 5

/** 채널·월별 매출 합계 (commission 시트 보정용) */
function revenueByMonthChannel(salesOrders: BatchInput['salesOrders']): Map<string, number> {
  const map = new Map<string, number>()
  for (const o of salesOrders) {
    const channel = normalizeChannel(o.channel)
    const month = o.monthKey && /^\d{4}-\d{2}$/.test(o.monthKey) ? o.monthKey : (o.orderDate ? new Date(o.orderDate).toISOString().slice(0, 7) : '')
    if (!month) continue
    const key = `${month}|${channel}`
    const rev = Number(o.consumerPrice) || 0
    map.set(key, (map.get(key) ?? 0) + rev)
  }
  return map
}

/** 배치의 매출/정산 데이터를 SalesFact 행으로 변환 (Sales·SKU·Channels 등 페이지 집계용) */
export function batchToSalesFactRows(
  batch: BatchInput,
  channelCommissionRates?: Record<string, number>
): SalesFactRow[] {
  const feeMap = feeByMonthChannel(batch.settlements)
  const adSpendMap = adSpendByMonthChannel(batch.adSpends)
  const costMasters = batch.costMasters ?? []

  if (channelCommissionRates && Object.keys(channelCommissionRates).length > 0) {
    const revByKey = revenueByMonthChannel(batch.salesOrders)
    for (const [key, revenueSum] of revByKey) {
      const currentFee = feeMap.get(key) ?? 0
      if (currentFee > 0) continue
      const channel = key.split('|')[1] ?? ''
      const rate = channelCommissionRates[channel] ?? channelCommissionRates[channel.trim()] ?? 0
      if (rate > 0) feeMap.set(key, revenueSum * rate)
    }
  }

  const countByKey = new Map<string, number>()
  for (const o of batch.salesOrders) {
    const channel = normalizeChannel(o.channel)
    const month = o.monthKey && /^\d{4}-\d{2}$/.test(o.monthKey) ? o.monthKey : (o.orderDate ? new Date(o.orderDate).toISOString().slice(0, 7) : '')
    if (month) {
      const key = `${month}|${channel}`
      countByKey.set(key, (countByKey.get(key) ?? 0) + 1)
    }
  }

  const rows: SalesFactRow[] = []
  for (const o of batch.salesOrders) {
    const channel = normalizeChannel(o.channel)
    const revenue = Number(o.consumerPrice) || 0
    const canceled = isCanceled(o.status)
    const date = o.orderDate || new Date()
    const month = o.monthKey && /^\d{4}-\d{2}$/.test(o.monthKey) ? o.monthKey : date.toISOString().slice(0, 7)
    const key = `${month}|${channel}`

    const totalFee = feeMap.get(key) ?? 0
    const count = countByKey.get(key) ?? 1
    let fee = count > 0 ? totalFee / count : 0

    const totalAdSpend = adSpendMap.get(key) ?? 0
    let adSpend = count > 0 ? totalAdSpend / count : 0

    // 순매출 = 매출(판매금액) - 수수료. 취소건은 0.
    const netRevenue = canceled ? 0 : Math.max(0, revenue - fee)

    // 행당 수수료·광고비가 매출 대비 비정상적으로 크면 상한 적용 (순환 방지를 위해 매출 기준)
    const cap = (canceled ? 0 : revenue) * MAX_FEE_OR_ADSPEND_MULTIPLIER
    if (fee > cap) fee = cap
    if (adSpend > cap) adSpend = cap
    // 제품원가도 순매출의 20배를 넘지 않도록 상한 (오입력 방지)
    const costMaster = matchCost(o.productName ?? '', o.category ?? '미분류', costMasters)
    const rawUnitCost = costMaster
      ? costMaster.unitCost + costMaster.packageCost + costMaster.logisticsCost
      : 0
    const unitCost = rawUnitCost > MAX_UNIT_COST ? MAX_UNIT_COST : rawUnitCost
    let cost = unitCost * (o.qty ?? 0)
    const costCap = netRevenue * 20
    if (cost > costCap) cost = costCap

    rows.push({
      date,
      month,
      channel,
      sku: o.productName || '',
      category: o.category || '미분류',
      revenue,
      netRevenue,
      qty: o.qty ?? 0,
      orders: 1,
      fee,
      adSpend,
      cost,
    })
  }
  return rows
}

/** 기존 SalesFact 전부 삭제 후 새 행으로 채움 (import 시 배치 기준으로 Sales 오버뷰 집계) */
export async function rebuildSalesFactFromBatch(
  batch: Parameters<typeof batchToSalesFactRows>[0],
  channelCommissionRates?: Record<string, number>
) {
  const rows = batchToSalesFactRows(batch, channelCommissionRates)
  await prisma.salesFact.deleteMany({})
  if (rows.length === 0) return
  await buildSalesFact(rows)
}

/** 행당 공헌이익 하한: 순매출의 -50배를 넘어가면 오류로 간주하고 상한 적용 */
const MIN_CONTRIBUTION_MULTIPLIER = 50

export async function buildSalesFact(rows: SalesFactRow[]) {
  const facts = rows.map((r) => {
    // 공헌이익 = 순매출 - 제품원가  (순매출에 이미 수수료가 반영되어 있으므로 여기서는 한 번만 차감)
    let contribution = r.netRevenue - r.cost
    const floor = r.netRevenue * -MIN_CONTRIBUTION_MULTIPLIER
    if (contribution < floor) contribution = floor
    return {
      date: typeof r.date === 'string' ? new Date(r.date) : r.date,
      month: r.month,
      channel: r.channel,
      sku: r.sku,
      category: r.category,
      revenue: r.revenue,
      netRevenue: r.netRevenue,
      qty: r.qty,
      orders: r.orders,
      fee: r.fee,
      adSpend: r.adSpend,
      cost: r.cost,
      contribution,
    }
  })

  await prisma.salesFact.createMany({
    data: facts,
  })
}
