'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { apiClient, getImageUrl } from '@/lib/api';
import {
  ShieldAlert,
  RefreshCw,
  AlertTriangle,
  Flag,
  CheckCircle2
} from 'lucide-react';
import { StudentProfileDTO } from '@campusface/shared';

export default function AdminDashboardPage() {
  const { user } = useAuth();

  const [metrics, setMetrics] = useState<{
    totalUsers: number;
    totalStudents: number;
    activeBattles: number;
    totalVotes: number;
    pendingReports: number;
    flaggedComments: number;
    pendingApprovals: number;
  } | null>(null);

  const [students, setStudents] = useState<StudentProfileDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reconcileMessage, setReconcileMessage] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [overviewRes, studentsRes] = await Promise.all([
        apiClient<{ metrics: any }>('/admin/overview'),
        apiClient<{ students: StudentProfileDTO[] }>('/admin/students')
      ]);
      setMetrics(overviewRes.metrics);
      setStudents(studentsRes.students);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'ADMIN' || user.role === 'MODERATOR')) {
      loadData();
    }
  }, [user]);

  const handleUpdateStudentStatus = async (studentId: string, status: 'APPROVED' | 'SUSPENDED' | 'REMOVED') => {
    try {
      await apiClient(`/admin/students/${studentId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ profileStatus: status })
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update student status');
    }
  };

  const handleReconcileLeaderboard = async () => {
    try {
      const res = await apiClient<{ success: boolean; message: string }>('/leaderboard/reconcile', {
        method: 'POST'
      });
      setReconcileMessage(res.message);
      setTimeout(() => setReconcileMessage(null), 4000);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to reconcile leaderboard');
    }
  };

  if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-white p-8 text-center">
        <ShieldAlert className="mb-4 h-12 w-12 text-red-500" />
        <h2 className="mb-2 text-xl font-bold text-[#6C1C74]">Restricted Access</h2>
        <p className="text-xs text-gray-500">You need administrative permissions to view this dashboard.</p>
      </div>
    );
  }

  const metricCards = metrics
    ? [
        { label: 'Users', value: metrics.totalUsers, color: 'text-gray-900' },
        { label: 'Contestants', value: metrics.totalStudents, color: 'text-[#6C1C74]' },
        { label: 'Active Battles', value: metrics.activeBattles, color: 'text-[#6C1C74]' },
        { label: 'Total Votes', value: metrics.totalVotes, color: 'text-[#6C1C74]' },
        { label: 'Pending Reports', value: metrics.pendingReports, color: 'text-red-600' },
        { label: 'Flagged Comments', value: metrics.flaggedComments, color: 'text-amber-600' }
      ]
    : [];

  return (
    <div className="mx-auto w-full max-w-6xl bg-white px-4 py-10 text-gray-900">
      {/* Header */}
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-1 inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#6C1C74]">
            <ShieldAlert className="h-4 w-4" />
            <span>Administrative Control Center</span>
          </div>
          <h1 className="text-3xl font-black text-[#6C1C74]">Superior Connection Admin &amp; Moderation</h1>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/admin/reports"
            className="flex items-center space-x-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
          >
            <Flag className="h-4 w-4" />
            <span>View Reports ({metrics?.pendingReports || 0})</span>
          </Link>

          <button
            onClick={handleReconcileLeaderboard}
            className="flex items-center space-x-2 rounded-xl bg-[#6C1C74] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-[#6C1C74]/20 transition-opacity hover:opacity-90"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reconcile Votes</span>
          </button>
        </div>
      </div>

      {reconcileMessage && (
        <div className="animate-fade-in mb-6 flex items-center space-x-2 rounded-xl border border-[#6C1C74]/25 bg-[#6C1C74]/5 p-3 text-xs text-[#6C1C74]">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span>{reconcileMessage}</span>
        </div>
      )}

      {/* Metrics Cards */}
      {metrics && (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
          {metricCards.map((m) => (
            <div
              key={m.label}
              className="rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-sm"
            >
              <span className={`text-2xl font-black ${m.color}`}>{m.value}</span>
              <span className="mt-1 block text-[11px] text-gray-500">{m.label}</span>
            </div>
          ))}

          {/* Pending Approvals — highlighted */}
          <div
            className={`rounded-2xl border-2 p-4 text-center ${
              metrics.pendingApprovals > 0
                ? 'animate-pulse border-[#6C1C74] bg-[#6C1C74]/10'
                : 'border-gray-200 bg-white shadow-sm'
            }`}
          >
            <span
              className={`text-2xl font-black ${
                metrics.pendingApprovals > 0 ? 'text-[#6C1C74]' : 'text-gray-400'
              }`}
            >
              {metrics.pendingApprovals}
            </span>
            <span className="mt-1 block text-[11px] font-medium text-[#6C1C74]">⏳ Pending</span>
          </div>
        </div>
      )}

      {/* Pending Approvals Alert Banner */}
      {metrics && metrics.pendingApprovals > 0 && (
        <div className="animate-fade-in mb-6 flex items-center space-x-3 rounded-2xl border border-[#6C1C74]/30 bg-[#6C1C74]/5 p-4">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-[#6C1C74]" />
          <div>
            <p className="text-sm font-bold text-[#6C1C74]">
              {metrics.pendingApprovals} contestant profile{metrics.pendingApprovals > 1 ? 's' : ''} awaiting your approval
            </p>
            <p className="mt-0.5 text-xs text-gray-600">
              These profiles are hidden from public battles until you approve them below.
            </p>
          </div>
        </div>
      )}

      {/* Student Contestants Management Queue */}
      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl shadow-[#6C1C74]/10">
        <div className="h-1.5 w-full bg-[#6C1C74]" />

        <div className="p-6">
          <h3 className="mb-4 text-lg font-bold text-[#6C1C74]">
            Contestant Verification &amp; Listing Queue
          </h3>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-gray-500">Loading student queue...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-700">
                <thead className="bg-[#6C1C74]/5 text-[10px] uppercase tracking-wider text-[#6C1C74]">
                  <tr>
                    <th className="rounded-l-lg p-3">Contestant</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Consent Status</th>
                    <th className="p-3">Profile Status</th>
                    <th className="p-3">Votes</th>
                    <th className="rounded-r-lg p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map((s) => (
                    <tr
                      key={s.id}
                      className={`transition-colors ${
                        s.profileStatus === 'PENDING'
                          ? 'bg-amber-50/50 hover:bg-amber-50'
                          : 'hover:bg-[#6C1C74]/5'
                      }`}
                    >
                      <td className="p-3">
                        <div className="flex items-center space-x-3">
                          <img
                            src={getImageUrl(s.imageUrl)}
                            alt={s.displayName}
                            className="h-10 w-10 rounded-lg bg-gray-100 object-cover ring-1 ring-gray-200"
                          />
                          <div>
                            <span className="font-bold text-gray-900 block">{s.displayName}</span>
                            <span className="text-[10px] text-gray-500">{s.email || 'Student'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">{s.department || '—'}</td>
                      <td className="p-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            s.consentStatus === 'ACTIVE'
                              ? 'border border-[#6C1C74]/25 bg-[#6C1C74]/10 text-[#6C1C74]'
                              : 'border border-red-200 bg-red-50 text-red-600'
                          }`}
                        >
                          {s.consentStatus}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            s.profileStatus === 'APPROVED'
                              ? 'bg-[#6C1C74] text-white'
                              : s.profileStatus === 'PENDING'
                              ? 'border border-amber-300 bg-amber-100 text-amber-900 font-extrabold'
                              : 'border border-gray-200 bg-gray-50 text-gray-700'
                          }`}
                        >
                          {s.profileStatus === 'PENDING' ? '⏳ PENDING REVIEW' : s.profileStatus}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-gray-900">{s.totalVotes || 0}</td>
                      <td className="space-x-2 p-3 text-right">
                        {s.profileStatus !== 'APPROVED' && (
                          <button
                            onClick={() => handleUpdateStudentStatus(s.id, 'APPROVED')}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                            title="Verify and approve contestant"
                          >
                            ✓ Verify &amp; Approve
                          </button>
                        )}
                        {s.profileStatus !== 'SUSPENDED' && (
                          <button
                            onClick={() => handleUpdateStudentStatus(s.id, 'SUSPENDED')}
                            className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 font-semibold text-amber-700 transition-colors hover:bg-amber-100"
                            title="Suspend profile"
                          >
                            Suspend
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}