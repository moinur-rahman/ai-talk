'use client';

import { FC, useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { FiPlus, FiX, FiFolder, FiSearch, FiChevronDown, FiCheck } from 'react-icons/fi';
import {
  useGetProjectsQuery,
  useCreateProjectMutation,
} from '@/services/projectApi';
import type { Project } from '@/types/chat';

type SortOption = 'recent' | 'edited' | 'created';

const SORT_LABELS: Record<SortOption, string> = {
  recent: 'Recent activity',
  edited: 'Last edited',
  created: 'Date created',
};

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

const ProjectsPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('recent');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: projects, isLoading } = useGetProjectsQuery({
    search: debouncedSearch || undefined,
    sort,
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
    };
    if (showSortMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSortMenu]);

  return (
    <div className="min-h-screen px-8 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-primary">Projects</h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-body hover:text-accent hover:border-accent/30 hover:bg-accent/5 transition-all duration-200 text-sm"
          >
            <FiPlus size={14} />
            New project
          </button>
        </div>

        {/* Search */}
        {!isLoading && (
          <div className="relative mb-5">
            <FiSearch
              size={14}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-raised border border-border text-primary placeholder-muted text-sm outline-none focus:border-border-strong transition-colors"
            />
          </div>
        )}

        {/* Sort */}
        {!isLoading && (projects?.length ?? 0) > 0 && (
          <div className="flex justify-end mb-4">
            <div ref={sortRef} className="relative">
              <button
                onClick={() => setShowSortMenu((v) => !v)}
                className="flex items-center gap-1.5 text-secondary hover:text-body text-xs transition-colors"
              >
                Sort by
                <span className="text-body font-medium">
                  {SORT_LABELS[sort]}
                </span>
                <FiChevronDown
                  size={12}
                  className={`transition-transform ${showSortMenu ? 'rotate-180' : ''}`}
                />
              </button>
              {showSortMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-44 bg-surface-raised border border-border rounded-xl shadow-xl overflow-hidden z-20">
                  {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => {
                        setSort(key);
                        setShowSortMenu(false);
                      }}
                      className="flex items-center justify-between w-full px-4 py-2.5 text-xs text-body hover:bg-surface-elevated hover:text-heading transition-colors"
                    >
                      {SORT_LABELS[key]}
                      {sort === key && (
                        <FiCheck size={12} className="text-accent" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <p className="text-muted text-sm">Loading projects...</p>
          </div>
        ) : !projects || projects.length === 0 ? (
          debouncedSearch ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-muted text-sm">
                No projects match &ldquo;{debouncedSearch}&rdquo;
              </p>
            </div>
          ) : (
            <EmptyState onNew={() => setShowModal(true)} />
          )
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>

      {showModal && <CreateProjectModal onClose={() => setShowModal(false)} />}
    </div>
  );
};

const ProjectCard: FC<{ project: Project }> = ({ project }) => (
  <Link
    href={`/projects/${project.id}`}
    className="group block p-5 rounded-2xl bg-surface-raised border border-border hover:border-border-strong hover:bg-[#1f2e42] transition-all duration-200"
  >
    <h3 className="text-primary font-semibold text-sm mb-2 group-hover:text-accent transition-colors">
      {project.name}
    </h3>
    {project.description && (
      <p className="text-secondary text-xs leading-relaxed line-clamp-2 mb-4">
        {project.description}
      </p>
    )}
    {!project.description && <div className="mb-4" />}
    <p className="text-muted text-[11px]">
      Updated {getRelativeTime(project.updatedAt)}
    </p>
  </Link>
);

const EmptyState = ({ onNew }: { onNew: () => void }) => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <div className="w-14 h-14 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center mb-5">
      <FiFolder size={22} className="text-muted" />
    </div>
    <h2 className="text-heading font-semibold text-base mb-2">
      No projects yet
    </h2>
    <p className="text-muted text-sm mb-6 max-w-xs">
      Organise your conversations into projects and add custom instructions for
      each.
    </p>
    <button
      onClick={onNew}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-surface-dim text-sm font-medium hover:bg-accent-hover transition-colors"
    >
      <FiPlus size={14} />
      New project
    </button>
  </div>
);

const CreateProjectModal = ({ onClose }: { onClose: () => void }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [createProject, { isLoading }] = useCreateProjectMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await createProject({
      name: name.trim(),
      description: description.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-surface-raised border border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <h2 className="text-primary font-semibold">
            Create a personal project
          </h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-body transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-body text-xs font-medium mb-2">
              What are you working on?
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name your project"
              className="w-full px-4 py-3 rounded-xl bg-surface-dim border border-border text-primary placeholder-muted text-sm outline-none focus:border-accent/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-body text-xs font-medium mb-2">
              What are you trying to achieve?
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your project, goals, subject, etc..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-surface-dim border border-border text-primary placeholder-muted text-sm outline-none focus:border-accent/50 transition-colors resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-border text-body text-sm hover:bg-surface-elevated transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isLoading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-surface-dim text-sm font-medium hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating...' : 'Create project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectsPage;
