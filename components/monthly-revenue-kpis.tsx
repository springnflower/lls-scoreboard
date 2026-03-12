'use client';

import useSWR from 'swr';
import { Card } from './ui';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type Data = {
  thisMonth: string;
  lastMonth: string;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
};

const fmt = (n: number) => new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(n);

export function MonthlyRevenueKpis() {
  const { data, error } = useSWR<Data>('/api/sales/monthly-compare', fetcher);

  if (error) return <p className="text-sm text-red-600">로딩 실패</p>;
  if (!data) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="p-4">
        <p className="text-sm text-slate-500">이번달 매출</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{fmt(data.thisMonthRevenue)}</p>
        <p className="mt-0.5 text-xs text-slate-400">{data.thisMonth}</p>
      </Card>
      <Card className="p-4">
        <p className="text-sm text-slate-500">지난달 매출</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{fmt(data.lastMonthRevenue)}</p>
        <p className="mt-0.5 text-xs text-slate-400">{data.lastMonth}</p>
      </Card>
    </div>
  );
}
