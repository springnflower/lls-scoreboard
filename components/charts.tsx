'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const palette = ['#1d4ed8', '#2563eb', '#38bdf8', '#0f766e', '#8b5cf6', '#f59e0b', '#ef4444', '#64748b'];

export function MonthlyLineChart({ data }: { data: Array<{ month: string; sales: number; spend?: number }> }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <ComposedChart data={data}>
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip />
          <Bar dataKey="spend" fill="#cbd5e1" radius={[10, 10, 0, 0]} />
          <Line type="monotone" dataKey="sales" stroke="#111827" strokeWidth={2.5} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ChannelBarChart({ data }: { data: Array<{ channel: string; sales: number }> }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <BarChart data={data.slice(0, 8)} layout="vertical" margin={{ left: 24 }}>
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" hide />
          <YAxis dataKey="channel" type="category" width={100} tickLine={false} axisLine={false} />
          <Tooltip />
          <Bar dataKey="sales" radius={[0, 10, 10, 0]} fill="#111827" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryPieChart({ data }: { data: Array<{ category: string; sales: number }> }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data.slice(0, 6)} dataKey="sales" nameKey="category" innerRadius={65} outerRadius={110} paddingAngle={3}>
            {data.slice(0, 6).map((entry, index) => (
              <Cell key={entry.category} fill={palette[index % palette.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
