const NewChat = () => {
  const hints = [
    'Explain a complex topic',
    'Write or debug code',
    'Analyze data or text',
    'Brainstorm ideas',
  ];

  return (
    <main className="flex-1 flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden px-6">
        {/* Ambient glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(0,196,161,0.06) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 text-center max-w-md">
          {/* Logo mark */}
          <div className="flex items-center justify-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center">
              <div className="w-5 h-5 rotate-45 rounded-sm border-2 border-accent" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-primary mb-3 tracking-tight">
            Start a conversation
          </h1>
          <p className="text-body text-sm leading-relaxed">
            Choose a provider and model above, then type your message below.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-2">
            {hints.map((hint) => (
              <div
                key={hint}
                className="px-4 py-3 rounded-xl bg-surface-elevated border border-border text-secondary text-xs text-left"
              >
                {hint}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
};

export default NewChat;
