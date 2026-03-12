'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { CategoryChartTable } from '@/components/category-chart-table';
import { MonthSelector } from '@/components/month-selector';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function CategoriesRoute() {
  const [month, setMonth] = useState('');
  const { data: months = [] } = useSWR<string[]>('/api/sales/months', fetcher);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Categories</h1>
            <p className="mt-2 text-slate-600">카테고리별 매출·마진</p>
          </div>
          <MonthSelector value={month} onChange={setMonth} months={months} />
        </div>
        <CategoryChartTable month={month || undefined} />
      </div>
    </main>
  );
}
