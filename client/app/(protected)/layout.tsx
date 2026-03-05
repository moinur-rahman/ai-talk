import { FC, ReactNode } from 'react';
import Sidebar from '@/components/common/Sidebar';
import { ChatProvider } from '@/contexts/ChatContext';
import Header from '@/components/chat/Header';
import { AuthProvider } from '@/contexts/AuthContext';
import SendMessage from '@/components/chat/SendMessage';

const Layout: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <ChatProvider>
        <div className="flex h-screen bg-[#090C12]">
          <Sidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <Header />
            <div className="flex-1 flex flex-col relative overflow-hidden">
              {children}
              <div className="w-full bg-[#090C12] px-4 pb-4 pt-2 flex justify-center">
                <SendMessage />
              </div>
            </div>
          </div>
        </div>
      </ChatProvider>
    </AuthProvider>
  );
};

export default Layout;
