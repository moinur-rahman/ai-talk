'use client';

import { FC, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiArrowLeft,
  FiPlus,
  FiMessageSquare,
  FiFileText,
  FiEdit2,
  FiTrash2,
  FiX,
  FiCheck,
} from 'react-icons/fi';
import {
  useGetProjectQuery,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
} from '@/services/projectApi';
import { useGetProjectConversationsQuery } from '@/services/chatApi';
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
  const { data: conversationsPage } =
    useGetProjectConversationsQuery(projectId);
  const [updateProject] = useUpdateProjectMutation();
  const [deleteProject, { isLoading: isDeleting }] = useDeleteProjectMutation();

  const [showEditInstructions, setShowEditInstructions] = useState(false);
  const [editInstructions, setEditInstructions] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);

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

  const conversations = conversationsPage?.conversations ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-[#4e677e] text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Back link */}
      <div className="px-8 pt-6 pb-2">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-[#4e677e] hover:text-[#92adc4] text-sm transition-colors"
        >
          <FiArrowLeft size={14} />
          All projects
        </Link>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main content */}
        <div className="flex-1 overflow-y-auto px-8 py-4">
          {/* Project header */}
          <div className="flex items-start justify-between gap-4 mb-8">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold text-[#e2ecf5] mb-2">
                {project?.name}
              </h1>
              {project?.description && (
                <p className="text-[#627a8e] text-sm leading-relaxed max-w-xl">
                  {project.description}
                </p>
              )}
            </div>
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowProjectMenu((v) => !v)}
                className="p-2 rounded-lg text-[#4e677e] hover:text-[#92adc4] hover:bg-[#222b3d] transition-colors"
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
          <div className="mb-8">
            <SendMessage />
          </div>

          {/* Conversations */}
          {conversations.length === 0 ? (
            <p className="text-[#4e677e] text-sm">
              No conversations yet. Start one above.
            </p>
          ) : (
            <div className="max-w-xl">
              <p className="text-[#4e677e] text-[10px] font-semibold uppercase tracking-widest mb-3">
                Conversations
              </p>
              <div className="divide-y divide-[#2e3d52]">
                {conversations.map((conv) => (
                  <Link
                    key={conv.id}
                    href={`/${conv.id}`}
                    className="flex items-center gap-3 py-3 text-[#92adc4] hover:text-[#d5e6f0] transition-colors group"
                  >
                    <FiMessageSquare
                      size={14}
                      className="flex-shrink-0 text-[#4e677e] group-hover:text-[#627a8e]"
                    />
                    <span className="text-sm truncate">{conv.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="w-72 flex-shrink-0 border-l border-[#2e3d52] px-5 py-6 space-y-4 overflow-y-auto">
          {/* Instructions */}
          <div className="bg-[#1a2535] border border-[#2e3d52] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2e3d52]">
              <span className="text-[#d5e6f0] text-sm font-medium">
                Instructions
              </span>
              <button
                onClick={openInstructionsEdit}
                className="text-[#4e677e] hover:text-[#00C4A1] transition-colors"
              >
                <FiPlus size={14} />
              </button>
            </div>
            <div className="px-4 py-3">
              {project?.instructions ? (
                <p className="text-[#627a8e] text-xs leading-relaxed line-clamp-4">
                  {project.instructions}
                </p>
              ) : (
                <p className="text-[#4e677e] text-xs">
                  Add instructions to tailor responses for this project.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit instructions panel */}
      {showEditInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#1a2535] border border-[#2e3d52] rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#2e3d52] flex items-center justify-between">
              <h2 className="text-[#e2ecf5] font-semibold text-sm">
                Project instructions
              </h2>
              <button
                onClick={() => setShowEditInstructions(false)}
                className="text-[#4e677e] hover:text-[#92adc4] transition-colors"
              >
                <FiX size={16} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-[#627a8e] text-xs">
                These instructions are automatically added to every conversation
                in this project as a system prompt.
              </p>
              <textarea
                autoFocus
                value={editInstructions}
                onChange={(e) => setEditInstructions(e.target.value)}
                placeholder="e.g. Always respond in formal English. Focus on conciseness."
                rows={6}
                className="w-full px-4 py-3 rounded-xl bg-[#141826] border border-[#2e3d52] text-[#e2ecf5] placeholder-[#4e677e] text-sm outline-none focus:border-[#00C4A1]/50 transition-colors resize-none"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditInstructions(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#2e3d52] text-[#92adc4] text-sm hover:bg-[#222b3d] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveInstructions}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#00C4A1] text-[#141826] text-sm font-medium hover:bg-[#00E5C0] transition-colors"
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
          <div className="w-full max-w-sm bg-[#1a2535] border border-[#2e3d52] rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#2e3d52] flex items-center justify-between">
              <h3 className="text-[#e2ecf5] font-semibold text-sm">
                Delete project
              </h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-[#4e677e] hover:text-[#92adc4] transition-colors"
              >
                <FiX size={16} />
              </button>
            </div>
            <div className="px-5 py-4">
              <p className="text-[#92adc4] text-sm">
                Delete{' '}
                <span className="text-[#d5e6f0] font-medium">
                  &ldquo;{project?.name}&rdquo;
                </span>
                ? Conversations will not be deleted.
              </p>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-[#2e3d52] text-[#92adc4] hover:bg-[#222b3d] text-sm transition-colors"
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
    <div className="absolute right-0 top-full mt-1 w-72 bg-[#1a2535] border border-[#2e3d52] rounded-xl shadow-2xl z-30 overflow-hidden">
      <div className="px-4 py-3 border-b border-[#2e3d52] flex items-center justify-between">
        <span className="text-[#d5e6f0] text-xs font-medium">
          Edit project
        </span>
        <button
          onClick={onClose}
          className="text-[#4e677e] hover:text-[#92adc4] transition-colors"
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
          className="w-full px-3 py-2 text-xs bg-[#141826] border border-[#2e3d52] rounded-lg text-[#e2ecf5] placeholder-[#4e677e] outline-none focus:border-[#00C4A1]/50"
        />
        <textarea
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          placeholder="Description (optional)"
          rows={2}
          className="w-full px-3 py-2 text-xs bg-[#141826] border border-[#2e3d52] rounded-lg text-[#e2ecf5] placeholder-[#4e677e] outline-none focus:border-[#00C4A1]/50 resize-none"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!editName.trim() || isLoading}
            className="flex-1 py-1.5 rounded-lg bg-[#00C4A1] text-[#141826] text-xs font-medium hover:bg-[#00E5C0] transition-colors disabled:opacity-50"
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
