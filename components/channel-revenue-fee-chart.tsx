'use client';

import useSWR from 'swr';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from './ui';

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const fmt = (n: number) => new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(n);

type Row = { channel: string; _sum: { revenue?: number; fee?: number; netRevenue?: number } };

export function ChannelRevenueFeeChart({ month }: { month?: string }) {
  const q = month ? `?month=${encodeURIComponent(month)}` : '';
  const { data: rows, error } = useSWR<Row[]>(`/api/sales-fact/channel${q}`, fetcher);

  if (error) return <p className="text-sm text-red-600">로딩 실패</p>;
  if (!Array.isArray(rows) || rows.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-sm text-slate-500">채널 데이터가 없습니다.</p>
      </Card>
    );
  }

  const chartData = rows.map((r) => ({
    channel: r.channel,
    매출: Number(r._sum.revenue ?? 0),
    수수료: Number(r._sum.fee ?? 0),
    순매출: Number(r._sum.netRevenue ?? 0),
  }));

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-sm font-semibold text-slate-800">채널별 매출·수수료</h3>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="channel" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => (v >= 1e6 ? `${v / 1e6}M` : String(v))} />
            <Tooltip formatter={(v: number) => fmt(v)} />
            <Bar dataKey="매출" fill="#1e293b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="수수료" fill="#94a3b8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-4 text-left font-medium">채널</th>
              <th className="py-2 pr-4 text-right font-medium">매출</th>
              <th className="py-2 pr-4 text-right font-medium">수수료</th>
              <th className="py-2 text-right font-medium">순매출</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((r) => (
              <tr key={r.channel} className="border-b border-slate-100">
                <td className="py-2 pr-4 font-medium text-slate-900">{r.channel}</td>
                <td className="py-2 pr-4 text-right tabular-nums text-slate-700">{fmt(r.매출)}</td>
                <td className="py-2 pr-4 text-right tabular-nums text-slate-600">{fmt(r.수수료)}</td>
                <td className="py-2 text-right tabular-nums text-slate-700">{fmt(r.순매출)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
