import { FC, ReactNode } from 'react';
import Sidebar from '@/components/common/Sidebar';
import { ChatProvider } from '@/contexts/ChatContext';

const Layout: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ChatProvider>
      <div className="flex h-screen bg-surface">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col relative overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </ChatProvider>
  );
};

export default Layout;
