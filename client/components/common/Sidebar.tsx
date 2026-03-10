'use client';
import { FC, useEffect, useRef, useState } from 'react';
import { useGetConversationsInfiniteQuery } from '@/services/chatApi';
import Link from 'next/link';
import { useChat } from '@/contexts/ChatContext';
import {
  FiPlus,
  FiMessageSquare,
  FiSearch,
  FiLogOut,
  FiChevronUp,
  FiShield,
} from 'react-icons/fi';
import SearchModal from './SearchModal';
import axiosInstance from '@/apis/axiosInstance';
import { url } from '@/utils/url';
import { useGetMeQuery } from '@/services/userApi';

const Sidebar: FC = () => {
  const { conversationId } = useChat();
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

  return (
    <>
      <nav className="w-60 h-screen flex flex-col bg-[#141826] border-r border-[#2e3d52]">
        <div className="px-4 pt-5 pb-4 flex-shrink-0 border-b border-[#2e3d52]">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-7 h-7 rounded-lg bg-[#00C4A1] flex items-center justify-center flex-shrink-0">
              <div className="w-3 h-3 rotate-45 rounded-sm border-2 border-[#141826]" />
            </div>
            <span className="text-[#e2ecf5] font-semibold text-sm tracking-wide">
              AI Talk
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <Link
              href="/"
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg border border-[#2e3d52] text-[#92adc4] hover:text-[#00C4A1] hover:border-[#00C4A1]/30 hover:bg-[#00C4A1]/5 transition-all duration-200 text-sm"
            >
              <FiPlus size={14} />
              <span>New conversation</span>
            </Link>
            <button
              onClick={() => setSearchOpen(true)}
              title="Search (⌘K)"
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg border border-[#2e3d52] text-[#92adc4] hover:text-[#00C4A1] hover:border-[#00C4A1]/30 hover:bg-[#00C4A1]/5 transition-all duration-200 text-sm"
            >
              <FiSearch size={14} />
              <span>Search</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          {conversations.length > 0 && (
            <p className="text-[#4e677e] text-[10px] font-semibold uppercase tracking-widest px-2 py-1.5 mb-1">
              Recent
            </p>
          )}
          {conversations.map((conversation) => (
            <SidebarItem
              key={conversation.id}
              name={conversation.title}
              id={conversation.id}
              isSelected={conversation.id === conversationId}
            />
          ))}
          <div ref={sentinelRef} className="h-1" />
          {isFetchingNextPage && (
            <p className="text-[#4e677e] text-[10px] text-center py-2">
              Loading...
            </p>
          )}
        </div>

        {/* User menu */}
        <div
          ref={menuRef}
          className="flex-shrink-0 px-3 py-3 border-t border-[#2e3d52] relative"
        >
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[#92adc4] hover:bg-[#1a2535] transition-all duration-200"
          >
            <div className="w-7 h-7 rounded-full bg-[#00C4A1]/20 border border-[#00C4A1]/30 flex items-center justify-center flex-shrink-0">
              <span className="text-[#00C4A1] text-[11px] font-semibold">
                {user?.name.charAt(0).toUpperCase() ?? '?'}
              </span>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-1.5">
                <p className="text-[#d5e6f0] text-xs font-medium truncate">
                  {user?.name ?? ''}
                </p>
                {user?.role === 'admin' && (
                  <span className="flex-shrink-0 px-1.5 py-0.5 rounded bg-[#00C4A1]/15 border border-[#00C4A1]/25 text-[#00C4A1] text-[9px] font-semibold uppercase tracking-wide">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-[#4e677e] text-[10px] truncate">
                {user?.email ?? ''}
              </p>
            </div>
            <FiChevronUp
              size={14}
              className={`flex-shrink-0 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {menuOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-1 bg-[#1a2535] border border-[#2e3d52] rounded-xl shadow-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#2e3d52]">
                <p className="text-[#d5e6f0] text-xs font-medium truncate">
                  {user?.name}
                </p>
                <p className="text-[#4e677e] text-[10px] truncate">
                  {user?.email}
                </p>
              </div>
              <div className="p-1">
                {user?.role === 'admin' && (
                  <Link
                    href="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[#92adc4] hover:text-[#00C4A1] hover:bg-[#00C4A1]/5 transition-all duration-200 text-sm"
                  >
                    <FiShield size={14} />
                    <span>Admin Panel</span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[#92adc4] hover:text-red-400 hover:bg-red-400/5 transition-all duration-200 text-sm disabled:opacity-50"
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

const SidebarItem: FC<{ name: string; id: string; isSelected?: boolean }> = ({
  name,
  id,
  isSelected = false,
}) => (
  <Link
    href={`/${id}`}
    className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg transition-all duration-150 text-sm mb-0.5 border-l-2 ${
      isSelected
        ? 'bg-[#1a2d42] text-[#00C4A1] border-[#00C4A1]'
        : 'text-[#92adc4] hover:bg-[#222b3d] hover:text-[#d5e6f0] border-transparent'
    }`}
  >
    <FiMessageSquare
      size={13}
      className={`flex-shrink-0 ${isSelected ? 'text-[#00C4A1]' : 'text-[#4e677e]'}`}
    />
    <span className="truncate">{name}</span>
  </Link>
);

export default Sidebar;
