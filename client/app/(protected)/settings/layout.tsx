'use client';
import { FC, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/common/Sidebar';
import { ChatProvider } from '@/contexts/ChatContext';

const NAV_ITEMS = [
  { label: 'General', href: '/settings/general' },
  { label: 'Data', href: '/settings/data' },
];

const SettingsLayout: FC<{ children: ReactNode }> = ({ children }) => {
  const pathname = usePathname();

  return (
    <ChatProvider>
      <div className="flex h-screen bg-surface">
        <Sidebar />
        <div className="flex flex-1 overflow-hidden justify-center">
          <div className="flex w-full max-w-4xl pt-10">
            <nav className="w-44 shrink-0 py-6 px-3">
              <p className="text-muted text-[10px] font-semibold uppercase tracking-widest px-3 mb-2">
                Settings
              </p>
              <ul className="space-y-0.5">
                {NAV_ITEMS.map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                        pathname === href
                          ? 'bg-surface-elevated text-heading font-medium'
                          : 'text-body hover:bg-surface-dim'
                      }`}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        </div>
      </div>
    </ChatProvider>
  );
};

export default SettingsLayout;
