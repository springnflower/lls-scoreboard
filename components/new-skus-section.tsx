'use client';

import useSWR from 'swr';
import { Card } from './ui';

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const fmt = (n: number) => new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(n);

type Row = { sku: string; month: string; _sum: { revenue?: number; qty?: number } };

/** 최근 3개월 내 첫 등장 SKU (신제품 성장) */
const RECENT_MONTHS = 3;

export function NewSkusSection({ month }: { month?: string }) {
  const { data: rows, error } = useSWR<Row[]>('/api/sales-fact/sku-by-month', fetcher);

  if (error) return <p className="text-sm text-red-600">로딩 실패</p>;
  if (!Array.isArray(rows) || rows.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-sm text-slate-500">SKU·월별 데이터가 없습니다.</p>
      </Card>
    );
  }

  const months = Array.from(new Set(rows.map((r) => r.month))).sort();
  const recentMonths = months.slice(-RECENT_MONTHS);
  const bySku = new Map<string, { firstMonth: string; months: Record<string, number> }>();

  for (const r of rows) {
    const rev = Number(r._sum?.revenue ?? 0);
    if (!bySku.has(r.sku)) {
      bySku.set(r.sku, { firstMonth: r.month, months: {} });
    }
    const ent = bySku.get(r.sku)!;
    ent.months[r.month] = rev;
    if (r.month < ent.firstMonth) ent.firstMonth = r.month;
  }

  const newSkus = Array.from(bySku.entries())
    .filter(([, v]) => recentMonths.includes(v.firstMonth))
    .map(([sku, v]) => {
      const revs = Object.entries(v.months).sort((a, b) => a[0].localeCompare(b[0]));
      const firstRev = revs[0]?.[1] ?? 0;
      const lastRev = revs[revs.length - 1]?.[1] ?? 0;
      const growth = firstRev > 0 ? ((lastRev - firstRev) / firstRev) * 100 : (lastRev > 0 ? 100 : 0);
      return {
        sku,
        firstMonth: v.firstMonth,
        firstRevenue: firstRev,
        latestRevenue: lastRev,
        growthPct: Math.round(growth * 10) / 10,
        totalRevenue: revs.reduce((s, [, n]) => s + n, 0),
      };
    })
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 15);

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-sm font-semibold text-slate-800">신규 출시 SKU (최근 {RECENT_MONTHS}개월 내 첫 매출)</h3>
      {newSkus.length === 0 ? (
        <p className="text-sm text-slate-500">해당 기간 첫 매출 SKU가 없습니다.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-4 text-left font-medium">SKU</th>
                <th className="py-2 pr-4 text-left font-medium">첫 매출 월</th>
                <th className="py-2 pr-4 text-right font-medium">첫 달 매출</th>
                <th className="py-2 pr-4 text-right font-medium">최근 매출</th>
                <th className="py-2 text-right font-medium">성장률(%)</th>
              </tr>
            </thead>
            <tbody>
              {newSkus.map((r) => (
                <tr key={r.sku} className="border-b border-slate-100">
                  <td className="py-2 pr-4 font-medium text-slate-900">{r.sku}</td>
                  <td className="py-2 pr-4 text-slate-600">{r.firstMonth}</td>
                  <td className="py-2 pr-4 text-right tabular-nums text-slate-700">{fmt(r.firstRevenue)}</td>
                  <td className="py-2 pr-4 text-right tabular-nums text-slate-700">{fmt(r.latestRevenue)}</td>
                  <td className={`py-2 text-right tabular-nums ${r.growthPct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{r.growthPct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
