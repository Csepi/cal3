import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  exportComplianceAudit,
  fetchComplianceAccessReview,
  fetchComplianceDashboard,
  fetchComplianceDataSubjectRequests,
  formatAdminError,
  updateComplianceDataSubjectRequest,
} from './adminApiService';
import type {
  ComplianceAccessReview,
  ComplianceDashboard,
  DataSubjectRequestItem,
} from './types';

import { tStatic } from '../../i18n';

interface AdminCompliancePanelProps {
  isActive?: boolean;
  themeColor?: string;
}

type DsrStatus = 'pending' | 'in_progress' | 'completed' | 'rejected';
type DsrType = 'access' | 'export' | 'delete';

const STATUS_OPTIONS: DsrStatus[] = [
  'pending',
  'in_progress',
  'completed',
  'rejected',
];
const TYPE_OPTIONS: DsrType[] = ['access', 'export', 'delete'];

const statusPillClass: Record<DsrStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-rose-100 text-rose-800',
};

const controlStatusClass: Record<'pass' | 'warn' | 'fail', string> = {
  pass: 'bg-emerald-100 text-emerald-800',
  warn: 'bg-amber-100 text-amber-800',
  fail: 'bg-rose-100 text-rose-800',
};

const toDate = (value: string | null | undefined): string =>
  value
    ? new Date(value).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'n/a';

const toggleArray = <T,>(current: T[], value: T): T[] =>
  current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];

