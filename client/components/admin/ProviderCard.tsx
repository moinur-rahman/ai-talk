'use client';
import { FiChevronDown, FiChevronUp, FiCpu } from 'react-icons/fi';
import { type AdminProvider } from '@/services/modelApi';
import ModelRow from './ModelRow';

const ProviderCard = ({
  provider,
  isExpanded,
  onToggle,
}: {
  provider: AdminProvider;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const enabledCount = provider.models.filter((m) => m.isEnabled).length;
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
          <p className="text-[#d5e6f0] text-sm font-medium capitalize">
            {provider.name}
          </p>
          <p className="text-[#4e677e] text-[11px] mt-0.5">
            {enabledCount} enabled
            {deprecatedCount > 0 && (
              <span className="text-[#3a5068]">
                {' '}
                · {deprecatedCount} deprecated
              </span>
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

export default ProviderCard;
