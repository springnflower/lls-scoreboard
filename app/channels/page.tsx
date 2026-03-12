'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { HitSkuByChannel } from '@/components/hit-sku-by-channel';
import { ChannelRevenueFeeChart } from '@/components/channel-revenue-fee-chart';
import { MonthSelector } from '@/components/month-selector';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ChannelsRoute() {
  const [month, setMonth] = useState('');
  const { data: months = [] } = useSWR<string[]>('/api/sales/months', fetcher);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Channels</h1>
            <p className="mt-2 text-slate-600">채널별 매출·수수료·ROAS</p>
          </div>
          <MonthSelector value={month} onChange={setMonth} months={months} />
        </div>
        <HitSkuByChannel month={month || undefined} />
        <ChannelRevenueFeeChart month={month || undefined} />
      </div>
    </main>
  );
}
