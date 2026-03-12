'use client';

import { Card } from '@/components/ui';
import { AnalyticsMonthlyTrend, SkuLifecycleTable } from '@/components/analytics-monthly-sku-lifecycle';

export default function AnalyticsRoute() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Analytics</h1>
          <p className="mt-2 text-slate-600">매출 추이·SKU 라이프사이클</p>
        </div>

        <section>
          <h2 className="mb-3 text-lg font-medium text-slate-800">매출 추이</h2>
          <AnalyticsMonthlyTrend />
        </section>

        <section>
          <h2 className="mb-3 text-lg font-medium text-slate-800">Cohort·재구매·LTV</h2>
          <Card className="p-6">
            <p className="text-sm text-slate-500">
              가입/첫구매 코호트·재구매율·고객 LTV는 고객(회원) 단위 데이터가 필요합니다. 현재 업로드 데이터에는 주문·매출·채널·SKU만 포함되어 있어, 회원 ID가 연동되면 코호트·재구매·LTV 분석을 추가할 수 있습니다.
            </p>
          </Card>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-medium text-slate-800">SKU lifecycle</h2>
          <SkuLifecycleTable />
        </section>
      </div>
    </main>
  );
}
