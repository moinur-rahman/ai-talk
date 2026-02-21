"use client";
import { FC } from "react";
import { useGetConversationsQuery } from "@/services/chatApi";
import Link from "next/link";
import { useChat } from "@/contexts/ChatContext";

const Sidebar: FC = () => {
  const { conversationId } = useChat();

  const { data: conversations = [] } = useGetConversationsQuery();

  return (
    <nav className="w-64 h-screen bg-gray-800 text-white flex flex-col">
      <div className="p-4 flex-shrink-0">
        <Link
          href="/"
          className="bg-gray-700 text-white py-2 px-4 rounded-md hover:bg-gray-600 text-center block"
        >
          New Chat
        </Link>
      </div>
      <div className="flex flex-col space-y-4 overflow-y-auto flex-grow px-4 pb-4 scrollbar scrollbar-thumb-gray-600 scrollbar-track-gray-800 scrollbar-w-2">
        {conversations.map((conversation) => {
          return (
            <SidebarItem
              key={conversation.id}
              name={conversation.title}
              id={conversation.id}
              isSelected={conversation.id === conversationId}
            />
          );
        })}
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
    className={`py-2 px-4 cursor-pointer rounded-md transition-colors duration-200 ${
      isSelected
        ? "bg-gray-600 border-l-4 border-gray-400 font-medium"
        : "hover:bg-gray-700"
    }`}
  >
    {name}
  </Link>
);

export default Sidebar;
