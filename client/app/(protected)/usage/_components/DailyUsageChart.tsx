'use client';

import { FC, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { DailyUsage } from '@/services/usageApi';

type Metric = 'cost' | 'tokens';

interface Props {
  data: DailyUsage[];
}

const formatDate = (d: string) => {
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const DailyUsageChart: FC<Props> = ({ data }) => {
  const [metric, setMetric] = useState<Metric>('cost');

  const chartData = data.map((d) => ({
    date: formatDate(d.date),
    cost: d.totalCost,
    tokens: d.totalTokens,
  }));

  return (
    <div className="bg-surface-raised border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-heading text-sm font-semibold">Daily Usage</h2>
        <div className="flex gap-1 bg-surface-elevated rounded-lg p-0.5">
          {(['cost', 'tokens'] as Metric[]).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-150 capitalize ${
                metric === m
                  ? 'bg-accent/20 text-accent'
                  : 'text-body hover:text-heading'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-muted text-sm">
          No data for this period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart
            data={chartData}
            margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="date"
              tick={{ fill: 'var(--color-muted)', fontSize: 10 }}
              axisLine={{ stroke: 'var(--color-border)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'var(--color-muted)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={48}
              tickFormatter={(v: number) =>
                metric === 'cost'
                  ? v < 0.01
                    ? `$${v.toFixed(4)}`
                    : `$${v.toFixed(2)}`
                  : v >= 1000
                    ? `${(v / 1000).toFixed(0)}K`
                    : String(v)
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-surface-overlay)',
                border: '1px solid var(--color-border)',
                borderRadius: '10px',
                fontSize: '12px',
                color: 'var(--color-primary)',
              }}
              formatter={(value: unknown) => {
                const v = typeof value === 'number' ? value : 0;
                return metric === 'cost'
                  ? [`$${v.toFixed(6)}`, 'Cost']
                  : [v.toLocaleString(), 'Tokens'];
              }}
            />
            <Line
              type="monotone"
              dataKey={metric}
              stroke="var(--color-accent)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: 'var(--color-accent)' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default DailyUsageChart;
