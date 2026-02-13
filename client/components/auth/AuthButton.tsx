'use client';

import { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  children: React.ReactNode;
}

const AuthButton = ({
  loading = false,
  variant = 'primary',
  children,
  className = '',
  disabled,
  ...props
}: AuthButtonProps) => {
  const baseClasses =
    'w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 active:scale-[0.98]',
    secondary:
      'bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300',
    outline:
      'bg-transparent text-blue-600 border-2 border-blue-600 hover:bg-blue-50',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="animate-spin" size={20} />}
      {children}
    </button>
  );
};

export default AuthButton;
