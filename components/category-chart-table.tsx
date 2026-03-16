'use client';

import useSWR from 'swr';
import { Card } from './ui';
import { CategoryPieChart } from './charts';

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const fmt = (n: number) => new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(n);

type Row = { category: string; _sum: { revenue?: number; netRevenue?: number; contribution?: number } };
type CategoryResponse = {
  rows: Row[];
  totals: { totalRevenue: number; totalNetRevenue: number; totalContribution: number; totalAdSpend: number };
};

export function CategoryChartTable({ month }: { month?: string }) {
  const q = month ? `?month=${encodeURIComponent(month)}` : '';
  const { data, error } = useSWR<CategoryResponse>(`/api/sales-fact/category${q}`, fetcher);

  const rows = data?.rows;
  const totals = data?.totals;

  if (error) return <p className="text-sm text-red-600">로딩 실패</p>;
  if (!Array.isArray(rows) || rows.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-sm text-slate-500">카테고리 데이터가 없습니다.</p>
      </Card>
    );
  }

  const chartData = rows.map((r) => ({
    category: r.category || '미분류',
    sales: Number(r._sum.revenue ?? 0),
  }));

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-sm font-semibold text-slate-800">카테고리별 매출</h3>
      <div className="grid gap-6 lg:grid-cols-2">
        <CategoryPieChart data={chartData} />
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-4 text-left font-medium">카테고리</th>
                <th className="py-2 pr-4 text-right font-medium">매출</th>
                <th className="py-2 pr-4 text-right font-medium">순매출</th>
                <th className="py-2 text-right font-medium">공헌이익</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.category} className="border-b border-slate-100">
                  <td className="py-2 pr-4 font-medium text-slate-900">{r.category || '미분류'}</td>
                  <td className="py-2 pr-4 text-right tabular-nums text-slate-700">{fmt(Number(r._sum.revenue ?? 0))}</td>
                  <td className="py-2 pr-4 text-right tabular-nums text-slate-700">{fmt(Number(r._sum.netRevenue ?? 0))}</td>
                  <td className="py-2 text-right tabular-nums text-slate-700">{fmt(Number(r._sum.contribution ?? 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {totals && (
            <div className="mt-3 space-y-1 text-xs text-slate-600">
              <p>총 매출 {fmt(totals.totalRevenue)} · 총 순매출 {fmt(totals.totalNetRevenue)} · 총 공헌이익 {fmt(totals.totalContribution)}</p>
              <p className="text-slate-500">광고비 {fmt(totals.totalAdSpend)}</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
