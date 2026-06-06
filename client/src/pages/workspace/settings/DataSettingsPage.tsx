import { useState } from 'react';
import { FiAlertTriangle, FiTrash2 } from 'react-icons/fi';
import { useDeleteAllConversationsMutation } from '@/services/chatApi';

const ConfirmDialog = ({
  onConfirm,
  onCancel,
  loading,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="bg-surface-raised border border-border rounded-2xl p-6 w-full max-w-sm shadow-xl">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
          <FiAlertTriangle size={16} className="text-red-400" />
        </div>
        <h2 className="text-heading text-sm font-semibold">
          Delete all conversations?
        </h2>
      </div>
      <p className="text-muted text-xs mb-5">
        This will permanently delete every conversation and its messages. This
        action cannot be undone.
      </p>
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 rounded-lg text-sm text-body hover:bg-surface-elevated border border-border transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="px-4 py-2 rounded-lg text-sm text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50"
        >
          {loading ? 'Deleting…' : 'Delete all'}
        </button>
      </div>
    </div>
  </div>
);

const DataSettingsPage = () => {
  const [deleteAllConversations, { isLoading }] =
    useDeleteAllConversationsMutation();
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);

  const handleConfirm = async () => {
    await deleteAllConversations();
    setShowConfirm(false);
    setDone(true);
    setTimeout(() => setDone(false), 3000);
  };

  return (
    <div className="max-w-2xl px-8 py-10">
      <h1 className="text-primary font-semibold text-lg mb-8">Data</h1>

      <section>
        <p className="text-muted text-[10px] font-semibold uppercase tracking-widest mb-3">
          Danger Zone
        </p>
        <div className="bg-surface-dim border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-heading text-sm font-medium">
                Delete all conversations
              </p>
              <p className="text-muted text-xs mt-0.5">
                Permanently remove every conversation and its messages.
              </p>
            </div>
            <button
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors shrink-0"
            >
              <FiTrash2 size={13} />
              {done ? 'Deleted!' : 'Delete all'}
            </button>
          </div>
        </div>
      </section>

      {showConfirm && (
        <ConfirmDialog
          onConfirm={handleConfirm}
          onCancel={() => setShowConfirm(false)}
          loading={isLoading}
        />
      )}
    </div>
  );
};

export default DataSettingsPage;
