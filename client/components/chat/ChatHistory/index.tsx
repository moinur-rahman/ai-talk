"use client";
import { useChat } from "@/contexts/ChatContext";
import { useChatData } from "./useChatData";
import { UserMessage, AssistantMessage } from "./MessageComponents";
import { Message } from "@/types/chat";

const ChatHistory = () => {
  const { conversationId, reasoningStreaming } = useChat();

  if (!conversationId) {
    return (
      <div className="h-full w-full overflow-y-auto px-4 flex flex-col items-center font-poppins">
        <div className="w-full max-w-[55rem] flex flex-col space-y-4 py-4">
          <div className="text-center text-gray-400">
            No conversation selected
          </div>
        </div>
      </div>
    );
  }

  const { chatHistories } = useChatData(conversationId);

  return (
    <div className="h-full w-full overflow-y-auto px-4 flex flex-col items-center font-poppins">
      <div className="w-full max-w-[55rem] flex flex-col space-y-4 py-4">
        {chatHistories.map((chat: Message, index: number) => {
          switch (chat.senderType) {
            case "user":
              return (
                <UserMessage
                  key={`user-${index}`}
                  mainContent={chat.mainContent}
                  attachments={chat.attachments}
                />
              );
            case "assistant":
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
