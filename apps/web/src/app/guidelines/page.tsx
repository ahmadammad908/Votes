import React from 'react';
import { CheckCircle, ShieldAlert } from 'lucide-react';

export default function GuidelinesPage() {
  return (
    <div className="mx-auto w-full max-w-4xl bg-white px-4 py-12 text-gray-900">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h1 className="mb-2 text-3xl font-black text-[#6C1C74]">
          Community Guidelines &amp; Anti-Harassment Rules
        </h1>
        <p className="text-xs text-gray-500 sm:text-sm">
          Superior Connection is committed to providing a positive, respectful, and safe campus environment.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl shadow-[#6C1C74]/10">
        {/* Top accent */}
        <div className="h-1.5 w-full bg-[#6C1C74]" />

        <div className="space-y-6 p-6 text-xs leading-relaxed text-gray-700 sm:p-8 sm:text-sm">
          <section className="space-y-3 rounded-2xl border border-red-200 bg-red-50 p-5">
            <h2 className="flex items-center space-x-2 text-base font-bold text-red-600">
              <ShieldAlert className="h-4 w-4" />
              <span>Zero Tolerance for Harassment &amp; Bullying</span>
            </h2>
            <p>
              The following actions are strictly prohibited and will trigger immediate account suspension and permanent platform bans:
            </p>
            <ul className="list-inside list-disc space-y-1 pl-2 text-gray-600">
              <li>Derogatory, insulting, body-shaming, or misogynistic comments towards any participant.</li>
              <li>Doxxing, sharing private phone numbers, social handles without permission, or campus dorm addresses.</li>
              <li>Non-consensual upload or submission of another student&apos;s photos.</li>
              <li>Hate speech, racial slurs, or discriminatory language based on identity, gender, or orientation.</li>
            </ul>
          </section>

          <section className="space-y-3 rounded-2xl border border-[#6C1C74]/20 bg-[#6C1C74]/5 p-5">
            <h2 className="flex items-center space-x-2 text-base font-bold text-[#6C1C74]">
              <CheckCircle className="h-4 w-4" />
              <span>Encouraged Community Behaviors</span>
            </h2>
            <ul className="list-inside list-disc space-y-1 pl-2 text-gray-600">
              <li>Cheer for your classmates and represent your academic department with pride.</li>
              <li>Report suspicious accounts or offensive comments promptly to help our moderation team.</li>
              <li>Respect the absolute right of any participant who chooses to delist their profile.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}