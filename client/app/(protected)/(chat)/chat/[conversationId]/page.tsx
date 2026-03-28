'use client';
import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiChevronDown, FiX } from 'react-icons/fi';
import ChatHistory from '@/components/chat/ChatHistory';
import SendMessage from '@/components/chat/SendMessage';
import {
  useGetChatHistoryQuery,
  useUpdateConversationTitleMutation,
  useDeleteConversationMutation,
} from '@/services/chatApi';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import ConversationContextMenu from '@/components/common/Sidebar/ConversationContextMenu';

const Chat = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const router = useRouter();

  const newConversationId = useSelector(
    (state: RootState) => state.chat.newConversationId,
  );
  const newConversationTitle = useSelector(
    (state: RootState) => state.chat.newConversationTitle,
  );
  const newConversationProject = useSelector(
    (state: RootState) => state.chat.newConversationProject,
  );
  const isNew = newConversationId === conversationId;

  const { data, isLoading } = useGetChatHistoryQuery(conversationId, {
    skip: isNew,
  });
  const project = isNew ? newConversationProject : (data?.project ?? null);
  const title = isNew ? newConversationTitle : (data?.title ?? null);

  const dropdownButtonRef = useRef<HTMLButtonElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [updateTitle] = useUpdateConversationTitleMutation();
  const [deleteConversation, { isLoading: isDeleting }] =
    useDeleteConversationMutation();

  const displayTitle = title ?? 'New conversation';

  useEffect(() => {
    if (isRenaming) renameInputRef.current?.select();
  }, [isRenaming]);

  const openMenu = () => {
    const rect = dropdownButtonRef.current!.getBoundingClientRect();
    setMenuPos({ x: rect.left, y: rect.bottom + 4 });
  };

  const handleRenameCommit = async () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== displayTitle) {
      await updateTitle({ conversationId, title: trimmed });
    }
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleRenameCommit();
    if (e.key === 'Escape') setIsRenaming(false);
  };

  const handleDelete = async () => {
    await deleteConversation(conversationId).unwrap();
    setShowDeleteModal(false);
    router.push('/new');
  };

  return (
    <main className="flex-1 flex flex-col h-full relative">
      <div className="absolute inset-0 flex flex-col">
        <div className="shrink-0 flex items-center px-5 py-3 border-b border-border bg-surface">
          <div className="flex items-center gap-1.5 min-w-0">
            {project && (
              <>
                <Link
                  href={`/projects/${project.id}`}
                  className="text-sm font-medium text-muted hover:text-body transition-colors truncate shrink-0"
                >
                  {project.name}
                </Link>
                <span className="text-muted text-sm shrink-0">/</span>
              </>
            )}
            {isRenaming ? (
              <input
                ref={renameInputRef}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={handleRenameCommit}
                onKeyDown={handleRenameKeyDown}
                maxLength={50}
                className="text-sm font-medium text-body bg-transparent border-b border-accent outline-none min-w-0 w-48"
              />
            ) : (
              <button
                ref={dropdownButtonRef}
                onClick={openMenu}
                className="flex items-center gap-1 min-w-0 group"
              >
                {isLoading && !isNew ? (
                  <span className="h-3.5 w-32 bg-border rounded animate-pulse inline-block" />
                ) : (
                  <span className="text-sm font-medium text-body truncate">
                    {displayTitle}
                  </span>
                )}
                <FiChevronDown
                  size={14}
                  className="text-muted group-hover:text-body transition-colors shrink-0"
                />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <ChatHistory />
        </div>
        <div className="w-full bg-surface px-4 pb-4 pt-2 flex justify-center">
          <SendMessage currentProject={data?.project ?? null} />
        </div>
      </div>

      {menuPos && (
        <ConversationContextMenu
          pos={menuPos}
          conversationId={conversationId}
          projectId={project?.id ?? null}
          onClose={() => setMenuPos(null)}
          onRename={() => {
            setRenameValue(title ?? '');
            setIsRenaming(true);
          }}
          onDelete={() => setShowDeleteModal(true)}
        />
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm bg-surface-raised border border-border rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-primary font-semibold text-sm">
                Delete conversation
              </h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-muted hover:text-body transition-colors"
              >
                <FiX size={16} />
              </button>
            </div>
            <div className="px-5 py-4">
              <p className="text-body text-sm">
                Are you sure you want to delete{' '}
                <span className="text-heading font-medium">
                  &ldquo;{displayTitle}&rdquo;
                </span>
                ? This cannot be undone.
              </p>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-border text-body hover:bg-surface-elevated text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium text-sm transition-colors disabled:opacity-60"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Chat;
