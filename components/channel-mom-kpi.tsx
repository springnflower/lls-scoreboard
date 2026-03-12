'use client';

import useSWR from 'swr';
import { Card } from './ui';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type Data = {
  channel: string;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  momPct: number;
  thisMonth: string;
  lastMonth: string;
};

const fmt = (n: number) => new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(n);

export function ChannelMomKpi({ channel = '네이버' }: { channel?: string }) {
  const { data, error } = useSWR<Data>(`/api/sales/channel-mom?channel=${encodeURIComponent(channel)}`, fetcher);

  if (error) return <p className="text-sm text-red-600">로딩 실패</p>;
  if (!data) return null;

  const isUp = data.momPct >= 0

  return (
    <Card className="p-4">
      <p className="text-sm text-slate-500">{channel} 매출 MoM</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${isUp ? 'text-emerald-600' : 'text-red-600'}`}>
        {data.momPct >= 0 ? '+' : ''}{data.momPct}%
      </p>
      <p className="mt-0.5 text-xs text-slate-400">
        이번달 {fmt(data.thisMonthRevenue)} / 지난달 {fmt(data.lastMonthRevenue)}
      </p>
    </Card>
  )
}
