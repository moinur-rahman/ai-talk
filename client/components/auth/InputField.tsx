'use client';

import { forwardRef, useState, InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, icon, type = 'text', className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    return (
      <div className="w-full">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
          {label}
          {props.required && (
            <span className="text-red-400 ml-1 normal-case">*</span>
          )}
        </label>
        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={inputType}
            className={`
              w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm text-slate-900
              placeholder:text-slate-400 transition-all duration-200
              focus:outline-none focus:bg-white focus:ring-4
              disabled:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400
              ${icon ? 'pl-10' : ''}
              ${isPassword ? 'pr-10' : ''}
              ${
                error
                  ? 'border-red-300 focus:border-red-400 focus:ring-red-500/10 bg-red-50/40'
                  : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10'
              }
              ${className}
            `}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-red-600 font-medium">{error}</p>
        )}
      </div>
    );
  },
);

InputField.displayName = 'InputField';

export default InputField;
