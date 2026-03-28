'use client';
import { FC, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useGetMeQuery } from '@/services/userApi';
import { FiCpu, FiChevronLeft } from 'react-icons/fi';

const AdminLayout: FC<{ children: ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isLoading } = useGetMeQuery();

  useEffect(() => {
    if (!isLoading && user && user.role !== 'admin') {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== 'admin') {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-surface">
      {/* Admin sidebar */}
      <nav className="w-56 h-screen flex flex-col bg-surface-dim border-r border-border shrink-0">
        <div className="px-4 pt-5 pb-4 border-b border-border">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shrink-0">
              <div className="w-3 h-3 rotate-45 rounded-sm border-2 border-surface-dim" />
            </div>
            <span className="text-primary font-semibold text-sm tracking-wide">
              AI Talk
            </span>
          </div>
          <p className="text-muted text-[10px] font-semibold uppercase tracking-widest mt-3 px-0.5">
            Admin Panel
          </p>
        </div>

        <div className="flex-1 px-3 py-3 space-y-0.5">
          <NavItem
            href="/admin/models"
            icon={<FiCpu size={14} />}
            label="Models"
            active={pathname === '/admin/models'}
          />
        </div>

        <div className="px-3 py-3 border-t border-border">
          <Link
            href="/new"
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-body hover:text-accent hover:bg-accent/5 transition-all duration-200 text-sm"
          >
            <FiChevronLeft size={14} />
            <span>Back to chat</span>
          </Link>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 flex items-center px-6 border-b border-border bg-surface-dim shrink-0">
          <h1 className="text-primary font-semibold text-sm">Admin Panel</h1>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
              <span className="text-accent text-[10px] font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-body text-xs">{user.name}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
};

const NavItem: FC<{
  href: string;
  icon: ReactNode;
  label: string;
  active: boolean;
}> = ({ href, icon, label, active }) => (
  <Link
    href={href}
    className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg transition-all duration-150 text-sm border-l-2 ${
      active
        ? 'bg-selected text-accent border-accent'
        : 'text-body hover:bg-surface-elevated hover:text-heading border-transparent'
    }`}
  >
    <span className={active ? 'text-accent' : 'text-muted'}>{icon}</span>
    <span>{label}</span>
  </Link>
);

export default AdminLayout;
