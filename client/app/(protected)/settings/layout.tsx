import { FC, ReactNode } from 'react';
import Sidebar from '@/components/common/Sidebar';
import { ChatProvider } from '@/contexts/ChatContext';

const SettingsLayout: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ChatProvider>
      <div className="flex h-screen bg-surface">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </ChatProvider>
  );
};

export default SettingsLayout;
