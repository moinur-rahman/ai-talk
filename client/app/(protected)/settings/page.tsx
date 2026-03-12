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
    router.push('/');
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-[#e2ecf5] font-semibold text-lg mb-8">Settings</h1>

      <section>
        <p className="text-[#4e677e] text-[10px] font-semibold uppercase tracking-widest mb-3">
          Data
        </p>
        <div className="bg-[#141826] border border-[#2e3d52] rounded-xl overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <FiTrash2
                size={15}
                className="text-red-400 mt-0.5 flex-shrink-0"
              />
              <div>
                <p className="text-[#d5e6f0] text-sm font-medium">
                  Delete all chats
                </p>
                <p className="text-[#4e677e] text-xs mt-0.5">
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
          <div className="w-full max-w-sm bg-[#1a2535] border border-[#2e3d52] rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#2e3d52] flex items-center justify-between">
              <h3 className="text-[#e2ecf5] font-semibold text-sm">
                Delete all chats
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#4e677e] hover:text-[#92adc4] transition-colors"
              >
                <FiX size={16} />
              </button>
            </div>
            <div className="px-5 py-4">
              <p className="text-[#92adc4] text-sm">
                This will permanently delete{' '}
                <span className="text-[#d5e6f0] font-medium">
                  all your conversations
                </span>
                . This cannot be undone.
              </p>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-[#2e3d52] text-[#92adc4] hover:bg-[#222b3d] text-sm transition-colors"
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
