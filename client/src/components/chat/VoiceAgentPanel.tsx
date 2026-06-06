import { FiPhoneOff } from 'react-icons/fi';
import type { VoiceAgentStatus } from '@/hooks/useVoiceAgent';

interface VoiceAgentPanelProps {
  status: VoiceAgentStatus;
  isSpeaking: boolean;
  isAssistantSpeaking: boolean;
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
  error,
  onStop,
}: VoiceAgentPanelProps) => {
  return (
    <div className="w-full mb-2 rounded-2xl border border-border bg-surface-elevated overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5">
        <StatusDot
          status={status}
          isSpeaking={isSpeaking}
          isAssistantSpeaking={isAssistantSpeaking}
        />
        {error && (
          <span className="text-xs text-red-400 truncate mx-3">{error}</span>
        )}
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
    </div>
  );
};

export default VoiceAgentPanel;
