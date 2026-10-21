import React from 'react';

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl bg-white px-4 py-12 text-gray-900">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h1 className="mb-2 text-3xl font-black text-[#6C1C74]">Terms of Participation</h1>
        <p className="text-xs text-gray-500 sm:text-sm">
          Last updated: October 2026 • Version 1.0
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl shadow-[#6C1C74]/10">
        {/* Top accent */}
        <div className="h-1.5 w-full bg-[#6C1C74]" />

        <div className="space-y-6 p-6 text-xs leading-relaxed text-gray-700 sm:p-8 sm:text-sm">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#6C1C74]">
              1. University Community Eligibility
            </h2>
            <p>
              Superior Connection is designed exclusively for university students. By creating an account, you affirm that you are an adult student attending an accredited institution and using a legitimate email address.
            </p>
          </section>

          <section className="space-y-2 border-t border-gray-200 pt-6">
            <h2 className="text-base font-bold text-[#6C1C74]">
              2. Single Category Voting Rules
            </h2>
            <p>
              Superior Connection battles feature a single voting dimension: Beauty. Numerical rating scales, star ratings, and derogatory comparison categories are strictly prohibited on the platform.
            </p>
          </section>

          <section className="space-y-2 border-t border-gray-200 pt-6">
            <h2 className="text-base font-bold text-[#6C1C74]">
              3. Integrity of Voting Process
            </h2>
            <p>
              Users may only cast one vote per 1-vs-1 battle. Automated script voting, bot manipulation, rate limit circumvention, or ballot stuffing will result in immediate IP and account bans.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}