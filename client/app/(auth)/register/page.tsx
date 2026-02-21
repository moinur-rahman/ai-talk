'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { Mail, Lock, User, MessageSquare } from 'lucide-react';

import InputField from '@/components/auth/InputField';
import AuthButton from '@/components/auth/AuthButton';
import AuthBrandPanel from '@/components/auth/AuthBrandPanel';
import { authApi, ApiError, RegisterCredentials } from '@/lib/api';

interface RegisterFormData extends RegisterCredentials {
  confirmPassword: string;
}

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
  textColor: string;
} {
  if (!password) return { score: 0, label: '', color: '', textColor: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500', textColor: 'text-red-600' };
  if (score === 2) return { score: 2, label: 'Fair', color: 'bg-amber-500', textColor: 'text-amber-600' };
  if (score === 3) return { score: 3, label: 'Good', color: 'bg-emerald-500', textColor: 'text-emerald-600' };
  return { score: 4, label: 'Strong', color: 'bg-emerald-500', textColor: 'text-emerald-600' };
}

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string>('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const password = watch('password');
  const passwordStrength = getPasswordStrength(password || '');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setLoading(true);
      setServerError('');

      const { confirmPassword, ...credentials } = data;
      await authApi.register(credentials);

      router.push('/login?registered=true');
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.message.includes('duplicate') || error.message.includes('already exists')) {
          setServerError('This email is already registered. Please use a different email or login.');
        } else {
          setServerError(error.message || 'Failed to create account');
        }
      } else {
        setServerError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* ── Left: Branding Panel ── */}
      <AuthBrandPanel
        accent="violet"
        heading={
          <>
            Start talking<br />
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              to the future<br />today
            </span>
          </>
        }
      />

      {/* ── Right: Form Panel ── */}
      <div className="flex items-center justify-center min-h-screen lg:min-h-0 bg-white px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-3 mb-10 lg:hidden">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/40">
              <MessageSquare className="text-white" size={18} />
            </div>
            <span className="font-semibold text-lg tracking-tight text-slate-900">AI Talk</span>
          </div>

          {/* Heading */}
          <div className="mb-8 space-y-1.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create your account</h1>
            <p className="text-slate-500 text-sm">Start your AI conversation journey</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {serverError && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            <InputField
              label="Full Name"
              type="text"
              placeholder="John Doe"
              icon={<User size={16} />}
              error={errors.name?.message}
              {...register('name', {
                required: 'Name is required',
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters',
                },
                maxLength: {
                  value: 255,
                  message: 'Name must not exceed 255 characters',
                },
              })}
            />

            <InputField
              label="Email"
              type="email"
              placeholder="you@example.com"
              icon={<Mail size={16} />}
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
                maxLength: {
                  value: 255,
                  message: 'Email must not exceed 255 characters',
                },
              })}
            />

            <div className="space-y-2">
              <InputField
                label="Password"
                type="password"
                placeholder="Create a strong password"
                icon={<Lock size={16} />}
                error={errors.password?.message}
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                  maxLength: {
                    value: 255,
                    message: 'Password must not exceed 255 characters',
                  },
                })}
              />

              {/* Password strength meter */}
              {password && (
                <div className="space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          level <= passwordStrength.score
                            ? passwordStrength.color
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${passwordStrength.textColor}`}>
                    {passwordStrength.label} password
                  </p>
                </div>
              )}
            </div>

            <InputField
              label="Confirm Password"
              type="password"
              placeholder="Re-enter your password"
              icon={<Lock size={16} />}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) =>
                  value === password || 'Passwords do not match',
              })}
            />

            <div className="flex items-start gap-2.5 text-sm">
              <input
                type="checkbox"
                className="w-4 h-4 mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 focus:ring-2 flex-shrink-0"
                required
              />
              <label className="text-slate-600 leading-relaxed">
                I agree to the{' '}
                <Link href="/terms" className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <AuthButton type="submit" loading={loading}>
              Create Account
            </AuthButton>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-slate-400 uppercase tracking-widest">
                or
              </span>
            </div>
          </div>

          {/* Google */}
          <AuthButton variant="secondary" type="button">
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign up with Google
          </AuthButton>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
