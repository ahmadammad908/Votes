'use client';

import React, { useState } from 'react';
import { apiClient } from '@/lib/api';
import { AlertCircle, X, CheckCircle2 } from 'lucide-react';
import { ReportTargetType } from '@campusface/shared';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  targetName?: string;
}

const REPORT_REASONS = [
  'Harassment, bullying, or derogatory language',
  'Non-consensual photo upload or impersonation',
  'Inappropriate or offensive content',
  'Spam or bot activity',
  'Other violation of community guidelines'
];

export function ReportModal({ isOpen, onClose, targetType, targetId, targetName }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [customDetails, setCustomDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const fullReason = customDetails ? `${selectedReason}: ${customDetails}` : selectedReason;

    try {
      await apiClient('/reports', {
        method: 'POST',
        body: JSON.stringify({
          targetType,
          targetId,
          reason: fullReason
        })
      });
      setSuccessMessage('Thank you for reporting. Our moderation team will review this shortly.');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit report. Please log in first.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-surface-100 border border-white/10 rounded-2xl p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 text-brand-pink mb-4">
          <AlertCircle className="w-5 h-5" />
          <h3 className="text-lg font-bold text-white">Report {targetType.toLowerCase()}</h3>
        </div>

        {targetName && (
          <p className="text-xs text-gray-400 mb-4">
            Reporting target: <span className="text-gray-200 font-semibold">{targetName}</span>
          </p>
        )}

        {successMessage ? (
          <div className="flex items-center space-x-2 text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-xl text-sm">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="text-xs text-red-400 bg-red-950/40 border border-red-500/30 p-3 rounded-lg">
                {errorMessage}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2">Select Reason</label>
              <div className="space-y-2">
                {REPORT_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className={`flex items-center space-x-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                      selectedReason === reason
                        ? 'border-brand-pink bg-brand-pink/10 text-white'
                        : 'border-white/5 bg-surface-200 text-gray-300 hover:bg-surface-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={() => setSelectedReason(reason)}
                      className="text-brand-pink focus:ring-brand-pink"
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Additional details (optional)</label>
              <textarea
                value={customDetails}
                onChange={(e) => setCustomDetails(e.target.value)}
                placeholder="Provide any relevant context..."
                className="w-full h-20 px-3 py-2 bg-surface-200 border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-pink resize-none"
                maxLength={300}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-semibold text-white bg-brand-pink hover:bg-brand-pink/90 rounded-lg transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
