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
          <h1 className="text-2xl font-semibold text-[#e2ecf5]">Projects</h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#2e3d52] text-[#92adc4] hover:text-[#00C4A1] hover:border-[#00C4A1]/30 hover:bg-[#00C4A1]/5 transition-all duration-200 text-sm"
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
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4e677e] pointer-events-none"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1a2535] border border-[#2e3d52] text-[#e2ecf5] placeholder-[#4e677e] text-sm outline-none focus:border-[#3a4f68] transition-colors"
            />
          </div>
        )}

        {/* Sort */}
        {!isLoading && (projects?.length ?? 0) > 0 && (
          <div className="flex justify-end mb-4">
            <div ref={sortRef} className="relative">
              <button
                onClick={() => setShowSortMenu((v) => !v)}
                className="flex items-center gap-1.5 text-[#627a8e] hover:text-[#92adc4] text-xs transition-colors"
              >
                Sort by
                <span className="text-[#92adc4] font-medium">
                  {SORT_LABELS[sort]}
                </span>
                <FiChevronDown
                  size={12}
                  className={`transition-transform ${showSortMenu ? 'rotate-180' : ''}`}
                />
              </button>
              {showSortMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-44 bg-[#1a2535] border border-[#2e3d52] rounded-xl shadow-xl overflow-hidden z-20">
                  {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => {
                        setSort(key);
                        setShowSortMenu(false);
                      }}
                      className="flex items-center justify-between w-full px-4 py-2.5 text-xs text-[#92adc4] hover:bg-[#222b3d] hover:text-[#d5e6f0] transition-colors"
                    >
                      {SORT_LABELS[key]}
                      {sort === key && (
                        <FiCheck size={12} className="text-[#00C4A1]" />
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
            <p className="text-[#4e677e] text-sm">Loading projects...</p>
          </div>
        ) : !projects || projects.length === 0 ? (
          debouncedSearch ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-[#4e677e] text-sm">
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
    className="group block p-5 rounded-2xl bg-[#1a2535] border border-[#2e3d52] hover:border-[#3a4f68] hover:bg-[#1f2e42] transition-all duration-200"
  >
    <h3 className="text-[#e2ecf5] font-semibold text-sm mb-2 group-hover:text-[#00C4A1] transition-colors">
      {project.name}
    </h3>
    {project.description && (
      <p className="text-[#627a8e] text-xs leading-relaxed line-clamp-2 mb-4">
        {project.description}
      </p>
    )}
    {!project.description && <div className="mb-4" />}
    <p className="text-[#4e677e] text-[11px]">
      Updated {getRelativeTime(project.updatedAt)}
    </p>
  </Link>
);

const EmptyState = ({ onNew }: { onNew: () => void }) => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <div className="w-14 h-14 rounded-2xl bg-[#222b3d] border border-[#2e3d52] flex items-center justify-center mb-5">
      <FiFolder size={22} className="text-[#4e677e]" />
    </div>
    <h2 className="text-[#d5e6f0] font-semibold text-base mb-2">
      No projects yet
    </h2>
    <p className="text-[#4e677e] text-sm mb-6 max-w-xs">
      Organise your conversations into projects and add custom instructions for
      each.
    </p>
    <button
      onClick={onNew}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00C4A1] text-[#141826] text-sm font-medium hover:bg-[#00E5C0] transition-colors"
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
      <div className="w-full max-w-md bg-[#1a2535] border border-[#2e3d52] rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-[#2e3d52] flex items-center justify-between">
          <h2 className="text-[#e2ecf5] font-semibold">
            Create a personal project
          </h2>
          <button
            onClick={onClose}
            className="text-[#4e677e] hover:text-[#92adc4] transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-[#92adc4] text-xs font-medium mb-2">
              What are you working on?
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name your project"
              className="w-full px-4 py-3 rounded-xl bg-[#141826] border border-[#2e3d52] text-[#e2ecf5] placeholder-[#4e677e] text-sm outline-none focus:border-[#00C4A1]/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[#92adc4] text-xs font-medium mb-2">
              What are you trying to achieve?
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your project, goals, subject, etc..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-[#141826] border border-[#2e3d52] text-[#e2ecf5] placeholder-[#4e677e] text-sm outline-none focus:border-[#00C4A1]/50 transition-colors resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-[#2e3d52] text-[#92adc4] text-sm hover:bg-[#222b3d] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isLoading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#e2ecf5] text-[#141826] text-sm font-medium hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
