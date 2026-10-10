import React, { useState, useEffect } from 'react';
import { NavScreen, Parcel } from '../../types';
import { api, AuthUser, VerificationReport } from '../../services/api';

interface AdminDashboardScreenProps {
  onNavigate: (screen: NavScreen) => void;
  onSelectParcel: (parcel: Parcel) => void;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({
  onNavigate,
  onSelectParcel,
}) => {
  const [activeTab, setActiveTab] = useState<'metrics' | 'users' | 'review-queue' | 'audit-logs'>('metrics');
  
  // Data states
  const [metrics, setMetrics] = useState<any>(null);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [reviewQueue, setReviewQueue] = useState<VerificationReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'metrics') {
        const m = await api.getAdminMetrics();
        setMetrics(m);
      } else if (activeTab === 'users') {
        const u = await api.listAdminUsers();
        setUsers(u);
      } else if (activeTab === 'review-queue') {
        const q = await api.getAdminReviewQueue();
        setReviewQueue(q);
      } else if (activeTab === 'audit-logs') {
        const logs = await api.getAdminAuditLogs();
        setAuditLogs(logs);
      }
    } catch {
      // Fallback offline mock for admin view
      if (activeTab === 'metrics') {
        setMetrics({
          total_users: 18,
          total_documents: 42,
          pending_ocr: 2,
          manual_review_queue: 3,
          pending_consent_requests: 4,
          verified_reports: 35,
          tampering_flags: 5,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleUserStatus = async (user: AuthUser) => {
    const newStatus = user.verification_status === 'VERIFIED' ? 'SUSPENDED' : 'VERIFIED';
    try {
      await api.updateAdminUserStatus(user.id, newStatus);
      setActionFeedback(`User ${user.full_name} status updated to ${newStatus}`);
      loadData();
    } catch {
      setActionFeedback(`Mock: User status toggled to ${newStatus}`);
    }
    setTimeout(() => setActionFeedback(null), 3500);
  };

  const handleResolveReview = async (reportId: string, decision: 'APPROVED' | 'REJECTED') => {
    try {
      await api.resolveReview(reportId, decision, 'Resolved by Divisional Commissioner Shri R. Rao, IAS');
      setActionFeedback(`Adjudication confirmed: ${decision}`);
      loadData();
    } catch {
      setActionFeedback(`Mock: Review decision logged as ${decision}`);
    }
    setTimeout(() => setActionFeedback(null), 3500);
  };

  return (
    <div className="w-full max-w-[1360px] mx-auto px-4 md:px-6 py-6 space-y-6">
      {/* Officer Header */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              alt="Shri Rajeshwar Rao, IAS"
              className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-300"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBqns_K8awSz6EFRZ6wGByQijnAKZwacYK2Q-nQNccVY-VFEm8TZbydrqGQsswPcC3jB3OYT1gyBbofPdZPuhdYTWm2D0Gvs2-KYyeTrmYAJ-WUkBw4upqsELw2_dHYeVHl8LVMg2RyVtwHMuYtsXAAzgl5QpuWpql5-in7q-F07XTQLNneP6y_ubOPVJb3-nsiOiWE-h6gP6oGtqiBsWRUdmVmqK5h7D43eiJTBA44Nvisvdlnl8UeKQ"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">
                  National Land Revenue Administrator Console
                </h1>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                  Administrator / IAS Class-3 DSC Active
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Officer: <strong className="text-slate-800">Shri Rajeshwar Rao, IAS</strong> • Divisional Land Revenue Commissionerate
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-mono font-bold border border-slate-200">
              AUDIT-KEY: #SEC-2026-REG-IAS
            </span>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('metrics')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'metrics' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          System Metrics & Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'users' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          User Management & RBAC
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('review-queue')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'review-queue' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Manual Review Queue
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('audit-logs')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'audit-logs' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Immutable Audit Logs
        </button>
      </div>

      {actionFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined text-base">info</span>
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Tab 1: System Metrics */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] text-slate-500 font-medium">Registered Accounts</span>
              <div className="text-2xl font-bold text-slate-900">{metrics?.total_users || 18}</div>
              <span className="text-[10px] text-emerald-700 font-semibold">RBAC Verified</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] text-slate-500 font-medium">Uploaded Documents</span>
              <div className="text-2xl font-bold text-slate-900">{metrics?.total_documents || 42}</div>
              <span className="text-[10px] text-slate-500">Private Object Storage</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] text-slate-500 font-medium">Tampering Flags</span>
              <div className="text-2xl font-bold text-amber-600">{metrics?.tampering_flags || 5}</div>
              <span className="text-[10px] text-amber-700 font-semibold">ELA & Morphology Alerts</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] text-slate-500 font-medium">Verified Dockets</span>
              <div className="text-2xl font-bold text-emerald-700">{metrics?.verified_reports || 35}</div>
              <span className="text-[10px] text-emerald-700 font-semibold">SHA-256 Digitally Signed</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900">Configured External Provider Adapters</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="font-semibold text-slate-900">OTP Dispatch Provider</div>
                <div className="text-emerald-700 font-mono text-[11px]">Active: Console / SMS Gateway</div>
                <div className="text-[10px] text-slate-500">Salted HMAC-SHA256 Challenge Container</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="font-semibold text-slate-900">Cadastral GIS Engine</div>
                <div className="text-emerald-700 font-mono text-[11px]">Active: Leaflet + OpenStreetMap</div>
                <div className="text-[10px] text-slate-500">Cadastral Boundary GeoJSON Overlays</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="font-semibold text-slate-900">Computer Vision OCR</div>
                <div className="text-emerald-700 font-mono text-[11px]">Active: OpenCV CLAHE + PyPDF</div>
                <div className="text-[10px] text-slate-500">Error Level Analysis (ELA 90% Q-Factor)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: User Management */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">User Access & Verification Control</h2>
            <button
              type="button"
              onClick={loadData}
              className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              <span>Refresh</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Mobile</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(users.length > 0 ? users : [
                  { id: 'u-1', full_name: 'Rajeshwar Rao, IAS', email: 'admin@bhusatya.gov.in', role: 'admin', verification_status: 'VERIFIED' },
                  { id: 'u-2', full_name: 'Ananya Sharma', email: 'citizen@bhusatya.in', role: 'applicant', verification_status: 'VERIFIED' },
                  { id: 'u-3', full_name: 'Vasantrao G. Deshmukh', email: 'owner@bhusatya.in', role: 'approver', verification_status: 'VERIFIED' },
                ] as AuthUser[]).map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="p-3.5 font-bold text-slate-900">{u.full_name}</td>
                    <td className="p-3.5 font-mono text-slate-600">{u.email}</td>
                    <td className="p-3.5 text-slate-500">{u.mobile_number || '—'}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.role === 'admin' ? 'bg-purple-50 text-purple-800 border border-purple-200' :
                        u.role === 'approver' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                        'bg-slate-100 text-slate-800 border border-slate-200'
                      }`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.verification_status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                      }`}>
                        {u.verification_status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {u.role !== 'admin' && (
                        <button
                          type="button"
                          onClick={() => handleToggleUserStatus(u)}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
                        >
                          {u.verification_status === 'VERIFIED' ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Review Queue */}
      {activeTab === 'review-queue' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Documents Awaiting Revenue Officer Adjudication</h2>
          <div className="space-y-3">
            {[
              {
                id: 'rep-1',
                ref: 'BHU-2026-PUN-0142',
                gat: 'Gat No. 142/3 (Hinjawadi)',
                applicant: 'Ananya Sharma',
                flag: 'Bank of Maharashtra mortgage lien (Rs 15,00,000 charge) detected in mutation note.',
                severity: 'HIGH',
              },
              {
                id: 'rep-2',
                ref: 'BHU-2026-HAV-0284',
                gat: 'Gat No. 284/1A (Wagholi)',
                applicant: 'Kunal Verma',
                flag: 'Active Civil Court Stay Order #CS-2022-849 noted in reference dataset.',
                severity: 'HIGH',
              },
            ].map((item) => (
              <div key={item.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{item.gat}</span>
                    <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-bold">
                      {item.severity} RISK
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">{item.ref}</span>
                  </div>
                  <p className="text-xs text-slate-600">{item.flag}</p>
                  <span className="text-[11px] text-slate-500">Applicant: {item.applicant}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleResolveReview(item.id, 'APPROVED')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                  >
                    Clear with Stamped Caveat
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResolveReview(item.id, 'REJECTED')}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                  >
                    Issue Block Order
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Audit Logs */}
      {activeTab === 'audit-logs' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Regulatory Audit Trail & Tamper-Evident History</h2>
            <button
              type="button"
              onClick={loadData}
              className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              <span>Refresh</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Resource</th>
                  <th className="p-3.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(auditLogs.length > 0 ? auditLogs : [
                  { id: 'l-1', timestamp: new Date().toISOString(), action: 'OTP_VERIFIED_SUCCESS', resource_type: 'ConsentVerification', details: 'OTP channel verification confirmed for Landowner Vasantrao Deshmukh' },
                  { id: 'l-2', timestamp: new Date(Date.now() - 3600000).toISOString(), action: 'REPORT_GENERATED', resource_type: 'VerificationReport', details: 'Verification report BHU-2026-PUN-0142 generated (Score: 78)' },
                  { id: 'l-3', timestamp: new Date(Date.now() - 7200000).toISOString(), action: 'DOCUMENT_UPLOAD', resource_type: 'LandDocument', details: 'Uploaded satbara_712_sample.pdf (7/12_extract)' },
                ]).map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="p-3.5 font-mono text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="p-3.5 font-mono font-bold text-slate-900">{log.action}</td>
                    <td className="p-3.5 text-slate-600">{log.resource_type}</td>
                    <td className="p-3.5 text-slate-600">{log.details || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
