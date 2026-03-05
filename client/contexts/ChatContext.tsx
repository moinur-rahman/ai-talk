'use client';
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from 'react';
import { Socket } from 'socket.io-client';
import { providerConnection } from '@/apis/socket';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateLastMessage,
  addMessage,
  setNewConversationId,
  removeConversation,
} from '@/redux/slices/chatSlice';
import { chatApi } from '@/services/chatApi';
import { AppDispatch, RootState } from '@/redux/store';
import { createConversation } from '@/services/createConversation';
import { useParams } from 'next/navigation';
import { FileMetadata } from '@/types/chat';

interface ISendMessageParams {
  prompt: string;
  attachments?: FileMetadata[];
}

interface IChatContext {
  providerConnection: Socket | null;
  streaming: Record<string, boolean>;
  reasoningStreaming: Record<string, boolean>;
  error: Record<string, string | null>;
  setError: (
    error: React.SetStateAction<Record<string, string | null>>,
  ) => void;
  sendMessage: (params: ISendMessageParams) => Promise<string | undefined>;
  stopStream: () => void;
  conversationId: string | undefined;
}

const ChatContext = createContext<IChatContext | null>(null);

export const useChat = () => {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }

  return context;
};

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const {
    conversationId,
  }: {
    conversationId: string | undefined;
  } = useParams();
  const [streaming, setStreaming] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<Record<string, string | null>>({});
  const [roomJoined, setRoomJoined] = useState<Record<string, boolean>>({});
  const previousConversationIdRef = useRef<string | undefined>(undefined);
  const pendingCleanupRef = useRef<Set<string>>(new Set());
  const [reasoningStreaming, setReasoningStreaming] = useState<
    Record<string, boolean>
  >({});
  const dispatch = useDispatch<AppDispatch>();

  const newConversationId = useSelector(
    (state: RootState) => state.chat.newConversationId,
  );

  const selectedModel = useSelector(
    (state: RootState) => state.model.selectedModel,
  );

  const reasoningEnabled = useSelector(
    (state: RootState) => state.model.reasoningEnabled,
  );

  useEffect(() => {
    providerConnection.connect();

    return () => {
      providerConnection.disconnect();
    };
  }, []);

  useEffect(() => {
    if (
      conversationId &&
      previousConversationIdRef.current !== undefined &&
      previousConversationIdRef.current !== conversationId
    ) {
      const prevId = previousConversationIdRef.current;

      if (prevId && !streaming[prevId]) {
        dispatch(removeConversation(prevId));
      } else if (prevId && streaming[prevId]) {
        pendingCleanupRef.current.add(prevId);
      }
    }

    previousConversationIdRef.current = conversationId;
  }, [conversationId, streaming, dispatch]);

  useEffect(() => {
    const handleToken = ({
      token,
      isEnd,
      conversationId,
      tokenType,
    }: {
      token: string;
      isEnd: boolean;
      conversationId: string;
      tokenType?: 'mainContent' | 'reasoningContent';
    }) => {
      if (!conversationId) return;

      if (isEnd) {
        if (tokenType === 'mainContent') {
          setStreaming((prev) => ({ ...prev, [conversationId]: false }));
          setReasoningStreaming((prev) => ({
            ...prev,
            [conversationId]: false,
          }));

          dispatch(
            chatApi.util.invalidateTags([
              { type: 'ChatHistory', id: conversationId },
            ]),
          );

          if (
            pendingCleanupRef.current.has(conversationId) &&
            conversationId !== previousConversationIdRef.current
          ) {
            dispatch(removeConversation(conversationId));
            pendingCleanupRef.current.delete(conversationId);
          }
        } else if (tokenType === 'reasoningContent') {
          setReasoningStreaming((prev) => ({
            ...prev,
            [conversationId]: false,
          }));
        }
      } else {
        dispatch(updateLastMessage({ conversationId, token, tokenType }));
      }
    };

    const handleConversationTitle = ({
      title,
      conversationId,
    }: {
      title: string;
      conversationId: string;
    }) => {
      if (!conversationId) return;

      const result = chatApi.util.updateQueryData(
        'getConversations',
        undefined,
        (draft) => {
          if (draft.pages.length > 0) {
            draft.pages[0].conversations.unshift({ id: conversationId, title });
          }
        },
      );
      dispatch(result);
    };

    const handleError = ({
      message,
      conversationId,
    }: {
      message: string;
      conversationId: string;
    }) => {
      if (!conversationId) return;

      console.error(`Error for conversation ${conversationId}:`, message);
      setError((prev) => ({ ...prev, [conversationId]: message }));
      setStreaming((prev) => ({ ...prev, [conversationId]: false }));
      setReasoningStreaming((prev) => ({ ...prev, [conversationId]: false }));

      if (
        pendingCleanupRef.current.has(conversationId) &&
        conversationId !== previousConversationIdRef.current
      ) {
        dispatch(removeConversation(conversationId));
        pendingCleanupRef.current.delete(conversationId);
      }
    };

    providerConnection.on('token', handleToken);
    providerConnection.on('conversation-title', handleConversationTitle);
    providerConnection.on('error', handleError);

    return () => {
      providerConnection.off('token', handleToken);
      providerConnection.off('conversation-title', handleConversationTitle);
      providerConnection.off('error', handleError);
    };
  }, [dispatch]);

  useEffect(() => {
    if (conversationId && newConversationId !== conversationId) {
      dispatch(setNewConversationId(null));
    }
  }, [conversationId, newConversationId, dispatch]);

  const sendMessage = async (
    params: ISendMessageParams,
  ): Promise<string | undefined> => {
    let currentId = conversationId;

    if (!providerConnection) {
      setError((prev) => ({
        ...prev,
        [currentId || 'global']: 'Socket connection not available',
      }));
      return;
    }

    if (!selectedModel) {
      setError((prev) => ({
        ...prev,
        [currentId || 'global']: 'Please select a model',
      }));
      return;
    }

    try {
      if (!currentId) {
        currentId = await createConversation();
        if (!currentId) {
          setError((prev) => ({
            ...prev,
            [currentId || 'global']:
              'Failed to create conversation. Please try again.',
          }));
          return undefined;
        }
      }

      if (!roomJoined[currentId]) {
        try {
          await new Promise<void>((resolve, reject) => {
            providerConnection.emit(
              'join-conversation',
              currentId,
              (response: { success: boolean; error?: string }) => {
                if (response.success) {
                  setRoomJoined((prev) => ({ ...prev, [currentId!]: true }));
                  resolve();
                } else {
                  reject(
                    new Error(response.error || 'Failed to join conversation'),
                  );
                }
              },
            );
          });

          if (!conversationId) {
            dispatch(setNewConversationId(currentId));
          }
        } catch (_err) {
          setError((prev) => ({
            ...prev,
            [currentId || 'global']:
              'Failed to connect to conversation. Please try again.',
          }));
          return undefined;
        }
      }

      dispatch(
        addMessage({
          conversationId: currentId,
          message: {
            mainContent: params.prompt,
            senderType: 'user',
            attachments: params.attachments,
          },
        }),
      );

      dispatch(
        addMessage({
          conversationId: currentId,
          message: {
            mainContent: '',
            reasoningContent: '',
            senderType: 'assistant',
          },
        }),
      );

      setStreaming((prev) => ({ ...prev, [currentId!]: true }));
      setReasoningStreaming((prev) => ({ ...prev, [currentId!]: true }));

      providerConnection.emit('get-llm-response', {
        prompt: params.prompt,
        conversationId: currentId,
        lastModelId: selectedModel.id,
        enableReasoning: selectedModel.hasReasoning && reasoningEnabled,
        fileIds: params.attachments
          ? params.attachments.map((file) => file.id)
          : [],
      });

      return currentId;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      setError((prev) => ({
        ...prev,
        [currentId || 'global']: 'Failed to send message. Please try again.',
      }));
      return undefined;
    }
  };

  const stopStream = () => {
    if (providerConnection && conversationId) {
      providerConnection.emit('stop-stream', { conversationId });
      setStreaming((prev) => ({ ...prev, [conversationId]: false }));
      setReasoningStreaming((prev) => ({ ...prev, [conversationId]: false }));
    }
  };

  const value = {
    providerConnection,
    streaming,
    reasoningStreaming,
    error,
    setError,
    sendMessage,
    stopStream,
    conversationId,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
