'use client';

import { FC, useState } from 'react';
import {
  useGetDashboardSummaryQuery,
  useGetUsageByModelQuery,
  useGetDailyUsageQuery,
} from '@/services/usageApi';
import { useGetMeQuery } from '@/services/userApi';
import UsageSummaryCards from './_components/UsageSummaryCards';
import DailyUsageChart from './_components/DailyUsageChart';
import ModelBreakdownChart from './_components/ModelBreakdownChart';
import PricingPanel from './_components/PricingPanel';

type Range = '7d' | '30d' | '90d';

const RANGES: { label: string; value: Range }[] = [
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
  { label: '90 days', value: '90d' },
];

const toLocalDateString = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDateRange = (range: Range): { from: string; to: string } => {
  const to = new Date();
  const from = new Date();
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  from.setDate(from.getDate() - days);
  return {
    from: toLocalDateString(from),
    to: toLocalDateString(to),
  };
};

const UsagePage: FC = () => {
  const [range, setRange] = useState<Range>('30d');
  const params = getDateRange(range);

  const { data: user } = useGetMeQuery();
  const { data: summary, isLoading: summaryLoading } =
    useGetDashboardSummaryQuery(params);
  const { data: byModel, isLoading: modelLoading } =
    useGetUsageByModelQuery(params);
  const { data: daily, isLoading: dailyLoading } =
    useGetDailyUsageQuery(params);

  const isLoading = summaryLoading || modelLoading || dailyLoading;

  const emptySummary = {
    messageCount: 0,
    inputTokens: 0,
    outputTokens: 0,
    reasoningTokens: 0,
    totalTokens: 0,
    totalCost: 0,
  };

  return (
    <div className="min-h-screen px-8 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-primary">
              Usage & Costs
            </h1>
            <p className="text-secondary text-sm mt-1">
              Token consumption and spending across all conversations
            </p>
          </div>

          {/* Date range picker */}
          <div className="flex gap-1 bg-surface-raised border border-border rounded-xl p-1">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  range === r.value
                    ? 'bg-accent/20 text-accent'
                    : 'text-body hover:text-heading'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-surface-raised border border-border rounded-2xl px-5 py-4 h-24 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <UsageSummaryCards data={summary ?? emptySummary} />
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {dailyLoading ? (
            <div className="bg-surface-raised border border-border rounded-2xl p-5 h-64 animate-pulse" />
          ) : (
            <DailyUsageChart data={daily ?? []} />
          )}

          {modelLoading ? (
            <div className="bg-surface-raised border border-border rounded-2xl p-5 h-64 animate-pulse" />
          ) : (
            <ModelBreakdownChart data={byModel ?? []} />
          )}
        </div>

        {/* Admin pricing panel */}
        {user?.role === 'admin' && <PricingPanel />}
      </div>
    </div>
  );
};

export default UsagePage;
