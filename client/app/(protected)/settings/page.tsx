'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiTrash2, FiX } from 'react-icons/fi';
import { useDeleteAllConversationsMutation } from '@/services/chatApi';

const SettingsPage = () => {
  const router = useRouter();
  const [deleteAllConversations, { isLoading }] =
    useDeleteAllConversationsMutation();
  const [showModal, setShowModal] = useState(false);

  const handleDeleteAll = async () => {
    await deleteAllConversations().unwrap();
    setShowModal(false);
    router.push('/new');
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-primary font-semibold text-lg mb-8">Settings</h1>

      <section>
        <p className="text-muted text-[10px] font-semibold uppercase tracking-widest mb-3">
          Data
        </p>
        <div className="bg-surface-dim border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <FiTrash2
                size={15}
                className="text-red-400 mt-0.5 flex-shrink-0"
              />
              <div>
                <p className="text-heading text-sm font-medium">
                  Delete all chats
                </p>
                <p className="text-muted text-xs mt-0.5">
                  Permanently remove all your conversations and messages
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-medium transition-colors"
            >
              Delete all
            </button>
          </div>
        </div>
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm bg-surface-raised border border-border rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-primary font-semibold text-sm">
                Delete all chats
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted hover:text-body transition-colors"
              >
                <FiX size={16} />
              </button>
            </div>
            <div className="px-5 py-4">
              <p className="text-body text-sm">
                This will permanently delete{' '}
                <span className="text-heading font-medium">
                  all your conversations
                </span>
                . This cannot be undone.
              </p>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-border text-body hover:bg-surface-elevated text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAll}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium text-sm transition-colors disabled:opacity-60"
                >
                  {isLoading ? 'Deleting...' : 'Delete all'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
