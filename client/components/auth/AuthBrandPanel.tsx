import { MessageSquare, Sparkles, Zap, Shield } from 'lucide-react';

interface OrbConfig {
  pos: string;
  color: string;
  size: string;
  blur: string;
  duration: string;
  delay: string;
}

interface AccentConfig {
  iconColor: string;
  orbs: OrbConfig[];
}

const accentConfig: Record<'indigo' | 'violet', AccentConfig> = {
  indigo: {
    iconColor: 'text-indigo-400',
    orbs: [
      {
        pos: 'absolute -top-40 -left-40',
        size: 'w-[560px] h-[560px]',
        color: 'bg-indigo-600/25',
        blur: 'blur-3xl',
        duration: '6s',
        delay: '0s',
      },
      {
        pos: 'absolute -bottom-32 right-0',
        size: 'w-[440px] h-[440px]',
        color: 'bg-violet-600/20',
        blur: 'blur-3xl',
        duration: '8s',
        delay: '2s',
      },
      {
        pos: 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
        size: 'w-[280px] h-[280px]',
        color: 'bg-indigo-400/10',
        blur: 'blur-2xl',
        duration: '5s',
        delay: '1s',
      },
    ],
  },
  violet: {
    iconColor: 'text-violet-400',
    orbs: [
      {
        pos: 'absolute -top-32 -right-32',
        size: 'w-[500px] h-[500px]',
        color: 'bg-violet-600/25',
        blur: 'blur-3xl',
        duration: '7s',
        delay: '0s',
      },
      {
        pos: 'absolute -bottom-40 -left-20',
        size: 'w-[480px] h-[480px]',
        color: 'bg-indigo-600/20',
        blur: 'blur-3xl',
        duration: '9s',
        delay: '1.5s',
      },
      {
        pos: 'absolute top-1/3 left-1/3',
        size: 'w-[220px] h-[220px]',
        color: 'bg-violet-400/10',
        blur: 'blur-2xl',
        duration: '5s',
        delay: '3s',
      },
    ],
  },
};

const features = [
  {
    icon: Sparkles,
    label: 'Multiple AI Models',
    desc: 'GPT-4, Claude, Gemini & more',
  },
  { icon: Zap, label: 'Real-time Streaming', desc: 'Instant, fluid responses' },
  { icon: Shield, label: 'Private & Secure', desc: 'Your data stays yours' },
];

interface AuthBrandPanelProps {
  heading: React.ReactNode;
  accent?: 'indigo' | 'violet';
}

export default function AuthBrandPanel({
  heading,
  accent = 'indigo',
}: AuthBrandPanelProps) {
  const { iconColor, orbs } = accentConfig[accent];

  return (
    <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-slate-950 p-12">
      {/* Ambient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {orbs.map((orb, i) => (
          <div
            key={i}
            className={`${orb.pos} ${orb.size} ${orb.color} ${orb.blur} rounded-full animate-pulse`}
            style={{
              animationDuration: orb.duration,
              animationDelay: orb.delay,
            }}
          />
        ))}
      </div>

      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-[0.12] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Logo */}
      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/40">
            <MessageSquare className="text-white" size={18} />
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">
            AI Talk
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 space-y-10">
        <div className="space-y-5">
          <h2 className="text-5xl font-bold text-white leading-[1.1] tracking-tight">
            {heading}
          </h2>
          <p className="text-slate-400 text-base leading-relaxed max-w-xs">
            One interface for every AI model. Switch providers, keep history,
            stay in flow.
          </p>
        </div>

        <div className="space-y-4">
          {features.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-center gap-3.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex-shrink-0">
                <Icon size={14} className={iconColor} />
              </div>
              <div>
                <p className="text-white text-sm font-medium">{label}</p>
                <p className="text-slate-500 text-xs">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10">
        <p className="text-slate-600 text-xs">
          © 2026 AI Talk. All rights reserved.
        </p>
      </div>
    </div>
  );
}
