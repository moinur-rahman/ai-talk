import { FC, ReactNode } from 'react';
import { VoiceAgentProvider } from '@/contexts/VoiceAgentContext';

const Layout: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <VoiceAgentProvider>
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {children}
      </div>
    </VoiceAgentProvider>
  );
};

export default Layout;
