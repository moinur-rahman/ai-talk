'use client';
import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { useUpdateModelMutation, type AdminModel } from '@/services/modelApi';

const Toggle = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
      checked ? 'bg-accent' : 'bg-border'
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ${
        checked ? 'translate-x-4' : 'translate-x-0'
      }`}
    />
  </button>
);

const EditModelDrawer = ({
  model,
  onClose,
}: {
  model: AdminModel;
  onClose: () => void;
}) => {
  const [updateModel, { isLoading }] = useUpdateModelMutation();
  const [visible, setVisible] = useState(false);
  const [form, setForm] = useState({
    name: model.name,
    description: model.description,
    hasReasoning: model.hasReasoning,
    isEnabled: model.isEnabled,
  });

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 250);
  };

  const handleSave = async () => {
    await updateModel({ modelId: model.id, ...form }).unwrap();
    handleClose();
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-250 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />
      <div className={`fixed right-0 top-0 h-full w-80 z-50 bg-surface-raised border-l border-border flex flex-col shadow-2xl transition-transform duration-250 ease-in-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h3 className="text-primary font-semibold text-sm">Edit Model</h3>
          <button
            onClick={handleClose}
            className="text-muted hover:text-body transition-colors"
          >
            <FiX size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div>
            <label className="block text-secondary text-xs mb-1.5">
              Model Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full bg-surface-dim border border-border rounded-lg px-3 py-2 text-heading text-sm focus:outline-none focus:border-accent/50"
            />
          </div>

          <div>
            <label className="block text-secondary text-xs mb-1.5">
              Description
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Optional description"
              className="w-full bg-surface-dim border border-border rounded-lg px-3 py-2 text-heading text-sm placeholder-[#3a5068] focus:outline-none focus:border-accent/50"
            />
          </div>

          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-heading text-sm">Reasoning</p>
              <p className="text-muted text-xs mt-0.5">
                Model supports extended thinking
              </p>
            </div>
            <Toggle
              checked={form.hasReasoning}
              onChange={(v) => setForm((f) => ({ ...f, hasReasoning: v }))}
            />
          </div>

          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-heading text-sm">Enabled</p>
              <p className="text-muted text-xs mt-0.5">
                Available for users to select
              </p>
            </div>
            <Toggle
              checked={form.isEnabled}
              onChange={(v) => setForm((f) => ({ ...f, isEnabled: v }))}
            />
          </div>
        </div>

        <div className="flex gap-2 px-5 py-4 border-t border-border flex-shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2 rounded-lg border border-border text-body hover:bg-surface-elevated text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-lg bg-accent hover:bg-[#00b090] text-surface-dim font-medium text-sm transition-colors disabled:opacity-60"
          >
            {isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </>
  );
};

export default EditModelDrawer;
