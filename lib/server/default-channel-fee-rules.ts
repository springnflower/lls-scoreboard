import type { ChannelFeeRuleRow } from '@/lib/types';

/** 채널명은 metrics.ts normalizeChannel 결과와 동일해야 함 (네이버, 쿠팡, 29CM, 자사몰, 기타) */
export const DEFAULT_CHANNEL_FEE_RULES: ChannelFeeRuleRow[] = [
  { channel: '네이버', baseRate: 0.059, extraRate: 0, fixedFee: 0, note: '스마트스토어 기본' },
  { channel: '쿠팡', baseRate: 0.12, extraRate: 0, fixedFee: 0, note: '로켓배송 기본' },
  { channel: '29CM', baseRate: 0.15, extraRate: 0, fixedFee: 0, note: '기본 수수료' },
  { channel: '자사몰', baseRate: 0.03, extraRate: 0, fixedFee: 0, note: 'PG 등' },
  { channel: '기타', baseRate: 0.1, extraRate: 0, fixedFee: 0, note: '기본 가정' }
];
