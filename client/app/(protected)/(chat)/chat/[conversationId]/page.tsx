import ChatHistory from '@/components/chat/ChatHistory';

const Chat = () => {
  return (
    <main className="flex-1 flex flex-col h-[calc(100vh-4rem)] relative">
      <div className="absolute inset-0 flex flex-col">
        <div className="flex-1 overflow-hidden">
          <ChatHistory />
        </div>
      </div>
    </main>
  );
};

export default Chat;
