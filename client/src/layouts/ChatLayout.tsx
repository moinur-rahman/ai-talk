import { Outlet } from 'react-router-dom';
import { VoiceAgentProvider } from '@/contexts/VoiceAgentContext';

const ChatLayout = () => {
  return (
    <VoiceAgentProvider>
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <Outlet />
      </div>
    </VoiceAgentProvider>
  );
};

export default ChatLayout;
