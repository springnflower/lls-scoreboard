'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Card, SectionTitle, Textarea } from './ui';
import { useScoreboardStore } from '@/lib/store';
import type { PersistedDashboardResponse, MonthlyTargetRow, ChannelFeeRuleRow, MediaSourceRow } from '@/lib/types';

const toMonthlyText = (rows: MonthlyTargetRow[]) => rows.map((row) => `${row.scope},${row.label},${row.month},${row.targetRevenue}`).join('\n');
const toFeeRuleText = (rows: ChannelFeeRuleRow[]) => rows.map((row) => `${row.channel},${row.baseRate},${row.extraRate ?? 0},${row.fixedFee ?? 0},${row.note ?? ''}`).join('\n');
const toMediaSourceText = (rows: MediaSourceRow[]) => rows.map((row) => `${row.media},${row.sourceType},${row.accountId ?? ''},${row.enabled ?? true},${row.note ?? ''}`).join('\n');

const parseMonthly = (text: string): MonthlyTargetRow[] => text.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
  const [scope, label, month, targetRevenue] = line.split(',').map((v) => v.trim());
  return { scope: scope as MonthlyTargetRow['scope'], label, month, targetRevenue: Number(targetRevenue || 0) };
});
const parseFeeRules = (text: string): ChannelFeeRuleRow[] => text.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
  const [channel, baseRate, extraRate, fixedFee, note] = line.split(',').map((v) => v.trim());
  return { channel, baseRate: Number(baseRate || 0), extraRate: Number(extraRate || 0), fixedFee: Number(fixedFee || 0), note };
});
const parseMediaSources = (text: string): MediaSourceRow[] => text.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
  const [media, sourceType, accountId, enabled, note] = line.split(',').map((v) => v.trim());
  return { media, sourceType: sourceType as MediaSourceRow['sourceType'], accountId, enabled: enabled !== 'false', note };
});

export function PlanningPage() {
  const { batchId, data, hydrate } = useScoreboardStore();
  const [monthlyText, setMonthlyText] = useState('');
  const [feeText, setFeeText] = useState('');
  const [mediaText, setMediaText] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

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
    setMonthlyText(toMonthlyText(data?.monthlyTargets ?? []));
    setFeeText(toFeeRuleText(data?.channelFeeRules ?? []));
    setMediaText(toMediaSourceText(data?.mediaSources ?? []));
  }, [data]);

  const help = useMemo(() => [
    'Monthly target: SCOPE,LABEL,MONTH,TARGET_REVENUE',
    '예시: TOTAL,FY26 TOTAL,2026-01,80000000',
    '예시: SKU,EXTENSION 3-SOCKET,2026-01,28000000',
    'Fee rule: CHANNEL,BASE_RATE,EXTRA_RATE,FIXED_FEE,NOTE',
    '예시: 네이버,0.085,0.01,0,smartstore fee',
    'Media source: MEDIA,SOURCE_TYPE,ACCOUNT_ID,ENABLED,NOTE',
    '예시: Meta,api,act_123456,true,meta ads api'
  ].join('\n'), []);

  async function save() {
    if (!batchId) return;
    setSaving(true);
    setMessage('');
    try {
      const requests = [
        fetch(`/api/goals/${batchId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'monthlyTargets', items: parseMonthly(monthlyText) }) }),
        fetch(`/api/goals/${batchId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'channelFeeRules', items: parseFeeRules(feeText) }) }),
        fetch(`/api/goals/${batchId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'mediaSources', items: parseMediaSources(mediaText) }) })
      ];
      const responses = await Promise.all(requests);
      const failed = responses.find((r) => !r.ok);
      if (failed) throw new Error('planning 저장 실패');
      const payload = (await responses[2].json()) as PersistedDashboardResponse;
      hydrate(payload);
      setMessage('저장 완료');
    } catch (error) {
      console.error(error);
      setMessage('저장 실패');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <Card className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Planning Ops</p>
            <h1 className="mt-1 text-3xl font-semibold">월목표 / 수수료룰 / 미디어소스</h1>
          </div>
          <div className="flex gap-2">
            <Button asLink="/">대시보드로</Button>
            <Button asLink="/inventory" className="bg-slate-700 text-white">재고</Button>
          </div>
        </Card>

        <Card>
          <SectionTitle title="입력 가이드" description="planning-oriented 운영 데이터 설정" />
          <pre className="whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">{help}</pre>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <SectionTitle title="Monthly Targets" description="TOTAL / SKU 월목표" />
            <Textarea value={monthlyText} onChange={(e) => setMonthlyText(e.target.value)} className="min-h-[360px] font-mono" />
          </Card>
          <Card>
            <SectionTitle title="Channel Fee Rules" description="채널별 수수료 룰 엔진" />
            <Textarea value={feeText} onChange={(e) => setFeeText(e.target.value)} className="min-h-[360px] font-mono" />
          </Card>
          <Card>
            <SectionTitle title="Media Sources" description="광고 API 자동수집용 source config" />
            <Textarea value={mediaText} onChange={(e) => setMediaText(e.target.value)} className="min-h-[360px] font-mono" />
          </Card>
        </div>

        <Card>
          <SectionTitle title="저장" description="저장 즉시 planning dashboard에 반영됩니다." />
          <div className="flex items-center gap-3">
            <Button onClick={save} disabled={saving || !batchId}>{saving ? '저장 중...' : '저장하기'}</Button>
            <span className="text-sm text-slate-500">{message}</span>
          </div>
        </Card>
      </div>
    </main>
  );
}
