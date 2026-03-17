import ChatHistory from '@/components/chat/ChatHistory';
import SendMessage from '@/components/chat/SendMessage';

const Chat = () => {
  return (
    <main className="flex-1 flex flex-col h-[calc(100vh-4rem)] relative">
      <div className="absolute inset-0 flex flex-col">
        <div className="flex-1 overflow-hidden">
          <ChatHistory />
        </div>
        <div className="w-full bg-surface px-4 pb-4 pt-2 flex justify-center">
          <SendMessage />
        </div>
      </div>
    </main>
  );
};

export default Chat;
