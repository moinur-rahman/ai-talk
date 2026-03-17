'use client';
import { useState } from 'react';
import { FiCheck, FiEdit2, FiX } from 'react-icons/fi';
import { useUpdateModelMutation, type AdminModel } from '@/services/modelApi';

const ModelRow = ({ model }: { model: AdminModel }) => {
  const [updateModel, { isLoading }] = useUpdateModelMutation();
  const [toggling, setToggling] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: model.name,
    description: model.description,
    hasReasoning: model.hasReasoning,
  });

  const handleToggleEnabled = async () => {
    setToggling(true);
    try {
      await updateModel({
        modelId: model.id,
        isEnabled: !model.isEnabled,
      }).unwrap();
    } finally {
      setToggling(false);
    }
  };

  const handleSave = async () => {
    await updateModel({ modelId: model.id, ...form }).unwrap();
    setEditing(false);
  };

  const handleCancel = () => {
    setForm({
      name: model.name,
      description: model.description,
      hasReasoning: model.hasReasoning,
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="px-4 py-3 bg-surface-raised space-y-2">
        <div className="flex gap-2">
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="flex-1 bg-surface-dim border border-border rounded-lg px-2.5 py-1.5 text-heading text-xs focus:outline-none focus:border-accent/50"
            placeholder="Name"
          />
          <input
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            className="flex-1 bg-surface-dim border border-border rounded-lg px-2.5 py-1.5 text-heading text-xs focus:outline-none focus:border-accent/50"
            placeholder="Description"
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.hasReasoning}
              onChange={(e) =>
                setForm((f) => ({ ...f, hasReasoning: e.target.checked }))
              }
              className="w-3.5 h-3.5 accent-accent"
            />
            <span className="text-body text-xs">Reasoning</span>
          </label>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCancel}
              className="p-1.5 rounded-lg text-muted hover:text-body hover:bg-surface-elevated transition-colors"
            >
              <FiX size={13} />
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="p-1.5 rounded-lg text-accent hover:bg-accent/10 transition-colors disabled:opacity-50"
            >
              <FiCheck size={13} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 group ${model.isDeprecated ? 'opacity-50' : ''}`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-heading text-xs font-medium truncate">
          {model.name}
        </p>
        {model.description && (
          <p className="text-muted text-[11px] truncate mt-0.5">
            {model.description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
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
        <button
          onClick={handleToggleEnabled}
          disabled={toggling}
          title={model.isEnabled ? 'Disable model' : 'Enable model'}
          className={`relative inline-flex h-4 w-7 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
            model.isEnabled ? 'bg-accent' : 'bg-border'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-3 w-3 rounded-full bg-white shadow transform transition-transform duration-200 ${
              model.isEnabled ? 'translate-x-3' : 'translate-x-0'
            }`}
          />
        </button>
        <button
          onClick={() => setEditing(true)}
          className="p-1.5 rounded-lg text-muted hover:text-body hover:bg-surface-elevated opacity-0 group-hover:opacity-100 transition-all"
        >
          <FiEdit2 size={12} />
        </button>
      </div>
    </div>
  );
};

export default ModelRow;
