'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api';
import {
  Flame, Lock, Mail, User as UserIcon, Building2,
  ArrowRight, AlertCircle, ShieldCheck, RefreshCw
} from 'lucide-react';
import { UNIVERSITY_DEPARTMENTS } from '@campusface/shared';

type Step = 'form' | 'otp';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  // ── Form step state ──────────────────────────────────────
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [department, setDepartment] = useState('');

  // ── OTP step state ───────────────────────────────────────
  const [step, setStep] = useState<Step>('form');
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // ── Shared state ─────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ── Step 1: Send OTP ──────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await apiClient<{ message: string }>('/auth/register/send-otp', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          displayName,
          department: department || undefined
        })
      });

      setStep('otp');
      setSuccessMessage(`Verification code sent to ${email}`);
      startResendCooldown();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 2: Verify OTP & complete registration ────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await apiClient<{ token: string; user: any }>('/auth/register/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp })
      });

      login(data.token, data.user);
      router.push('/battle');
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await apiClient<{ message: string }>('/auth/register/send-otp', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          displayName,
          department: department || undefined
        })
      });
      setSuccessMessage('New verification code sent!');
      setOtp('');
      startResendCooldown();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  /** 60-second resend cooldown */
  const startResendCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md bg-surface-100/90 border border-white/10 rounded-3xl p-8 glass-panel shadow-2xl animate-fade-in">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-purple/20 text-brand-purple mb-3">
            {step === 'otp'
              ? <ShieldCheck className="w-6 h-6 text-brand-purple" />
              : <Flame className="w-6 h-6 fill-brand-purple" />
            }
          </div>
          <h1 className="text-2xl font-black text-white">
            {step === 'otp' ? 'Verify Your Email' : 'Create Account'}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            {step === 'otp'
              ? `Enter the 6-digit code sent to ${email}`
              : 'Join CampusFace with your student email'
            }
          </p>
        </div>

        {/* Error */}
        {errorMessage && (
          <div className="mb-6 p-3 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center space-x-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success */}
        {successMessage && (
          <div className="mb-6 p-3 rounded-xl bg-green-950/40 border border-green-500/30 flex items-center space-x-2 text-xs text-green-300">
            <ShieldCheck className="w-4 h-4 text-green-400 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ── STEP 1: Registration Form ── */}
        {step === 'form' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">University Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.name@campusface.edu"
                  className="w-full pl-10 pr-4 py-3 bg-surface-200 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-purple"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Display Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full pl-10 pr-4 py-3 bg-surface-200 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-purple"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Department (Optional)</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-surface-200 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-brand-purple"
                >
                  <option value="">Select Department (Optional)</option>
                  {UNIVERSITY_DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full pl-10 pr-4 py-3 bg-surface-200 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-purple"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 mt-2 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-brand-purple to-brand-pink hover:opacity-90 active:scale-98 shadow-lg shadow-brand-purple/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{isLoading ? 'Sending Code...' : 'Send Verification Code'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ── STEP 2: OTP Verification ── */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1 text-center">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                pattern="\d{6}"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="● ● ● ● ● ●"
                className="w-full text-center text-2xl font-black tracking-[0.5em] py-4 bg-surface-200 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-brand-purple"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-brand-purple to-brand-pink hover:opacity-90 active:scale-98 shadow-lg shadow-brand-purple/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isLoading ? 'Verifying...' : 'Verify & Create Account'}</span>
            </button>

            {/* Resend + Go Back */}
            <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => { setStep('form'); setErrorMessage(null); setSuccessMessage(null); setOtp(''); }}
                className="hover:text-white transition-colors"
              >
                ← Change email
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || isLoading}
                className="flex items-center space-x-1 hover:text-white transition-colors disabled:opacity-40"
              >
                <RefreshCw className="w-3 h-3" />
                <span>
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </span>
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-white/10 text-center text-xs text-gray-400">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-brand-purple hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
