'use client';
import { FiEdit2 } from 'react-icons/fi';
import { type AdminModel } from '@/services/modelApi';

const ModelRow = ({
  model,
  onEdit,
}: {
  model: AdminModel;
  onEdit: (model: AdminModel) => void;
}) => (
  <div
    className={`flex items-center gap-3 px-4 py-3 group ${model.isDeprecated ? 'opacity-50' : ''}`}
  >
    <div className="flex-1 min-w-0">
      <p className="text-heading text-xs font-medium truncate">{model.name}</p>
      {model.description && (
        <p className="text-muted text-[11px] truncate mt-0.5">
          {model.description}
        </p>
      )}
    </div>
    <div className="flex items-center gap-2 shrink-0">
      {model.hasReasoning && (
        <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-medium">
          Reasoning
        </span>
      )}
      {model.isDeprecated && (
        <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-medium">
          Deprecated
        </span>
      )}
      {model.isEnabled ? (
        <span className="px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-medium">
          Enabled
        </span>
      ) : (
        <span className="px-2 py-0.5 rounded-full bg-border/40 border border-border text-muted text-[10px] font-medium">
          Disabled
        </span>
      )}
      <button
        onClick={() => onEdit(model)}
        className="p-1.5 rounded-lg text-muted hover:text-body hover:bg-surface-elevated opacity-0 group-hover:opacity-100 transition-all"
      >
        <FiEdit2 size={12} />
      </button>
    </div>
  </div>
);

export default ModelRow;
