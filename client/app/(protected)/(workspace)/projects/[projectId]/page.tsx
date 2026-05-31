'use client';

import { FC, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiArrowLeft,
  FiCheck,
  FiEdit2,
  FiMoreHorizontal,
  FiPlus,
  FiTrash2,
  FiX,
} from 'react-icons/fi';
import {
  useGetProjectQuery,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
} from '@/services/projectApi';
import {
  useGetProjectConversationsInfiniteQuery,
  useDeleteConversationMutation,
  useUpdateConversationTitleMutation,
} from '@/services/chatApi';
import ConversationContextMenu from '@/components/common/Sidebar/ConversationContextMenu';
import SendMessage from '@/components/chat/SendMessage';

function getRelativeTime(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}

const ProjectDetailPage: FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();

  const { data: project, isLoading } = useGetProjectQuery(projectId);
  const {
    data: conversationsData,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useGetProjectConversationsInfiniteQuery(projectId);
  const [updateProject] = useUpdateProjectMutation();
  const [deleteProject, { isLoading: isDeleting }] = useDeleteProjectMutation();

  const [showEditInstructions, setShowEditInstructions] = useState(false);
  const [editInstructions, setEditInstructions] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  const openInstructionsEdit = () => {
    setEditInstructions(project?.instructions ?? '');
    setShowEditInstructions(true);
  };

  const handleSaveInstructions = async () => {
    await updateProject({
      projectId,
      instructions: editInstructions.trim() || undefined,
    });
    setShowEditInstructions(false);
  };

  const handleDelete = async () => {
    await deleteProject(projectId);
    router.push('/projects');
  };

  const conversations =
    conversationsData?.pages.flatMap((p) => p.conversations) ?? [];
  const total = conversationsData?.pages[0]?.total;
  const description = project?.description ?? '';
  const descriptionTruncated = description.length > 160;
  const displayedDescription =
    descriptionTruncated && !descriptionExpanded
      ? description.slice(0, 160) + '...'
      : description;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="flex max-w-5xl mx-auto px-8 py-8 gap-8 min-h-full">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Back link */}
            <Link
              href="/projects"
              className="inline-flex items-center gap-1.5 text-muted hover:text-body text-sm transition-colors mb-6"
            >
              <FiArrowLeft size={14} />
              All projects
            </Link>

            {/* Project header */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold text-primary mb-2">
                  {project?.name}
                </h1>
                {description && (
                  <p className="text-secondary text-sm leading-relaxed">
                    {displayedDescription}
                    {descriptionTruncated && (
                      <button
                        onClick={() => setDescriptionExpanded((v) => !v)}
                        className="ml-1 text-muted hover:text-body underline text-sm transition-colors"
                      >
                        {descriptionExpanded ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </p>
                )}
              </div>
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowProjectMenu((v) => !v)}
                  className="p-2 rounded-lg text-muted hover:text-body hover:bg-surface-elevated transition-colors"
                >
                  <FiEdit2 size={16} />
                </button>
                {showProjectMenu && (
                  <ProjectMenu
                    onDelete={() => {
                      setShowProjectMenu(false);
                      setShowDeleteModal(true);
                    }}
                    onClose={() => setShowProjectMenu(false)}
                    projectId={projectId}
                    projectName={project?.name ?? ''}
                    projectDescription={project?.description ?? ''}
                  />
                )}
              </div>
            </div>

            {/* New conversation prompt */}
            <div className="mb-8 [&>div]:max-w-none">
              <SendMessage
                defaultRows={3}
                currentProject={
                  project ? { id: project.id, name: project.name } : null
                }
                disableProjectPicker
              />
            </div>

            {/* Conversations */}
            {conversations.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-muted text-[10px] font-semibold uppercase tracking-widest">
                    Conversations
                  </p>
                  {total !== undefined && (
                    <span className="text-muted text-[10px]">{total}</span>
                  )}
                </div>
                <div className="divide-y divide-border">
                  {conversations.map((conv) => (
                    <ProjectConversationRow
                      key={conv.id}
                      id={conv.id}
                      title={conv.title}
                      updatedAt={conv.updatedAt}
                      projectId={projectId}
                    />
                  ))}
                </div>
                {hasNextPage && (
                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="mt-4 w-full py-2 text-xs text-muted hover:text-body border border-border rounded-lg hover:bg-surface-elevated transition-colors disabled:opacity-50"
                  >
                    {isFetchingNextPage
                      ? 'Loading...'
                      : `Load more${total !== undefined ? ` (${total - conversations.length} remaining)` : ''}`}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right panel */}
          <div className="w-72 shrink-0 space-y-3 pt-14">
            {/* Instructions */}
            <div className="bg-surface-raised border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="text-heading text-sm font-medium">
                  Instructions
                </span>
                <button
                  onClick={openInstructionsEdit}
                  className="text-muted hover:text-accent transition-colors"
                  title={
                    project?.instructions
                      ? 'Edit instructions'
                      : 'Add instructions'
                  }
                >
                  {project?.instructions ? (
                    <FiEdit2 size={13} />
                  ) : (
                    <FiPlus size={14} />
                  )}
                </button>
              </div>
              <div className="px-4 py-3">
                {project?.instructions ? (
                  <p className="text-secondary text-xs leading-relaxed line-clamp-4">
                    {project.instructions}
                  </p>
                ) : (
                  <p className="text-muted text-xs">
                    Add instructions to tailor responses for this project.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit instructions panel */}
      {showEditInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-surface-raised border border-border rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-primary font-semibold text-sm">
                Project instructions
              </h2>
              <button
                onClick={() => setShowEditInstructions(false)}
                className="text-muted hover:text-body transition-colors"
              >
                <FiX size={16} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-secondary text-xs">
                These instructions are automatically added to every conversation
                in this project as a system prompt.
              </p>
              <textarea
                autoFocus
                value={editInstructions}
                onChange={(e) => setEditInstructions(e.target.value)}
                placeholder="e.g. Always respond in formal English. Focus on conciseness."
                rows={6}
                className="w-full px-4 py-3 rounded-xl bg-surface-dim border border-border text-primary placeholder-muted text-sm outline-none focus:border-accent/50 transition-colors resize-none"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditInstructions(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border text-body text-sm hover:bg-surface-elevated transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveInstructions}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-surface-dim text-sm font-medium hover:bg-accent-hover transition-colors"
                >
                  <FiCheck size={14} /> Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-surface-raised border border-border rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-primary font-semibold text-sm">
                Delete project
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
                Delete{' '}
                <span className="text-heading font-medium">
                  &ldquo;{project?.name}&rdquo;
                </span>
                ? Conversations will not be deleted.
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
    </div>
  );
};

const ProjectConversationRow: FC<{
  id: string;
  title: string | null;
  updatedAt: string;
  projectId: string;
}> = ({ id, title, updatedAt, projectId }) => {
  const router = useRouter();
  const [deleteConversation, { isLoading: isDeleting }] =
    useDeleteConversationMutation();
  const [updateTitle] = useUpdateConversationTitleMutation();

  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(title ?? '');
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
    setMenuPos({ x: rect.left - 192 - 6, y: rect.top });
  };

  const handleRenameCommit = async () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== title) {
      await updateTitle({ conversationId: id, title: trimmed });
    } else {
      setRenameValue(title ?? '');
    }
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleRenameCommit();
    if (e.key === 'Escape') {
      setRenameValue(title ?? '');
      setIsRenaming(false);
    }
  };

  const handleDelete = async () => {
    await deleteConversation(id).unwrap();
    setShowDeleteModal(false);
    router.refresh();
  };

  const displayName = title || 'Untitled';

  return (
    <>
      <div className="relative group flex items-center gap-2 py-3.5">
        {isRenaming ? (
          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            <input
              ref={renameInputRef}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleRenameCommit}
              onKeyDown={handleRenameKeyDown}
              maxLength={50}
              className="bg-transparent text-sm text-primary outline-none border-b border-accent/50 w-full"
            />
            {updatedAt && (
              <span className="text-xs text-subtle">
                Last message {getRelativeTime(updatedAt)}
              </span>
            )}
          </div>
        ) : (
          <Link
            href={`/chat/${id}`}
            className="flex-1 min-w-0 flex flex-col gap-0.5 pr-8"
          >
            <span className="text-sm text-body group-hover:text-heading transition-colors truncate">
              {displayName}
            </span>
            {updatedAt && (
              <span className="text-xs text-subtle group-hover:text-muted transition-colors">
                Last message {getRelativeTime(updatedAt)}
              </span>
            )}
          </Link>
        )}

        {!isRenaming && (
          <button
            ref={moreButtonRef}
            onClick={openMenu}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted hover:text-body hover:bg-surface-elevated transition-colors opacity-0 group-hover:opacity-100"
          >
            <FiMoreHorizontal size={15} />
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

const ProjectMenu: FC<{
  projectId: string;
  projectName: string;
  projectDescription: string;
  onDelete: () => void;
  onClose: () => void;
}> = ({ projectId, projectName, projectDescription, onDelete, onClose }) => {
  const [editName, setEditName] = useState(projectName);
  const [editDescription, setEditDescription] = useState(projectDescription);
  const [updateProject, { isLoading }] = useUpdateProjectMutation();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    await updateProject({
      projectId,
      name: editName.trim(),
      description: editDescription.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="absolute right-0 top-full mt-1 w-72 bg-surface-raised border border-border rounded-xl shadow-2xl z-30 overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="text-heading text-xs font-medium">Edit project</span>
        <button
          onClick={onClose}
          className="text-muted hover:text-body transition-colors"
        >
          <FiX size={14} />
        </button>
      </div>
      <form onSubmit={handleSave} className="px-4 py-3 space-y-3">
        <input
          autoFocus
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          placeholder="Project name"
          className="w-full px-3 py-2 text-xs bg-surface-dim border border-border rounded-lg text-primary placeholder-muted outline-none focus:border-accent/50"
        />
        <textarea
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          placeholder="Description (optional)"
          rows={2}
          className="w-full px-3 py-2 text-xs bg-surface-dim border border-border rounded-lg text-primary placeholder-muted outline-none focus:border-accent/50 resize-none"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!editName.trim() || isLoading}
            className="flex-1 py-1.5 rounded-lg bg-accent text-surface-dim text-xs font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 text-xs hover:bg-red-400/10 transition-colors"
          >
            <FiTrash2 size={12} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectDetailPage;
