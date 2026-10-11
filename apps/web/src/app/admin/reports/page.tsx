'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api';
import { ShieldAlert, Flag, CheckCircle2, XCircle, ArrowLeft, AlertTriangle } from 'lucide-react';
import { ReportDTO } from '@campusface/shared';

export default function AdminReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'RESOLVED' | ''>('PENDING');

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const endpoint = statusFilter ? `/reports/admin?status=${statusFilter}` : '/reports/admin';
      const data = await apiClient<{ reports: ReportDTO[] }>(endpoint);
      setReports(data.reports);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'ADMIN' || user.role === 'MODERATOR')) {
      loadReports();
    }
  }, [user, statusFilter]);

  const handleResolve = async (
    reportId: string,
    actionTaken?: 'NONE' | 'HIDE_CONTENT' | 'REMOVE_CONTENT' | 'SUSPEND_STUDENT'
  ) => {
    try {
      await apiClient(`/reports/admin/${reportId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'RESOLVED',
          actionTaken: actionTaken || 'NONE',
          notes: `Action executed: ${actionTaken || 'None'}`
        })
      });
      await loadReports();
    } catch (err: any) {
      alert(err.message || 'Failed to update report');
    }
  };

  const handleDismiss = async (reportId: string) => {
    try {
      await apiClient(`/reports/admin/${reportId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'DISMISSED',
          actionTaken: 'NONE'
        })
      });
      await loadReports();
    } catch (err: any) {
      alert(err.message || 'Failed to dismiss report');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-10">
      {/* Back button */}
      <Link
        href="/admin"
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-gray-400 hover:text-white mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Admin Dashboard</span>
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">Community Moderation & Abuse Reports</h1>
          <p className="text-xs text-gray-400 mt-1">Review flagged comments, contestant reports, and abuse incidents.</p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3 py-2 bg-surface-100 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
        >
          <option value="PENDING">Pending Reports Only</option>
          <option value="RESOLVED">Resolved Reports</option>
          <option value="">All Reports</option>
        </select>
      </div>

      <div className="glass-panel rounded-3xl border border-white/10 p-6">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-gray-400">Loading reports queue...</div>
        ) : reports.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">No reports found in this queue.</div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="p-5 rounded-2xl bg-surface-200/60 border border-white/5 space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-500/30">
                      {report.targetType} REPORT
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-400">{new Date(report.createdAt).toLocaleString()}</span>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    report.status === 'PENDING' ? 'bg-amber-950 text-amber-400' : 'bg-emerald-950 text-emerald-400'
                  }`}>
                    {report.status}
                  </span>
                </div>

                <div>
                  <p className="text-xs font-semibold text-white">Reason:</p>
                  <p className="text-xs text-gray-300 mt-0.5 leading-relaxed bg-surface-100 p-2.5 rounded-lg border border-white/5">
                    {report.reason}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">Target ID: <code>{report.targetId}</code></p>
                </div>

                {report.status === 'PENDING' && (
                  <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-white/5">
                    {report.targetType === 'COMMENT' && (
                      <button
                        onClick={() => handleResolve(report.id, 'REMOVE_CONTENT')}
                        className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors"
                      >
                        Remove Comment
                      </button>
                    )}
                    {report.targetType === 'STUDENT' && (
                      <button
                        onClick={() => handleResolve(report.id, 'SUSPEND_STUDENT')}
                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors"
                      >
                        Suspend Student
                      </button>
                    )}
                    <button
                      onClick={() => handleResolve(report.id, 'NONE')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors"
                    >
                      Resolve (No Action Needed)
                    </button>
                    <button
                      onClick={() => handleDismiss(report.id)}
                      className="px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-50 text-gray-300 font-semibold text-xs transition-colors border border-white/10"
                    >
                      Dismiss Report
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
