import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Lock } from 'lucide-react';
import Superior from '@/assets/images/Superior.png';

const PLATFORM_LINKS = [
  { href: '/battle', label: 'Vote Battles' },
  { href: '/leaderboard', label: 'University Leaderboard' },
  { href: '/participant/consent', label: 'Contestant Consent Portal' },
  { href: '/account', label: 'Privacy & Settings' },
];

const LEGAL_LINKS = [
  { href: '/privacy', label: 'Privacy Policy & Data Rights' },
  { href: '/terms', label: 'Terms of Participation' },
  { href: '/guidelines', label: 'Community Rules & Anti-Bullying' },
  { href: '/participant/profile', label: 'Immediate Consent Revocation' },
];

export function Footer() {
  return (
    <footer className="mt-auto w-full border-t border-gray-200 bg-white text-sm text-gray-600">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-2">
            <Link href="/" aria-label="Home" className="inline-block">
              <Image
                src={Superior}
                alt="Superior"
                className="h-10 w-auto object-contain"
              />
            </Link>
            <p className="max-w-md text-xs leading-relaxed text-gray-600">
              A high-performance university beauty voting platform where students compare
              consenting peers side-by-side. Built with strict privacy standards, zero
              non-consensual media, anti-harassment safeguards, and immediate consent
              revocation workflows.
            </p>
            <div className="flex items-center space-x-4 pt-2 text-xs text-[#6C1C74]">
              <span className="flex items-center space-x-1">
                <ShieldCheck className="h-4 w-4" />
                <span>100% Consenting Participants</span>
              </span>
              <span className="flex items-center space-x-1">
                <Lock className="h-4 w-4" />
                <span>Encrypted &amp; Audited</span>
              </span>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#6C1C74]">
              Platform
            </h4>
            <ul className="space-y-2 text-xs">
              {PLATFORM_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-gray-600 transition-colors hover:text-[#6C1C74]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Safety */}
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#6C1C74]">
              Safety &amp; Legal
            </h4>
            <ul className="space-y-2 text-xs">
              {LEGAL_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-gray-600 transition-colors hover:text-[#6C1C74]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between space-y-4 border-t border-gray-200 pt-8 text-xs text-gray-500 sm:flex-row sm:space-y-0">
          <p>
            &copy; {new Date().getFullYear()} Superior Connection. All rights reserved. Strictly for
            university community entertainment.
          </p>
          <p>Powered by Next.js, Fastify &amp; PostgreSQL</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;