'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api';
import { Flame, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

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
    <div className="flex-1 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md bg-surface-100/90 border border-white/10 rounded-3xl p-8 glass-panel shadow-2xl animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-pink/20 text-brand-pink mb-3">
            <Flame className="w-6 h-6 fill-brand-pink" />
          </div>
          <h1 className="text-2xl font-black text-white">Welcome Back</h1>
          <p className="text-xs text-gray-400 mt-1">Sign in with your university account to vote</p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-3 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center space-x-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">University Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@campusface.edu"
                className="w-full pl-10 pr-4 py-3 bg-surface-200 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-pink"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-surface-200 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-pink"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 mt-2 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-brand-pink to-brand-purple hover:opacity-90 active:scale-98 shadow-lg shadow-brand-pink/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{isLoading ? 'Signing in...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-white/10 text-center text-xs text-gray-400">
          Don&apos;t have an account yet?{' '}
          <Link href="/register" className="font-semibold text-brand-pink hover:underline">
            Register here
          </Link>
        </div>

        {/* Demo Credentials Helper */}
        <div className="mt-4 p-3 bg-surface-200/50 rounded-xl border border-white/5 text-[11px] text-gray-400">
          <p className="font-semibold text-gray-300 mb-1">Demo Credentials:</p>
          <p>Admin: <code className="text-brand-cyan">admin@campusface.edu</code> / <code className="text-brand-pink">CampusFace2026!</code></p>
          <p>Voter: <code className="text-brand-cyan">student.voter@campusface.edu</code> / <code className="text-brand-pink">CampusFace2026!</code></p>
        </div>
      </div>
    </div>
  );
}
