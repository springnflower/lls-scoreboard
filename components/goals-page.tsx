'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Card, SectionTitle, Textarea } from './ui';
import { useScoreboardStore } from '@/lib/store';
import type { GoalTargetInput, PersistedDashboardResponse } from '@/lib/types';

function goalsToText(goals: GoalTargetInput[]) {
  return goals.map((goal) => `${goal.scope},${goal.label},${goal.targetRevenue},${goal.targetMarginRate ?? ''}`).join('\n');
}

function textToGoals(text: string): GoalTargetInput[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [scope, label, targetRevenue, targetMarginRate] = line.split(',').map((value) => value.trim());
      return {
        scope: scope as GoalTargetInput['scope'],
        label,
        targetRevenue: Number(targetRevenue || 0),
        targetMarginRate: targetMarginRate ? Number(targetMarginRate) : null
      };
    });
}

export function GoalsPage() {
  const { batchId, goals, data, hydrate } = useScoreboardStore();
  const [goalText, setGoalText] = useState('');
  const [adSpendText, setAdSpendText] = useState('');
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
    setGoalText(goalsToText(goals));
  }, [goals]);

  useEffect(() => {
    const rows = (data?.adSpends ?? []).map((row) => `${row.channel},${row.media},${row.month},${row.spend},${row.memo ?? ''}`).join('\n');
    setAdSpendText(rows);
  }, [data]);

  const help = useMemo(() => [
    '목표 입력 형식: SCOPE,LABEL,TARGET_REVENUE,TARGET_MARGIN_RATE',
    '예시1: TOTAL,FY26 TOTAL,1000000000,0.35',
    '예시2: SKU,EXTENSION 3-SOCKET,350000000,0.38',
    '광고비 형식: CHANNEL,MEDIA,MONTH,SPEND,MEMO',
    '예시: 네이버,Naver Search,2026-01,3200000,브랜드검색'
  ].join('\n'), []);

  const save = async () => {
    if (!batchId) return;
    setSaving(true);
    setMessage('');
    try {
      const goalsPayload = await fetch(`/api/goals/${batchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'goals', items: textToGoals(goalText) })
      });
      if (!goalsPayload.ok) throw new Error('goals 저장 실패');

      const adSpends = adSpendText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [channel, media, month, spend, memo] = line.split(',').map((value) => value.trim());
          return { channel, media, month, spend: Number(spend || 0), memo };
        });

      const adPayload = await fetch(`/api/goals/${batchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'adSpends', items: adSpends })
      });
      if (!adPayload.ok) throw new Error('ad spends 저장 실패');
      const finalPayload = (await adPayload.json()) as PersistedDashboardResponse;
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
            <h1 className="mt-1 text-3xl font-semibold">목표 / 광고비 관리</h1>
          </div>
          <div className="flex gap-2">
            <Button asLink="/">대시보드로</Button>
            <Button asLink="/inventory" className="bg-slate-700 text-white">재고관리</Button>
          </div>
        </Card>

        <Card>
          <SectionTitle title="입력 가이드" description="TOTAL / CATEGORY / CHANNEL / SKU 목표와 미디어별 광고비" />
          <pre className="whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">{help}</pre>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <SectionTitle title="Goal Targets" description="전체목표와 SKU 목표를 함께 관리" />
            <Textarea value={goalText} onChange={(e) => setGoalText(e.target.value)} className="min-h-[360px] font-mono" />
          </Card>
          <Card>
            <SectionTitle title="Media Spend Inputs" description="채널 × 미디어 × 월 광고비 입력" />
            <Textarea value={adSpendText} onChange={(e) => setAdSpendText(e.target.value)} className="min-h-[360px] font-mono" />
          </Card>
        </div>

        <Card>
          <SectionTitle title="저장" description="저장 즉시 목표 달성률, 미디어비 분석에 반영됩니다." />
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
