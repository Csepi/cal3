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
        <h2 className="text-xl font-semibold text-slate-900">Personal Logs</h2>
        <p className="mt-1 text-sm text-slate-600">
          Full audit trail for your account activity, automations, API key
          calls, login attempts, and GDPR privacy controls.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Total Events
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {summary?.totalEvents ?? '-'}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Login Success/Fail
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {summary ? `${summary.loginSuccessCount}/${summary.loginFailureCount}` : '-'}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            API/MCP Calls
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {summary ? `${summary.apiKeyCallCount + summary.mcpCallCount}` : '-'}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Automation Runs
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {summary?.automationRunCount ?? '-'}
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Privacy & Data Rights
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Self-service GDPR controls for consent, data export, and deletion
              requests.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={privacyBusy}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: themeColor }}
          >
            Export My Data
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Privacy Policy
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {privacyReportQuery.data?.profile.privacyPolicyVersion ?? 'not accepted'}
            </p>
            <p className="text-xs text-slate-500">
              accepted:{' '}
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
              Accept v2026-03
            </button>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Data Footprint
            </p>
            <p className="mt-1 text-sm text-slate-700">
              Calendars: {privacyReportQuery.data?.footprint.ownedCalendars ?? 'n/a'}
            </p>
            <p className="text-sm text-slate-700">
              Events: {privacyReportQuery.data?.footprint.createdEvents ?? 'n/a'}
            </p>
            <p className="text-sm text-slate-700">
              Tasks: {privacyReportQuery.data?.footprint.ownedTasks ?? 'n/a'}
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Delete Request
            </p>
            <input
              value={confirmEmail}
              onChange={(event) => setConfirmEmail(event.target.value)}
              placeholder="Confirm email"
              className="mt-2 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
            />
            <input
              value={deleteReason}
              onChange={(event) => setDeleteReason(event.target.value)}
              placeholder="Reason (optional)"
              className="mt-2 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
            />
            <button
              type="button"
              onClick={handleDeleteRequest}
              disabled={privacyBusy}
              className="mt-2 w-full rounded border border-rose-300 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50 disabled:opacity-60"
            >
              Submit delete request
            </button>
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
        <h3 className="text-sm font-semibold text-slate-900">Data Requests</h3>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">ID</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Created</th>
                <th className="px-3 py-2 font-medium">Completed</th>
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
                    No data subject requests yet.
                  </td>
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
            placeholder="Search action or error..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">All categories</option>
            <option value="security">Security</option>
            <option value="mutation">Mutation</option>
            <option value="permission">Permission</option>
            <option value="api_error">API errors</option>
            <option value="frontend_error">Frontend errors</option>
          </select>
          <select
            value={selectedOutcome}
            onChange={(event) => setSelectedOutcome(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">All outcomes</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
            <option value="denied">Denied</option>
          </select>
          <button
            type="button"
            onClick={() => feedQuery.refetch()}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: themeColor }}
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-900">Activity Events</h3>
        </div>
        {feedQuery.isLoading && (
          <div className="px-4 py-6 text-sm text-slate-500">
            Loading personal logs...
          </div>
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
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Outcome</th>
                  <th className="px-4 py-3 font-medium">Severity</th>
                  <th className="px-4 py-3 font-medium">Details</th>
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
                      No audit events found for current filters.
                    </td>
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
