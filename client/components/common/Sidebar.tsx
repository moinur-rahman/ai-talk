'use client';
import { FC } from 'react';
import { useGetConversationsQuery } from '@/services/chatApi';
import Link from 'next/link';
import { useChat } from '@/contexts/ChatContext';
import { FiPlus, FiMessageSquare } from 'react-icons/fi';

const Sidebar: FC = () => {
  const { conversationId } = useChat();
  const { data: conversations = [] } = useGetConversationsQuery();

  return (
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
        <Link
          href="/"
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg border border-[#1A2840] text-[#7A96AD] hover:text-[#00C4A1] hover:border-[#00C4A1]/30 hover:bg-[#00C4A1]/5 transition-all duration-200 text-sm"
        >
          <FiPlus size={14} />
          <span>New conversation</span>
        </Link>
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
      </div>
    </nav>
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
