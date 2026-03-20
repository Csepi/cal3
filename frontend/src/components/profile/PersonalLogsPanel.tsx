import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type {
  PersonalAuditEvent,
  PersonalAuditQuery,
} from '../../types/PersonalAudit';
import type { ConsentType } from '../../types/PrivacyCompliance';
import {
  acceptPrivacyPolicy,
  createDataSubjectRequest,
  exportPersonalData,
  getPersonalAuditFeed,
  getPrivacyAccessReport,
  getPrivacyConsents,
  listDataSubjectRequests,
  upsertPrivacyConsent,
} from '../../services/personalLogsApi';

import { tStatic } from '../../i18n';

interface PersonalLogsPanelProps {
  themeColor: string;
}

const formatDateTime = (value: string): string =>
  new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

const SEVERITY_BADGE: Record<string, string> = {
  info: 'bg-slate-100 text-slate-700',
  warn: 'bg-amber-100 text-amber-800',
  critical: 'bg-red-100 text-red-700',
};

const OUTCOME_BADGE: Record<string, string> = {
  success: 'bg-emerald-100 text-emerald-700',
  failure: 'bg-red-100 text-red-700',
  denied: 'bg-amber-100 text-amber-800',
};

const eventDescription = (event: PersonalAuditEvent): string => {
  if (event.errorMessage) {
    return event.errorMessage;
  }
  if (event.path && event.method) {
    return `${event.method} ${event.path}`;
  }
  return event.resourceType
    ? `${event.resourceType}:${event.resourceId ?? '-'}`
    : 'No extra details';
};

const consentLabel: Record<ConsentType, string> = {
  privacy_policy: 'Privacy Policy',
  terms_of_service: 'Terms of Service',
  marketing_email: 'Marketing Email',
  data_processing: 'Data Processing',
  cookie_analytics: 'Cookie Analytics',
};

