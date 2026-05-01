'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
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
  const [switchToMessageId, setSwitchToMessageId] = useState<
    string | undefined
  >();
  const { chatHistories } = useChatData(
    conversationId ?? '',
    switchToMessageId,
  );
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSwitchToMessageId(undefined);
  }, [conversationId]);

  const isStreaming =
    (conversationId && streaming[conversationId]) ||
    (conversationId && reasoningStreaming[conversationId]) ||
    isAssistantSpeaking;

  const handleNavigate = useCallback((messageId: string) => {
    setSwitchToMessageId(messageId);
  }, []);

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
          const key = chat.id ?? `msg-${index}`;
          switch (chat.senderType) {
            case 'user':
              return (
                <UserMessage
                  key={key}
                  mainContent={chat.mainContent}
                  attachments={chat.attachments}
                  inputType={chat.inputType}
                  audioDurationMs={chat.audioDurationMs}
                  messageId={chat.id}
                  siblingIds={chat.siblingIds}
                  onNavigate={handleNavigate}
                />
              );
            case 'assistant':
              return (
                <AssistantMessage
                  key={key}
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
                  messageId={chat.id}
                  siblingIds={chat.siblingIds}
                  onNavigate={handleNavigate}
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
