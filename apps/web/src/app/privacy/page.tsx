import React from 'react';
import { ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto w-full max-w-4xl bg-white px-4 py-12 text-gray-900">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h1 className="mb-2 text-3xl font-black text-[#6C1C74]">
          Privacy Policy &amp; Student Data Rights
        </h1>
        <p className="text-xs text-gray-500 sm:text-sm">
          Last updated: October 2026 • Version 1.0
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl shadow-[#6C1C74]/10">
        {/* Top accent */}
        <div className="h-1.5 w-full bg-[#6C1C74]" />

        <div className="space-y-6 p-6 text-xs leading-relaxed text-gray-700 sm:p-8 sm:text-sm">
          <section className="space-y-2">
            <h2 className="flex items-center space-x-2 text-base font-bold text-[#6C1C74]">
              <ShieldCheck className="h-4 w-4" />
              <span>1. Zero Web Scraping Commitment</span>
            </h2>
            <p>
              Superior Connection does not scrape, crawl, harvest, or aggregate student photographs or identities from Instagram, Facebook, university directories, or third-party databases. Every contestant profile featured on Superior Connection exists solely because the verified student owner signed an explicit, documented participant agreement.
            </p>
          </section>

          <section className="space-y-2 border-t border-gray-200 pt-6">
            <h2 className="flex items-center space-x-2 text-base font-bold text-[#6C1C74]">
              <Lock className="h-4 w-4" />
              <span>2. Voter Confidentiality</span>
            </h2>
            <p>
              When you cast a vote in a pairwise beauty battle, your individual ballot is stored securely in PostgreSQL with transactional idempotency constraints to prevent duplicate voting. Your individual ballot selections are strictly private and are never exposed publicly or tied to your name on any leaderboard.
            </p>
          </section>

          <section className="space-y-2 border-t border-gray-200 pt-6">
            <h2 className="flex items-center space-x-2 text-base font-bold text-[#6C1C74]">
              <CheckCircle2 className="h-4 w-4" />
              <span>3. Immediate Right of Consent Revocation</span>
            </h2>
            <p>
              Any participating contestant can withdraw consent at any time via the Participant Profile page. Consent withdrawal immediately marks the student profile as removed, closes all active battles featuring the participant, deletes or hides media from public listings, and flushes cached rankings.
            </p>
          </section>

          <section className="space-y-2 border-t border-gray-200 pt-6">
            <h2 className="text-base font-bold text-[#6C1C74]">
              4. Data Retention &amp; Security Standards
            </h2>
            <p>
              All network communication is encrypted using TLS 1.3. User passwords are encrypted with bcrypt. Administrative actions, profile updates, and consent agreements are recorded in audit logs with timestamped hashes to ensure compliance and traceability.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}