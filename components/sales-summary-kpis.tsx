'use client';

import useSWR from 'swr';
import { Card } from './ui';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type Data = {
  totalRevenue: number;
  totalNetRevenue: number;
  totalContribution: number;
  totalOrders: number;
  aov: number;
  month?: string | null;
};

const fmt = (n: number) => new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(n);

const items: { key: keyof Data; label: string }[] = [
  { key: 'totalRevenue', label: '총매출' },
  { key: 'totalNetRevenue', label: '순매출' },
  { key: 'totalContribution', label: '공헌이익' },
  { key: 'totalOrders', label: '주문수' },
  { key: 'aov', label: '객단가' },
];

export function SalesSummaryKpis({ month }: { month?: string }) {
  const url = month ? `/api/sales/summary?month=${encodeURIComponent(month)}` : '/api/sales/summary';
  const { data, error } = useSWR<Data>(url, fetcher);

  if (error) return <p className="text-sm text-red-600">로딩 실패</p>;
  if (!data) return null;

  const subLabel = month ? `${month} 월별` : '전체 누적';

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {items.map(({ key, label }) => (
        <Card key={key} className="p-4">
          <p className="text-sm text-slate-500">{label} <span className="text-slate-400">({subLabel})</span></p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900">{fmt(Number(data[key] ?? 0))}</p>
        </Card>
      ))}
    </div>
  );
}
