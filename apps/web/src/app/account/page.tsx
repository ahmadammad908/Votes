'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { LogOut, Lock, Sparkles } from 'lucide-react';

export default function AccountPage() {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-white p-8 text-center">
        <h2 className="mb-2 text-xl font-bold text-[#6C1C74]">Sign in required</h2>
        <p className="mb-6 text-xs text-gray-500">
          Please log in to manage your account and privacy preferences.
        </p>
        <Link
          href="/login"
          className="rounded-xl bg-[#6C1C74] px-6 py-2.5 text-xs font-semibold text-white shadow-md shadow-[#6C1C74]/20 transition-opacity hover:opacity-90"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl bg-white px-4 py-12 text-gray-900">
      <div className="mx-auto mb-10 max-w-md text-center">
        <h1 className="mb-2 text-3xl font-black text-[#6C1C74]">Account &amp; Privacy</h1>
        <p className="text-xs text-gray-500">
          Manage your university credentials and privacy controls.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl shadow-[#6C1C74]/10">
        {/* Top accent */}
        <div className="h-1.5 w-full bg-[#6C1C74]" />

        <div className="space-y-6 p-6 sm:p-8">
          {/* User Info */}
          <div className="flex items-center space-x-4 border-b border-gray-200 pb-6">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#6C1C74] text-xl font-bold text-white">
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-base font-bold text-gray-900">{user.email}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[#6C1C74]/25 bg-[#6C1C74]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#6C1C74]">
                  Role: {user.role}
                </span>
                <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-[11px] font-semibold text-gray-700">
                  Status: {user.accountStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Voting Privacy Notice */}
          <div className="space-y-2 rounded-2xl border border-[#6C1C74]/15 bg-[#6C1C74]/5 p-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#6C1C74]">
              <Lock className="h-4 w-4" />
              <span>Voter Ballot Confidentiality</span>
            </div>
            <p className="text-xs leading-relaxed text-gray-600">
              Your individual votes in one-vs-one battles are cryptographically tied to your unique user ID for duplicate prevention, but are never displayed publicly or associated with your name on leaderboards.
            </p>
          </div>

          {/* Participant Status */}
          <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h4 className="flex items-center space-x-1.5 text-xs font-bold text-gray-900">
                <Sparkles className="h-3.5 w-3.5 text-[#6C1C74]" />
                <span>Contestant Profile</span>
              </h4>
              <p className="text-xs text-gray-500">
                {user.student
                  ? `Active profile under "${user.student.displayName}"`
                  : 'You have not joined as a battle contestant.'}
              </p>
            </div>
            <Link
              href={user.student ? '/participant/profile' : '/participant/consent'}
              className="shrink-0 rounded-xl bg-[#6C1C74] px-4 py-2 text-center text-xs font-semibold text-white transition-opacity hover:opacity-90"
            >
              {user.student ? 'Manage Contestant Profile' : 'Sign Up as Contestant'}
            </Link>
          </div>

          {/* Logout */}
          <div className="flex justify-end border-t border-gray-200 pt-4">
            <button
              onClick={() => logout()}
              className="flex items-center space-x-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}