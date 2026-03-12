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
      <div className="flex h-screen items-center justify-center bg-[#1b2030]">
        <div className="w-5 h-5 border-2 border-[#00C4A1] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#1b2030]">
      {/* Admin sidebar */}
      <nav className="w-56 h-screen flex flex-col bg-[#141826] border-r border-[#2e3d52] flex-shrink-0">
        <div className="px-4 pt-5 pb-4 border-b border-[#2e3d52]">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-7 h-7 rounded-lg bg-[#00C4A1] flex items-center justify-center flex-shrink-0">
              <div className="w-3 h-3 rotate-45 rounded-sm border-2 border-[#141826]" />
            </div>
            <span className="text-[#e2ecf5] font-semibold text-sm tracking-wide">
              AI Talk
            </span>
          </div>
          <p className="text-[#4e677e] text-[10px] font-semibold uppercase tracking-widest mt-3 px-0.5">
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

        <div className="px-3 py-3 border-t border-[#2e3d52]">
          <Link
            href="/"
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[#92adc4] hover:text-[#00C4A1] hover:bg-[#00C4A1]/5 transition-all duration-200 text-sm"
          >
            <FiChevronLeft size={14} />
            <span>Back to chat</span>
          </Link>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 flex items-center px-6 border-b border-[#2e3d52] bg-[#141826] flex-shrink-0">
          <h1 className="text-[#e2ecf5] font-semibold text-sm">Admin Panel</h1>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#00C4A1]/20 border border-[#00C4A1]/30 flex items-center justify-center">
              <span className="text-[#00C4A1] text-[10px] font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-[#92adc4] text-xs">{user.name}</span>
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
        ? 'bg-[#1a2d42] text-[#00C4A1] border-[#00C4A1]'
        : 'text-[#92adc4] hover:bg-[#222b3d] hover:text-[#d5e6f0] border-transparent'
    }`}
  >
    <span className={active ? 'text-[#00C4A1]' : 'text-[#4e677e]'}>{icon}</span>
    <span>{label}</span>
  </Link>
);

export default AdminLayout;
