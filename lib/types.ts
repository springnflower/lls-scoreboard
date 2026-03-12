export type SalesRow = {
  source: 'sales';
  channel: string;
  orderId: string;
  orderDate: string;
  month: string;
  status: string;
  productName: string;
  color: string;
  category: string;
  qty: number;
  consumerPrice: number;
  address: string;
};

export type SettlementRow = {
  source: 'settlement';
  partner: string;
  monthNumber: number | null;
  settledAt: string;
  settlementId: string;
  transactionType: string;
  productName: string;
  color: string;
  category: string;
  grossSales: number;
  fee: number;
  adjustment: number;
  settlementAmount: number;
  qty: number;
  isMatched: boolean;
  cancelType: string;
};

export type PurchaseRow = {
  source: 'purchase';
  accountType: string;
  fiscalYear: string;
  purchaseDate: string;
  vendor: string;
  item: string;
  qty: number;
  supplyCost: number;
  totalWithVat: number;
  paid: boolean;
  note: string;
};

export type AdSpendRow = {
  id?: string;
  channel: string;
  media: string;
  month: string;
  spend: number;
  memo?: string;
};

export type ProductCostMasterRow = {
  id?: string;
  keyword: string;
  category?: string;
  unitCost: number;
  packageCost?: number;
  logisticsCost?: number;
  memo?: string;
  priority?: number;
};

export type InventoryPositionRow = {
  id?: string;
  skuKeyword: string;
  category?: string;
  onHandQty: number;
  reservedQty?: number;
  unitCost: number;
  memo?: string;
};

export type MonthlyTargetRow = {
  id?: string;
  scope: 'TOTAL' | 'SKU';
  label: string;
  month: string;
  targetRevenue: number;
};

export type ChannelFeeRuleRow = {
  id?: string;
  channel: string;
  baseRate: number;
  extraRate?: number;
  fixedFee?: number;
  note?: string;
};

export type MediaSourceRow = {
  id?: string;
  media: string;
  sourceType: 'manual' | 'api';
  accountId?: string;
  enabled?: boolean;
  note?: string;
};

export type ScoreboardData = {
  sales: SalesRow[];
  settlements: SettlementRow[];
  purchases: PurchaseRow[];
  adSpends?: AdSpendRow[];
  costMasters?: ProductCostMasterRow[];
  inventoryPositions?: InventoryPositionRow[];
  monthlyTargets?: MonthlyTargetRow[];
  channelFeeRules?: ChannelFeeRuleRow[];
  mediaSources?: MediaSourceRow[];
};

export type GoalTargetInput = {
  scope: 'TOTAL' | 'CATEGORY' | 'CHANNEL' | 'SKU';
  label: string;
  targetRevenue: number;
  targetMarginRate?: number | null;
};

export type DashboardFilters = {
  month: string;
  channel: string;
  category: string;
  search: string;
};

export type KpiCard = {
  label: string;
  value: number;
  unit?: 'currency' | 'percent' | 'count';
  description: string;
  delta?: number;
};

export type PersistedDashboardResponse = {
  batchId: string;
  fileName: string;
  importedAt: string;
  storagePath?: string | null;
  data: ScoreboardData;
  goals: GoalTargetInput[];
};

export type BatchSummary = {
  id: string;
  fileName: string;
  importedAt: string;
  storagePath?: string | null;
  salesCount: number;
  totalRevenue: number;
};

export type CompareResponse = {
  current: PersistedDashboardResponse | null;
  previous: PersistedDashboardResponse | null;
};
