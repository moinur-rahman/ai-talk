'use client';
import { useEffect, useRef } from 'react';
import { FiPhoneOff } from 'react-icons/fi';
import type { VoiceAgentStatus, VoiceTurn } from '@/hooks/useVoiceAgent';

interface VoiceAgentPanelProps {
  status: VoiceAgentStatus;
  isSpeaking: boolean;
  isAssistantSpeaking: boolean;
  liveUserText: string;
  liveAssistantText: string;
  turns: VoiceTurn[];
  error: string | null;
  onStop: () => void;
}

const StatusDot = ({
  status,
  isSpeaking,
  isAssistantSpeaking,
}: {
  status: VoiceAgentStatus;
  isSpeaking: boolean;
  isAssistantSpeaking: boolean;
}) => {
  if (status === 'connecting') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted">
        <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
        Connecting...
      </span>
    );
  }
  if (isSpeaking) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-green-400">
        <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        Listening
      </span>
    );
  }
  if (isAssistantSpeaking) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-accent">
        <span className="inline-block w-2 h-2 rounded-full bg-accent animate-pulse" />
        Speaking
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted">
      <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
      Active
    </span>
  );
};

const VoiceAgentPanel = ({
  status,
  isSpeaking,
  isAssistantSpeaking,
  liveUserText,
  liveAssistantText,
  turns,
  error,
  onStop,
}: VoiceAgentPanelProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns, liveUserText, liveAssistantText]);

  const hasContent =
    turns.length > 0 || liveUserText || liveAssistantText;

  return (
    <div className="w-full mb-2 rounded-2xl border border-border bg-surface-elevated overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50">
        <StatusDot
          status={status}
          isSpeaking={isSpeaking}
          isAssistantSpeaking={isAssistantSpeaking}
        />
        <button
          type="button"
          onClick={onStop}
          aria-label="End voice conversation"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors"
        >
          <FiPhoneOff size={13} />
          End
        </button>
      </div>

      {/* Transcript area */}
      <div
        ref={scrollRef}
        className="px-4 py-3 space-y-2 overflow-y-auto"
        style={{ maxHeight: '220px', minHeight: hasContent ? '80px' : '56px' }}
      >
        {!hasContent && status === 'active' && (
          <p className="text-xs text-muted text-center py-2">
            Start speaking to begin the conversation.
          </p>
        )}

        {!hasContent && status === 'connecting' && (
          <p className="text-xs text-muted text-center py-2">
            Setting up voice connection...
          </p>
        )}

        {error && (
          <p className="text-xs text-red-400 text-center py-1">{error}</p>
        )}

        {/* Completed turns */}
        {turns.map((turn, i) => (
          <div
            key={i}
            className={`text-sm leading-relaxed ${
              turn.role === 'user' ? 'text-muted' : 'text-primary'
            }`}
          >
            <span
              className={`text-[10px] uppercase tracking-wider mr-2 font-medium ${
                turn.role === 'user' ? 'text-muted/60' : 'text-accent/70'
              }`}
            >
              {turn.role === 'user' ? 'You' : 'Assistant'}
            </span>
            {turn.text}
          </div>
        ))}

        {/* Live user transcript */}
        {liveUserText && (
          <div className="text-sm leading-relaxed text-muted">
            <span className="text-[10px] uppercase tracking-wider mr-2 font-medium text-muted/60">
              You
            </span>
            <span>{liveUserText}</span>
            <span className="inline-block w-1 h-3.5 bg-green-400 ml-0.5 animate-pulse align-middle" />
          </div>
        )}

        {/* Live assistant transcript */}
        {liveAssistantText && (
          <div className="text-sm leading-relaxed text-primary">
            <span className="text-[10px] uppercase tracking-wider mr-2 font-medium text-accent/70">
              Assistant
            </span>
            <span>{liveAssistantText}</span>
            <span className="inline-block w-1 h-3.5 bg-accent ml-0.5 animate-pulse align-middle" />
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceAgentPanel;
