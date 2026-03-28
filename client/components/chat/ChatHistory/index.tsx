'use client';
import { useEffect, useRef } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { useVoiceAgentContext } from '@/contexts/VoiceAgentContext';
import { useChatData } from './useChatData';
import { UserMessage, AssistantMessage } from './MessageComponents';
import { Message } from '@/types/chat';

const ChatHistory = () => {
  const {
    conversationId,
    streaming,
    reasoningStreaming,
    imageGenerating,
    webSearching,
  } = useChat();
  const { isAssistantSpeaking } = useVoiceAgentContext();
  const { chatHistories } = useChatData(conversationId ?? '');
  const bottomRef = useRef<HTMLDivElement>(null);

  const isStreaming =
    (conversationId && streaming[conversationId]) ||
    (conversationId && reasoningStreaming[conversationId]) ||
    isAssistantSpeaking;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistories.length, isStreaming]);

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
          const isLast = index === chatHistories.length - 1;
          switch (chat.senderType) {
            case 'user':
              return (
                <UserMessage
                  key={`user-${index}`}
                  mainContent={chat.mainContent}
                  attachments={chat.attachments}
                  inputType={chat.inputType}
                  audioDurationMs={chat.audioDurationMs}
                />
              );
            case 'assistant':
              return (
                <AssistantMessage
                  key={`assistant-${index}`}
                  mainContent={chat.mainContent}
                  reasoningContent={chat.reasoningContent}
                  attachments={chat.attachments}
                  generatedImage={chat.generatedImage}
                  isProcessing={reasoningStreaming[conversationId]}
                  isGeneratingImage={imageGenerating[conversationId] ?? false}
                  isSearching={webSearching[conversationId] ?? false}
                  isStreaming={
                    isLast &&
                    ((streaming[conversationId] ?? false) ||
                      isAssistantSpeaking)
                  }
                />
              );
            default:
              return null;
          }
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default ChatHistory;
