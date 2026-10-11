import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Heart, Lock, AlertCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-surface-300 border-t border-white/10 mt-auto py-12 text-sm text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-black tracking-wider uppercase gradient-text">
                CAMPUS<span className="text-white">FACE</span>
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed max-w-md">
              A high-performance university beauty voting platform where students compare consenting peers side-by-side. Built with strict privacy standards, zero non-consensual media, anti-harassment safeguards, and immediate consent revocation workflows.
            </p>
            <div className="flex items-center space-x-4 text-xs text-gray-400 pt-2">
              <span className="flex items-center space-x-1 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>100% Consenting Participants</span>
              </span>
              <span className="flex items-center space-x-1 text-brand-cyan">
                <Lock className="w-4 h-4" />
                <span>Encrypted & Audited</span>
              </span>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/battle" className="hover:text-brand-pink transition-colors">
                  Vote Battles
                </Link>
              </li>
              <li>
                <Link href="/leaderboard" className="hover:text-brand-gold transition-colors">
                  University Leaderboard
                </Link>
              </li>
              <li>
                <Link href="/participant/consent" className="hover:text-brand-cyan transition-colors">
                  Contestant Consent Portal
                </Link>
              </li>
              <li>
                <Link href="/account" className="hover:text-white transition-colors">
                  Privacy & Settings
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Safety */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Safety & Legal</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy & Data Rights
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Participation
                </Link>
              </li>
              <li>
                <Link href="/guidelines" className="hover:text-white transition-colors">
                  Community Rules & Anti-Bullying
                </Link>
              </li>
              <li>
                <Link href="/participant/profile" className="text-red-400 hover:text-red-300 transition-colors">
                  Immediate Consent Revocation
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 space-y-4 sm:space-y-0">
          <p>© {new Date().getFullYear()} CampusFace. All rights reserved. Strictly for university community entertainment.</p>
          <div className="flex items-center space-x-2">
            <span>Powered by Next.js, Fastify & PostgreSQL</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
