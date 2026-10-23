'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiClient, getImageUrl } from '@/lib/api';
import { 
  Upload, 
  Trash2, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  UserCheck, 
  Flame, 
  Camera,
  ArrowRight
} from 'lucide-react';
import { StudentProfileDTO } from '@campusface/shared';

export default function ParticipantProfilePage() {
  const router = useRouter();
  const { user, refreshSession } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [student, setStudent] = useState<StudentProfileDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Consent Withdrawal Modal State
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient<{ student: StudentProfileDTO; hasProfile: boolean }>('/students/me');
      if (!data.hasProfile || !data.student) {
        router.push('/participant/consent');
        return;
      }
      setStudent(data.student);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load participant profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  // Handle File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size exceeds the 5MB limit.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    setErrorMessage(null);
    setUploadMessage(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('campusface_auth_token') : null;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://votes-ul7p.onrender.com/api/v1'}/students/upload-photo`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      setUploadMessage('Photo uploaded and updated successfully!');
      await loadProfile();
      await refreshSession();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  // Withdraw Consent
  const handleWithdrawConsent = async () => {
    setIsWithdrawing(true);
    try {
      await apiClient('/students/me/withdraw-consent', {
        method: 'POST'
      });
      await refreshSession();
      setWithdrawalModalOpen(false);
      await loadProfile();
    } catch (err: any) {
      alert(err.message || 'Failed to withdraw consent');
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-8 h-8 rounded-full border-2 border-brand-cyan border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h1 className="text-3xl font-black text-white mb-2">Contestant Profile & Media</h1>
        <p className="text-xs sm:text-sm text-gray-400">
          Manage your verified student photograph and participation settings.
        </p>
      </div>

      {uploadMessage && (
        <div className="mb-6 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center space-x-2 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{uploadMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-3 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center space-x-2 text-xs text-red-300">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {student && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Photo & Upload Box */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col items-center text-center space-y-4">
            <div className="relative w-48 h-60 rounded-2xl overflow-hidden bg-surface-200 border border-white/10 group">
              <img
                src={getImageUrl(student.imageUrl)}
                alt={student.displayName}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || student.consentStatus === 'WITHDRAWN'}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity cursor-pointer"
              >
                <Camera className="w-6 h-6 mb-1" />
                <span className="text-xs font-semibold">Change Photo</span>
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || student.consentStatus === 'WITHDRAWN'}
              className="w-full py-2.5 rounded-xl bg-surface-100 hover:bg-surface-50 border border-white/10 text-xs font-semibold text-white flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isUploading ? 'Uploading...' : 'Upload New Photo'}</span>
            </button>
            <p className="text-[10px] text-gray-400">Supported: JPG, PNG, WEBP (Max 5MB)</p>
          </div>

          {/* Details & Status */}
          <div className="md:col-span-2 glass-panel p-6 rounded-3xl border border-white/10 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-white">{student.displayName}</h2>
                  <p className="text-xs text-brand-pink font-semibold">{student.department || 'General University'}</p>
                </div>
                <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-brand-pink/10 border border-brand-pink/30 text-xs font-bold text-brand-pink">
                  <Flame className="w-3.5 h-3.5 fill-brand-pink" />
                  <span>{student.totalVotes || 0} Votes</span>
                </div>
              </div>

              {/* Status Badges */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-surface-200 border border-white/5">
                  <span className="text-[11px] text-gray-400 block">Consent Status</span>
                  <span className={`text-xs font-bold ${
                    student.consentStatus === 'ACTIVE' ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {student.consentStatus}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-surface-200 border border-white/5">
                  <span className="text-[11px] text-gray-400 block">Battle Listing Status</span>
                  <span className={`text-xs font-bold ${
                    student.profileStatus === 'APPROVED' ? 'text-brand-cyan' : 'text-amber-400'
                  }`}>
                    {student.profileStatus}
                  </span>
                </div>
              </div>

              {student.consentStatus === 'WITHDRAWN' && (
                <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300">
                  You have withdrawn your consent. Your profile is completely delisted from all active and future battles.
                </div>
              )}
            </div>

            {/* Consent Withdrawal Action Section */}
            <div className="pt-6 border-t border-white/10">
              {student.consentStatus === 'ACTIVE' ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="text-xs text-gray-400 max-w-sm">
                    <strong className="text-red-400 block mb-0.5">Withdraw Consent & Delist</strong>
                    Instantly removes your photo and profile from all active and future battles.
                  </div>
                  <button
                    onClick={() => setWithdrawalModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-semibold text-xs transition-colors flex items-center space-x-1.5 flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Withdraw Consent</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => router.push('/participant/consent')}
                  className="w-full py-3 rounded-xl bg-brand-cyan/10 hover:bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30 font-semibold text-xs transition-colors"
                >
                  Re-sign Consent Agreement to Participate
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {withdrawalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-surface-100 border border-red-500/30 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center space-x-2 text-red-400 mb-3">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Withdraw Consent & Delist?</h3>
            </div>
            <p className="text-xs text-gray-300 mb-6 leading-relaxed">
              This action will immediately close all active battles featuring you and delist your profile from public searches and future matchups.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setWithdrawalModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdrawConsent}
                disabled={isWithdrawing}
                className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {isWithdrawing ? 'Withdrawing...' : 'Confirm Delisting'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
