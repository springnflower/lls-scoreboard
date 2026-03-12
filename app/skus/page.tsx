'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Card } from '@/components/ui';
import { TopSkuTable } from '@/components/top-sku-table';
import { SkuShareKpis } from '@/components/sku-share-kpis';
import { SkuGrowthChart } from '@/components/sku-growth-chart';
import { NewSkusSection } from '@/components/new-skus-section';
import { DeadSkuTable } from '@/components/dead-sku-table';
import { MonthSelector } from '@/components/month-selector';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SkusRoute() {
  const [month, setMonth] = useState('');
  const { data: months = [] } = useSWR<string[]>('/api/sales/months', fetcher);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">SKUs</h1>
            <p className="mt-2 text-slate-600">SKU별 실적·공헌이익·ROAS</p>
          </div>
          <MonthSelector value={month} onChange={setMonth} months={months} />
        </div>

        <section>
          <h2 className="mb-3 text-lg font-medium text-slate-800">매출 집중도</h2>
          <SkuShareKpis month={month || undefined} />
        </section>

        <section>
          <h2 className="mb-3 text-lg font-medium text-slate-800">Top3 SKU</h2>
          <Card className="p-6">
            <TopSkuTable limit={3} month={month || undefined} />
          </Card>
        </section>
        <section>
          <h2 className="mb-3 text-lg font-medium text-slate-800">Top10 SKU</h2>
          <Card className="p-6">
            <TopSkuTable limit={10} month={month || undefined} />
          </Card>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-medium text-slate-800">SKU 성장률</h2>
          <SkuGrowthChart month={month || undefined} />
        </section>

        <section>
          <h2 className="mb-3 text-lg font-medium text-slate-800">신제품 성장</h2>
          <NewSkusSection month={month || undefined} />
        </section>

        <section>
          <h2 className="mb-3 text-lg font-medium text-slate-800">Dead SKU</h2>
          <DeadSkuTable month={month || undefined} limit={10} />
        </section>
      </div>
    </main>
  );
}
