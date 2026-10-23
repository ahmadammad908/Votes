'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api';
import {
  Lock, Mail, User as UserIcon, Building2,
  ArrowRight, AlertCircle, ShieldCheck, RefreshCw
} from 'lucide-react';
import { UNIVERSITY_DEPARTMENTS } from '@campusface/shared';
import Logo from '@/assets/images/logo.png';

type Step = 'form' | 'otp';

const inputBase =
  'w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-[#6C1C74] focus:outline-none focus:ring-1 focus:ring-[#6C1C74]';
const iconBase =
  'absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6C1C74]/60';
const labelBase = 'mb-1 block text-xs font-semibold text-gray-700';

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
      await apiClient<{ message: string }>('https://votes-ul7p.onrender.com/api/v1/auth/register/send-otp', {
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
      const data = await apiClient<{ token: string; user: any }>('https://votes-ul7p.onrender.com/api/v1/auth/register/verify-otp', {
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
    <div className="flex flex-1 items-center justify-center bg-gradient-to-b from-[#6C1C74]/5 to-white p-4 py-12">
      <div className="animate-fade-in w-full max-w-md overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl shadow-[#6C1C74]/10">
        {/* Top accent */}
        <div className="h-1.5 w-full bg-[#6C1C74]" />

        <div className="p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mb-4 flex justify-center">
              <Image
                src={Logo}
                alt="Logo"
                priority
                className="h-16 w-auto object-contain"
              />
            </div>
            <h1 className="text-2xl font-black text-[#6C1C74]">
              {step === 'otp' ? 'Verify Your Email' : 'Create Account'}
            </h1>
            <p className="mt-1 text-xs text-gray-500">
              {step === 'otp'
                ? `Enter the 6-digit code sent to ${email}`
                : 'Join Superior Connection with your student email'
              }
            </p>
          </div>

          {/* Error */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-6 flex items-center space-x-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success */}
          {successMessage && (
            <div className="mb-6 flex items-center space-x-2 rounded-xl border border-[#6C1C74]/25 bg-[#6C1C74]/5 p-3 text-xs text-[#6C1C74]">
              <ShieldCheck className="h-4 w-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ── STEP 1: Registration Form ── */}
          {step === 'form' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label htmlFor="email" className={labelBase}>University Email</label>
                <div className="relative">
                  <Mail className={iconBase} />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.name@superior.edu"
                    className={inputBase}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="displayName" className={labelBase}>Display Name</label>
                <div className="relative">
                  <UserIcon className={iconBase} />
                  <input
                    id="displayName"
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className={inputBase}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="department" className={labelBase}>Department (Optional)</label>
                <div className="relative">
                  <Building2 className={iconBase} />
                  <select
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className={inputBase}
                  >
                    <option value="">Select Department (Optional)</option>
                    {UNIVERSITY_DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="password" className={labelBase}>Password</label>
                <div className="relative">
                  <Lock className={iconBase} />
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className={inputBase}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 flex w-full items-center justify-center space-x-2 rounded-xl bg-[#6C1C74] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#6C1C74]/25 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
              >
                <span>{isLoading ? 'Sending Code...' : 'Send Verification Code'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {/* ── STEP 2: OTP Verification ── */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <label htmlFor="otp" className="mb-1 block text-center text-xs font-semibold text-gray-700">
                  6-Digit Verification Code
                </label>
                <input
                  id="otp"
                  type="text"
                  required
                  maxLength={6}
                  pattern="\d{6}"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="● ● ● ● ● ●"
                  className="w-full rounded-xl border border-gray-300 bg-white py-4 text-center text-2xl font-black tracking-[0.5em] text-[#6C1C74] placeholder-gray-300 transition-colors focus:border-[#6C1C74] focus:outline-none focus:ring-1 focus:ring-[#6C1C74]"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="flex w-full items-center justify-center space-x-2 rounded-xl bg-[#6C1C74] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#6C1C74]/25 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>{isLoading ? 'Verifying...' : 'Verify & Create Account'}</span>
              </button>

              {/* Resend + Go Back */}
              <div className="flex items-center justify-between border-t border-gray-200 pt-4 text-xs text-gray-500">
                <button
                  type="button"
                  onClick={() => { setStep('form'); setErrorMessage(null); setSuccessMessage(null); setOtp(''); }}
                  className="transition-colors hover:text-[#6C1C74]"
                >
                  ← Change email
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || isLoading}
                  className="flex items-center space-x-1 font-medium text-[#6C1C74] transition-opacity hover:opacity-80 disabled:opacity-40"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                  </span>
                </button>
              </div>
            </form>
          )}

          {/* Footer */}
          <div className="mt-6 border-t border-gray-200 pt-6 text-center text-xs text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-[#6C1C74] hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}