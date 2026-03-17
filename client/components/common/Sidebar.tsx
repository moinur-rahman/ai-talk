'use client';
import { FC, useEffect, useRef, useState } from 'react';
import {
  useGetConversationsInfiniteQuery,
  useDeleteConversationMutation,
} from '@/services/chatApi';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useChat } from '@/contexts/ChatContext';
import {
  FiPlus,
  FiMessageSquare,
  FiSearch,
  FiLogOut,
  FiChevronUp,
  FiShield,
  FiTrash2,
  FiX,
  FiSettings,
  FiFolder,
} from 'react-icons/fi';
import SearchModal from './SearchModal';
import axiosInstance from '@/apis/axiosInstance';
import { url } from '@/utils/url';
import { useGetMeQuery } from '@/services/userApi';

const Sidebar: FC = () => {
  const { conversationId } = useChat();
  const pathname = usePathname();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useGetConversationsInfiniteQuery();
  const { data: user } = useGetMeQuery();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    setLoggingOut(true);
    await axiosInstance.post('/auth/logout').catch(() => {});
    window.location.href = url.login;
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const conversations =
    data?.pages
      .flatMap((page) => page.conversations)
      .filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i) ?? [];
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const isOnProjects = pathname.startsWith('/projects');

  return (
    <>
      <nav className="w-60 h-screen flex flex-col bg-surface-dim border-r border-border">
        <div className="px-4 pt-5 pb-4 flex-shrink-0 border-b border-border">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
              <div className="w-3 h-3 rotate-45 rounded-sm border-2 border-surface-dim" />
            </div>
            <span className="text-primary font-semibold text-sm tracking-wide">
              AI Talk
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <Link
              href="/new"
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg border border-border text-body hover:text-accent hover:border-accent/30 hover:bg-accent/5 transition-all duration-200 text-sm"
            >
              <FiPlus size={14} />
              <span>New conversation</span>
            </Link>
            <Link
              href="/projects"
              className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg border transition-all duration-200 text-sm ${
                isOnProjects
                  ? 'border-accent/30 bg-accent/5 text-accent'
                  : 'border-border text-body hover:text-accent hover:border-accent/30 hover:bg-accent/5'
              }`}
            >
              <FiFolder size={14} />
              <span>Projects</span>
            </Link>
            <button
              onClick={() => setSearchOpen(true)}
              title="Search (⌘K)"
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg border border-border text-body hover:text-accent hover:border-accent/30 hover:bg-accent/5 transition-all duration-200 text-sm"
            >
              <FiSearch size={14} />
              <span>Search</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          {conversations.length > 0 && (
            <p className="text-muted text-[10px] font-semibold uppercase tracking-widest px-2 py-1.5 mb-1">
              Recent
            </p>
          )}
          {conversations.map((conversation) => (
            <SidebarItem
              key={conversation.id}
              name={conversation.title}
              id={conversation.id}
              isSelected={conversation.id === conversationId}
              isProjectConversation={!!conversation.projectId}
            />
          ))}
          <div ref={sentinelRef} className="h-1" />
          {isFetchingNextPage && (
            <p className="text-muted text-[10px] text-center py-2">
              Loading...
            </p>
          )}
        </div>

        {/* User menu */}
        <div
          ref={menuRef}
          className="flex-shrink-0 px-3 py-3 border-t border-border relative"
        >
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-body hover:bg-surface-raised transition-all duration-200"
          >
            <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center flex-shrink-0">
              <span className="text-accent text-[11px] font-semibold">
                {user?.name.charAt(0).toUpperCase() ?? '?'}
              </span>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-1.5">
                <p className="text-heading text-xs font-medium truncate">
                  {user?.name ?? ''}
                </p>
                {user?.role === 'admin' && (
                  <span className="flex-shrink-0 px-1.5 py-0.5 rounded bg-accent/15 border border-accent/25 text-accent text-[9px] font-semibold uppercase tracking-wide">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-muted text-[10px] truncate">
                {user?.email ?? ''}
              </p>
            </div>
            <FiChevronUp
              size={14}
              className={`flex-shrink-0 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {menuOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-1 bg-surface-raised border border-border rounded-xl shadow-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-heading text-xs font-medium truncate">
                  {user?.name}
                </p>
                <p className="text-muted text-[10px] truncate">{user?.email}</p>
              </div>
              <div className="p-1">
                {user?.role === 'admin' && (
                  <Link
                    href="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-body hover:text-accent hover:bg-accent/5 transition-all duration-200 text-sm"
                  >
                    <FiShield size={14} />
                    <span>Admin Panel</span>
                  </Link>
                )}
                <Link
                  href="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-body hover:text-accent hover:bg-accent/5 transition-all duration-200 text-sm"
                >
                  <FiSettings size={14} />
                  <span>Settings</span>
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-body hover:text-red-400 hover:bg-red-400/5 transition-all duration-200 text-sm disabled:opacity-50"
                >
                  <FiLogOut size={14} />
                  <span>{loggingOut ? 'Logging out...' : 'Log out'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
};

const SidebarItem: FC<{
  name: string;
  id: string;
  isSelected?: boolean;
  isProjectConversation?: boolean;
}> = ({ name, id, isSelected = false, isProjectConversation = false }) => {
  const router = useRouter();
  const [deleteConversation, { isLoading }] = useDeleteConversationMutation();
  const [showModal, setShowModal] = useState(false);

  const handleDelete = async () => {
    await deleteConversation(id).unwrap();
    setShowModal(false);
    if (isSelected) router.push('/new');
  };

  return (
    <>
      <div className="relative group mb-0.5">
        <Link
          href={`/chat/${id}`}
          className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg transition-all duration-150 text-sm border-l-2 pr-8 ${
            isSelected
              ? 'bg-selected text-accent border-accent'
              : 'text-body hover:bg-surface-elevated hover:text-heading border-transparent'
          }`}
        >
          {isProjectConversation ? (
            <FiFolder
              size={13}
              className={`flex-shrink-0 ${isSelected ? 'text-accent' : 'text-muted'}`}
            />
          ) : (
            <FiMessageSquare
              size={13}
              className={`flex-shrink-0 ${isSelected ? 'text-accent' : 'text-muted'}`}
            />
          )}
          <span className="truncate">{name}</span>
        </Link>

        <button
          onClick={(e) => {
            e.preventDefault();
            setShowModal(true);
          }}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100"
        >
          <FiTrash2 size={14} />
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm bg-surface-raised border border-border rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-primary font-semibold text-sm">
                Delete conversation
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
                Are you sure you want to delete{' '}
                <span className="text-heading font-medium">
                  &ldquo;{name}&rdquo;
                </span>
                ? This cannot be undone.
              </p>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-border text-body hover:bg-surface-elevated text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium text-sm transition-colors disabled:opacity-60"
                >
                  {isLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
