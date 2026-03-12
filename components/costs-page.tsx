'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Card, SectionTitle, Textarea } from './ui';
import { useScoreboardStore } from '@/lib/store';
import type { PersistedDashboardResponse, ProductCostMasterRow } from '@/lib/types';

function costsToText(rows: ProductCostMasterRow[]) {
  return rows
    .map((row) => [row.keyword, row.category ?? '', row.unitCost, row.packageCost ?? 0, row.logisticsCost ?? 0, row.priority ?? 100, row.memo ?? ''].join(','))
    .join('\n');
}

function textToCosts(text: string): ProductCostMasterRow[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [keyword, category, unitCost, packageCost, logisticsCost, priority, memo] = line.split(',').map((value) => value.trim());
      return {
        keyword,
        category,
        unitCost: Number(unitCost || 0),
        packageCost: Number(packageCost || 0),
        logisticsCost: Number(logisticsCost || 0),
        priority: Number(priority || 100),
        memo: memo ?? ''
      };
    });
}

export function CostsPage() {
  const { batchId, data, hydrate } = useScoreboardStore();
  const [costText, setCostText] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!batchId) {
      (async () => {
        const res = await fetch('/api/dashboard');
        if (!res.ok) return;
        const payload = (await res.json()) as PersistedDashboardResponse | null;
        if (payload) hydrate(payload);
      })();
    }
  }, [batchId, hydrate]);

  useEffect(() => {
    setCostText(costsToText(data?.costMasters ?? []));
  }, [data]);

  const help = useMemo(() => [
    '입력 형식: KEYWORD,CATEGORY,UNIT_COST,PACKAGE_COST,LOGISTICS_COST,PRIORITY,MEMO',
    '예시: 3-SOCKET,3PORT,33800,1500,2800,10,대표 멀티탭',
    'KEYWORD는 상품명에 포함되는 문자열입니다.',
    'PRIORITY 숫자가 작을수록 먼저 매칭됩니다.'
  ].join('\n'), []);

  const save = async () => {
    if (!batchId) return;
    setSaving(true);
    setMessage('');
    try {
      const payload = await fetch(`/api/goals/${batchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'costMasters', items: textToCosts(costText) })
      });
      if (!payload.ok) throw new Error('cost masters 저장 실패');
      const finalPayload = (await payload.json()) as PersistedDashboardResponse;
      hydrate(finalPayload);
      setMessage('저장 완료');
    } catch (error) {
      console.error(error);
      setMessage('저장 실패');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <Card className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Scoreboard 운영 설정</p>
            <h1 className="mt-1 text-3xl font-semibold">원가마스터 관리</h1>
          </div>
          <Button asLink="/">대시보드로</Button>
        </Card>

        <Card>
          <SectionTitle title="입력 가이드" description="원가마스터 기반 SKU 손익 계산 룰" />
          <pre className="whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">{help}</pre>
        </Card>

        <Card>
          <SectionTitle title="Product Cost Master" description="상품명 키워드 기반 unit cost / package / logistics 설정" />
          <Textarea value={costText} onChange={(e) => setCostText(e.target.value)} className="min-h-[420px] font-mono" />
        </Card>

        <Card>
          <SectionTitle title="저장" description="저장 즉시 현재 배치에 cost master가 반영됩니다." />
          <div className="flex items-center gap-3">
            <Button onClick={save} disabled={saving || !batchId}>{saving ? '저장 중...' : '저장하기'}</Button>
            <span className="text-sm text-slate-500">{message}</span>
            {!batchId ? <span className="text-sm text-rose-500">먼저 대시보드에서 batch를 로드하세요.</span> : null}
          </div>
        </Card>
      </div>
    </main>
  );
}
