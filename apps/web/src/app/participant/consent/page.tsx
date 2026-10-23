'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiClient, getImageUrl } from '@/lib/api';
import {
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Upload,
  Camera,
  X,
  Clock,
  UserCheck
} from 'lucide-react';
import { CONSENT_TERMS_TEXT, CURRENT_CONSENT_VERSION, UNIVERSITY_DEPARTMENTS } from '@campusface/shared';

export default function ParticipantConsentPage() {
  const router = useRouter();
  const { user, refreshSession } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [department, setDepartment] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    name: string;
    department: string;
    imageUrl?: string | null;
  } | null>(null);

  useEffect(() => {
    if (user?.student) {
      setDisplayName(user.student.displayName || '');
      setDepartment(user.student.department || '');
      if (user.student.imageUrl) {
        setPreviewUrl(getImageUrl(user.student.imageUrl));
      }
      if (user.student.profileStatus === 'PENDING') {
        setPendingApproval(true);
        setSubmittedData({
          name: user.student.displayName,
          department: user.student.department || '',
          imageUrl: getImageUrl(user.student.imageUrl)
        });
      }
    }
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size exceeds the 5MB limit. Please select a smaller photo.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg('Please upload a valid image file (JPG, PNG, or WebP).');
      return;
    }

    setErrorMsg(null);
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/login?redirect=/participant/consent');
      return;
    }

    if (!displayName.trim()) {
      setErrorMsg('Please enter your contestant display name.');
      return;
    }

    if (!department) {
      setErrorMsg('Please select your university department.');
      return;
    }

    if (!selectedFile && !previewUrl) {
      setErrorMsg('Please upload your contestant photo to participate.');
      return;
    }

    if (!hasReadTerms) {
      setErrorMsg('You must review and check the explicit consent agreement checkbox.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      let uploadedImageUrl: string | undefined = undefined;
      let uploadedStorageKey: string | undefined = undefined;

      // 1. Upload the image file if user picked a new file
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const token = typeof window !== 'undefined' ? localStorage.getItem('campusface_auth_token') : null;
        const uploadRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'https://votes-ul7p.onrender.com/api/v1'}/students/upload-photo`,
          {
            method: 'POST',
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            credentials: 'include',
            body: formData
          }
        );

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.message || 'Photo upload failed. Please try again.');
        }

        uploadedImageUrl = uploadData.imageUrl;
        uploadedStorageKey = uploadData.storageKey;
      }

      // 2. Submit consent with name, department, and image details
      const res = await apiClient<{ pendingApproval: boolean }>('/students/me/consent', {
        method: 'POST',
        body: JSON.stringify({
          agreed: true,
          consentVersion: CURRENT_CONSENT_VERSION,
          displayName: displayName.trim(),
          department,
          imageUrl: uploadedImageUrl,
          imageStorageKey: uploadedStorageKey
        })
      });

      await refreshSession();

      setSubmittedData({
        name: displayName.trim(),
        department,
        imageUrl: previewUrl || uploadedImageUrl
      });

      // Show Pending Admin Approval screen
      setPendingApproval(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit consent application');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Pending Approval / Verification Screen ──────────────────────────────────────────────
  if (pendingApproval) {
    return (
      <div className="mx-auto w-full max-w-lg bg-white px-4 py-16 text-center text-gray-900">
        <div className="animate-fade-in rounded-3xl border border-gray-200 bg-white p-8 shadow-xl sm:p-10">
          <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-[#6C1C74]/30 bg-[#6C1C74]/10">
            <Clock className="h-8 w-8 text-[#6C1C74]" />
          </div>

          <h1 className="mb-2 text-2xl font-black text-[#6C1C74]">Application Submitted! 🎉</h1>
          <p className="mb-6 text-xs leading-relaxed text-gray-600 sm:text-sm">
            Your contestant profile and photograph have been received and are currently{' '}
            <span className="font-semibold text-[#6C1C74]">under admin verification</span>.
            Our team will verify your submission before your profile goes live in voting battles.
          </p>

          {/* Submitted Profile Card Preview */}
          {submittedData && (
            <div className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 text-left shadow-sm">
              <div className="flex items-center space-x-4 p-4">
                {submittedData.imageUrl ? (
                  <img
                    src={submittedData.imageUrl}
                    alt={submittedData.name}
                    className="h-16 w-16 rounded-xl object-cover ring-2 ring-[#6C1C74]/30"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#6C1C74]/10 text-xl font-bold text-[#6C1C74]">
                    {submittedData.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-bold text-gray-900">{submittedData.name}</h3>
                  <p className="truncate text-xs text-gray-500">{submittedData.department}</p>
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                    <Clock className="h-3 w-3" />
                    Pending Admin Verification
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="mb-8 space-y-2.5 rounded-2xl border border-[#6C1C74]/15 bg-[#6C1C74]/5 p-4 text-left">
            <div className="flex items-center space-x-2 text-xs text-gray-700">
              <CheckCircle className="h-4 w-4 flex-shrink-0 text-[#6C1C74]" />
              <span>Signed consent agreement recorded</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-700">
              <CheckCircle className="h-4 w-4 flex-shrink-0 text-[#6C1C74]" />
              <span>Photograph uploaded securely</span>
            </div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-[#6C1C74]">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>Admin review required before appearing in public battles</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => router.push('/battle')}
              className="flex-1 rounded-xl bg-[#6C1C74] py-3 text-xs font-bold text-white transition-opacity hover:opacity-90"
            >
              Browse Live Battles →
            </button>
            <button
              onClick={() => setPendingApproval(false)}
              className="rounded-xl border border-gray-300 px-4 py-3 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Edit Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl bg-white px-4 py-10 text-gray-900 sm:py-14">
      {/* Header */}
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <div className="mb-3 inline-flex items-center space-x-2 rounded-full border border-[#6C1C74]/30 bg-[#6C1C74]/10 px-3 py-1 text-xs font-bold text-[#6C1C74]">
          <Sparkles className="h-4 w-4" />
          <span>Contestant Onboarding</span>
        </div>
        <h1 className="mb-2 text-3xl font-black text-[#6C1C74] sm:text-4xl">
          Participant Consent &amp; Photo Submission
        </h1>
        <p className="text-xs text-gray-600 sm:text-sm">
          Superior Connection strictly publishes photographs only with explicit, documented student permission.
          Please provide your details, upload your photo, and sign the agreement below.
        </p>
      </div>

      <div className="space-y-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-xl shadow-[#6C1C74]/5 sm:p-8">
        {/* Error message */}
        {errorMsg && (
          <div className="flex items-center space-x-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Personal Details */}
          <div>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#6C1C74]">
              1. Contestant Information
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">
                  Full Name / Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Jessica Taylor"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:border-[#6C1C74] focus:outline-none focus:ring-1 focus:ring-[#6C1C74]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">
                  University Department *
                </label>
                <select
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-xs text-gray-900 focus:border-[#6C1C74] focus:outline-none focus:ring-1 focus:ring-[#6C1C74]"
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
          </div>

          {/* Step 2: Photograph Upload */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#6C1C74]">
              2. Upload Contestant Photograph *
            </h2>

            <div className="rounded-2xl border-2 border-dashed border-[#6C1C74]/30 bg-[#6C1C74]/5 p-6 transition-colors hover:border-[#6C1C74]/60">
              {previewUrl ? (
                <div className="flex flex-col items-center sm:flex-row sm:items-center sm:space-x-6">
                  <div className="relative mb-4 h-36 w-28 overflow-hidden rounded-xl border border-[#6C1C74]/30 shadow-md sm:mb-0">
                    <img
                      src={previewUrl}
                      alt="Uploaded preview"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="absolute right-1 top-1 rounded-full bg-red-600 p-1 text-white shadow-md hover:bg-red-700 focus:outline-none"
                      title="Remove photo"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <p className="text-xs font-bold text-gray-900">Photo selected successfully!</p>
                    <p className="mt-1 text-[11px] text-gray-500">
                      {selectedFile ? selectedFile.name : 'Current Profile Image'}
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-3 inline-flex items-center space-x-1.5 rounded-lg border border-[#6C1C74]/40 bg-white px-3 py-1.5 text-xs font-semibold text-[#6C1C74] hover:bg-[#6C1C74]/10"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      <span>Choose Different Photo</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6C1C74]/10 text-[#6C1C74]">
                    <Upload className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-bold text-gray-800">
                    Click to upload or drag and drop your photo
                  </p>
                  <p className="mt-1 text-[11px] text-gray-500">
                    Clear portrait photograph. JPG, PNG or WebP (Max 5MB).
                  </p>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-3 inline-flex items-center space-x-1.5 rounded-xl bg-[#6C1C74] px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90"
                  >
                    <Camera className="h-4 w-4" />
                    <span>Select Photo</span>
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Step 3: Legal Terms */}
          <div className="border-t border-gray-200 pt-6">
            <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
              <span className="font-semibold text-gray-800">Legal Agreement ({CURRENT_CONSENT_VERSION})</span>
              <span className="flex items-center space-x-1 text-[#6C1C74]">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Right to withdraw at any time</span>
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto whitespace-pre-line rounded-xl border border-gray-200 bg-gray-50 p-4 font-mono text-[11px] leading-relaxed text-gray-700">
              {CONSENT_TERMS_TEXT}
            </div>
          </div>

          {/* Step 4: Sign Agreement Checkbox */}
          <label className="flex cursor-pointer items-start space-x-3 rounded-2xl border border-[#6C1C74]/25 bg-[#6C1C74]/5 p-4 transition-colors hover:bg-[#6C1C74]/10">
            <input
              type="checkbox"
              required
              checked={hasReadTerms}
              onChange={(e) => setHasReadTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-400 text-[#6C1C74] accent-[#6C1C74] focus:ring-[#6C1C74]"
            />
            <div className="text-xs leading-relaxed text-gray-700">
              <strong className="text-[#6C1C74]">I confirm and certify:</strong> I am the student pictured in my uploaded photos, I voluntarily give explicit permission to be featured in Superior Connection beauty battles, and I understand I can withdraw consent and delist my profile at any time.
            </div>
          </label>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !hasReadTerms}
            className="flex w-full items-center justify-center space-x-2 rounded-2xl bg-[#6C1C74] py-4 text-sm font-bold text-white shadow-lg shadow-[#6C1C74]/20 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Uploading Photo &amp; Recording Consent...</span>
              </div>
            ) : (
              <>
                <span>Sign Agreement &amp; Proceed to Upload</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
