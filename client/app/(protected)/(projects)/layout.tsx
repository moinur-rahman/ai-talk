import { FC, ReactNode } from 'react';
import Sidebar from '@/components/common/Sidebar';
import { ChatProvider } from '@/contexts/ChatContext';

const Layout: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ChatProvider>
      <div className="flex h-screen bg-surface">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto">{children}</div>
        </div>
      </div>
    </ChatProvider>
  );
};

export default Layout;
