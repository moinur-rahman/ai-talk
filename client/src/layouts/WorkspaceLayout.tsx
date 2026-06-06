import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/common/Sidebar';
import { ChatProvider } from '@/contexts/ChatContext';

const WorkspaceLayout = () => {
  return (
    <ChatProvider>
      <div className="flex h-screen bg-surface">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Outlet />
        </div>
      </div>
    </ChatProvider>
  );
};

export default WorkspaceLayout;
