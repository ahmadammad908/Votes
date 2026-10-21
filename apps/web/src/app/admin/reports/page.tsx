'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
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

  if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-white p-8 text-center">
        <ShieldAlert className="mb-4 h-12 w-12 text-red-500" />
        <h2 className="mb-2 text-xl font-bold text-[#6C1C74]">Restricted Access</h2>
        <p className="text-xs text-gray-500">You need administrative permissions to view this page.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl bg-white px-4 py-10 text-gray-900">
      {/* Back button */}
      <Link
        href="/admin"
        className="mb-6 inline-flex items-center space-x-1.5 text-xs font-semibold text-gray-500 transition-colors hover:text-[#6C1C74]"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Admin Dashboard</span>
      </Link>

      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black text-[#6C1C74]">Community Moderation &amp; Abuse Reports</h1>
          <p className="mt-1 text-xs text-gray-500">
            Review flagged comments, contestant reports, and abuse incidents.
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          aria-label="Filter reports"
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-[#6C1C74] focus:outline-none focus:ring-1 focus:ring-[#6C1C74]"
        >
          <option value="PENDING">Pending Reports Only</option>
          <option value="RESOLVED">Resolved Reports</option>
          <option value="">All Reports</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl shadow-[#6C1C74]/10">
        {/* Top accent */}
        <div className="h-1.5 w-full bg-[#6C1C74]" />

        <div className="p-6">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-gray-500">Loading reports queue...</div>
          ) : reports.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-500">No reports found in this queue.</div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[10px] font-bold text-red-600">
                        {report.targetType} REPORT
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="text-gray-500">{new Date(report.createdAt).toLocaleString()}</span>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        report.status === 'PENDING'
                          ? 'border border-amber-200 bg-amber-50 text-amber-700'
                          : 'border border-[#6C1C74]/25 bg-[#6C1C74]/10 text-[#6C1C74]'
                      }`}
                    >
                      {report.status}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-[#6C1C74]">Reason:</p>
                    <p className="mt-0.5 rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-xs leading-relaxed text-gray-700">
                      {report.reason}
                    </p>
                    <p className="mt-1 text-[11px] text-gray-400">
                      Target ID: <code className="text-gray-600">{report.targetId}</code>
                    </p>
                  </div>

                  {report.status === 'PENDING' && (
                    <div className="flex flex-wrap items-center gap-2 border-t border-gray-200 pt-3">
                      {report.targetType === 'COMMENT' && (
                        <button
                          onClick={() => handleResolve(report.id, 'REMOVE_CONTENT')}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700"
                        >
                          Remove Comment
                        </button>
                      )}
                      {report.targetType === 'STUDENT' && (
                        <button
                          onClick={() => handleResolve(report.id, 'SUSPEND_STUDENT')}
                          className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-600"
                        >
                          Suspend Student
                        </button>
                      )}
                      <button
                        onClick={() => handleResolve(report.id, 'NONE')}
                        className="rounded-lg bg-[#6C1C74] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                      >
                        Resolve (No Action Needed)
                      </button>
                      <button
                        onClick={() => handleDismiss(report.id)}
                        className="rounded-lg border border-[#6C1C74]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#6C1C74] transition-colors hover:bg-[#6C1C74]/5"
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
    </div>
  );
}