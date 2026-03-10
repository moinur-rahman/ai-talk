'use client';
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
    hasReasoning: false,
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
      const message =
        (err as { data?: { message?: string } })?.data?.message;
      setError(message ?? 'Failed to create model');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md bg-[#1a2535] border border-[#2e3d52] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2e3d52]">
          <h3 className="text-[#e2ecf5] font-semibold text-sm">Add Model</h3>
          <button
            onClick={onClose}
            className="text-[#4e677e] hover:text-[#92adc4] transition-colors"
          >
            <FiX size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-[#627a8e] text-xs mb-1.5">
              Provider
            </label>
            <select
              value={form.providerId}
              onChange={(e) =>
                setForm((f) => ({ ...f, providerId: e.target.value }))
              }
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
            <label className="block text-[#627a8e] text-xs mb-1.5">
              Model Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, name: e.target.value }))
              }
              placeholder="e.g. gpt-4o"
              required
              className="w-full bg-[#141826] border border-[#2e3d52] rounded-lg px-3 py-2 text-[#d5e6f0] text-sm placeholder-[#3a5068] focus:outline-none focus:border-[#00C4A1]/50"
            />
          </div>

          <div>
            <label className="block text-[#627a8e] text-xs mb-1.5">
              Description
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Optional description"
              className="w-full bg-[#141826] border border-[#2e3d52] rounded-lg px-3 py-2 text-[#d5e6f0] text-sm placeholder-[#3a5068] focus:outline-none focus:border-[#00C4A1]/50"
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.hasReasoning}
              onChange={(e) =>
                setForm((f) => ({ ...f, hasReasoning: e.target.checked }))
              }
              className="w-4 h-4 rounded accent-[#00C4A1]"
            />
            <span className="text-[#92adc4] text-sm">
              Has reasoning capability
            </span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isEnabled}
              onChange={(e) =>
                setForm((f) => ({ ...f, isEnabled: e.target.checked }))
              }
              className="w-4 h-4 rounded accent-[#00C4A1]"
            />
            <span className="text-[#92adc4] text-sm">Enable for users</span>
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

export default CreateModelModal;
