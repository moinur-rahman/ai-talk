'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FiChevronDown } from 'react-icons/fi';
import ChatHistory from '@/components/chat/ChatHistory';
import SendMessage from '@/components/chat/SendMessage';
import { useGetChatHistoryQuery } from '@/services/chatApi';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

const Chat = () => {
  const { conversationId } = useParams<{ conversationId: string }>();

  const newConversationId = useSelector(
    (state: RootState) => state.chat.newConversationId,
  );
  const newConversationTitle = useSelector(
    (state: RootState) => state.chat.newConversationTitle,
  );
  const newConversationProject = useSelector(
    (state: RootState) => state.chat.newConversationProject,
  );
  const isNew = newConversationId === conversationId;

  const { data, isLoading } = useGetChatHistoryQuery(conversationId, {
    skip: isNew,
  });
  const project = isNew ? newConversationProject : (data?.project ?? null);
  const title = isNew ? newConversationTitle : (data?.title ?? null);

  return (
    <main className="flex-1 flex flex-col h-full relative">
      <div className="absolute inset-0 flex flex-col">
        <div className="flex-shrink-0 flex items-center px-5 py-3 border-b border-border bg-surface">
          <div className="flex items-center gap-1.5 min-w-0">
            {project && (
              <>
                <Link
                  href={`/projects/${project.id}`}
                  className="text-sm font-medium text-muted hover:text-body transition-colors truncate flex-shrink-0"
                >
                  {project.name}
                </Link>
                <span className="text-muted text-sm flex-shrink-0">/</span>
              </>
            )}
            <button className="flex items-center gap-1 min-w-0 group">
              {isLoading && !isNew ? (
                <span className="h-3.5 w-32 bg-border rounded animate-pulse inline-block" />
              ) : (
                <span className="text-sm font-medium text-body truncate">
                  {title ?? 'New conversation'}
                </span>
              )}
              <FiChevronDown
                size={14}
                className="text-muted group-hover:text-body transition-colors flex-shrink-0"
              />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <ChatHistory />
        </div>
        <div className="w-full bg-surface px-4 pb-4 pt-2 flex justify-center">
          <SendMessage currentProject={data?.project ?? null} />
        </div>
      </div>
    </main>
  );
};

export default Chat;
