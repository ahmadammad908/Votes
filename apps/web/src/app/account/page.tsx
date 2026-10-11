'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { User, ShieldCheck, Lock, LogOut, Flame, Sparkles } from 'lucide-react';

export default function AccountPage() {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Sign in required</h2>
        <p className="text-xs text-gray-400 mb-6">Please log in to manage your account and privacy preferences.</p>
        <Link
          href="/login"
          className="px-6 py-2.5 rounded-xl bg-brand-pink text-white font-semibold text-xs"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-12">
      <div className="text-center max-w-md mx-auto mb-10">
        <h1 className="text-3xl font-black text-white mb-2">Account & Privacy</h1>
        <p className="text-xs text-gray-400">Manage your university credentials and privacy controls.</p>
      </div>

      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
        {/* User Info */}
        <div className="flex items-center space-x-4 pb-6 border-b border-white/10">
          <div className="w-14 h-14 rounded-2xl bg-brand-purple/20 text-brand-purple flex items-center justify-center font-bold text-xl">
            {user.email.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{user.email}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-surface-200 border border-white/10 text-brand-cyan">
                Role: {user.role}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-surface-200 border border-white/10 text-emerald-400">
                Status: {user.accountStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Voting Privacy Notice */}
        <div className="p-4 rounded-2xl bg-surface-200 border border-white/5 space-y-2">
          <div className="flex items-center space-x-2 text-brand-gold text-xs font-bold">
            <Lock className="w-4 h-4" />
            <span>Voter Ballot Confidentiality</span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Your individual votes in one-vs-one battles are cryptographically tied to your unique user ID for duplicate prevention, but are never displayed publicly or associated with your name on leaderboards.
          </p>
        </div>

        {/* Participant Status */}
        <div className="p-4 rounded-2xl bg-surface-200 border border-white/5 flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-white flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
              <span>Contestant Profile</span>
            </h4>
            <p className="text-xs text-gray-400">
              {user.student ? `Active profile under "${user.student.displayName}"` : 'You have not joined as a battle contestant.'}
            </p>
          </div>
          <Link
            href={user.student ? '/participant/profile' : '/participant/consent'}
            className="px-4 py-2 rounded-xl bg-surface-100 hover:bg-surface-50 text-white font-semibold text-xs border border-white/10 transition-colors"
          >
            {user.student ? 'Manage Contestant Profile' : 'Sign Up as Contestant'}
          </Link>
        </div>

        {/* Logout */}
        <div className="pt-4 flex justify-end">
          <button
            onClick={() => logout()}
            className="px-5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold flex items-center space-x-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
