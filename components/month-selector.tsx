'use client';

import { Select } from './ui';

type Props = {
  value: string;
  onChange: (month: string) => void;
  months: string[];
  className?: string;
};

/** 월별 / 누적 선택. value '' = 전체(누적), 'YYYY-MM' = 해당 월 */
export function MonthSelector({ value, onChange, months, className }: Props) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-slate-600">기간</label>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-[160px]"
      >
        <option value="">전체 (누적)</option>
        {months.map((m) => (
          <option key={m} value={m}>{m} 월별</option>
        ))}
      </Select>
    </div>
  );
}
