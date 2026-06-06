import { type FC } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { UsageByModel } from '@/services/usageApi';

const COLORS = [
  'var(--color-accent)',
  '#7c6ff7',
  '#f97316',
  '#e879f9',
  '#38bdf8',
  '#fb7185',
  '#a3e635',
  '#fbbf24',
];

interface Props {
  data: UsageByModel[];
}

const ModelBreakdownChart: FC<Props> = ({ data }) => {
  const chartData = [...data]
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, 8)
    .map((d) => ({
      name:
        d.modelName.length > 20 ? d.modelName.slice(0, 20) + '…' : d.modelName,
      fullName: d.modelName,
      provider: d.providerName,
      cost: d.totalCost,
      messages: d.messageCount,
      pct: d.percentOfTotalCost,
    }));

  return (
    <div className="bg-surface-raised border border-border rounded-2xl p-5">
      <h2 className="text-heading text-sm font-semibold mb-4">Cost by Model</h2>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-muted text-sm">
          No data for this period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{ fill: 'var(--color-muted)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) =>
                v < 0.01 ? `$${v.toFixed(4)}` : `$${v.toFixed(2)}`
              }
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: 'var(--color-body)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={110}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-surface-overlay)',
                border: '1px solid var(--color-border)',
                borderRadius: '10px',
                fontSize: '12px',
                color: 'var(--color-primary)',
              }}
              formatter={(value: unknown, _name: unknown, props: unknown) => {
                const v = typeof value === 'number' ? value : 0;
                const p = (
                  props as {
                    payload?: { provider?: string; pct?: number };
                  }
                )?.payload;
                return [
                  `$${v.toFixed(6)} (${p?.pct ?? 0}%)`,
                  p?.provider ?? '',
                ];
              }}
              labelFormatter={(label: unknown) => String(label)}
            />
            <Bar dataKey="cost" radius={[0, 4, 4, 0]} maxBarSize={20}>
              {chartData.map((_entry, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index % COLORS.length]}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default ModelBreakdownChart;
