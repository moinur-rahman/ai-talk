'use client';

import { FC, useState } from 'react';
import { FiEdit2, FiCheck, FiX } from 'react-icons/fi';
import {
  useGetAllModelPricingQuery,
  useUpsertModelPricingMutation,
  type ModelPricing,
} from '@/services/usageApi';

interface EditState {
  modelId: string;
  inputTokenPrice: string;
  outputTokenPrice: string;
  reasoningTokenPrice: string;
}

const PricingRow: FC<{
  pricing: ModelPricing;
  onSave: (payload: {
    modelId: string;
    inputTokenPrice: number;
    outputTokenPrice: number;
    reasoningTokenPrice?: number;
  }) => Promise<void>;
}> = ({ pricing, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditState>({
    modelId: pricing.modelId,
    inputTokenPrice: String(pricing.inputTokenPrice),
    outputTokenPrice: String(pricing.outputTokenPrice),
    reasoningTokenPrice:
      pricing.reasoningTokenPrice != null
        ? String(pricing.reasoningTokenPrice)
        : '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      modelId: pricing.modelId,
      inputTokenPrice: Number(form.inputTokenPrice),
      outputTokenPrice: Number(form.outputTokenPrice),
      reasoningTokenPrice:
        form.reasoningTokenPrice !== ''
          ? Number(form.reasoningTokenPrice)
          : undefined,
    });
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => {
    setForm({
      modelId: pricing.modelId,
      inputTokenPrice: String(pricing.inputTokenPrice),
      outputTokenPrice: String(pricing.outputTokenPrice),
      reasoningTokenPrice:
        pricing.reasoningTokenPrice != null
          ? String(pricing.reasoningTokenPrice)
          : '',
    });
    setEditing(false);
  };

  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-3 pr-4">
        <p className="text-primary text-xs font-medium">{pricing.modelName}</p>
        <p className="text-muted text-[10px] capitalize">
          {pricing.providerName}
        </p>
      </td>
      {editing ? (
        <>
          <td className="py-3 pr-3">
            <input
              type="number"
              step="any"
              value={form.inputTokenPrice}
              onChange={(e) =>
                setForm((f) => ({ ...f, inputTokenPrice: e.target.value }))
              }
              className="w-24 px-2 py-1 rounded-lg bg-surface-elevated border border-accent/40 text-primary text-xs outline-none"
            />
          </td>
          <td className="py-3 pr-3">
            <input
              type="number"
              step="any"
              value={form.outputTokenPrice}
              onChange={(e) =>
                setForm((f) => ({ ...f, outputTokenPrice: e.target.value }))
              }
              className="w-24 px-2 py-1 rounded-lg bg-surface-elevated border border-accent/40 text-primary text-xs outline-none"
            />
          </td>
          <td className="py-3 pr-3">
            <input
              type="number"
              step="any"
              value={form.reasoningTokenPrice}
              onChange={(e) =>
                setForm((f) => ({ ...f, reasoningTokenPrice: e.target.value }))
              }
              placeholder="—"
              className="w-24 px-2 py-1 rounded-lg bg-surface-elevated border border-border text-primary text-xs outline-none placeholder-muted"
            />
          </td>
          <td className="py-3">
            <div className="flex gap-1">
              <button
                onClick={handleSave}
                disabled={saving}
                className="p-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors disabled:opacity-50"
              >
                <FiCheck size={12} />
              </button>
              <button
                onClick={handleCancel}
                className="p-1.5 rounded-lg hover:bg-surface-elevated text-body hover:text-heading transition-colors"
              >
                <FiX size={12} />
              </button>
            </div>
          </td>
        </>
      ) : (
        <>
          <td className="py-3 pr-3 text-body text-xs">
            ${pricing.inputTokenPrice}
          </td>
          <td className="py-3 pr-3 text-body text-xs">
            ${pricing.outputTokenPrice}
          </td>
          <td className="py-3 pr-3 text-body text-xs">
            {pricing.reasoningTokenPrice != null
              ? `$${pricing.reasoningTokenPrice}`
              : '—'}
          </td>
          <td className="py-3">
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-lg hover:bg-surface-elevated text-muted hover:text-accent transition-colors"
            >
              <FiEdit2 size={12} />
            </button>
          </td>
        </>
      )}
    </tr>
  );
};

const PricingPanel: FC = () => {
  const { data: pricing, isLoading } = useGetAllModelPricingQuery();
  const [upsert] = useUpsertModelPricingMutation();

  const handleSave = async (payload: {
    modelId: string;
    inputTokenPrice: number;
    outputTokenPrice: number;
    reasoningTokenPrice?: number;
  }) => {
    await upsert(payload);
  };

  return (
    <div className="bg-surface-raised border border-border rounded-2xl p-5">
      <div className="mb-4">
        <h2 className="text-heading text-sm font-semibold">Model Pricing</h2>
        <p className="text-muted text-xs mt-0.5">Prices in USD per 1M tokens</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !pricing || pricing.length === 0 ? (
        <p className="text-muted text-sm text-center py-8">
          No pricing configured. Send a message to auto-create pricing entries.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-2 pr-4 text-muted text-[10px] font-semibold uppercase tracking-wide">
                  Model
                </th>
                <th className="pb-2 pr-3 text-muted text-[10px] font-semibold uppercase tracking-wide">
                  Input /1M
                </th>
                <th className="pb-2 pr-3 text-muted text-[10px] font-semibold uppercase tracking-wide">
                  Output /1M
                </th>
                <th className="pb-2 pr-3 text-muted text-[10px] font-semibold uppercase tracking-wide">
                  Reasoning /1M
                </th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {pricing.map((p) => (
                <PricingRow key={p.modelId} pricing={p} onSave={handleSave} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PricingPanel;
