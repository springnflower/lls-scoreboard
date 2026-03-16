'use client';

import { useMemo, useEffect } from 'react';
import { Card } from '@/components/ui';
import { MarketingAdSpendChart } from '@/components/marketing-ad-spend-chart';
import { useScoreboardStore } from '@/lib/store';
import { getDashboardModel } from '@/lib/metrics';

const currency = (v: number) => new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(v || 0);
const pct = (v: number) => `${((v || 0) * 100).toFixed(1)}%`;

export default function MarketingRoute() {
  const { data, goals, filters, hydrate } = useScoreboardStore();
  useEffect(() => {
    if (!data) {
      fetch('/api/dashboard')
        .then((res) => res.ok ? res.json() : null)
        .then((payload) => { if (payload?.data) hydrate(payload); });
    }
  }, [data, hydrate]);
  const model = useMemo(() => (data ? getDashboardModel(data, filters, goals) : null), [data, filters, goals]);

  const monthly = (model?.monthlyTrend ?? []).map((row: { month: string; sales: number; spend: number }) => ({
    month: row.month,
    광고비: row.spend ?? 0,
    매출: row.sales ?? 0,
    ROAS: (row.spend ?? 0) > 0 ? (row.sales ?? 0) / (row.spend ?? 0) : 0
  }));

  const byMedia = (model?.mediaSpendTotals ?? []).map((row: { media: string; spend: number; share: number }) => ({
    media: row.media || '기타',
    광고비: row.spend ?? 0,
    비중: (row.share ?? 0) * 100
  }));

  const by지면 = (model?.spendBy지면 ?? []).map((row: { 지면: string; spend: number; share: number }) => ({
    지면: row.지면 || '기타',
    광고비: row.spend ?? 0,
    비중: (row.share ?? 0) * 100
  }));

  const totalSpend = monthly.reduce((s, r) => s + r.광고비, 0);
  const totalSales = monthly.reduce((s, r) => s + r.매출, 0);
  const overallROAS = totalSpend > 0 ? totalSales / totalSpend : 0;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">광고비 분석</h1>
          <p className="mt-2 text-slate-600">월별·매체별 금액 확인 및 매출 연동 ROAS</p>
        </div>

        <Card className="p-6">
          <h3 className="mb-4 text-sm font-semibold text-slate-800">월별 광고비 대비 자사몰·네이버 매출·ROAS</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-4 text-left font-medium">월</th>
                  <th className="py-2 pr-4 text-right font-medium">광고비(총)</th>
                  <th className="py-2 pr-4 text-right font-medium">자사몰 매출</th>
                  <th className="py-2 pr-4 text-right font-medium">자사몰 ROAS</th>
                  <th className="py-2 pr-4 text-right font-medium">네이버 매출</th>
                  <th className="py-2 text-right font-medium">네이버 ROAS</th>
                </tr>
              </thead>
              <tbody>
                {(model?.monthlyTrendByChannel ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500">데이터가 없습니다.</td>
                  </tr>
                ) : (
                  (model?.monthlyTrendByChannel ?? []).map((r: { month: string; totalSpend: number; 자사몰: { sales: number; roas: number }; 네이버: { sales: number; roas: number } }) => (
                    <tr key={r.month} className="border-b border-slate-100">
                      <td className="py-2 pr-4 font-medium text-slate-900">{r.month}</td>
                      <td className="py-2 pr-4 text-right tabular-nums text-slate-700">{currency(r.totalSpend)}</td>
                      <td className="py-2 pr-4 text-right tabular-nums text-slate-700">{currency(r.자사몰?.sales)}</td>
                      <td className="py-2 pr-4 text-right tabular-nums text-slate-700">{r.totalSpend > 0 ? ((r.자사몰?.roas ?? 0) * 100).toFixed(1) + '%' : '-'}</td>
                      <td className="py-2 pr-4 text-right tabular-nums text-slate-700">{currency(r.네이버?.sales)}</td>
                      <td className="py-2 text-right tabular-nums text-slate-700">{r.totalSpend > 0 ? ((r.네이버?.roas ?? 0) * 100).toFixed(1) + '%' : '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 text-sm font-semibold text-slate-800">월별 광고비·매출·ROAS</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-4 text-left font-medium">월</th>
                  <th className="py-2 pr-4 text-right font-medium">광고비</th>
                  <th className="py-2 pr-4 text-right font-medium">매출</th>
                  <th className="py-2 text-right font-medium">ROAS</th>
                </tr>
              </thead>
              <tbody>
                {monthly.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-500">데이터가 없습니다. 엑셀 업로드 후 확인하세요.</td>
                  </tr>
                ) : (
                  monthly.map((r) => (
                    <tr key={r.month} className="border-b border-slate-100">
                      <td className="py-2 pr-4 font-medium text-slate-900">{r.month}</td>
                      <td className="py-2 pr-4 text-right tabular-nums text-slate-700">{currency(r.광고비)}</td>
                      <td className="py-2 pr-4 text-right tabular-nums text-slate-700">{currency(r.매출)}</td>
                      <td className="py-2 text-right tabular-nums text-slate-700">{r.ROAS > 0 ? (r.ROAS * 100).toFixed(1) + '%' : '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {monthly.length > 0 && (
            <p className="mt-3 text-xs text-slate-500">
              전체 기간 합계: 광고비 {currency(totalSpend)} · 매출 {currency(totalSales)} · ROAS {overallROAS > 0 ? (overallROAS * 100).toFixed(1) + '%' : '-'}
            </p>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 text-sm font-semibold text-slate-800">지면별 광고비 (네이버·메타·카카오·기타)</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-4 text-left font-medium">지면</th>
                  <th className="py-2 pr-4 text-right font-medium">광고비</th>
                  <th className="py-2 text-right font-medium">비중</th>
                </tr>
              </thead>
              <tbody>
                {by지면.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-500">광고비 데이터가 없습니다.</td>
                  </tr>
                ) : (
                  by지면.map((r) => (
                    <tr key={r.지면} className="border-b border-slate-100">
                      <td className="py-2 pr-4 font-medium text-slate-900">{r.지면}</td>
                      <td className="py-2 pr-4 text-right tabular-nums text-slate-700">{currency(r.광고비)}</td>
                      <td className="py-2 text-right tabular-nums text-slate-700">{r.비중.toFixed(1)}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 text-sm font-semibold text-slate-800">매체별 광고비 (세부)</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-4 text-left font-medium">매체</th>
                  <th className="py-2 pr-4 text-right font-medium">광고비</th>
                  <th className="py-2 text-right font-medium">비중</th>
                </tr>
              </thead>
              <tbody>
                {byMedia.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-500">광고비 데이터가 없습니다.</td>
                  </tr>
                ) : (
                  byMedia.map((r) => (
                    <tr key={r.media} className="border-b border-slate-100">
                      <td className="py-2 pr-4 font-medium text-slate-900">{r.media}</td>
                      <td className="py-2 pr-4 text-right tabular-nums text-slate-700">{currency(r.광고비)}</td>
                      <td className="py-2 text-right tabular-nums text-slate-700">{r.비중.toFixed(1)}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <MarketingAdSpendChart />
      </div>
    </main>
  );
}
