'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api';
import { ShieldCheck, CheckCircle, AlertTriangle, ArrowRight, Sparkles, Building2 } from 'lucide-react';
import { CONSENT_TERMS_TEXT, CURRENT_CONSENT_VERSION, UNIVERSITY_DEPARTMENTS } from '@campusface/shared';

export default function ParticipantConsentPage() {
  const router = useRouter();
  const { user, refreshSession } = useAuth();

  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [department, setDepartment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user?.student) {
      setDisplayName(user.student.displayName);
      setDepartment(user.student.department || '');
    }
  }, [user]);

  const [pendingApproval, setPendingApproval] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/login?redirect=/participant/consent');
      return;
    }

    if (!hasReadTerms) {
      setErrorMsg('You must review and check the explicit consent agreement checkbox.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await apiClient<{ pendingApproval: boolean }>('/students/me/consent', {
        method: 'POST',
        body: JSON.stringify({
          agreed: true,
          consentVersion: CURRENT_CONSENT_VERSION,
          displayName: displayName || undefined,
          department: department || undefined
        })
      });

      await refreshSession();

      if (res.pendingApproval) {
        // Profile submitted — waiting for admin approval
        setPendingApproval(true);
      } else {
        // Already approved — go to profile
        router.push('/participant/profile');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit consent');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Pending Approval Screen ──────────────────────────────────────────────
  if (pendingApproval) {
    return (
      <div className="w-full max-w-lg mx-auto px-4 py-20 text-center">
        <div className="glass-panel p-10 rounded-3xl border border-white/10 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 mb-6 mx-auto">
            <ShieldCheck className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-2xl font-black text-white mb-3">Application Submitted! 🎉</h1>
          <p className="text-sm text-gray-400 leading-relaxed mb-6">
            Your contestant profile has been submitted and is currently{' '}
            <span className="text-amber-400 font-semibold">under admin review</span>.
            You will be added to battles once an admin approves your profile.
          </p>
          <div className="p-4 rounded-2xl bg-surface-200/60 border border-white/5 text-left space-y-2 mb-8">
            <div className="flex items-center space-x-2 text-xs text-gray-300">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Consent agreement recorded ✓</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-300">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Profile information saved ✓</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Awaiting admin approval — profile not yet public</span>
            </div>
          </div>
          <button
            onClick={() => router.push('/battle')}
            className="w-full py-3 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-brand-purple to-brand-pink hover:opacity-90 transition-all"
          >
            Browse Battles While You Wait →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-cyan/10 border border-brand-cyan/30 text-xs font-bold text-brand-cyan mb-3">
          <Sparkles className="w-4 h-4" />
          <span>Contestant Onboarding</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">
          Participant Consent Agreement
        </h1>
        <p className="text-xs sm:text-sm text-gray-400">
          CampusFace strictly publishes photographs only with explicit, documented permission. Please review the terms below to participate.
        </p>
      </div>

      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
        {/* Terms Box */}
        <div>
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span className="font-semibold text-gray-200">Legal Agreement ({CURRENT_CONSENT_VERSION})</span>
            <span className="text-emerald-400 flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Right to withdraw at any time</span>
            </span>
          </div>

          <div className="p-4 rounded-xl bg-surface-200/80 border border-white/5 font-mono text-xs text-gray-300 whitespace-pre-line leading-relaxed max-h-60 overflow-y-auto">
            {CONSENT_TERMS_TEXT}
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center space-x-2 text-xs text-red-300">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Profile Inputs */}
        <form onSubmit={handleSubmit} className="space-y-6 pt-4 border-t border-white/10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Contestant Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Jessica Taylor"
                className="w-full px-4 py-2.5 bg-surface-200 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-cyan"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                University Department (Optional)
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface-200 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-brand-cyan"
              >
                <option value="">Select Department</option>
                {UNIVERSITY_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Consent Checkbox */}
          <label className="flex items-start space-x-3 p-4 rounded-2xl bg-surface-200/50 border border-brand-cyan/20 cursor-pointer hover:bg-surface-200 transition-colors">
            <input
              type="checkbox"
              checked={hasReadTerms}
              onChange={(e) => setHasReadTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-600 text-brand-cyan focus:ring-brand-cyan"
            />
            <div className="text-xs text-gray-300 leading-relaxed">
              <strong className="text-white">I confirm and certify:</strong> I am the student pictured in my uploaded photos, I voluntarily give explicit permission to be featured in CampusFace beauty battles, and I understand I can withdraw consent and delist my profile at any time.
            </div>
          </label>

          <button
            type="submit"
            disabled={isSubmitting || !hasReadTerms}
            className="w-full py-4 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-pink hover:opacity-90 active:scale-98 shadow-xl shadow-brand-cyan/15 transition-all flex items-center justify-center space-x-2 disabled:opacity-40"
          >
            <span>{isSubmitting ? 'Recording Consent...' : 'Sign Agreement & Proceed to Upload'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