const downloadTextFile = (filename: string, content: string): void => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const AdminCompliancePanel: React.FC<AdminCompliancePanelProps> = ({
  isActive = false,
  themeColor = '#2563eb',
}) => {
  const [dashboard, setDashboard] = useState<ComplianceDashboard | null>(null);
  const [accessReview, setAccessReview] = useState<ComplianceAccessReview | null>(
    null,
  );
  const [requests, setRequests] = useState<DataSubjectRequestItem[]>([]);
  const [requestCount, setRequestCount] = useState(0);
  const [selectedStatuses, setSelectedStatuses] = useState<DsrStatus[]>([
    'pending',
    'in_progress',
  ]);
  const [selectedTypes, setSelectedTypes] = useState<DsrType[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingRequestId, setSavingRequestId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboardRes, accessReviewRes, dsrRes] = await Promise.all([
        fetchComplianceDashboard(),
        fetchComplianceAccessReview(),
        fetchComplianceDataSubjectRequests({
          statuses: selectedStatuses,
          requestTypes: selectedTypes,
          search: search.trim() || undefined,
          limit: 100,
          offset: 0,
        }),
      ]);
      setDashboard(dashboardRes);
      setAccessReview(accessReviewRes);
      setRequests(dsrRes.items ?? []);
      setRequestCount(dsrRes.count ?? dsrRes.items.length);
    } catch (err) {
      setError(formatAdminError(err));
    } finally {
      setLoading(false);
    }
  }, [search, selectedStatuses, selectedTypes]);

  useEffect(() => {
    if (!isActive) {
      return;
    }
    void loadAll();
  }, [isActive, loadAll]);

  const mfaCoverage = dashboard?.summary.mfa;
  const consentCoverage = dashboard?.summary.consent;
  const topErrorCode = dashboard?.summary.errorSummary.topErrorCodes[0];
  const staleCount = accessReview?.staleAccessCandidates.length ?? 0;

  const pendingRequestCount = useMemo(
    () =>
      requests.filter(
        (item) => item.status === 'pending' || item.status === 'in_progress',
      ).length,
    [requests],
  );

  const updateRequestStatus = async (
    requestId: number,
    nextStatus: DsrStatus,
  ) => {
    setSavingRequestId(requestId);
    setError(null);
    try {
      await updateComplianceDataSubjectRequest(requestId, {
        status: nextStatus,
      });
      setMessage(`Request #${requestId} updated to ${nextStatus}.`);
      await loadAll();
    } catch (err) {
      setError(formatAdminError(err));
    } finally {
      setSavingRequestId(null);
    }
  };

  const handleAuditExport = async (format: 'json' | 'csv') => {
    setError(null);
    try {
      const payload = await exportComplianceAudit({ format });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      if (format === 'csv' && typeof payload.csv === 'string') {
        downloadTextFile(`compliance-audit-${timestamp}.csv`, payload.csv);
      } else {
        downloadTextFile(
          `compliance-audit-${timestamp}.json`,
          JSON.stringify(payload, null, 2),
        );
      }
      setMessage(`Generated ${format.toUpperCase()} audit export.`);
    } catch (err) {
      setError(formatAdminError(err));
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/95 shadow-xl">
      <header className="border-b border-slate-200 px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              {tStatic('common:auto.frontend.kaf16df2c74f2')}</h2>
            <p className="text-sm text-slate-600">
              {tStatic('common:auto.frontend.kfc8231a6fe20')}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void loadAll()}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              {tStatic('common:auto.frontend.k56e3badc4e6c')}</button>
            <button
              type="button"
              onClick={() => void handleAuditExport('json')}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              {tStatic('common:auto.frontend.kbc399052d420')}</button>
            <button
              type="button"
              onClick={() => void handleAuditExport('csv')}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              {tStatic('common:auto.frontend.k5755f9ac0aa1')}</button>
          </div>
        </div>
        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {message && !error && (
          <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {message}
          </p>
        )}
      </header>

      <div className="grid gap-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {tStatic('common:auto.frontend.k4b2fd92536a6')}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {mfaCoverage
              ? `${Math.round(mfaCoverage.ratio * 100)}%`
              : loading
                ? '...'
                : 'n/a'}
          </p>
          <p className="text-xs text-slate-500">
            {mfaCoverage
              ? `${mfaCoverage.enabledCount}/${mfaCoverage.totalUsers} active users`
              : 'Awaiting data'}
          </p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {tStatic('common:auto.frontend.k1f23ac61f226')}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {consentCoverage
              ? `${Math.round(consentCoverage.ratio * 100)}%`
              : loading
                ? '...'
                : 'n/a'}
          </p>
          <p className="text-xs text-slate-500">
            {consentCoverage
              ? `${consentCoverage.acceptedPrivacyPolicy}/${consentCoverage.totalUsers} users`
              : 'Awaiting data'}
          </p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {tStatic('common:auto.frontend.k1fa47a742f82')}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {pendingRequestCount}
          </p>
          <p className="text-xs text-slate-500">{requestCount} {tStatic('common:auto.frontend.k4b9c5f16461c')}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {tStatic('common:auto.frontend.k67259e752394')}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {staleCount}
          </p>
          <p className="text-xs text-slate-500">
            {tStatic('common:auto.frontend.k3be898f9775f')}{topErrorCode?.code ?? 'n/a'}
          </p>
        </article>
      </div>

      <div className="grid gap-4 border-b border-slate-200 px-6 py-5 xl:grid-cols-[2fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <h3 className="text-sm font-semibold text-slate-800">{tStatic('common:auto.frontend.k579efc8a8e78')}</h3>
          <p className="mt-1 text-xs text-slate-500">
            {tStatic('common:auto.frontend.k6f2cf10d5e6b')}</p>
          <div className="mt-3 space-y-2">
            {(dashboard?.controls ?? []).map((control) => (
              <article
                key={control.id}
                className="rounded-xl border border-slate-200 bg-white p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                      {control.framework}
                    </span>
                    <span className="text-sm font-medium text-slate-900">
                      {control.control}
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${controlStatusClass[control.status]}`}
                  >
                    {control.status.toUpperCase()}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600">{control.detail}</p>
                <p className="mt-1 font-mono text-[11px] text-slate-500">
                  {tStatic('common:auto.frontend.kb934ed78d338')}{control.evidence}
                </p>
              </article>
            ))}
            {!loading && (dashboard?.controls.length ?? 0) === 0 && (
              <p className="text-sm text-slate-500">{tStatic('common:auto.frontend.k886aff973bbd')}</p>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <h3 className="text-sm font-semibold text-slate-800">{tStatic('common:auto.frontend.kc7199d9e9593')}</h3>
            <div className="mt-2 space-y-1 text-xs text-slate-600">
              <p>
                {tStatic('common:auto.frontend.kee89f9707762')}{dashboard?.settings.appLogRetentionDays ?? 'n/a'} {tStatic('common:auto.frontend.k5548ae4f34cb')}</p>
              <p>
                {tStatic('common:auto.frontend.k88bb2f3c8fa4')}{dashboard?.settings.auditRetentionDays ?? 'n/a'} {tStatic('common:auto.frontend.k5548ae4f34cb')}</p>
            </div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <h3 className="text-sm font-semibold text-slate-800">{tStatic('common:auto.frontend.kf4f2c9bf780e')}</h3>
            <div className="mt-2 space-y-1 text-xs text-slate-600">
              <p>
                {tStatic('common:auto.frontend.k6ea1f001e6f2')}{dashboard?.summary.errorSummary.criticalCount ?? 'n/a'}
              </p>
              <p>
                {tStatic('common:auto.frontend.k13928441cadb')}{dashboard?.summary.errorSummary.failureCount ?? 'n/a'}
              </p>
            </div>
          </section>
        </aside>
      </div>

      <div className="grid gap-4 px-6 py-5 xl:grid-cols-[3fr_2fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-900">
              {tStatic('common:auto.frontend.k4bb1b5d90977')}</h3>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() =>
                    setSelectedStatuses((prev) => toggleArray(prev, status))
                  }
                  className={`rounded-full border px-2.5 py-1 text-xs ${
                    selectedStatuses.includes(status)
                      ? 'border-blue-300 bg-blue-50 text-blue-700'
                      : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {TYPE_OPTIONS.map((requestType) => (
              <button
                key={requestType}
                type="button"
                onClick={() =>
                  setSelectedTypes((prev) => toggleArray(prev, requestType))
                }
                className={`rounded-full border px-2.5 py-1 text-xs ${
                  selectedTypes.includes(requestType)
                    ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {requestType}
              </button>
            ))}
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={tStatic('common:auto.frontend.ke2813534065b')}
              className="ml-auto rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
            />
            <button
              type="button"
              onClick={() => void loadAll()}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
              style={{ backgroundColor: themeColor }}
            >
              {tStatic('common:auto.frontend.kcfea419c3b4e')}</button>
          </div>
          <div className="mt-3 max-h-[480px] overflow-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-semibold">{tStatic('common:auto.frontend.k89f89c02cf47')}</th>
                  <th className="px-3 py-2 font-semibold">{tStatic('common:auto.frontend.k3deb74565196')}</th>
                  <th className="px-3 py-2 font-semibold">{tStatic('common:auto.frontend.kbae7d5be7082')}</th>
                  <th className="px-3 py-2 font-semibold">{tStatic('common:auto.frontend.kaccf40c89baa')}</th>
                  <th className="px-3 py-2 font-semibold">{tStatic('common:auto.frontend.kf219cc0614ae')}</th>
                  <th className="px-3 py-2 font-semibold">{tStatic('common:auto.frontend.kc3cd636a585b')}</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id} className="border-t border-slate-200">
                    <td className="px-3 py-2 font-mono text-slate-700">
                      #{request.id}
                    </td>
                    <td className="px-3 py-2 text-slate-700">{request.requestType}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusPillClass[request.status]}`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {toDate(request.createdAt)}
                    </td>
                    <td className="max-w-[320px] px-3 py-2 text-slate-700">
                      {request.reason ?? 'n/a'}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1.5">
                        {request.status !== 'in_progress' && (
                          <button
                            type="button"
                            disabled={savingRequestId === request.id}
                            onClick={() =>
                              void updateRequestStatus(request.id, 'in_progress')
                            }
                            className="rounded border border-slate-300 px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                          >
                            {tStatic('common:auto.frontend.kf61eadaf153a')}</button>
                        )}
                        {request.status !== 'completed' && (
                          <button
                            type="button"
                            disabled={savingRequestId === request.id}
                            onClick={() =>
                              void updateRequestStatus(request.id, 'completed')
                            }
                            className="rounded border border-emerald-300 px-2 py-1 text-[11px] text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                          >
                            {tStatic('common:auto.frontend.k1f5a1abf2f08')}</button>
                        )}
                        {request.status !== 'rejected' && (
                          <button
                            type="button"
                            disabled={savingRequestId === request.id}
                            onClick={() =>
                              void updateRequestStatus(request.id, 'rejected')
                            }
                            className="rounded border border-rose-300 px-2 py-1 text-[11px] text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                          >
                            {tStatic('common:auto.frontend.k2b03b59293b6')}</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && requests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                      {tStatic('common:auto.frontend.k543cd56ffa8f')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900">{tStatic('common:auto.frontend.k9334cf926691')}</h3>
          <p className="mt-1 text-xs text-slate-500">
            {tStatic('common:auto.frontend.k2a71660143ae')}</p>
          <div className="mt-3 space-y-3">
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                {tStatic('common:auto.frontend.k3acd55c5f1c5')}</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {accessReview?.privilegedAccounts.length ?? 'n/a'}
              </p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                {tStatic('common:auto.frontend.kf959dc3ba2de')}</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {accessReview?.organisationAdmins.length ?? 'n/a'}
              </p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                {tStatic('common:auto.frontend.k6af75f37e960')}</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {staleCount}
              </p>
            </article>
          </div>
          <div className="mt-4 max-h-[280px] overflow-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-semibold">{tStatic('common:auto.frontend.k9f8a2389a20c')}</th>
                  <th className="px-3 py-2 font-semibold">{tStatic('common:auto.frontend.kc3f104d13657')}</th>
                  <th className="px-3 py-2 font-semibold">{tStatic('common:auto.frontend.k40faba968903')}</th>
                  <th className="px-3 py-2 font-semibold">{tStatic('common:auto.frontend.k2df48ad223be')}</th>
                </tr>
              </thead>
              <tbody>
                {(accessReview?.staleAccessCandidates ?? []).map((item) => (
                  <tr key={item.userId} className="border-t border-slate-200">
                    <td className="px-3 py-2 text-slate-700">
                      {item.username}
                      <div className="text-[11px] text-slate-500">{item.email}</div>
                    </td>
                    <td className="px-3 py-2 text-slate-700">{item.role}</td>
                    <td className="px-3 py-2 text-slate-700">
                      {item.mfaEnabled ? 'Enabled' : 'Missing'}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {toDate(item.lastLoginAt)}
                    </td>
                  </tr>
                ))}
                {!loading && (accessReview?.staleAccessCandidates.length ?? 0) === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                      {tStatic('common:auto.frontend.k393e1532f2a8')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  );
};

export default AdminCompliancePanel;
