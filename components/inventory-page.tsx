'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Card, SectionTitle, Textarea } from './ui';
import { useScoreboardStore } from '@/lib/store';
import type { InventoryPositionRow, PersistedDashboardResponse } from '@/lib/types';

function rowsToText(rows: InventoryPositionRow[]) {
  return rows.map((row) => [row.skuKeyword, row.category ?? '', row.onHandQty, row.reservedQty ?? 0, row.unitCost, row.memo ?? ''].join(',')).join('\n');
}

function textToRows(text: string): InventoryPositionRow[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [skuKeyword, category, onHandQty, reservedQty, unitCost, memo] = line.split(',').map((value) => value.trim());
      return { skuKeyword, category, onHandQty: Number(onHandQty || 0), reservedQty: Number(reservedQty || 0), unitCost: Number(unitCost || 0), memo: memo ?? '' };
    });
}

export function InventoryPage() {
  const { batchId, data, hydrate } = useScoreboardStore();
  const [text, setText] = useState('');
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
    setText(rowsToText(data?.inventoryPositions ?? []));
  }, [data]);

  const help = useMemo(() => [
    '입력 형식: SKU_KEYWORD,CATEGORY,ON_HAND_QTY,RESERVED_QTY,UNIT_COST,MEMO',
    '예시: 3-SOCKET,3PORT,420,20,38100,3port 가용재고',
    'UNIT_COST는 재고자산 계산에 사용됩니다.'
  ].join('\n'), []);

  const save = async () => {
    if (!batchId) return;
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch(`/api/goals/${batchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'inventoryPositions', items: textToRows(text) })
      });
      if (!response.ok) throw new Error('inventory 저장 실패');
      const payload = (await response.json()) as PersistedDashboardResponse;
      hydrate(payload);
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
            <h1 className="mt-1 text-3xl font-semibold">재고 포지션 관리</h1>
          </div>
          <div className="flex gap-2">
            <Button asLink="/">대시보드로</Button>
            <Button asLink="/costs" className="bg-slate-700 text-white">원가마스터</Button>
          </div>
        </Card>

        <Card>
          <SectionTitle title="입력 가이드" description="재고량 / 예약수량 / 재고자산 산정용 데이터" />
          <pre className="whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">{help}</pre>
        </Card>

        <Card>
          <SectionTitle title="Inventory Positions" description="재고량과 자산 계산에 사용되는 기준 테이블" />
          <Textarea value={text} onChange={(e) => setText(e.target.value)} className="min-h-[420px] font-mono" />
        </Card>

        <Card>
          <SectionTitle title="저장" description="저장 즉시 대시보드 재고 자산에 반영됩니다." />
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
