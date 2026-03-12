'use client';

import useSWR from 'swr';
import { Card } from './ui';

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const fmt = (n: number) => new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(n);

type Row = { sku: string; _sum: { revenue?: number; qty?: number; contribution?: number } };

/** 매출 하위 SKU (퇴출·정리 후보) */
export function DeadSkuTable({ month, limit = 10 }: { month?: string; limit?: number }) {
  const q = month ? `?month=${encodeURIComponent(month)}` : '';
  const { data: rows, error } = useSWR<Row[]>(`/api/sales-fact/sku${q}`, fetcher);

  if (error) return <p className="text-sm text-red-600">로딩 실패</p>;
  if (!Array.isArray(rows) || rows.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-sm text-slate-500">SKU 데이터가 없습니다.</p>
      </Card>
    );
  }

  const sorted = [...rows].sort((a, b) => Number(a._sum?.revenue ?? 0) - Number(b._sum?.revenue ?? 0));
  const bottom = sorted.slice(0, limit);

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-sm font-semibold text-slate-800">매출 하위 SKU (퇴출·정리 검토 후보)</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-4 text-left font-medium">순위</th>
              <th className="py-2 pr-4 text-left font-medium">SKU</th>
              <th className="py-2 pr-4 text-right font-medium">매출</th>
              <th className="py-2 pr-4 text-right font-medium">수량</th>
              <th className="py-2 text-right font-medium">공헌이익</th>
            </tr>
          </thead>
          <tbody>
            {bottom.map((r, i) => (
              <tr key={r.sku} className="border-b border-slate-100">
                <td className="py-2 pr-4 text-slate-500">{i + 1}</td>
                <td className="py-2 pr-4 font-medium text-slate-900">{r.sku}</td>
                <td className="py-2 pr-4 text-right tabular-nums text-slate-700">{fmt(Number(r._sum?.revenue ?? 0))}</td>
                <td className="py-2 pr-4 text-right tabular-nums text-slate-700">{fmt(Number(r._sum?.qty ?? 0))}</td>
                <td className="py-2 text-right tabular-nums text-slate-700">{fmt(Number(r._sum?.contribution ?? 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
