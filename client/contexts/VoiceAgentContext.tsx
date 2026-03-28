'use client';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppDispatch } from '@/redux/hooks';
import {
  addMessage,
  setLastAssistantContent,
  setNewConversationId,
  updateLastMessage,
} from '@/redux/slices/chatSlice';
import { chatApi } from '@/services/chatApi';
import useVoiceAgent, { type VoiceAgentStatus } from '@/hooks/useVoiceAgent';

interface IVoiceAgentContext {
  status: VoiceAgentStatus;
  isSpeaking: boolean;
  isAssistantSpeaking: boolean;
  error: string | null;
  isOpen: boolean;
  toggle: () => Promise<void>;
  close: () => void;
}

const VoiceAgentContext = createContext<IVoiceAgentContext | null>(null);

export const useVoiceAgentContext = (): IVoiceAgentContext => {
  const context = useContext(VoiceAgentContext);
  if (!context) {
    // Safe fallback when rendered outside VoiceAgentProvider (e.g. projects layout)
    return {
      status: 'idle',
      isSpeaking: false,
      isAssistantSpeaking: false,
      error: null,
      isOpen: false,
      toggle: async () => {},
      close: () => {},
    };
  }
  return context;
};

export const VoiceAgentProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const { conversationId } = useParams<{ conversationId?: string }>();
  const dispatch = useAppDispatch();

  const [isOpen, setIsOpen] = useState(false);

  // Keep a ref so callbacks always read the latest conversationId
  // without needing to be recreated on every navigation
  const conversationIdRef = useRef<string | undefined>(conversationId);
  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  const { status, isSpeaking, isAssistantSpeaking, error, start, stop } =
    useVoiceAgent();

  // Ordering state machine refs — prevent assistant message appearing before user message.
  // race condition: `response.created` can fire before
  // `conversation.item.input_audio_transcription.completed`
  const userTranscriptDispatchedRef = useRef(true);
  const pendingAssistantAddRef = useRef(false);
  const assistantDeltaBufferRef = useRef('');
  const speechStartTimeRef = useRef<number | null>(null);

  // Barrier/join refs for new conversation first turn.
  // Both conversationId (from SSE) and user transcript (from WebRTC) must arrive
  // before we flush + navigate. Either can arrive first.
  const pendingUserTranscriptRef = useRef<string | null>(null);
  const pendingNavigationIdRef = useRef<string | null>(null);
  const pendingAudioDurationRef = useRef<number | undefined>(undefined);

  const close = useCallback(() => {
    stop();
    setIsOpen(false);
  }, [stop]);

  // Dispatches user + pending assistant messages for the first turn of a new conversation,
  // then navigates. Called once both the conversationId and user transcript are available.
  const flushAndNavigate = useCallback(
    (newId: string, transcript: string, audioDurationMs?: number) => {
      dispatch(
        addMessage({
          conversationId: newId,
          message: {
            mainContent: transcript,
            senderType: 'user',
            inputType: 'voice',
            audioDurationMs,
            attachments: [],
          },
        }),
      );
      userTranscriptDispatchedRef.current = true;

      if (pendingAssistantAddRef.current) {
        pendingAssistantAddRef.current = false;
        dispatch(
          addMessage({
            conversationId: newId,
            message: {
              mainContent: assistantDeltaBufferRef.current,
              senderType: 'assistant',
              inputType: 'text',
              attachments: [],
            },
          }),
        );
        assistantDeltaBufferRef.current = '';
      }

      // Mark as new so useChatData skips the messages fetch (same mechanism as text chat)
      dispatch(setNewConversationId(newId));

      // Optimistically insert into sidebar with transcript as placeholder title.
      // The real LLM title arrives via onConversationTitle and replaces it.
      const optimisticTitle =
        transcript.length > 60 ? `${transcript.slice(0, 60)}…` : transcript;
      dispatch(
        chatApi.util.updateQueryData('getConversations', undefined, (draft) => {
          if (draft.pages.length > 0) {
            draft.pages[0].conversations.unshift({
              id: newId,
              title: optimisticTitle,
              updatedAt: new Date().toISOString(),
              projectId: null,
            });
          }
        }),
      );

      router.push(`/chat/${newId}`);
    },
    [dispatch, router],
  );

  const toggle = useCallback(async () => {
    if (isOpen) {
      close();
      return;
    }

    setIsOpen(true);
    await start({
      conversationId,
      onConversationCreated: (newConversationId) => {
        // Always update conversationIdRef immediately so ongoing delta buffering works
        conversationIdRef.current = newConversationId;

        if (pendingUserTranscriptRef.current) {
          // User transcript already arrived — flush everything and navigate
          const transcript = pendingUserTranscriptRef.current;
          const audioDurationMs = pendingAudioDurationRef.current;
          pendingUserTranscriptRef.current = null;
          pendingAudioDurationRef.current = undefined;
          flushAndNavigate(newConversationId, transcript, audioDurationMs);
        } else {
          // User transcript not yet arrived — store and wait
          pendingNavigationIdRef.current = newConversationId;
        }
      },
      onConversationTitle: (titleConversationId, title) => {
        // Real LLM title arrived — replace the optimistic placeholder in sidebar cache
        dispatch(
          chatApi.util.updateQueryData(
            'getConversations',
            undefined,
            (draft) => {
              for (const page of draft.pages) {
                const entry = page.conversations.find(
                  (c) => c.id === titleConversationId,
                );
                if (entry) {
                  entry.title = title;
                  break;
                }
              }
            },
          ),
        );
      },
      callbacks: {
        onSpeechStarted: () => {
          // Reset ordering state for each new user turn
          userTranscriptDispatchedRef.current = false;
          pendingAssistantAddRef.current = false;
          assistantDeltaBufferRef.current = '';
          pendingUserTranscriptRef.current = null;
          pendingNavigationIdRef.current = null;
          pendingAudioDurationRef.current = undefined;
          speechStartTimeRef.current = Date.now();
        },

        onUserTranscriptCompleted: (transcript) => {
          if (userTranscriptDispatchedRef.current) {
            return;
          }
          const audioDurationMs =
            speechStartTimeRef.current !== null
              ? Date.now() - speechStartTimeRef.current
              : undefined;
          speechStartTimeRef.current = null;

          const id = conversationIdRef.current;
          if (!id) {
            // conversationId not known yet — buffer transcript and duration, then wait
            pendingUserTranscriptRef.current = transcript;
            pendingAudioDurationRef.current = audioDurationMs;
            userTranscriptDispatchedRef.current = true;
            return;
          }
          if (pendingNavigationIdRef.current) {
            // onConversationCreated already fired before transcript arrived —
            // transcript is now the missing piece; flush everything and navigate
            const newId = pendingNavigationIdRef.current;
            pendingNavigationIdRef.current = null;
            flushAndNavigate(newId, transcript, audioDurationMs);
            return;
          }
          // Existing conversation — normal dispatch
          dispatch(
            addMessage({
              conversationId: id,
              message: {
                mainContent: transcript,
                senderType: 'user',
                inputType: 'voice',
                audioDurationMs,
                attachments: [],
              },
            }),
          );
          userTranscriptDispatchedRef.current = true;
          // If assistant already started before transcript arrived, flush now
          if (pendingAssistantAddRef.current) {
            pendingAssistantAddRef.current = false;
            dispatch(
              addMessage({
                conversationId: id,
                message: {
                  mainContent: assistantDeltaBufferRef.current,
                  senderType: 'assistant',
                  inputType: 'text',
                  attachments: [],
                },
              }),
            );
            assistantDeltaBufferRef.current = '';
          }
        },

        onAssistantStarted: () => {
          const id = conversationIdRef.current;
          if (userTranscriptDispatchedRef.current && id) {
            // User message already in chat AND we have an id — add assistant immediately
            dispatch(
              addMessage({
                conversationId: id,
                message: {
                  mainContent: '',
                  senderType: 'assistant',
                  inputType: 'text',
                  attachments: [],
                },
              }),
            );
          } else {
            // Either user transcript hasn't arrived yet, or we don't have an id yet —
            // buffer deltas until both conditions are met
            pendingAssistantAddRef.current = true;
            assistantDeltaBufferRef.current = '';
          }
        },

        onAssistantTranscriptDelta: (delta) => {
          const id = conversationIdRef.current;
          if (pendingAssistantAddRef.current || !id) {
            // Buffer while waiting for user transcript or conversationId
            assistantDeltaBufferRef.current += delta;
            return;
          }
          dispatch(
            updateLastMessage({
              conversationId: id,
              token: delta,
              tokenType: 'mainContent',
            }),
          );
        },

        onAssistantTranscriptCompleted: (finalTranscript) => {
          const trimmed = finalTranscript.trim();
          const id = conversationIdRef.current;

          if (pendingAssistantAddRef.current) {
            // Fallback: flush never happened (e.g. user transcript never arrived)
            pendingAssistantAddRef.current = false;
            if (id && trimmed) {
              dispatch(
                addMessage({
                  conversationId: id,
                  message: {
                    mainContent: trimmed,
                    senderType: 'assistant',
                    inputType: 'text',
                    attachments: [],
                  },
                }),
              );
              assistantDeltaBufferRef.current = '';
            }
          } else if (id && trimmed) {
            // Replace accumulated deltas with the canonical transcript from OpenAI's
            // done event — this is exactly what the server saves to the DB
            dispatch(
              setLastAssistantContent({ conversationId: id, content: trimmed }),
            );
          }
        },
      },
    });
  }, [
    isOpen,
    close,
    start,
    conversationId,
    dispatch,
    router,
    flushAndNavigate,
  ]);

  return (
    <VoiceAgentContext.Provider
      value={{
        status,
        isSpeaking,
        isAssistantSpeaking,
        error,
        isOpen,
        toggle,
        close,
      }}
    >
      {children}
    </VoiceAgentContext.Provider>
  );
};
