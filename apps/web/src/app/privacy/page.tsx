import React from 'react';
import { ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-12">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h1 className="text-3xl font-black text-white mb-2">Privacy Policy & Student Data Rights</h1>
        <p className="text-xs sm:text-sm text-gray-400">
          Last updated: October 2026 • Version 1.0
        </p>
      </div>

      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 text-xs sm:text-sm text-gray-300 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>1. Zero Web Scraping Commitment</span>
          </h2>
          <p>
            CampusFace does not scrape, crawl, harvest, or aggregate student photographs or identities from Instagram, Facebook, university directories, or third-party databases. Every contestant profile featured on CampusFace exists solely because the verified student owner signed an explicit, documented participant agreement.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Lock className="w-4 h-4 text-brand-purple" />
            <span>2. Voter Confidentiality</span>
          </h2>
          <p>
            When you cast a vote in a pairwise beauty battle, your individual ballot is stored securely in PostgreSQL with transactional idempotency constraints to prevent duplicate voting. Your individual ballot selections are strictly private and are never exposed publicly or tied to your name on any leaderboard.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-brand-pink" />
            <span>3. Immediate Right of Consent Revocation</span>
          </h2>
          <p>
            Any participating contestant can withdraw consent at any time via the Participant Profile page. Consent withdrawal immediately marks the student profile as removed, closes all active battles featuring the participant, deletes or hides media from public listings, and flushes cached rankings.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">4. Data Retention & Security Standards</h2>
          <p>
            All network communication is encrypted using TLS 1.3. User passwords are encrypted with bcrypt. Administrative actions, profile updates, and consent agreements are recorded in audit logs with timestamped hashes to ensure compliance and traceability.
          </p>
        </section>
      </div>
    </div>
  );
}
