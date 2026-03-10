'use client';
import { useState } from 'react';
import {
  useGetAdminOverviewQuery,
  useSyncModelsMutation,
  useCreateModelMutation,
  useUpdateModelMutation,
  type AdminProvider,
  type AdminModel,
  type SyncResult,
  type CreateModelPayload,
} from '@/services/modelApi';
import {
  FiRefreshCw,
  FiChevronDown,
  FiChevronUp,
  FiCpu,
  FiPlus,
  FiEdit2,
  FiCheck,
  FiX,
} from 'react-icons/fi';

// ─── Create Model Modal ───────────────────────────────────────────────────────

const CreateModelModal = ({
  providers,
  onClose,
}: {
  providers: AdminProvider[];
  onClose: () => void;
}) => {
  const [createModel, { isLoading }] = useCreateModelMutation();
  const [form, setForm] = useState<CreateModelPayload>({
    name: '',
    description: '',
    hasReasoning: false,
    providerId: providers[0]?.id ?? '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await createModel(form).unwrap();
      onClose();
    } catch (err: any) {
      setError(err?.data?.message ?? 'Failed to create model');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md bg-[#1a2535] border border-[#2e3d52] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2e3d52]">
          <h3 className="text-[#e2ecf5] font-semibold text-sm">Add Model</h3>
          <button onClick={onClose} className="text-[#4e677e] hover:text-[#92adc4] transition-colors">
            <FiX size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-[#627a8e] text-xs mb-1.5">Provider</label>
            <select
              value={form.providerId}
              onChange={(e) => setForm((f) => ({ ...f, providerId: e.target.value }))}
              className="w-full bg-[#141826] border border-[#2e3d52] rounded-lg px-3 py-2 text-[#d5e6f0] text-sm focus:outline-none focus:border-[#00C4A1]/50 capitalize"
            >
              {providers.map((p) => (
                <option key={p.id} value={p.id} className="capitalize">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#627a8e] text-xs mb-1.5">Model Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. gpt-4o"
              required
              className="w-full bg-[#141826] border border-[#2e3d52] rounded-lg px-3 py-2 text-[#d5e6f0] text-sm placeholder-[#3a5068] focus:outline-none focus:border-[#00C4A1]/50"
            />
          </div>

          <div>
            <label className="block text-[#627a8e] text-xs mb-1.5">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Optional description"
              className="w-full bg-[#141826] border border-[#2e3d52] rounded-lg px-3 py-2 text-[#d5e6f0] text-sm placeholder-[#3a5068] focus:outline-none focus:border-[#00C4A1]/50"
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.hasReasoning}
              onChange={(e) => setForm((f) => ({ ...f, hasReasoning: e.target.checked }))}
              className="w-4 h-4 rounded accent-[#00C4A1]"
            />
            <span className="text-[#92adc4] text-sm">Has reasoning capability</span>
          </label>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-[#2e3d52] text-[#92adc4] hover:bg-[#222b3d] text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-lg bg-[#00C4A1] hover:bg-[#00b090] text-[#141826] font-medium text-sm transition-colors disabled:opacity-60"
            >
              {isLoading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Inline Edit Row ──────────────────────────────────────────────────────────

const ModelRow = ({ model }: { model: AdminModel }) => {
  const [updateModel, { isLoading }] = useUpdateModelMutation();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: model.name,
    description: model.description,
    hasReasoning: model.hasReasoning,
    isDeprecated: model.isDeprecated,
  });

  const handleSave = async () => {
    await updateModel({ modelId: model.id, ...form }).unwrap();
    setEditing(false);
  };

  const handleCancel = () => {
    setForm({
      name: model.name,
      description: model.description,
      hasReasoning: model.hasReasoning,
      isDeprecated: model.isDeprecated,
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="px-4 py-3 bg-[#1a2535] space-y-2">
        <div className="flex gap-2">
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="flex-1 bg-[#141826] border border-[#2e3d52] rounded-lg px-2.5 py-1.5 text-[#d5e6f0] text-xs focus:outline-none focus:border-[#00C4A1]/50"
            placeholder="Name"
          />
          <input
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="flex-1 bg-[#141826] border border-[#2e3d52] rounded-lg px-2.5 py-1.5 text-[#d5e6f0] text-xs focus:outline-none focus:border-[#00C4A1]/50"
            placeholder="Description"
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.hasReasoning}
                onChange={(e) => setForm((f) => ({ ...f, hasReasoning: e.target.checked }))}
                className="w-3.5 h-3.5 accent-[#00C4A1]"
              />
              <span className="text-[#92adc4] text-xs">Reasoning</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isDeprecated}
                onChange={(e) => setForm((f) => ({ ...f, isDeprecated: e.target.checked }))}
                className="w-3.5 h-3.5 accent-red-400"
              />
              <span className="text-[#92adc4] text-xs">Deprecated</span>
            </label>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCancel}
              className="p-1.5 rounded-lg text-[#4e677e] hover:text-[#92adc4] hover:bg-[#222b3d] transition-colors"
            >
              <FiX size={13} />
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="p-1.5 rounded-lg text-[#00C4A1] hover:bg-[#00C4A1]/10 transition-colors disabled:opacity-50"
            >
              <FiCheck size={13} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-3 group ${model.isDeprecated ? 'opacity-50' : ''}`}>
      <div className="flex-1 min-w-0">
        <p className="text-[#d5e6f0] text-xs font-medium truncate">{model.name}</p>
        {model.description && (
          <p className="text-[#4e677e] text-[11px] truncate mt-0.5">{model.description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {model.hasReasoning && (
          <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-medium">
            Reasoning
          </span>
        )}
        {model.isDeprecated ? (
          <span className="px-2 py-0.5 rounded-full bg-[#2e3d52] text-[#4e677e] text-[10px] font-medium">
            Deprecated
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full bg-[#00C4A1]/10 border border-[#00C4A1]/20 text-[#00C4A1] text-[10px] font-medium">
            Active
          </span>
        )}
        <button
          onClick={() => setEditing(true)}
          className="p-1.5 rounded-lg text-[#4e677e] hover:text-[#92adc4] hover:bg-[#222b3d] opacity-0 group-hover:opacity-100 transition-all"
        >
          <FiEdit2 size={12} />
        </button>
      </div>
    </div>
  );
};

// ─── Provider Card ────────────────────────────────────────────────────────────

const ProviderCard = ({
  provider,
  isExpanded,
  onToggle,
}: {
  provider: AdminProvider;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const activeCount = provider.models.filter((m) => !m.isDeprecated).length;
  const deprecatedCount = provider.models.filter((m) => m.isDeprecated).length;

  return (
    <div className="rounded-xl border border-[#2e3d52] bg-[#141826] overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#1a2535] transition-colors duration-150"
      >
        <div className="w-8 h-8 rounded-lg bg-[#222b3d] border border-[#2e3d52] flex items-center justify-center flex-shrink-0">
          <FiCpu size={14} className="text-[#00C4A1]" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-[#d5e6f0] text-sm font-medium capitalize">{provider.name}</p>
          <p className="text-[#4e677e] text-[11px] mt-0.5">
            {activeCount} active
            {deprecatedCount > 0 && (
              <span className="text-[#3a5068]"> · {deprecatedCount} deprecated</span>
            )}
          </p>
        </div>
        {isExpanded ? (
          <FiChevronUp size={14} className="text-[#4e677e] flex-shrink-0" />
        ) : (
          <FiChevronDown size={14} className="text-[#4e677e] flex-shrink-0" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-[#2e3d52]">
          {provider.models.length === 0 ? (
            <p className="px-4 py-4 text-[#4e677e] text-xs text-center">
              No models — run sync to populate
            </p>
          ) : (
            <div className="divide-y divide-[#1e2d3d]">
              {provider.models.map((model) => (
                <ModelRow key={model.id} model={model} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const ModelsPage = () => {
  const { data: providers, isLoading } = useGetAdminOverviewQuery();
  const [syncModels, { isLoading: isSyncing }] = useSyncModelsMutation();
  const [syncResults, setSyncResults] = useState<SyncResult[] | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);

  const handleSync = async () => {
    setSyncResults(null);
    const res = await syncModels().unwrap();
    setSyncResults(res.data.results);
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[#e2ecf5] font-semibold text-lg">Models</h2>
          <p className="text-[#627a8e] text-xs mt-0.5">
            Manage providers and their available models
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2e3d52] text-[#92adc4] hover:text-[#00C4A1] hover:border-[#00C4A1]/30 hover:bg-[#00C4A1]/5 text-sm transition-all duration-200"
          >
            <FiPlus size={14} />
            Add Model
          </button>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00C4A1] hover:bg-[#00b090] text-[#141826] font-medium text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <FiRefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing...' : 'Sync Models'}
          </button>
        </div>
      </div>

      {/* Sync results */}
      {syncResults && (
        <div className="mb-5 rounded-xl border border-[#2e3d52] bg-[#141826] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2e3d52]">
            <p className="text-[#e2ecf5] text-xs font-semibold uppercase tracking-widest">
              Sync Results
            </p>
          </div>
          <div className="divide-y divide-[#2e3d52]">
            {syncResults.map((r) => (
              <div key={r.provider} className="px-4 py-3 flex items-center gap-4">
                <span className="text-[#d5e6f0] text-sm font-medium w-32 capitalize">
                  {r.provider}
                </span>
                {r.error ? (
                  <span className="text-red-400 text-xs">{r.error}</span>
                ) : (
                  <div className="flex gap-4 text-xs">
                    <span className="text-[#00C4A1]">+{r.created} created</span>
                    <span className="text-blue-400">~{r.updated} restored</span>
                    <span className="text-[#627a8e]">{r.deprecated} deprecated</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Providers list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 border-2 border-[#00C4A1] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {providers?.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              isExpanded={expanded.has(provider.id)}
              onToggle={() => toggleExpand(provider.id)}
            />
          ))}
        </div>
      )}

      {showCreate && providers && (
        <CreateModelModal providers={providers} onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
};

export default ModelsPage;
