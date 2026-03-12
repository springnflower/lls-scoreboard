'use client';

import { MarketingAdSpendChart } from '@/components/marketing-ad-spend-chart';

export default function MarketingRoute() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Marketing</h1>
          <p className="mt-2 text-slate-600">광고비·집행·채널별 ROAS</p>
        </div>
        <MarketingAdSpendChart />
      </div>
    </main>
  );
}
