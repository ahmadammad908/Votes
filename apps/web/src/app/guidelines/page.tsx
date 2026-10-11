import React from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

export default function GuidelinesPage() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-12">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h1 className="text-3xl font-black text-white mb-2">Community Guidelines & Anti-Harassment Rules</h1>
        <p className="text-xs sm:text-sm text-gray-400">
          CampusFace is committed to providing a positive, respectful, and safe campus environment.
        </p>
      </div>

      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 text-xs sm:text-sm text-gray-300 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-red-400 flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4" />
            <span>Zero Tolerance for Harassment & Bullying</span>
          </h2>
          <p>
            The following actions are strictly prohibited and will trigger immediate account suspension and permanent platform bans:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-400 pl-2">
            <li>Derogatory, insulting, body-shaming, or misogynistic comments towards any participant.</li>
            <li>Doxxing, sharing private phone numbers, social handles without permission, or campus dorm addresses.</li>
            <li>Non-consensual upload or submission of another student&apos;s photos.</li>
            <li>Hate speech, racial slurs, or discriminatory language based on identity, gender, or orientation.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-emerald-400 flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>Encouraged Community Behaviors</span>
          </h2>
          <ul className="list-disc list-inside space-y-1 text-gray-400 pl-2">
            <li>Cheer for your classmates and represent your academic department with pride.</li>
            <li>Report suspicious accounts or offensive comments promptly to help our moderation team.</li>
            <li>Respect the absolute right of any participant who chooses to delist their profile.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
