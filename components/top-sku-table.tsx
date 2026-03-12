'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const fmt = (n: number) => new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(n);

type Row = { sku: string; _sum: { revenue: number; qty: number; contribution: number } };

export function TopSkuTable({ limit, month }: { limit?: number; month?: string }) {
  const q = month ? `?month=${encodeURIComponent(month)}` : '';
  const { data: rows, error } = useSWR<Row[]>(`/api/sales-fact/sku${q}`, fetcher);

  if (error) {
    return <p className="text-sm text-red-600">로딩 실패</p>;
  }

  const raw = Array.isArray(rows) && rows.length > 0 ? rows : [
    { sku: 'LLS 3PORT', _sum: { revenue: 210_000_000, qty: 4100, contribution: 92_000_000 } },
    { sku: 'LLS USB-C', _sum: { revenue: 34_000_000, qty: 820, contribution: 11_400_000 } },
    { sku: 'LLS CABLE', _sum: { revenue: 19_000_000, qty: 2600, contribution: 7_200_000 } },
  ];
  const list = limit != null ? raw.slice(0, limit) : raw;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-500">
            <th className="py-3 pr-6 font-medium">SKU</th>
            <th className="py-3 pr-6 font-medium text-right">Revenue</th>
            <th className="py-3 pr-6 font-medium text-right">Qty</th>
            <th className="py-3 pr-6 font-medium text-right">Contribution</th>
          </tr>
        </thead>
        <tbody>
          {list.map((row) => (
            <tr key={row.sku} className="border-b border-slate-100">
              <td className="py-3 pr-6 font-medium text-slate-900">{row.sku}</td>
              <td className="py-3 pr-6 text-right tabular-nums text-slate-700">{fmt(row._sum.revenue)}</td>
              <td className="py-3 pr-6 text-right tabular-nums text-slate-700">{fmt(row._sum.qty)}</td>
              <td className="py-3 pr-6 text-right tabular-nums text-slate-700">{fmt(row._sum.contribution)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
