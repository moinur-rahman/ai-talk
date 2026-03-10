import { FC, ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';

const Layout: FC<{ children: ReactNode }> = ({ children }) => {
  return <AuthProvider>{children}</AuthProvider>;
};

export default Layout;
