import { useState } from 'react';
import SendMessage from '@/components/chat/SendMessage';
import { useGetMeQuery } from '@/services/userApi';

const HINTS = [
  'Explain a complex topic',
  'Write or debug code',
  'Analyze data or text',
  'Brainstorm ideas',
];

const GENERIC_MESSAGES = [
  "What's on your mind?",
  'How can I help?',
  'What are you working on?',
  'Ready when you are.',
  'Ask me anything.',
];

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Good night';
}

const NewChatPage = () => {
  const { data: user } = useGetMeQuery();
  const firstName = (user?.displayName || user?.name || '').split(' ')[0];

  // Pick greeting style and message index once on mount (lazy initializer is outside render)
  const [{ useGreeting, greeting, msgIndex }] = useState(() => ({
    useGreeting: Math.random() < 0.5,
    greeting: getTimeGreeting(),
    msgIndex: Math.floor(Math.random() * GENERIC_MESSAGES.length),
  }));

  const heading = useGreeting
    ? firstName
      ? `${greeting}, ${firstName}`
      : greeting
    : GENERIC_MESSAGES[msgIndex];

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 overflow-hidden relative">
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(0,196,161,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 w-full max-w-[52rem] flex flex-col items-center gap-6">
        <h1 className="text-3xl font-bold text-primary tracking-tight">
          {heading}
        </h1>

        <SendMessage defaultRows={3} />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
          {HINTS.map((hint) => (
            <div
              key={hint}
              className="px-4 py-3 rounded-xl bg-surface-elevated border border-border text-secondary text-xs text-left"
            >
              {hint}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

export default NewChatPage;
