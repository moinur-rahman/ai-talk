import { type FC } from 'react';
import {
  FiArrowDown,
  FiArrowUp,
  FiDollarSign,
  FiMessageSquare,
} from 'react-icons/fi';
import type { UsageSummary } from '@/services/usageApi';

const formatTokens = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
};

const formatCost = (n: number): string => {
  if (n === 0) return '$0.00';
  if (n < 0.01) return `$${n.toFixed(6)}`;
  if (n < 1) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}

const StatCard: FC<StatCardProps> = ({ icon, label, value, sub }) => (
  <div className="bg-surface-raised border border-border rounded-2xl px-5 py-4">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
        {icon}
      </div>
      <span className="text-body text-xs font-medium">{label}</span>
    </div>
    <p className="text-primary text-2xl font-semibold tracking-tight">
      {value}
    </p>
    {sub && <p className="text-muted text-xs mt-1">{sub}</p>}
  </div>
);

interface Props {
  data: UsageSummary;
}

const UsageSummaryCards: FC<Props> = ({ data }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <StatCard
      icon={<FiDollarSign size={14} />}
      label="Total Cost"
      value={formatCost(data.totalCost)}
    />
    <StatCard
      icon={<FiMessageSquare size={14} />}
      label="Messages"
      value={data.messageCount.toLocaleString()}
    />
    <StatCard
      icon={<FiArrowDown size={14} />}
      label="Input Tokens"
      value={formatTokens(data.inputTokens)}
      sub={`${formatTokens(data.reasoningTokens)} reasoning`}
    />
    <StatCard
      icon={<FiArrowUp size={14} />}
      label="Output Tokens"
      value={formatTokens(data.outputTokens)}
      sub={`${formatTokens(data.totalTokens)} total`}
    />
  </div>
);

export default UsageSummaryCards;
