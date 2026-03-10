import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type {
  PersonalAuditEvent,
  PersonalAuditQuery,
} from '../../types/PersonalAudit';
import { getPersonalAuditFeed } from '../../services/personalLogsApi';

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
  return event.resourceType ? `${event.resourceType}:${event.resourceId ?? '-'}` : 'No extra details';
};

export const PersonalLogsPanel: React.FC<PersonalLogsPanelProps> = ({
  themeColor,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedOutcome, setSelectedOutcome] = useState<string>('all');

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

  const data = feedQuery.data;
  const summary = data?.summary;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Personal Logs</h2>
        <p className="mt-1 text-sm text-slate-600">
          Full audit trail for your account activity, automations, API key calls, and login attempts.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Events</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{summary?.totalEvents ?? '-'}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Login Success/Fail</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {summary ? `${summary.loginSuccessCount}/${summary.loginFailureCount}` : '-'}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">API/MCP Calls</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {summary ? `${summary.apiKeyCallCount + summary.mcpCallCount}` : '-'}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Automation Runs</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{summary?.automationRunCount ?? '-'}</p>
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
          <div className="px-4 py-6 text-sm text-slate-500">Loading personal logs...</div>
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
                    <td className="px-4 py-3 text-slate-600">{formatDateTime(event.createdAt)}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{event.action}</td>
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
                    <td className="px-4 py-3 text-slate-600">{eventDescription(event)}</td>
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
