'use client';
import { useState, useMemo } from 'react';
import { FiPlus, FiRefreshCw, FiSearch } from 'react-icons/fi';
import {
  useGetAdminOverviewQuery,
  useSyncModelsMutation,
  type SyncResult,
} from '@/services/modelApi';
import ProviderCard from '@/components/admin/ProviderCard';
import CreateModelModal from '@/components/admin/CreateModelModal';

const ModelsPage = () => {
  const { data: providers, isLoading } = useGetAdminOverviewQuery();
  const [syncModels, { isLoading: isSyncing }] = useSyncModelsMutation();
  const [syncResults, setSyncResults] = useState<SyncResult[] | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');

  const filteredProviders = useMemo(() => {
    if (!providers) return [];
    const q = search.trim().toLowerCase();
    if (!q) return providers;
    return providers
      .map((p) => ({
        ...p,
        models: p.models.filter((m) => m.name.toLowerCase().includes(q)),
      }))
      .filter((p) => p.models.length > 0);
  }, [providers, search]);

  const handleSync = async () => {
    setSyncResults(null);
    const res = await syncModels().unwrap();
    setSyncResults(res.data.results);
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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

      {/* Search */}
      <div className="relative mb-4">
        <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4e677e]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search models..."
          className="w-full bg-[#141826] border border-[#2e3d52] rounded-lg pl-9 pr-3 py-2 text-[#d5e6f0] text-sm placeholder-[#3a5068] focus:outline-none focus:border-[#00C4A1]/50"
        />
      </div>

      {/* Providers list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 border-2 border-[#00C4A1] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredProviders.length === 0 ? (
        <p className="text-center text-[#4e677e] text-sm py-20">No models found</p>
      ) : (
        <div className="space-y-3">
          {filteredProviders.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              isExpanded={!!search.trim() || expanded.has(provider.id)}
              onToggle={() => toggleExpand(provider.id)}
            />
          ))}
        </div>
      )}

      {showCreate && providers && (
        <CreateModelModal
          providers={providers}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
};

export default ModelsPage;
