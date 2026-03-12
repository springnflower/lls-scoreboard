'use client';

import useSWR from 'swr';
import { Card } from './ui';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type Row = {
  channel: string;
  sku: string;
  _sum: { revenue: number; qty: number; contribution: number };
};

const TOP_N = 5;
const fmt = (n: number) => new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(n);

function HitSkuTable({ channel, rows }: { channel: string; rows: Row[] }) {
  const list = rows.filter((r) => r.channel === channel).slice(0, TOP_N);

  return (
    <Card className="p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-800">{channel} 히트 SKU</h3>
      {list.length === 0 ? (
        <p className="text-xs text-slate-500">데이터 없음</p>
      ) : (
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-2 pr-3 text-xs font-medium">SKU</th>
              <th className="py-2 pr-3 text-right text-xs font-medium">Revenue</th>
              <th className="py-2 pr-3 text-right text-xs font-medium">Qty</th>
            </tr>
          </thead>
          <tbody>
            {list.map((row) => (
              <tr key={`${row.channel}-${row.sku}`} className="border-b border-slate-100">
                <td className="py-2 pr-3 font-medium text-slate-900">{row.sku}</td>
                <td className="py-2 pr-3 text-right tabular-nums text-slate-700">{fmt(row._sum.revenue)}</td>
                <td className="py-2 pr-3 text-right tabular-nums text-slate-700">{fmt(row._sum.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

export function HitSkuByChannel({ month }: { month?: string }) {
  const q = month ? `?month=${encodeURIComponent(month)}` : '';
  const { data: rows, error } = useSWR<Row[]>(`/api/sales/channel-sku${q}`, fetcher);

  if (error) {
    return <p className="text-sm text-red-600">로딩 실패</p>;
  }

  const list = Array.isArray(rows) ? rows : [];
  const channels = Array.from(new Set(list.map((r) => r.channel).filter(Boolean))).sort();

  return (
    <section>
      <h2 className="mb-3 text-lg font-medium text-slate-800">채널별 히트 SKU</h2>
      {channels.length === 0 ? (
        <p className="text-sm text-slate-500">채널 데이터가 없습니다.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {channels.map((channel) => (
            <HitSkuTable key={channel} channel={channel} rows={list} />
          ))}
        </div>
      )}
    </section>
  );
}
