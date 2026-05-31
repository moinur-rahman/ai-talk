import { FC, ReactNode } from 'react';
import { VoiceAgentProvider } from '@/contexts/VoiceAgentContext';

const Layout: FC<{ children: ReactNode }> = ({ children }) => {
  return <VoiceAgentProvider>{children}</VoiceAgentProvider>;
};

export default Layout;
