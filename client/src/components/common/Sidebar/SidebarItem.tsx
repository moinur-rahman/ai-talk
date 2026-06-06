import {
  type FC,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiFolder,
  FiMessageSquare,
  FiMoreHorizontal,
  FiX,
} from 'react-icons/fi';
import {
  useDeleteConversationMutation,
  useUpdateConversationTitleMutation,
} from '@/services/chatApi';
import ConversationContextMenu from './ConversationContextMenu';

const SidebarItem: FC<{
  name: string | null;
  id: string;
  projectId: string | null;
  isSelected?: boolean;
}> = ({ name, id, projectId, isSelected = false }) => {
  const navigate = useNavigate();
  const [deleteConversation, { isLoading: isDeleting }] =
    useDeleteConversationMutation();
  const [updateTitle] = useUpdateConversationTitleMutation();

  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(name ?? '');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming) renameInputRef.current?.select();
  }, [isRenaming]);

  const openMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = moreButtonRef.current!.getBoundingClientRect();
    setMenuPos({ x: rect.right + 6, y: rect.top });
  };

  const handleRenameCommit = async () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== name) {
      await updateTitle({ conversationId: id, title: trimmed });
    } else {
      setRenameValue(name ?? '');
    }
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleRenameCommit();
    if (e.key === 'Escape') {
      setRenameValue(name ?? '');
      setIsRenaming(false);
    }
  };

  const handleDelete = async () => {
    await deleteConversation(id).unwrap();
    setShowDeleteModal(false);
    if (isSelected) navigate('/new');
  };

  const displayName = name || 'Untitled';

  return (
    <>
      <div className="relative group mb-0.5">
        {isRenaming ? (
          <div
            className={`flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-lg border-l-2 ${
              isSelected ? 'border-accent bg-selected' : 'border-transparent'
            }`}
          >
            {projectId ? (
              <FiFolder size={13} className="shrink-0 text-muted" />
            ) : (
              <FiMessageSquare size={13} className="shrink-0 text-muted" />
            )}
            <input
              ref={renameInputRef}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleRenameCommit}
              onKeyDown={handleRenameKeyDown}
              maxLength={50}
              className="flex-1 min-w-0 bg-transparent text-sm text-primary outline-none"
            />
          </div>
        ) : (
          <Link
            to={`/chat/${id}`}
            className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg transition-all duration-150 text-sm border-l-2 pr-8 ${
              isSelected
                ? 'bg-selected text-accent border-accent'
                : 'text-body hover:bg-surface-elevated hover:text-heading border-transparent'
            }`}
          >
            {projectId ? (
              <FiFolder
                size={13}
                className={`shrink-0 ${isSelected ? 'text-accent' : 'text-muted'}`}
              />
            ) : (
              <FiMessageSquare
                size={13}
                className={`shrink-0 ${isSelected ? 'text-accent' : 'text-muted'}`}
              />
            )}
            <span className="truncate">{displayName}</span>
          </Link>
        )}

        {!isRenaming && (
          <button
            ref={moreButtonRef}
            onClick={openMenu}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded text-muted hover:text-body hover:bg-surface-elevated transition-colors opacity-0 group-hover:opacity-100"
          >
            <FiMoreHorizontal size={14} />
          </button>
        )}
      </div>

      {menuPos && (
        <ConversationContextMenu
          pos={menuPos}
          conversationId={id}
          projectId={projectId}
          onClose={() => setMenuPos(null)}
          onRename={() => {
            setRenameValue(name ?? '');
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
                  &ldquo;{displayName}&rdquo;
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
    </>
  );
};

export default SidebarItem;
