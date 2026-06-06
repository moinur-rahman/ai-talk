import { useState } from 'react';
import { FiX } from 'react-icons/fi';
import {
  useCreateModelMutation,
  type AdminProvider,
  type CreateModelPayload,
} from '@/services/modelApi';

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
    isEnabled: false,
    providerId: providers[0]?.id ?? '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await createModel(form).unwrap();
      onClose();
    } catch (err: unknown) {
      const message = (err as { data?: { message?: string } })?.data?.message;
      setError(message ?? 'Failed to create model');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md bg-surface-raised border border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-primary font-semibold text-sm">Add Model</h3>
          <button
            onClick={onClose}
            className="text-muted hover:text-body transition-colors"
          >
            <FiX size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-secondary text-xs mb-1.5">
              Provider
            </label>
            <select
              value={form.providerId}
              onChange={(e) =>
                setForm((f) => ({ ...f, providerId: e.target.value }))
              }
              className="w-full bg-surface-dim border border-border rounded-lg px-3 py-2 text-heading text-sm focus:outline-none focus:border-accent/50 capitalize"
            >
              {providers.map((p) => (
                <option key={p.id} value={p.id} className="capitalize">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-secondary text-xs mb-1.5">
              Model Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. gpt-4o"
              required
              className="w-full bg-surface-dim border border-border rounded-lg px-3 py-2 text-heading text-sm placeholder-[#3a5068] focus:outline-none focus:border-accent/50"
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

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isEnabled}
              onChange={(e) =>
                setForm((f) => ({ ...f, isEnabled: e.target.checked }))
              }
              className="w-4 h-4 rounded accent-accent"
            />
            <span className="text-body text-sm">Enable for users</span>
          </label>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-border text-body hover:bg-surface-elevated text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-lg bg-accent hover:bg-[#00b090] text-surface-dim font-medium text-sm transition-colors disabled:opacity-60"
            >
              {isLoading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateModelModal;
