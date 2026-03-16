'use client';

import useSWR from 'swr';
import { Card } from './ui';

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const fmt = (n: number) => new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(n);

type Row = { _sum: { revenue?: number } };

export function TopDimensionCards({ month }: { month?: string }) {
  const q = month ? `?month=${encodeURIComponent(month)}` : '';
  const { data: skuRows } = useSWR<Array<{ sku: string } & Row>>(`/api/sales-fact/sku${q}`, fetcher);
  const { data: channelRows } = useSWR<Array<{ channel: string } & Row>>(`/api/sales-fact/channel${q}`, fetcher);
  const { data: categoryData } = useSWR<{ rows?: Array<{ category: string } & Row> } | Array<{ category: string } & Row>>(`/api/sales-fact/category${q}`, fetcher);
  const categoryRows = Array.isArray(categoryData) ? categoryData : categoryData?.rows;

  const topSku = Array.isArray(skuRows) && skuRows[0] ? { name: skuRows[0].sku, revenue: skuRows[0]._sum?.revenue ?? 0 } : null;
  const topChannel = Array.isArray(channelRows) && channelRows[0] ? { name: channelRows[0].channel, revenue: channelRows[0]._sum?.revenue ?? 0 } : null;
  const topCategory = Array.isArray(categoryRows) && categoryRows[0] ? { name: categoryRows[0].category, revenue: categoryRows[0]._sum?.revenue ?? 0 } : null;
  const subLabel = month ? `${month} 월별` : '전체 누적';

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card className="p-4">
        <p className="text-sm text-slate-500">Top SKU <span className="text-slate-400">({subLabel})</span></p>
        <p className="mt-1 font-semibold text-slate-900">{topSku?.name ?? '-'}</p>
        <p className="mt-0.5 text-sm tabular-nums text-slate-600">{fmt(topSku?.revenue ?? 0)}</p>
      </Card>
      <Card className="p-4">
        <p className="text-sm text-slate-500">Top Channel <span className="text-slate-400">({subLabel})</span></p>
        <p className="mt-1 font-semibold text-slate-900">{topChannel?.name ?? '-'}</p>
        <p className="mt-0.5 text-sm tabular-nums text-slate-600">{fmt(topChannel?.revenue ?? 0)}</p>
      </Card>
      <Card className="p-4">
        <p className="text-sm text-slate-500">Top Category <span className="text-slate-400">({subLabel})</span></p>
        <p className="mt-1 font-semibold text-slate-900">{topCategory?.name ?? '-'}</p>
        <p className="mt-0.5 text-sm tabular-nums text-slate-600">{fmt(topCategory?.revenue ?? 0)}</p>
      </Card>
    </div>
  );
}
