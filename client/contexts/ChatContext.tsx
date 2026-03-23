'use client';
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateLastMessage,
  setLastMessageGeneratedImage,
  addMessage,
  setNewConversationId,
  setNewConversationTitle,
  setNewConversationProject,
  removeConversation,
} from '@/redux/slices/chatSlice';
import { chatApi } from '@/services/chatApi';
import { AppDispatch, RootState } from '@/redux/store';
import { createConversation } from '@/services/createConversation';
import { useParams } from 'next/navigation';
import { FileMetadata } from '@/types/chat';
import { getCsrfTokenFromCookie } from '@/utils/getCsrfTokenFromCookie';

interface ISendMessageParams {
  prompt: string;
  attachments?: FileMetadata[];
  project?: { id: string; name: string };
}

interface IChatContext {
  streaming: Record<string, boolean>;
  reasoningStreaming: Record<string, boolean>;
  imageGenerating: Record<string, boolean>;
  webSearching: Record<string, boolean>;
  error: Record<string, string | null>;
  setError: (
    error: React.SetStateAction<Record<string, string | null>>,
  ) => void;
  sendMessage: (params: ISendMessageParams) => Promise<string | undefined>;
  stopStream: () => void;
  conversationId: string | undefined;
  projectId: string | undefined;
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
    projectId,
  }: {
    conversationId: string | undefined;
    projectId: string | undefined;
  } = useParams();

  const [streaming, setStreaming] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<Record<string, string | null>>({});
  const [reasoningStreaming, setReasoningStreaming] = useState<
    Record<string, boolean>
  >({});
  const [imageGenerating, setImageGenerating] = useState<
    Record<string, boolean>
  >({});
  const [webSearching, setWebSearching] = useState<Record<string, boolean>>({});

  const previousConversationIdRef = useRef<string | undefined>(undefined);
  const pendingCleanupRef = useRef<Set<string>>(new Set());
  const activeStreamsRef = useRef<Record<string, AbortController>>({});
  const effectiveProjectIdRef = useRef<string | undefined>(undefined);

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

  const webSearchEnabled = useSelector(
    (state: RootState) => state.model.webSearchEnabled,
  );

  const responseStyle = useSelector(
    (state: RootState) => state.model.responseStyle,
  );

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
    if (conversationId && newConversationId !== conversationId) {
      dispatch(setNewConversationId(null));
    }
  }, [conversationId, newConversationId, dispatch]);

  const handleStreamEvent = (
    event: {
      type: string;
      token?: string;
      tokenType?: 'mainContent' | 'reasoningContent';
      isEnd?: boolean;
      title?: string;
      message?: string;
      imageData?: string;
      presignedUrl?: string;
      conversationId?: string;
      status?: 'searching' | 'done';
    },
    currentConversationId: string,
  ) => {
    const convId = event.conversationId ?? currentConversationId;

    if (event.type === 'token') {
      const { token = '', tokenType, isEnd = false } = event;

      if (isEnd) {
        if (tokenType === 'mainContent') {
          setStreaming((prev) => ({ ...prev, [convId]: false }));
          setReasoningStreaming((prev) => ({ ...prev, [convId]: false }));
          setImageGenerating((prev) => ({ ...prev, [convId]: false }));
          setWebSearching((prev) => ({ ...prev, [convId]: false }));

          if (
            pendingCleanupRef.current.has(convId) &&
            convId !== previousConversationIdRef.current
          ) {
            dispatch(removeConversation(convId));
            pendingCleanupRef.current.delete(convId);
          }
        } else if (tokenType === 'reasoningContent') {
          setReasoningStreaming((prev) => ({ ...prev, [convId]: false }));
        }
      } else {
        dispatch(
          updateLastMessage({ conversationId: convId, token, tokenType }),
        );
      }
    } else if (event.type === 'conversation-title') {
      if (!convId || !event.title) return;

      dispatch(setNewConversationTitle(event.title));

      const effectiveProjId = effectiveProjectIdRef.current;
      if (effectiveProjId) {
        dispatch(
          chatApi.util.invalidateTags([
            { type: 'ProjectConversations', id: effectiveProjId },
          ]),
        );
      }

      const result = chatApi.util.updateQueryData(
        'getConversations',
        undefined,
        (draft) => {
          if (draft.pages.length > 0) {
            let found = false;
            for (const page of draft.pages) {
              const conv = page.conversations.find((c) => c.id === convId);
              if (conv) {
                conv.title = event.title!;
                found = true;
                break;
              }
            }
            if (!found) {
              draft.pages[0].conversations.unshift({
                id: convId,
                title: event.title!,
                updatedAt: new Date().toISOString(),
                projectId: effectiveProjId ?? null,
              });
            }
          }
        },
      );
      dispatch(result);
    } else if (event.type === 'partial-image' && event.imageData) {
      setImageGenerating((prev) => ({ ...prev, [convId]: true }));
      dispatch(
        setLastMessageGeneratedImage({
          conversationId: convId,
          imageData: `data:image/png;base64,${event.imageData}`,
        }),
      );
    } else if (event.type === 'generated-image' && event.presignedUrl) {
      setImageGenerating((prev) => ({ ...prev, [convId]: false }));
      dispatch(
        setLastMessageGeneratedImage({
          conversationId: convId,
          imageData: event.presignedUrl,
        }),
      );
    } else if (event.type === 'web-search-status') {
      setWebSearching((prev) => ({
        ...prev,
        [convId]: event.status === 'searching',
      }));
    } else if (event.type === 'error') {
      const message = event.message ?? 'An error occurred';
      console.error(`Error for conversation ${convId}:`, message);
      setError((prev) => ({ ...prev, [convId]: message }));
      setStreaming((prev) => ({ ...prev, [convId]: false }));
      setReasoningStreaming((prev) => ({ ...prev, [convId]: false }));
      setImageGenerating((prev) => ({ ...prev, [convId]: false }));
      setWebSearching((prev) => ({ ...prev, [convId]: false }));

      if (
        pendingCleanupRef.current.has(convId) &&
        convId !== previousConversationIdRef.current
      ) {
        dispatch(removeConversation(convId));
        pendingCleanupRef.current.delete(convId);
      }
    }
  };

  const runStream = async (
    currentId: string,
    params: ISendMessageParams,
    modelId: string,
    enableReasoning: boolean,
    webSearchEnabled: boolean,
    style: string,
  ) => {
    try {
      const csrfToken = getCsrfTokenFromCookie();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/chats/${currentId}/stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({
            prompt: params.prompt,
            lastModelId: modelId,
            enableReasoning,
            webSearchEnabled,
            fileIds: params.attachments
              ? params.attachments.map((f) => f.id)
              : [],
            responseStyle: style,
          }),
          signal: activeStreamsRef.current[currentId]?.signal,
        },
      );

      if (!response.ok || !response.body) {
        throw new Error('Stream request failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;
          try {
            const event = JSON.parse(jsonStr);
            handleStreamEvent(event, currentId);
          } catch {
            // ignore malformed events
          }
        }
      }

      delete activeStreamsRef.current[currentId];
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      console.error('Error in stream:', err);
      setError((prev) => ({
        ...prev,
        [currentId]: 'Failed to send message. Please try again.',
      }));
      setStreaming((prev) => ({ ...prev, [currentId]: false }));
      setReasoningStreaming((prev) => ({ ...prev, [currentId]: false }));
      delete activeStreamsRef.current[currentId];
    }
  };

  const sendMessage = async (
    params: ISendMessageParams,
  ): Promise<string | undefined> => {
    let currentId = conversationId;

    if (!selectedModel) {
      setError((prev) => ({
        ...prev,
        [currentId || 'global']: 'Please select a model',
      }));
      return;
    }

    const effectiveProjId = params.project?.id;
    effectiveProjectIdRef.current = effectiveProjId;

    try {
      if (!currentId) {
        currentId = await createConversation(effectiveProjId);
        if (!currentId) {
          setError((prev) => ({
            ...prev,
            [currentId || 'global']:
              'Failed to create conversation. Please try again.',
          }));
          return undefined;
        }
        dispatch(setNewConversationId(currentId));
        dispatch(setNewConversationProject(params.project ?? null));

        // Optimistically add to sidebar immediately using the user's message
        // as the initial title. It will be replaced once the AI title arrives.
        const prompt = params.prompt.trim();
        const initialTitle =
          prompt.length > 60 ? `${prompt.slice(0, 60)}…` : prompt;
        dispatch(
          chatApi.util.updateQueryData(
            'getConversations',
            undefined,
            (draft) => {
              if (draft.pages.length > 0) {
                draft.pages[0].conversations.unshift({
                  id: currentId!,
                  title: initialTitle,
                  updatedAt: new Date().toISOString(),
                  projectId: effectiveProjId ?? null,
                });
              }
            },
          ),
        );
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

      const abortController = new AbortController();
      activeStreamsRef.current[currentId] = abortController;

      // Fire-and-forget: don't await the stream so the caller gets the ID
      // immediately and can navigate to the chat page while streaming runs.
      void runStream(
        currentId,
        params,
        selectedModel.id,
        selectedModel.hasReasoning && reasoningEnabled,
        webSearchEnabled,
        responseStyle,
      );

      return currentId;
    } catch (err) {
      console.error('Error in sendMessage:', err);
      setError((prev) => ({
        ...prev,
        [currentId || 'global']: 'Failed to send message. Please try again.',
      }));
      if (currentId) {
        setStreaming((prev) => ({ ...prev, [currentId!]: false }));
        setReasoningStreaming((prev) => ({ ...prev, [currentId!]: false }));
        delete activeStreamsRef.current[currentId];
      }
      return undefined;
    }
  };

  const stopStream = () => {
    if (conversationId && activeStreamsRef.current[conversationId]) {
      activeStreamsRef.current[conversationId].abort();
      delete activeStreamsRef.current[conversationId];
      setStreaming((prev) => ({ ...prev, [conversationId]: false }));
      setReasoningStreaming((prev) => ({ ...prev, [conversationId]: false }));
    }
  };

  const value = {
    streaming,
    reasoningStreaming,
    imageGenerating,
    webSearching,
    error,
    setError,
    sendMessage,
    stopStream,
    conversationId,
    projectId,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
