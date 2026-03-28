import { FC, ReactNode } from 'react';
import Sidebar from '@/components/common/Sidebar';
import { ChatProvider } from '@/contexts/ChatContext';
import { VoiceAgentProvider } from '@/contexts/VoiceAgentContext';

const Layout: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ChatProvider>
      <VoiceAgentProvider>
        <div className="flex h-screen bg-surface">
          <Sidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto">{children}</div>
          </div>
        </div>
      </VoiceAgentProvider>
    </ChatProvider>
  );
};

export default Layout;