const downloadJson = (filename: string, payload: unknown): void => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const PersonalLogsPanel: React.FC<PersonalLogsPanelProps> = ({
  themeColor,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedOutcome, setSelectedOutcome] = useState<string>('all');
  const [deleteReason, setDeleteReason] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [privacyMessage, setPrivacyMessage] = useState<string | null>(null);
  const [privacyError, setPrivacyError] = useState<string | null>(null);
  const [privacyBusy, setPrivacyBusy] = useState(false);

  const query = useMemo<PersonalAuditQuery>(
    () => ({
      limit: 150,
      search: search.trim() || undefined,
      categories: selectedCategory === 'all' ? undefined : [selectedCategory],
      outcomes: selectedOutcome === 'all' ? undefined : [selectedOutcome],
      includeAutomation: true,
    }),
    [search, selectedCategory, selectedOutcome],
  );

  const feedQuery = useQuery({
    queryKey: ['personal-audit-feed', query],
    queryFn: () => getPersonalAuditFeed(query),
    staleTime: 30_000,
  });

  const privacyReportQuery = useQuery({
    queryKey: ['privacy-access-report'],
    queryFn: () => getPrivacyAccessReport(),
    staleTime: 60_000,
  });

  const consentQuery = useQuery({
    queryKey: ['privacy-consents'],
    queryFn: () => getPrivacyConsents(),
    staleTime: 60_000,
  });

  const dsrQuery = useQuery({
    queryKey: ['privacy-dsr'],
    queryFn: () => listDataSubjectRequests({ limit: 30, offset: 0 }),
    staleTime: 30_000,
  });

  const data = feedQuery.data;
  const summary = data?.summary;
  const isInitialLoadActive =
    feedQuery.isLoading
    || privacyReportQuery.isLoading
    || consentQuery.isLoading
    || dsrQuery.isLoading;
  const isBackgroundActivityActive =
    (feedQuery.isFetching && !feedQuery.isLoading)
    || (privacyReportQuery.isFetching && !privacyReportQuery.isLoading)
    || (consentQuery.isFetching && !consentQuery.isLoading)
    || (dsrQuery.isFetching && !dsrQuery.isLoading)
    || privacyBusy;

  const withPrivacyAction = async (fn: () => Promise<void>) => {
    setPrivacyBusy(true);
    setPrivacyError(null);
    setPrivacyMessage(null);
    try {
      await fn();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Privacy action failed.';
      setPrivacyError(message);
    } finally {
      setPrivacyBusy(false);
    }
  };

  const handleExport = () =>
    withPrivacyAction(async () => {
      const payload = await exportPersonalData();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      downloadJson(`personal-data-export-${timestamp}.json`, payload);
      setPrivacyMessage('Personal data export generated and downloaded.');
      await dsrQuery.refetch();
    });

  const handleDeleteRequest = () =>
    withPrivacyAction(async () => {
      await createDataSubjectRequest({
        requestType: 'delete',
        reason: deleteReason.trim() || undefined,
        confirmEmail: confirmEmail.trim() || undefined,
      });
      setDeleteReason('');
      setConfirmEmail('');
      setPrivacyMessage(
        'Delete request submitted. You can follow status in the request table below.',
      );
      await dsrQuery.refetch();
    });

  const handleConsentToggle = (type: ConsentType, accepted: boolean) =>
    withPrivacyAction(async () => {
      await upsertPrivacyConsent(type, {
        decision: accepted ? 'accepted' : 'revoked',
        policyVersion: '2026-03',
        source: 'personal-privacy-center',
      });
      setPrivacyMessage(
        `${consentLabel[type]} marked as ${accepted ? 'accepted' : 'revoked'}.`,
      );
      await consentQuery.refetch();
    });

  const handlePrivacyPolicyAccept = () =>
    withPrivacyAction(async () => {
      await acceptPrivacyPolicy('2026-03');
      setPrivacyMessage('Privacy policy acceptance recorded.');
      await Promise.all([consentQuery.refetch(), privacyReportQuery.refetch()]);
    });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">{tStatic('common:auto.frontend.kfbeb4c81bede')}</h2>
        <p className="mt-1 text-sm text-slate-600">
          {tStatic('common:auto.frontend.k26dcf854a8cb')}</p>
      </div>

      {isInitialLoadActive && (
        <div
          className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-700"
          role="status"
          aria-live="polite"
        >
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-9-9" />
          </svg>
          {tStatic('common:auto.frontend.k50c6253d51b7')}
        </div>
      )}

      {isBackgroundActivityActive && !isInitialLoadActive && (
        <div
          className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-700"
          role="status"
          aria-live="polite"
        >
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-9-9" />
          </svg>
          {tStatic('common:auto.frontend.k50c6253d51b7')}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {tStatic('common:auto.frontend.k404aaeec8e3c')}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {summary?.totalEvents ?? '-'}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {tStatic('common:auto.frontend.k5e7cc2fead90')}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {summary ? `${summary.loginSuccessCount}/${summary.loginFailureCount}` : '-'}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {tStatic('common:auto.frontend.k1e4bfd73334a')}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {summary ? `${summary.apiKeyCallCount + summary.mcpCallCount}` : '-'}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {tStatic('common:auto.frontend.k4978f5d37915')}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {summary?.automationRunCount ?? '-'}
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              {tStatic('common:auto.frontend.k2f70f8c73180')}</h3>
            <p className="mt-1 text-xs text-slate-500">
              {tStatic('common:auto.frontend.ka9588aa4fed5')}</p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={privacyBusy}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: themeColor }}
          >
            {tStatic('common:auto.frontend.k609211e83fd7')}</button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {tStatic('common:auto.frontend.k9db108ba6b7f')}</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {privacyReportQuery.data?.profile.privacyPolicyVersion ?? 'not accepted'}
            </p>
            <p className="text-xs text-slate-500">
              {tStatic('common:auto.frontend.kadc7aca56eca')}{' '}
              {privacyReportQuery.data?.profile.privacyPolicyAcceptedAt
                ? formatDateTime(privacyReportQuery.data.profile.privacyPolicyAcceptedAt)
                : 'n/a'}
            </p>
            <button
              type="button"
              onClick={handlePrivacyPolicyAccept}
              disabled={privacyBusy}
              className="mt-2 rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 disabled:opacity-60"
            >
              {tStatic('common:auto.frontend.k10294da69b01')}</button>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {tStatic('common:auto.frontend.kca5abc1d090f')}</p>
            <p className="mt-1 text-sm text-slate-700">
              {tStatic('common:auto.frontend.kf5e92392fe00')}{privacyReportQuery.data?.footprint.ownedCalendars ?? 'n/a'}
            </p>
            <p className="text-sm text-slate-700">
              {tStatic('common:auto.frontend.kf82d30abe9f0')}{privacyReportQuery.data?.footprint.createdEvents ?? 'n/a'}
            </p>
            <p className="text-sm text-slate-700">
              {tStatic('common:auto.frontend.k7f0bc90f4685')}{privacyReportQuery.data?.footprint.ownedTasks ?? 'n/a'}
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {tStatic('common:auto.frontend.kfa8d4ceb2ec0')}</p>
            <input
              value={confirmEmail}
              onChange={(event) => setConfirmEmail(event.target.value)}
              placeholder={tStatic('common:auto.frontend.kbfdda476b6e1')}
              className="mt-2 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
            />
            <input
              value={deleteReason}
              onChange={(event) => setDeleteReason(event.target.value)}
              placeholder={tStatic('common:auto.frontend.kf6826f8fc9b4')}
              className="mt-2 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
            />
            <button
              type="button"
              onClick={handleDeleteRequest}
              disabled={privacyBusy}
              className="mt-2 w-full rounded border border-rose-300 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50 disabled:opacity-60"
            >
              {tStatic('common:auto.frontend.k8b8afe514a42')}</button>
          </article>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {(['marketing_email', 'cookie_analytics'] as ConsentType[]).map(
            (type) => {
              const latest = consentQuery.data?.find(
                (item) => item.consentType === type,
              );
              const accepted = latest?.decision === 'accepted';
              return (
                <div
                  key={type}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {consentLabel[type]}
                    </p>
                    <p className="text-xs text-slate-500">
                      {latest
                        ? `${latest.decision} on ${formatDateTime(latest.createdAt)}`
                        : 'No decision yet'}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={privacyBusy}
                    onClick={() => handleConsentToggle(type, !accepted)}
                    className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    {accepted ? 'Revoke' : 'Accept'}
                  </button>
                </div>
              );
            },
          )}
        </div>

        {privacyError && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {privacyError}
          </p>
        )}
        {privacyMessage && !privacyError && (
          <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {privacyMessage}
          </p>
        )}
      </section>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">{tStatic('common:auto.frontend.k88dff832f3ac')}</h3>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">{tStatic('common:auto.frontend.k89f89c02cf47')}</th>
                <th className="px-3 py-2 font-medium">{tStatic('common:auto.frontend.k3deb74565196')}</th>
                <th className="px-3 py-2 font-medium">{tStatic('common:auto.frontend.kbae7d5be7082')}</th>
                <th className="px-3 py-2 font-medium">{tStatic('common:auto.frontend.kaccf40c89baa')}</th>
                <th className="px-3 py-2 font-medium">{tStatic('common:auto.frontend.k1798b3ba42ee')}</th>
              </tr>
            </thead>
            <tbody>
              {(dsrQuery.data?.items ?? []).map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-mono text-slate-700">#{item.id}</td>
                  <td className="px-3 py-2 text-slate-700">{item.requestType}</td>
                  <td className="px-3 py-2 text-slate-700">{item.status}</td>
                  <td className="px-3 py-2 text-slate-600">
                    {formatDateTime(item.createdAt)}
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    {item.completedAt ? formatDateTime(item.completedAt) : 'n/a'}
                  </td>
                </tr>
              ))}
              {!dsrQuery.isLoading && (dsrQuery.data?.items.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-5 text-center text-slate-500">
                    {tStatic('common:auto.frontend.k6e0b2e1f6e2b')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={tStatic('common:auto.frontend.k6e60cd40ed51')}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">{tStatic('common:auto.frontend.k060be00f4f26')}</option>
            <option value="security">{tStatic('common:auto.frontend.kf25ce1b8a399')}</option>
            <option value="mutation">{tStatic('common:auto.frontend.k13bcc5c25bae')}</option>
            <option value="permission">{tStatic('common:auto.frontend.k1785713451d0')}</option>
            <option value="api_error">{tStatic('common:auto.frontend.ke7fc9ad43d15')}</option>
            <option value="frontend_error">{tStatic('common:auto.frontend.k3e5984c265cb')}</option>
          </select>
          <select
            value={selectedOutcome}
            onChange={(event) => setSelectedOutcome(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">{tStatic('common:auto.frontend.k8769f8f20db9')}</option>
            <option value="success">{tStatic('common:auto.frontend.k42a8f651d79f')}</option>
            <option value="failure">{tStatic('common:auto.frontend.k1656649117e4')}</option>
            <option value="denied">{tStatic('common:auto.frontend.k63b16bd41e56')}</option>
          </select>
          <button
            type="button"
            onClick={() => feedQuery.refetch()}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: themeColor }}
          >
            {tStatic('common:auto.frontend.k56e3badc4e6c')}</button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-900">{tStatic('common:auto.frontend.k2ec1ddc09f5f')}</h3>
        </div>
        {feedQuery.isLoading && (
          <div className="px-4 py-6 text-sm text-slate-500">
            {tStatic('common:auto.frontend.k50c6253d51b7')}</div>
        )}
        {feedQuery.isError && (
          <div className="px-4 py-6 text-sm text-red-600">
            {(feedQuery.error as Error).message || 'Failed to load personal logs.'}
          </div>
        )}
        {!feedQuery.isLoading && !feedQuery.isError && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">{tStatic('common:auto.frontend.k6c82e6dd8680')}</th>
                  <th className="px-4 py-3 font-medium">{tStatic('common:auto.frontend.k97c89a4d6630')}</th>
                  <th className="px-4 py-3 font-medium">{tStatic('common:auto.frontend.ka3c686e711e4')}</th>
                  <th className="px-4 py-3 font-medium">{tStatic('common:auto.frontend.kd3f0610632bb')}</th>
                  <th className="px-4 py-3 font-medium">{tStatic('common:auto.frontend.kde314fa0c9d9')}</th>
                  <th className="px-4 py-3 font-medium">{tStatic('common:auto.frontend.kdc3decbb9384')}</th>
                </tr>
              </thead>
              <tbody>
                {(data?.events ?? []).map((event) => (
                  <tr key={event.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-slate-600">
                      {formatDateTime(event.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {event.action}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{event.category}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${OUTCOME_BADGE[event.outcome] ?? 'bg-slate-100 text-slate-700'}`}
                      >
                        {event.outcome}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${SEVERITY_BADGE[event.severity] ?? 'bg-slate-100 text-slate-700'}`}
                      >
                        {event.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {eventDescription(event)}
                    </td>
                  </tr>
                ))}
                {(data?.events.length ?? 0) === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      {tStatic('common:auto.frontend.kfc03444f72fc')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalLogsPanel;
