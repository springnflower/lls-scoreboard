'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { SalesSummaryKpis } from './sales-summary-kpis';
import { TopDimensionCards } from './top-dimension-cards';
import { MonthlyRevenueKpis } from './monthly-revenue-kpis';
import { ChannelMomKpi } from './channel-mom-kpi';
import { MonthSelector } from './month-selector';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SalesPage() {
  const [month, setMonth] = useState('');
  const { data: months = [] } = useSWR<string[]>('/api/sales/months', fetcher);
  const { data } = useSWR('/api/sales/monthly', fetcher);

  const chartData = Array.isArray(data)
    ? data.map((row: { month: string; _sum: { revenue?: number } }) => ({
        month: row.month,
        revenue: row._sum?.revenue ?? 0,
      }))
    : []

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-slate-900">Sales Overview</h1>
          <MonthSelector value={month} onChange={setMonth} months={months} />
        </div>
        <SalesSummaryKpis month={month || undefined} />
        <TopDimensionCards month={month || undefined} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MonthlyRevenueKpis />
          <ChannelMomKpi channel="네이버" />
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#111827" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
