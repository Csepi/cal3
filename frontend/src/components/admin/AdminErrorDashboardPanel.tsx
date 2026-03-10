import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchAdminAuditEvents,
  fetchAdminErrorSummary,
  formatAdminError,
} from './adminApiService';
import type { AuditEvent, AuditSeverity } from './types';

import { tStatic } from '../../i18n';

interface AdminErrorDashboardPanelProps {
  isActive?: boolean;
}

const severityChipClass: Record<AuditSeverity, string> = {
  info: 'bg-blue-100 text-blue-700 border border-blue-200',
  warn: 'bg-amber-100 text-amber-700 border border-amber-200',
  critical: 'bg-red-100 text-red-700 border border-red-200',
};

const toDisplayTime = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value));

export const AdminErrorDashboardPanel: React.FC<AdminErrorDashboardPanelProps> = ({
  isActive = false,
}) => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hoursWindow, setHoursWindow] = useState(24);
  const [summary, setSummary] = useState<{
    criticalCount: number;
    failureCount: number;
    topErrorCodes: Array<{ code: string; count: number }>;
    trend: Array<{ hour: string; count: number }>;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const from = new Date(now.getTime() - hoursWindow * 60 * 60 * 1000);

      const [eventsResponse, summaryResponse] = await Promise.all([
        fetchAdminAuditEvents({
          categories: ['api_error', 'frontend_error', 'security'],
          from: from.toISOString(),
          to: now.toISOString(),
          limit: 200,
        }),
        fetchAdminErrorSummary(hoursWindow),
      ]);

      setEvents(eventsResponse.items ?? []);
      setSummary(summaryResponse.data);
    } catch (err) {
      setError(formatAdminError(err));
    } finally {
      setLoading(false);
    }
  }, [hoursWindow]);

  useEffect(() => {
    if (!isActive) return;
    void load();
    const timer = window.setInterval(() => {
      void load();
    }, 15000);
    return () => window.clearInterval(timer);
  }, [isActive, load]);

  const criticalEvents = useMemo(
    () => events.filter((event) => event.severity === 'critical').slice(0, 20),
    [events],
  );

  return (
    <section className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border border-gray-200">
      <header className="px-6 py-5 border-b border-gray-200 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{tStatic('common:auto.frontend.k2204bca9e1e9')}</h2>
          <p className="text-sm text-gray-500">
            {tStatic('common:auto.frontend.kcda7f284bf42')}</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600">{tStatic('common:auto.frontend.k41dfc0a6c927')}</label>
          <select
            className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
            value={hoursWindow}
            onChange={(event) => setHoursWindow(Number(event.target.value))}
          >
            <option value={1}>{tStatic('common:auto.frontend.ke9c9f7bc39bb')}</option>
            <option value={6}>{tStatic('common:auto.frontend.k8d61fd6a4ee0')}</option>
            <option value={24}>{tStatic('common:auto.frontend.k027795961131')}</option>
            <option value={72}>{tStatic('common:auto.frontend.k3a667340feca')}</option>
          </select>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            {tStatic('common:auto.frontend.k56e3badc4e6c')}</button>
        </div>
      </header>

      {error && (
        <div className="px-6 py-3 text-sm text-red-700 bg-red-50 border-b border-red-100">
          {error}
        </div>
      )}

      <div className="px-6 py-5 grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-gray-200 p-4 bg-gray-50/70">
          <p className="text-xs uppercase tracking-wide text-gray-500">{tStatic('common:auto.frontend.k04b7b26c8ca2')}</p>
          <p className="text-2xl font-semibold text-red-700">
            {summary?.criticalCount ?? 0}
          </p>
        </article>
        <article className="rounded-xl border border-gray-200 p-4 bg-gray-50/70">
          <p className="text-xs uppercase tracking-wide text-gray-500">{tStatic('common:auto.frontend.k3eec15825d37')}</p>
          <p className="text-2xl font-semibold text-amber-700">
            {summary?.failureCount ?? 0}
          </p>
        </article>
        <article className="rounded-xl border border-gray-200 p-4 bg-gray-50/70">
          <p className="text-xs uppercase tracking-wide text-gray-500">{tStatic('common:auto.frontend.k7c8ab1b444c9')}</p>
          <p className="text-2xl font-semibold text-gray-900">{events.length}</p>
        </article>
      </div>

      <div className="px-6 pb-6 grid gap-6 xl:grid-cols-2">
        <article className="rounded-2xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">{tStatic('common:auto.frontend.k7e377a85510e')}</h3>
          <div className="space-y-2">
            {(summary?.topErrorCodes ?? []).slice(0, 10).map((item) => (
              <div
                key={item.code}
                className="flex items-center justify-between rounded-lg bg-gray-50 border border-gray-200 px-3 py-2"
              >
                <span className="font-mono text-xs text-gray-700">{item.code}</span>
                <span className="text-sm font-semibold text-gray-900">{item.count}</span>
              </div>
            ))}
            {(summary?.topErrorCodes?.length ?? 0) === 0 && (
              <p className="text-sm text-gray-500">{tStatic('common:auto.frontend.k121aab5e3528')}</p>
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">{tStatic('common:auto.frontend.kbcc1a612d1aa')}</h3>
          <div className="space-y-3 max-h-[380px] overflow-auto pr-1">
            {criticalEvents.map((event) => (
              <div key={event.id} className="rounded-xl border border-red-200 bg-red-50/50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-red-700">{event.action}</span>
                  <span className="text-[11px] text-red-600">{toDisplayTime(event.createdAt)}</span>
                </div>
                <p className="mt-1 text-xs text-red-700">{event.errorMessage ?? 'Critical event without message'}</p>
                {event.requestId && (
                  <p className="mt-1 font-mono text-[11px] text-red-600">
                    {tStatic('common:auto.frontend.k501f4b093aea')}{event.requestId}
                  </p>
                )}
              </div>
            ))}
            {criticalEvents.length === 0 && (
              <p className="text-sm text-gray-500">{tStatic('common:auto.frontend.kb681987fc18b')}</p>
            )}
          </div>
        </article>
      </div>

      <div className="px-6 pb-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">{tStatic('common:auto.frontend.k2bbce038f70e')}</h3>
        <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
          {events.map((event) => (
            <article
              key={event.id}
              className="rounded-xl border border-gray-200 px-3 py-2 bg-white flex items-start justify-between gap-4"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${severityChipClass[event.severity]}`}>
                    {event.severity}
                  </span>
                  <span className="text-xs text-gray-500">{event.category}</span>
                  <span className="text-xs font-medium text-gray-700 truncate">
                    {event.action}
                  </span>
                </div>
                <p className="text-xs text-gray-700 truncate">
                  {event.errorMessage ?? event.errorCode ?? 'No error message'}
                </p>
                {event.requestId && (
                  <p className="text-[11px] font-mono text-gray-500 truncate">
                    {event.requestId}
                  </p>
                )}
              </div>
              <span className="text-[11px] text-gray-500 whitespace-nowrap">
                {toDisplayTime(event.createdAt)}
              </span>
            </article>
          ))}
          {!loading && events.length === 0 && (
            <p className="text-sm text-gray-500">{tStatic('common:auto.frontend.kac45479776ed')}</p>
          )}
          {loading && <p className="text-sm text-gray-500">{tStatic('common:auto.frontend.k1e6195a7e64b')}</p>}
        </div>
      </div>
    </section>
  );
};

export default AdminErrorDashboardPanel;
