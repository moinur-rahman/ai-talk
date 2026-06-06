import { type ButtonHTMLAttributes } from 'react';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

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
    'w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

  const variantClasses = {
    primary:
      'bg-linear-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/35',
    secondary:
      'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm',
    outline:
      'bg-transparent text-indigo-600 border-2 border-indigo-600 hover:bg-indigo-50',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <AiOutlineLoading3Quarters className="animate-spin" size={16} />
      )}
      {children}
    </button>
  );
};

export default AuthButton;
