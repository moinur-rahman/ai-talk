import { FC, ReactNode } from 'react';
import Sidebar from '@/components/common/Sidebar';
import { ChatProvider } from '@/contexts/ChatContext';
import Header from '@/components/chat/Header';

const Layout: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ChatProvider>
      <div className="flex h-screen bg-surface">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <div className="flex-1 flex flex-col relative overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </ChatProvider>
  );
};

export default Layout;
