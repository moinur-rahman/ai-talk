import { type FC, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiArrowLeft, FiEdit2, FiFolder, FiTrash2, FiX } from 'react-icons/fi';
import { toast } from 'sonner';
import { useUpdateConversationProjectMutation } from '@/services/chatApi';
import { useGetProjectsQuery } from '@/services/projectApi';

type MenuView = 'main' | 'projects';

export interface ContextMenuProps {
  pos: { x: number; y: number };
  conversationId: string;
  projectId: string | null;
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
}

const ConversationContextMenu: FC<ContextMenuProps> = ({
  pos,
  conversationId,
  projectId,
  onClose,
  onRename,
  onDelete,
}) => {
  const [view, setView] = useState<MenuView>('main');
  const [updateProject] = useUpdateConversationProjectMutation();
  const { data: projects } = useGetProjectsQuery();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [onClose]);

  const menuWidth = 192; // w-48
  const adjustedX = Math.min(pos.x, window.innerWidth - menuWidth - 8);

  const handleProjectSelect = async (newProjectId: string | null) => {
    const result = await updateProject({
      conversationId,
      projectId: newProjectId,
    });
    if ('error' in result) {
      toast.error('Failed to update project');
    } else if (newProjectId === null) {
      toast.success('Removed from project');
    } else {
      const project = projects?.find((p) => p.id === newProjectId);
      toast.success(`Added to ${project?.name ?? 'project'}`);
    }
    onClose();
  };

  const content =
    view === 'projects' ? (
      <div>
        <button
          onClick={() => setView('main')}
          className="flex items-center gap-2 w-full px-3 py-2 text-xs text-muted hover:text-body transition-colors border-b border-border mb-1"
        >
          <FiArrowLeft size={12} />
          Back
        </button>
        <div className="max-h-48 overflow-y-auto">
          {projects && projects.length > 0 ? (
            projects.map((p) => (
              <button
                key={p.id}
                onClick={() => handleProjectSelect(p.id)}
                className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs transition-colors ${
                  p.id === projectId
                    ? 'text-accent bg-accent/5'
                    : 'text-body hover:bg-surface-elevated'
                }`}
              >
                <FiFolder size={12} className="shrink-0" />
                <span className="truncate">{p.name}</span>
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-xs text-muted">No projects yet</p>
          )}
        </div>
      </div>
    ) : (
      <div>
        <button
          onClick={() => {
            onClose();
            onRename();
          }}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs text-body hover:bg-surface-elevated transition-colors"
        >
          <FiEdit2 size={13} />
          Rename
        </button>

        {projectId ? (
          <>
            <button
              onClick={() => setView('projects')}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs text-body hover:bg-surface-elevated transition-colors"
            >
              <FiFolder size={13} />
              Change project
            </button>
            <button
              onClick={() => handleProjectSelect(null)}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs text-body hover:bg-surface-elevated transition-colors"
            >
              <FiX size={13} />
              Remove from project
            </button>
          </>
        ) : (
          <button
            onClick={() => setView('projects')}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs text-body hover:bg-surface-elevated transition-colors"
          >
            <FiFolder size={13} />
            Add to project
          </button>
        )}

        <div className="my-1 border-t border-border" />

        <button
          onClick={() => {
            onClose();
            onDelete();
          }}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-400/10 transition-colors"
        >
          <FiTrash2 size={13} />
          Delete
        </button>
      </div>
    );

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[200] w-48 bg-surface-raised border border-border rounded-xl shadow-2xl p-1"
      style={{ left: adjustedX, top: pos.y }}
    >
      {content}
    </div>,
    document.body,
  );
};

export default ConversationContextMenu;
