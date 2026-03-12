import type { ProductCostMasterRow } from '@/lib/types';

export const DEFAULT_COST_MASTERS: ProductCostMasterRow[] = [
  { keyword: '3-SOCKET', category: '3PORT', unitCost: 33800, packageCost: 1500, logisticsCost: 2800, memo: '초기값 예시', priority: 10 },
  { keyword: 'USB-C SOCKET', category: 'USB-C', unitCost: 41800, packageCost: 1500, logisticsCost: 2800, memo: '초기값 예시', priority: 10 },
  { keyword: 'CABLE', category: 'CABLE', unitCost: 8200, packageCost: 800, logisticsCost: 2200, memo: '초기값 예시', priority: 10 },
  { keyword: '3PACK', category: 'PACKAGE', unitCost: 101400, packageCost: 2500, logisticsCost: 3500, memo: '초기값 예시', priority: 20 },
  { keyword: 'COLLABO', category: 'COLLABO', unitCost: 35000, packageCost: 1500, logisticsCost: 2800, memo: '초기값 예시', priority: 30 }
];
