'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { 
  Flame, 
  Trophy, 
  User as UserIcon, 
  ShieldCheck, 
  LogOut, 
  Menu, 
  X, 
  Sparkles,
  ShieldAlert
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-white/10 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-pink via-brand-purple to-brand-cyan p-[1.5px] group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full bg-surface-200 rounded-[10px] flex items-center justify-center">
                <Flame className="w-5 h-5 text-brand-pink fill-brand-pink group-hover:text-brand-gold transition-colors" />
              </div>
            </div>
            <div>
              <span className="text-xl font-black tracking-wider uppercase gradient-text">
                CAMPUS<span className="text-white">FACE</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] font-semibold text-gray-400 ml-2 px-1.5 py-0.5 rounded bg-surface-100 border border-white/5">
                BEAUTY VOTE
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              href="/battle"
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/battle')
                  ? 'bg-brand-purple/20 text-brand-pink border border-brand-pink/30'
                  : 'text-gray-300 hover:text-white hover:bg-surface-100'
              }`}
            >
              <Flame className="w-4 h-4 text-brand-pink" />
              <span>Vote Battles</span>
            </Link>

            <Link
              href="/leaderboard"
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/leaderboard')
                  ? 'bg-brand-purple/20 text-brand-gold border border-brand-gold/30'
                  : 'text-gray-300 hover:text-white hover:bg-surface-100'
              }`}
            >
              <Trophy className="w-4 h-4 text-brand-gold" />
              <span>Leaderboard</span>
            </Link>

            <Link
              href="/participant/consent"
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/participant/consent') || isActive('/participant/profile')
                  ? 'bg-brand-purple/20 text-brand-cyan border border-brand-cyan/30'
                  : 'text-gray-300 hover:text-white hover:bg-surface-100'
              }`}
            >
              <Sparkles className="w-4 h-4 text-brand-cyan" />
              <span>Join as Contestant</span>
            </Link>

            {user && (user.role === 'ADMIN' || user.role === 'MODERATOR') && (
              <Link
                href="/admin"
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium text-amber-400 hover:bg-amber-400/10 border border-amber-400/20 transition-colors`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Admin</span>
              </Link>
            )}
          </div>

          {/* Auth Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <Link
                  href="/account"
                  className="flex items-center space-x-2 text-sm text-gray-200 hover:text-white bg-surface-100 px-3 py-1.5 rounded-lg border border-white/10"
                >
                  <UserIcon className="w-4 h-4 text-brand-purple" />
                  <span className="font-medium truncate max-w-[120px]">{user.email.split('@')[0]}</span>
                </Link>
                <button
                  onClick={() => logout()}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-surface-100 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-1.5 text-sm font-semibold text-white bg-gradient-to-r from-brand-pink to-brand-purple hover:opacity-90 rounded-lg shadow-lg shadow-brand-pink/20 transition-all duration-200"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-surface-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-surface-200 border-b border-white/10 px-4 pt-2 pb-6 space-y-2 animate-fade-in">
          <Link
            href="/battle"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-base font-medium text-gray-200 hover:bg-surface-100"
          >
            <Flame className="w-5 h-5 text-brand-pink" />
            <span>Vote Battles</span>
          </Link>
          <Link
            href="/leaderboard"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-base font-medium text-gray-200 hover:bg-surface-100"
          >
            <Trophy className="w-5 h-5 text-brand-gold" />
            <span>Leaderboard</span>
          </Link>
          <Link
            href="/participant/consent"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-base font-medium text-gray-200 hover:bg-surface-100"
          >
            <Sparkles className="w-5 h-5 text-brand-cyan" />
            <span>Join as Contestant</span>
          </Link>

          {user && (user.role === 'ADMIN' || user.role === 'MODERATOR') && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-base font-medium text-amber-400 hover:bg-surface-100"
            >
              <ShieldAlert className="w-5 h-5" />
              <span>Admin Moderation</span>
            </Link>
          )}

          <div className="pt-4 border-t border-white/10">
            {user ? (
              <div className="space-y-2">
                <Link
                  href="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-base font-medium text-gray-200 hover:bg-surface-100"
                >
                  <UserIcon className="w-5 h-5 text-brand-purple" />
                  <span>My Account ({user.email})</span>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-base font-medium text-red-400 hover:bg-surface-100 text-left"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-lg text-sm font-medium text-gray-200 bg-surface-100 hover:bg-surface-50"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-brand-pink to-brand-purple"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
