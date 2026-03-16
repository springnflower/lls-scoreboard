'use client';

import { useState } from 'react';
import useSWR from 'swr';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SalesSummaryKpis } from './sales-summary-kpis';
import { TopDimensionCards } from './top-dimension-cards';
import { MonthlyRevenueKpis } from './monthly-revenue-kpis';
import { ChannelMomKpi } from './channel-mom-kpi';
import { MonthSelector } from './month-selector';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const fmtMoney = (n: number) =>
  new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(n) + '원';

const MOM_CHANNELS = [
  { dataKey: '네이버', amountKey: '네이버_금액', name: '네이버' },
  { dataKey: '자사몰', amountKey: '자사몰_금액', name: '자사몰' },
  { dataKey: '입점사 토탈', amountKey: '입점사토탈_금액', name: '입점사 토탈' },
] as const;

type MomDataRow = {
  month: string;
  네이버: number;
  자사몰: number;
  '입점사 토탈': number;
  네이버_금액: number;
  자사몰_금액: number;
  입점사토탈_금액: number;
};

function MomBarTooltip({
  active,
  payload,
  label,
  data,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: Record<string, unknown> }>;
  label?: string;
  data?: MomDataRow[];
}) {
  if (!active || !label) return null;
  const row = (data?.find((r) => r.month === label) ?? payload?.[0]?.payload ?? {}) as MomDataRow;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-md">
      <p className="mb-2 text-sm font-medium text-slate-700">월: {label}</p>
      <ul className="space-y-1 text-sm">
        {MOM_CHANNELS.map(({ dataKey, amountKey, name }) => {
          const pct = row[dataKey] ?? 0;
          const amount = Number(row[amountKey] ?? 0);
          return (
            <li key={dataKey} className="flex justify-between gap-4">
              <span>{name}</span>
              <span className="tabular-nums">
                {pct >= 0 ? '+' : ''}{pct}% · {fmtMoney(amount)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function SalesPage() {
  const [month, setMonth] = useState('');
  const { data: months = [] } = useSWR<string[]>('/api/sales/months', fetcher);
  const { data } = useSWR('/api/sales/monthly', fetcher);
  const { data: momSeries } = useSWR<{
    data: Array<{
      month: string;
      네이버: number;
      자사몰: number;
      '입점사 토탈': number;
      네이버_금액: number;
      자사몰_금액: number;
      입점사토탈_금액: number;
    }>;
  }>('/api/sales/channel-mom-series', fetcher);

  const chartData = Array.isArray(data)
    ? data.map((row: { month: string; _sum: { revenue?: number } }) => ({
        month: row.month,
        revenue: row._sum?.revenue ?? 0,
      }))
    : [];

  const momChartData = momSeries?.data ?? [];

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-slate-900">Sales Overview</h1>
          <MonthSelector value={month} onChange={setMonth} months={months} />
        </div>
        <SalesSummaryKpis month={month || undefined} />
        <TopDimensionCards month={month || undefined} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MonthlyRevenueKpis />
          <ChannelMomKpi channel="네이버" />
          <ChannelMomKpi channel="자사몰" />
          <ChannelMomKpi channel="유통" label="입점사 토탈" />
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#111827" strokeWidth={2} dot={false} name="매출" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {momChartData.length > 0 && (
          <div>
            <h2 className="mb-2 text-lg font-medium text-slate-800">채널별 매출 MoM (전월 대비 %)</h2>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={momChartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip content={<MomBarTooltip data={momChartData} />} />
                  <Legend />
                  <Bar dataKey="네이버" fill="#16a34a" name="네이버" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="자사몰" fill="#2563eb" name="자사몰" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="입점사 토탈" fill="#dc2626" name="입점사 토탈" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
