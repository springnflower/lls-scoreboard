'use client';

import useSWR from 'swr';
import { Card } from './ui';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type Data = { top3Pct: number; top10Pct: number; month?: string | null };

export function SkuShareKpis({ month }: { month?: string }) {
  const url = month ? `/api/sales/sku-share?month=${encodeURIComponent(month)}` : '/api/sales/sku-share';
  const { data, error } = useSWR<Data>(url, fetcher);

  if (error) return null;
  const top3 = data?.top3Pct ?? 0;
  const top10 = data?.top10Pct ?? 0;
  const subLabel = month ? `${month} 월별` : '전체 누적';

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="p-4">
        <p className="text-sm text-slate-500">Top3 SKU % <span className="text-slate-400">({subLabel})</span></p>
        <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{top3}%</p>
      </Card>
      <Card className="p-4">
        <p className="text-sm text-slate-500">Top10 SKU % <span className="text-slate-400">({subLabel})</span></p>
        <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{top10}%</p>
      </Card>
    </div>
  );
}
