'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { apiClient, getImageUrl } from '@/lib/api';
import { 
  ShieldAlert, 
  Users, 
  Flame, 
  MessageSquare, 
  RefreshCw, 
  Check, 
  X, 
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
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <ShieldAlert className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Restricted Access</h2>
        <p className="text-xs text-gray-400">You need administrative permissions to view this dashboard.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>Administrative Control Center</span>
          </div>
          <h1 className="text-3xl font-black text-white">CampusFace Admin & Moderation</h1>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/admin/reports"
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition-colors"
          >
            <Flag className="w-4 h-4" />
            <span>View Reports ({metrics?.pendingReports || 0})</span>
          </Link>

          <button
            onClick={handleReconcileLeaderboard}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-surface-100 hover:bg-surface-50 text-white border border-white/10 text-xs font-semibold transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-brand-gold" />
            <span>Reconcile Votes</span>
          </button>
        </div>
      </div>

      {reconcileMessage && (
        <div className="mb-6 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center space-x-2 text-xs text-emerald-300 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{reconcileMessage}</span>
        </div>
      )}

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4 mb-8">
          <div className="p-4 rounded-2xl glass-panel text-center">
            <span className="text-2xl font-black text-white">{metrics.totalUsers}</span>
            <span className="text-[11px] text-gray-400 block mt-1">Users</span>
          </div>
          <div className="p-4 rounded-2xl glass-panel text-center">
            <span className="text-2xl font-black text-brand-pink">{metrics.totalStudents}</span>
            <span className="text-[11px] text-gray-400 block mt-1">Contestants</span>
          </div>
          <div className="p-4 rounded-2xl glass-panel text-center">
            <span className="text-2xl font-black text-brand-purple">{metrics.activeBattles}</span>
            <span className="text-[11px] text-gray-400 block mt-1">Active Battles</span>
          </div>
          <div className="p-4 rounded-2xl glass-panel text-center">
            <span className="text-2xl font-black text-brand-gold">{metrics.totalVotes}</span>
            <span className="text-[11px] text-gray-400 block mt-1">Total Votes</span>
          </div>
          <div className="p-4 rounded-2xl glass-panel text-center">
            <span className="text-2xl font-black text-red-400">{metrics.pendingReports}</span>
            <span className="text-[11px] text-gray-400 block mt-1">Pending Reports</span>
          </div>
          <div className="p-4 rounded-2xl glass-panel text-center">
            <span className="text-2xl font-black text-amber-400">{metrics.flaggedComments}</span>
            <span className="text-[11px] text-gray-400 block mt-1">Flagged Comments</span>
          </div>
          {/* Pending Approvals — highlighted */}
          <div className={`p-4 rounded-2xl text-center border-2 ${
            metrics.pendingApprovals > 0
              ? 'bg-amber-950/40 border-amber-500/60 animate-pulse'
              : 'glass-panel border-white/10'
          }`}>
            <span className={`text-2xl font-black ${metrics.pendingApprovals > 0 ? 'text-amber-400' : 'text-gray-500'}`}>
              {metrics.pendingApprovals}
            </span>
            <span className="text-[11px] text-amber-300 block mt-1">⏳ Pending</span>
          </div>
        </div>
      )}

      {/* Pending Approvals Alert Banner */}
      {metrics && metrics.pendingApprovals > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex items-center space-x-3 animate-fade-in">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-300">
              {metrics.pendingApprovals} contestant profile{metrics.pendingApprovals > 1 ? 's' : ''} awaiting your approval
            </p>
            <p className="text-xs text-amber-400/70 mt-0.5">
              These profiles are hidden from public battles until you approve them below.
            </p>
          </div>
        </div>
      )}


      {/* Student Contestants Management Queue */}
      <div className="glass-panel rounded-3xl border border-white/10 p-6">
        <h3 className="text-lg font-bold text-white mb-4">Contestant Verification & Listing Queue</h3>
        {isLoading ? (
          <div className="py-12 text-center text-xs text-gray-400">Loading student queue...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-surface-200/60 text-gray-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3 rounded-l-lg">Contestant</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Consent Status</th>
                  <th className="p-3">Profile Status</th>
                  <th className="p-3">Votes</th>
                  <th className="p-3 rounded-r-lg text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-100/40">
                    <td className="p-3 flex items-center space-x-3">
                      <img
                        src={getImageUrl(s.imageUrl)}
                        alt={s.displayName}
                        className="w-9 h-9 rounded-lg object-cover bg-surface-200"
                      />
                      <span className="font-bold text-white">{s.displayName}</span>
                    </td>
                    <td className="p-3">{s.department || '—'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.consentStatus === 'ACTIVE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-red-950 text-red-400'
                      }`}>
                        {s.consentStatus}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.profileStatus === 'APPROVED' ? 'bg-cyan-950 text-brand-cyan border border-brand-cyan/30' : 'bg-amber-950 text-amber-400'
                      }`}>
                        {s.profileStatus}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-white">{s.totalVotes || 0}</td>
                    <td className="p-3 text-right space-x-2">
                      {s.profileStatus !== 'APPROVED' && (
                        <button
                          onClick={() => handleUpdateStudentStatus(s.id, 'APPROVED')}
                          className="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold"
                          title="Approve profile"
                        >
                          Approve
                        </button>
                      )}
                      {s.profileStatus !== 'SUSPENDED' && (
                        <button
                          onClick={() => handleUpdateStudentStatus(s.id, 'SUSPENDED')}
                          className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold"
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
  );
}
