'use client';
import { useChat } from '@/contexts/ChatContext';
import { useChatData } from './useChatData';
import { UserMessage, AssistantMessage } from './MessageComponents';
import { Message } from '@/types/chat';

const ChatHistory = () => {
  const { conversationId, reasoningStreaming } = useChat();
  const { chatHistories } = useChatData(conversationId ?? '');

  if (!conversationId) {
    return (
      <div className="h-full w-full overflow-y-auto px-4 flex flex-col items-center">
        <div className="w-full max-w-[52rem] flex flex-col space-y-6 py-6">
          <div className="text-center text-muted text-sm">
            No conversation selected
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto px-4 flex flex-col items-center">
      <div className="w-full max-w-[52rem] flex flex-col space-y-6 py-6">
        {chatHistories.map((chat: Message, index: number) => {
          switch (chat.senderType) {
            case 'user':
              return (
                <UserMessage
                  key={`user-${index}`}
                  mainContent={chat.mainContent}
                  attachments={chat.attachments}
                />
              );
            case 'assistant':
              return (
                <AssistantMessage
                  key={`assistant-${index}`}
                  mainContent={chat.mainContent}
                  reasoningContent={chat.reasoningContent}
                  attachments={chat.attachments}
                  isProcessing={reasoningStreaming[conversationId]}
                />
              );
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
};

export default ChatHistory;
