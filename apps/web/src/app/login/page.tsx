'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api';
import { Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import Logo from '@/assets/images/logo.png';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await apiClient<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      login(data.token, data.user);
      router.push('/battle');
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-b from-[#6C1C74]/5 to-white p-4 py-12">
      <div className="animate-fade-in w-full max-w-md overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl shadow-[#6C1C74]/10">
        {/* Top accent */}
        <div className="h-1.5 w-full bg-[#6C1C74]" />

        <div className="p-8">
          <div className="mb-8 text-center">
            <div className="mb-4 flex justify-center">
              <Image
                src={Logo}
                alt="Logo"
                priority
                className="h-16 w-auto object-contain"
              />
            </div>
            <h1 className="text-2xl font-black text-[#6C1C74]">Welcome Back</h1>
            <p className="mt-1 text-xs text-gray-500">Sign in with your university account to vote</p>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="mb-6 flex items-center space-x-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-xs font-semibold text-gray-700">
                University Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6C1C74]/60" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@superior.edu"
                  className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-[#6C1C74] focus:outline-none focus:ring-1 focus:ring-[#6C1C74]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-xs font-semibold text-gray-700">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6C1C74]/60" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-[#6C1C74] focus:outline-none focus:ring-1 focus:ring-[#6C1C74]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex w-full items-center justify-center space-x-2 rounded-xl bg-[#6C1C74] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#6C1C74]/25 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            >
              <span>{isLoading ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-6 border-t border-gray-200 pt-6 text-center text-xs text-gray-500">
            Don&apos;t have an account yet?{' '}
            <Link href="/register" className="font-semibold text-[#6C1C74] hover:underline">
              Register here
            </Link>
          </div>

          {/* Demo Credentials Helper */}
          <div className="mt-4 rounded-xl border border-[#6C1C74]/15 bg-[#6C1C74]/5 p-3 text-[11px] text-gray-600">
            <p className="mb-1 font-semibold text-[#6C1C74]">Demo Credentials:</p>
            <p>
              Admin: <code className="font-semibold text-gray-900">admin@superior.edu</code> /{' '}
              <code className="font-semibold text-[#6C1C74]">Superior2026!</code>
            </p>
            <p>
              Voter: <code className="font-semibold text-gray-900">student.voter@superior.edu</code> /{' '}
              <code className="font-semibold text-[#6C1C74]">Superior2026!</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}