import React from 'react';
import Link from 'next/link';
import { Flame, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center my-16">
      <div className="w-16 h-16 rounded-2xl bg-brand-pink/20 text-brand-pink flex items-center justify-center mb-4">
        <Flame className="w-8 h-8 fill-brand-pink" />
      </div>
      <h1 className="text-4xl font-black text-white mb-2">404</h1>
      <h2 className="text-lg font-bold text-gray-200 mb-2">Page Not Found</h2>
      <p className="text-xs text-gray-400 max-w-sm mb-6">
        The battle or page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-surface-100 hover:bg-surface-50 text-white font-semibold text-xs border border-white/10 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Home</span>
      </Link>
    </div>
  );
}
