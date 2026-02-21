import { FC, ReactNode } from "react";
import Sidebar from "@/components/common/Sidebar";
import { ChatProvider } from "@/contexts/ChatContext";
import Header from "@/components/chat/Header";
import { AuthProvider } from "@/contexts/AuthContext";
import SendMessage from "@/components/chat/SendMessage";

const Layout: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <ChatProvider>
        <div className="flex h-screen bg-gray-900">
          <Sidebar />
          <div className="flex flex-col flex-1">
            <Header />
            <div className="flex-1 flex flex-col relative">
              {children}
              <div className="w-full bg-gray-900 p-6 flex justify-center">
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
