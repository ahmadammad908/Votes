import React from 'react';

export default function TermsPage() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-12">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h1 className="text-3xl font-black text-white mb-2">Terms of Participation</h1>
        <p className="text-xs sm:text-sm text-gray-400">
          Last updated: October 2026 • Version 1.0
        </p>
      </div>

      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 text-xs sm:text-sm text-gray-300 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">1. University Community Eligibility</h2>
          <p>
            CampusFace is designed exclusively for university students. By creating an account, you affirm that you are an adult student attending an accredited institution and using a legitimate email address.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">2. Single Category Voting Rules</h2>
          <p>
            CampusFace battles feature a single voting dimension: Beauty. Numerical rating scales, star ratings, and derogatory comparison categories are strictly prohibited on the platform.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">3. Integrity of Voting Process</h2>
          <p>
            Users may only cast one vote per 1-vs-1 battle. Automated script voting, bot manipulation, rate limit circumvention, or ballot stuffing will result in immediate IP and account bans.
          </p>
        </section>
      </div>
    </div>
  );
}
