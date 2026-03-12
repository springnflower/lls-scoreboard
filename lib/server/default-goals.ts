import type { GoalTargetInput } from '@/lib/types';

export const DEFAULT_GOALS: GoalTargetInput[] = [
  { scope: 'TOTAL', label: 'FY26 TOTAL', targetRevenue: 1_000_000_000, targetMarginRate: 0.35 },
  { scope: 'CATEGORY', label: '3PORT', targetRevenue: 500_000_000, targetMarginRate: 0.4 },
  { scope: 'CATEGORY', label: 'USB-C', targetRevenue: 220_000_000, targetMarginRate: 0.32 },
  { scope: 'CATEGORY', label: 'CABLE', targetRevenue: 100_000_000, targetMarginRate: 0.38 },
  { scope: 'CATEGORY', label: 'PACKAGE', targetRevenue: 120_000_000, targetMarginRate: 0.42 },
  { scope: 'CHANNEL', label: '네이버', targetRevenue: 450_000_000, targetMarginRate: 0.35 },
  { scope: 'CHANNEL', label: '쿠팡', targetRevenue: 200_000_000, targetMarginRate: 0.28 },
  { scope: 'CHANNEL', label: '29CM', targetRevenue: 180_000_000, targetMarginRate: 0.42 },
  { scope: 'CHANNEL', label: '자사몰', targetRevenue: 170_000_000, targetMarginRate: 0.55 }
  // SKU 목표는 DB에 GoalScope enum에 'SKU' 추가 후 사용 (v7 마이그레이션 적용 시)
];
