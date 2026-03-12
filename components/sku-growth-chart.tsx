'use client';

import useSWR from 'swr';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from './ui';

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const fmt = (n: number) => new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(n);

type MonthlyRow = { month: string; _sum: { revenue?: number } };

export function SkuGrowthChart({ month }: { month?: string }) {
  const { data: rows, error } = useSWR<MonthlyRow[]>('/api/sales/monthly', fetcher);

  if (error) return <p className="text-sm text-red-600">로딩 실패</p>;
  if (!Array.isArray(rows) || rows.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-sm text-slate-500">월별 매출 데이터가 없습니다.</p>
      </Card>
    );
  }

  const withMom = rows
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((r, i, arr) => {
      const rev = Number(r._sum?.revenue ?? 0);
      const prev = i > 0 ? Number(arr[i - 1]._sum?.revenue ?? 0) : 0;
      const momPct = prev > 0 ? ((rev - prev) / prev) * 100 : (rev > 0 ? 100 : 0);
      return {
        month: r.month,
        매출: rev,
        전월대비: Math.round(momPct * 10) / 10,
      };
    });

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-sm font-semibold text-slate-800">월별 매출 추이 및 전월 대비 성장률</h3>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={withMom} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis yAxisId="left" tickLine={false} axisLine={false} tickFormatter={(v) => (v >= 1e6 ? `${v / 1e6}M` : String(v))} />
            <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
            <Tooltip formatter={(v: number, name: string) => (name === '전월대비' ? `${v}%` : fmt(v))} />
            <Line yAxisId="left" type="monotone" dataKey="매출" stroke="#1e293b" strokeWidth={2} dot={false} name="매출" />
            <Line yAxisId="right" type="monotone" dataKey="전월대비" stroke="#64748b" strokeDasharray="4 4" dot={false} name="전월대비(%)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
