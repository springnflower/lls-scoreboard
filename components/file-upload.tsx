'use client';

import { useState } from 'react';
import { FileUp, LoaderCircle } from 'lucide-react';
import { useScoreboardStore } from '@/lib/store';
import type { PersistedDashboardResponse } from '@/lib/types';

export function FileUpload() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const hydrate = useScoreboardStore((state) => state.hydrate);
  const setBatches = useScoreboardStore((state) => state.setBatches);

  return (
    <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center transition hover:border-slate-400 hover:bg-white">
      <div className="mb-4 rounded-2xl bg-white p-4 shadow-soft">
        {loading ? <LoaderCircle className="h-8 w-8 animate-spin" /> : <FileUp className="h-8 w-8" />}
      </div>
      <p className="text-lg font-semibold">스코어보드 업로드 · DB 적재 · 파일 보관</p>
      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
        업로드 즉시 서버에서 파싱 후 Postgres에 저장하고, 원본 파일은 local storage 또는 Supabase Storage에 보관합니다.
      </p>
      <span className="mt-5 rounded-full bg-ink px-4 py-2 text-sm font-medium text-white">파일 선택</span>
      <input
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          setLoading(true);
          setError('');
          try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await fetch('/api/import', { method: 'POST', body: formData });
            const payload = (await response.json()) as PersistedDashboardResponse | { message: string };
            if (!response.ok || !('batchId' in payload)) throw new Error('message' in payload ? payload.message : 'import 실패');
            hydrate(payload);
            const batchesRes = await fetch('/api/batches');
            if (batchesRes.ok) setBatches(await batchesRes.json());
          } catch (e) {
            console.error(e);
            setError('업로드/적재에 실패했습니다. DATABASE_URL, Prisma 마이그레이션, Storage 설정을 확인해주세요.');
          } finally {
            setLoading(false);
          }
        }}
      />
      {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
    </label>
  );
}
