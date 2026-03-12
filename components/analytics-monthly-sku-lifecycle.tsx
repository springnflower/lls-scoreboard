'use client';

import useSWR from 'swr';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from './ui';

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const fmt = (n: number) => new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(n);

type MonthlyRow = { month: string; _sum: { revenue?: number } };
type SkuMonthRow = { sku: string; month: string; _sum: { revenue?: number } };

export function AnalyticsMonthlyTrend() {
  const { data: rows, error } = useSWR<MonthlyRow[]>('/api/sales/monthly', fetcher);

  if (error) return <p className="text-sm text-red-600">로딩 실패</p>;
  if (!Array.isArray(rows) || rows.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-sm text-slate-500">월별 매출 데이터가 없습니다.</p>
      </Card>
    );
  }

  const chartData = rows
    .map((r) => ({ month: r.month, 매출: Number(r._sum?.revenue ?? 0) }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-sm font-semibold text-slate-800">월별 매출 추이</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => (v >= 1e6 ? `${v / 1e6}M` : String(v))} />
            <Tooltip formatter={(v: number) => fmt(v)} />
            <Line type="monotone" dataKey="매출" stroke="#1e293b" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function SkuLifecycleTable() {
  const { data: rows, error } = useSWR<SkuMonthRow[]>('/api/sales-fact/sku-by-month', fetcher);

  if (error) return <p className="text-sm text-red-600">로딩 실패</p>;
  if (!Array.isArray(rows) || rows.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-sm text-slate-500">SKU·월별 데이터가 없습니다.</p>
      </Card>
    );
  }

  const bySku = new Map<string, { first: string; last: string; total: number; months: number }>();
  for (const r of rows) {
    const rev = Number(r._sum?.revenue ?? 0);
    if (!bySku.has(r.sku)) bySku.set(r.sku, { first: r.month, last: r.month, total: 0, months: 0 });
    const e = bySku.get(r.sku)!;
    e.total += rev;
    e.months += 1;
    if (r.month < e.first) e.first = r.month;
    if (r.month > e.last) e.last = r.month;
  }

  const list = Array.from(bySku.entries())
    .map(([sku, v]) => ({ sku, ...v }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 20);

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-sm font-semibold text-slate-800">SKU 단계별 (첫 등장·최근·누적 매출)</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-4 text-left font-medium">SKU</th>
              <th className="py-2 pr-4 text-left font-medium">첫 매출 월</th>
              <th className="py-2 pr-4 text-left font-medium">최근 매출 월</th>
              <th className="py-2 pr-4 text-right font-medium">매출 월 수</th>
              <th className="py-2 text-right font-medium">누적 매출</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.sku} className="border-b border-slate-100">
                <td className="py-2 pr-4 font-medium text-slate-900">{r.sku}</td>
                <td className="py-2 pr-4 text-slate-600">{r.first}</td>
                <td className="py-2 pr-4 text-slate-600">{r.last}</td>
                <td className="py-2 pr-4 text-right tabular-nums text-slate-700">{r.months}</td>
                <td className="py-2 text-right tabular-nums text-slate-700">{fmt(r.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
