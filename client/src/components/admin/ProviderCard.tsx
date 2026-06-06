import { FiChevronDown, FiChevronUp, FiCpu } from 'react-icons/fi';
import { type AdminProvider, type AdminModel } from '@/services/modelApi';
import ModelRow from './ModelRow';

const ProviderCard = ({
  provider,
  isExpanded,
  onToggle,
  onEditModel,
}: {
  provider: AdminProvider;
  isExpanded: boolean;
  onToggle: () => void;
  onEditModel: (model: AdminModel) => void;
}) => {
  const enabledCount = provider.models.filter((m) => m.isEnabled).length;
  const deprecatedCount = provider.models.filter((m) => m.isDeprecated).length;

  return (
    <div className="rounded-xl border border-border bg-surface-dim overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-surface-raised transition-colors duration-150"
      >
        <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-border flex items-center justify-center shrink-0">
          <FiCpu size={14} className="text-accent" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-heading text-sm font-medium capitalize">
            {provider.name}
          </p>
          <p className="text-muted text-[11px] mt-0.5">
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
          <FiChevronUp size={14} className="text-muted shrink-0" />
        ) : (
          <FiChevronDown size={14} className="text-muted shrink-0" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-border">
          {provider.models.length === 0 ? (
            <p className="px-4 py-4 text-muted text-xs text-center">
              No models — run sync to populate
            </p>
          ) : (
            <div className="divide-y divide-[#1e2d3d]">
              {provider.models.map((model) => (
                <ModelRow key={model.id} model={model} onEdit={onEditModel} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProviderCard;
