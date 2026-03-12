/**
 * 채널별 품목/카테고리 포커스 매핑
 * 네이버 → 멀티탭, 29CM → 패키지
 */
export const CHANNEL_FOCUS: Record<string, string> = {
  네이버: '멀티탭',
  '29CM': '패키지',
}

export function getChannelFocus(channel: string): string {
  return CHANNEL_FOCUS[channel] ?? channel
}
