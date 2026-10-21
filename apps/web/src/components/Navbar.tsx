'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  Flame,
  Trophy,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import Superior from '@/assets/images/Superior.png';

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  const linkBase =
    'flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors border';
  const linkActive = 'bg-[#6C1C74]/10 text-[#6C1C74] border-[#6C1C74]/30';
  const linkIdle =
    'text-gray-700 border-transparent hover:text-[#6C1C74] hover:bg-[#6C1C74]/5';

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center group" aria-label="Home">
            <Image
              src={Superior}
              alt="Superior"
              priority
              className="h-10 w-auto object-contain group-hover:scale-105 transition-transform duration-200"
            />
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              href="/battle"
              className={`${linkBase} ${isActive('/battle') ? linkActive : linkIdle}`}
            >
              <Flame className="w-4 h-4 text-[#6C1C74]" />
              <span>Vote Battles</span>
            </Link>

            <Link
              href="/leaderboard"
              className={`${linkBase} ${isActive('/leaderboard') ? linkActive : linkIdle}`}
            >
              <Trophy className="w-4 h-4 text-[#6C1C74]" />
              <span>Leaderboard</span>
            </Link>

            <Link
              href="/participant/consent"
              className={`${linkBase} ${
                isActive('/participant/consent') || isActive('/participant/profile')
                  ? linkActive
                  : linkIdle
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#6C1C74]" />
              <span>Join as Contestant</span>
            </Link>

            {user && (user.role === 'ADMIN' || user.role === 'MODERATOR') && (
              <Link
                href="/admin"
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium text-[#6C1C74] hover:bg-[#6C1C74]/10 border border-[#6C1C74]/30 transition-colors"
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
                  className="flex items-center space-x-2 text-sm text-gray-800 hover:text-[#6C1C74] bg-white px-3 py-1.5 rounded-lg border border-gray-200 hover:border-[#6C1C74]/40 transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-[#6C1C74]" />
                  <span className="font-medium truncate max-w-[120px]">
                    {user.email.split('@')[0]}
                  </span>
                </Link>
                <button
                  onClick={() => logout()}
                  className="p-2 text-gray-500 hover:text-red-500 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 text-sm font-medium text-gray-700 hover:text-[#6C1C74] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-1.5 text-sm font-semibold text-white bg-[#6C1C74] hover:opacity-90 rounded-lg shadow-md shadow-[#6C1C74]/20 transition-all duration-200"
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
              className="p-2 rounded-lg text-gray-600 hover:text-[#6C1C74] hover:bg-[#6C1C74]/5"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-4 pt-2 pb-6 space-y-2 animate-fade-in">
          <Link
            href="/battle"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-base font-medium text-gray-800 hover:bg-[#6C1C74]/5"
          >
            <Flame className="w-5 h-5 text-[#6C1C74]" />
            <span>Vote Battles</span>
          </Link>
          <Link
            href="/leaderboard"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-base font-medium text-gray-800 hover:bg-[#6C1C74]/5"
          >
            <Trophy className="w-5 h-5 text-[#6C1C74]" />
            <span>Leaderboard</span>
          </Link>
          <Link
            href="/participant/consent"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-base font-medium text-gray-800 hover:bg-[#6C1C74]/5"
          >
            <Sparkles className="w-5 h-5 text-[#6C1C74]" />
            <span>Join as Contestant</span>
          </Link>

          {user && (user.role === 'ADMIN' || user.role === 'MODERATOR') && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-base font-medium text-[#6C1C74] hover:bg-[#6C1C74]/5"
            >
              <ShieldAlert className="w-5 h-5" />
              <span>Admin Moderation</span>
            </Link>
          )}

          <div className="pt-4 border-t border-gray-200">
            {user ? (
              <div className="space-y-2">
                <Link
                  href="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-base font-medium text-gray-800 hover:bg-[#6C1C74]/5"
                >
                  <UserIcon className="w-5 h-5 text-[#6C1C74]" />
                  <span>My Account ({user.email})</span>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-base font-medium text-red-500 hover:bg-red-50 text-left"
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
                  className="w-full text-center py-2.5 rounded-lg text-sm font-medium text-[#6C1C74] border border-[#6C1C74]/30 hover:bg-[#6C1C74]/5"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-lg text-sm font-semibold text-white bg-[#6C1C74] hover:opacity-90"
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