'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from './ui';

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const fmt = (n: number) => new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(n);

type AdSpendRow = { channel: string; media: string; month: string; spend: number };
type ChannelRow = { channel: string; _sum: { revenue?: number; adSpend?: number } };

export function MarketingAdSpendChart() {
  const [adSpends, setAdSpends] = useState<AdSpendRow[]>([]);
  const { data: dashboard } = useSWR<{ data?: { adSpends?: AdSpendRow[] } }>('/api/dashboard', fetcher);
  const { data: channelRows } = useSWR<ChannelRow[]>('/api/sales-fact/channel', fetcher);

  useEffect(() => {
    if (dashboard?.data?.adSpends) setAdSpends(dashboard.data.adSpends);
  }, [dashboard]);

  const byChannel = adSpends.reduce<Record<string, number>>((acc, r) => {
    const ch = r.channel || '기타';
    acc[ch] = (acc[ch] ?? 0) + r.spend;
    return acc;
  }, {});

  const channelRevenue = (channelRows ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.channel] = Number(r._sum?.revenue ?? 0);
    return acc;
  }, {});

  const chartData = Object.entries(byChannel)
    .map(([channel, spend]) => ({
      channel,
      광고비: spend,
      매출: channelRevenue[channel] ?? 0,
      ROAS: spend > 0 ? (channelRevenue[channel] ?? 0) / spend : 0,
    }))
    .sort((a, b) => b.광고비 - a.광고비);

  if (chartData.length === 0 && adSpends.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-sm text-slate-500">광고비 데이터가 없습니다. 엑셀에 raw4(광고비) 또는 spend 시트를 넣고 업로드해 주세요.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-sm font-semibold text-slate-800">채널별 광고비·매출·ROAS</h3>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="channel" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => (v >= 1e6 ? `${v / 1e6}M` : String(v))} />
            <Tooltip formatter={(v: number) => fmt(v)} />
            <Bar dataKey="광고비" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            <Bar dataKey="매출" fill="#1e293b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-4 text-left font-medium">채널</th>
              <th className="py-2 pr-4 text-right font-medium">광고비</th>
              <th className="py-2 pr-4 text-right font-medium">매출</th>
              <th className="py-2 text-right font-medium">ROAS</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((r) => (
              <tr key={r.channel} className="border-b border-slate-100">
                <td className="py-2 pr-4 font-medium text-slate-900">{r.channel}</td>
                <td className="py-2 pr-4 text-right tabular-nums text-slate-700">{fmt(r.광고비)}</td>
                <td className="py-2 pr-4 text-right tabular-nums text-slate-700">{fmt(r.매출)}</td>
                <td className="py-2 text-right tabular-nums text-slate-700">{(r.ROAS * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
