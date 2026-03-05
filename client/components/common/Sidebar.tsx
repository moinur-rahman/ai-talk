'use client';
import { FC, useEffect, useRef, useState } from 'react';
import { useGetConversationsInfiniteQuery } from '@/services/chatApi';
import Link from 'next/link';
import { useChat } from '@/contexts/ChatContext';
import { FiPlus, FiMessageSquare, FiSearch } from 'react-icons/fi';
import SearchModal from './SearchModal';

const Sidebar: FC = () => {
  const { conversationId } = useChat();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useGetConversationsInfiniteQuery();
  const [searchOpen, setSearchOpen] = useState(false);

  const conversations = data?.pages
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
      <nav className="w-60 h-screen flex flex-col bg-[#060810] border-r border-[#1A2840]">
        <div className="px-4 pt-5 pb-4 flex-shrink-0 border-b border-[#1A2840]">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-7 h-7 rounded-lg bg-[#00C4A1] flex items-center justify-center flex-shrink-0">
              <div className="w-3 h-3 rotate-45 rounded-sm border-2 border-[#060810]" />
            </div>
            <span className="text-[#D8E8F3] font-semibold text-sm tracking-wide">
              AI Talk
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <Link
              href="/"
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg border border-[#1A2840] text-[#7A96AD] hover:text-[#00C4A1] hover:border-[#00C4A1]/30 hover:bg-[#00C4A1]/5 transition-all duration-200 text-sm"
            >
              <FiPlus size={14} />
              <span>New conversation</span>
            </Link>
            <button
              onClick={() => setSearchOpen(true)}
              title="Search (⌘K)"
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg border border-[#1A2840] text-[#7A96AD] hover:text-[#00C4A1] hover:border-[#00C4A1]/30 hover:bg-[#00C4A1]/5 transition-all duration-200 text-sm"
            >
              <FiSearch size={14} />
              <span>Search</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          {conversations.length > 0 && (
            <p className="text-[#3D5570] text-[10px] font-semibold uppercase tracking-widest px-2 py-1.5 mb-1">
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
            <p className="text-[#3D5570] text-[10px] text-center py-2">
              Loading...
            </p>
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
        ? 'bg-[#0A1E2E] text-[#00C4A1] border-[#00C4A1]'
        : 'text-[#7A96AD] hover:bg-[#0E1822] hover:text-[#C8D8E4] border-transparent'
    }`}
  >
    <FiMessageSquare
      size={13}
      className={`flex-shrink-0 ${isSelected ? 'text-[#00C4A1]' : 'text-[#3D5570]'}`}
    />
    <span className="truncate">{name}</span>
  </Link>
);

export default Sidebar;
