import { FC, ReactNode } from 'react';
import Sidebar from '@/components/common/Sidebar';
import { ChatProvider } from '@/contexts/ChatContext';
import Header from '@/components/chat/Header';
import SendMessage from '@/components/chat/SendMessage';

const Layout: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ChatProvider>
      <div className="flex h-screen bg-[#1b2030]">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <div className="flex-1 flex flex-col relative overflow-hidden">
            {children}
            <div className="w-full bg-[#1b2030] px-4 pb-4 pt-2 flex justify-center">
              <SendMessage />
            </div>
          </div>
        </div>
      </div>
    </ChatProvider>
  );
};

export default Layout;
