import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  clearAdminLogs,
  fetchAdminLogs,
  formatAdminError,
  runAdminLogRetention,
  updateLogRetentionSettings,
} from './adminApiService';
import type { LogLevel, LogResponse, LogSettings } from './types';
import {
  applyClientLogFilters,
  buildRequestGroups,
  computePercentile,
  parseLogEntry,
  sortParsedLogs,
  toCsv,
  type ClientLogFilters,
  type ParsedLogEntry,
} from './logsInsights';

interface AdminLogsPanelProps {
  isActive?: boolean;
}

type ViewMode = 'table' | 'timeline' | 'requests';

interface ServerFilterState {
  levels: LogLevel[];
  contexts: string[];
  search: string;
  from: string;
  to: string;
  limit: number;
  offset: number;
}

interface SettingsDraft {
  retentionDays: number;
  autoCleanupEnabled: boolean;
  realtimeCriticalAlertsEnabled: boolean;
  errorRateAlertThresholdPerMinute: number;
  p95LatencyAlertThresholdMs: number;
  metricsRetentionHours: number;
}

const LEVEL_OPTIONS: LogLevel[] = ['trace', 'debug', 'info', 'warn', 'error'];
const METHOD_OPTIONS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];

const DEFAULT_SERVER_FILTERS: ServerFilterState = {
  levels: [],
  contexts: [],
  search: '',
  from: '',
  to: '',
  limit: 200,
  offset: 0,
};

const INITIAL_CLIENT_FILTERS: ClientLogFilters = {
  methods: [],
  requestId: '',
  pathContains: '',
  userId: '',
  organisationId: '',
  onlyWithStack: false,
  onlyErrors: false,
  onlyApiExceptions: false,
  onlyAuthRelated: false,
};

const levelBadgeClass: Record<LogLevel, string> = {
  log: 'bg-slate-100 text-slate-700 border border-slate-200',
  info: 'bg-blue-100 text-blue-700 border border-blue-200',
  warn: 'bg-amber-100 text-amber-700 border border-amber-200',
  error: 'bg-red-100 text-red-700 border border-red-200',
  debug: 'bg-violet-100 text-violet-700 border border-violet-200',
  verbose: 'bg-cyan-100 text-cyan-700 border border-cyan-200',
  trace: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
};

const metricTone = (value: number, warnThreshold: number): string =>
  value >= warnThreshold
    ? 'text-red-700'
    : value >= warnThreshold * 0.7
      ? 'text-amber-700'
      : 'text-emerald-700';

const formatDateTime = (value: string): string =>
  new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value));

const toInputDateTime = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hour}:${minute}`;
};

const toIso = (value: string): string | undefined => {
  if (!value.trim()) {
    return undefined;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
};

const toggleArray = <T,>(values: T[], value: T): T[] =>
  values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];

const safeNumber = (value: string): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getDurationMs = (from: string, to: string): number =>
  Math.max(0, new Date(to).getTime() - new Date(from).getTime());

const downloadTextFile = (filename: string, content: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const AdminLogsPanel: React.FC<AdminLogsPanelProps> = ({ isActive = false }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [serverDraft, setServerDraft] =
    useState<ServerFilterState>(DEFAULT_SERVER_FILTERS);
  const [serverFilters, setServerFilters] =
    useState<ServerFilterState>(DEFAULT_SERVER_FILTERS);

  const [clientFilters, setClientFilters] =
    useState<ClientLogFilters>(INITIAL_CLIENT_FILTERS);
  const [minLatencyMs, setMinLatencyMs] = useState('');
  const [requireMetadata, setRequireMetadata] = useState(false);
  const [sortDirection, setSortDirection] = useState<'newest' | 'oldest'>('newest');

  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshSeconds, setRefreshSeconds] = useState(20);

  const [logs, setLogs] = useState<ParsedLogEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const [settings, setSettings] = useState<LogSettings | null>(null);
  const [settingsDraft, setSettingsDraft] = useState<SettingsDraft | null>(null);
  const [clearBefore, setClearBefore] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [maintenanceBusy, setMaintenanceBusy] = useState(false);

  useEffect(() => {
    if (!settings) {
      return;
    }
    setSettingsDraft({
      retentionDays: settings.retentionDays,
      autoCleanupEnabled: settings.autoCleanupEnabled,
      realtimeCriticalAlertsEnabled: settings.realtimeCriticalAlertsEnabled,
      errorRateAlertThresholdPerMinute: settings.errorRateAlertThresholdPerMinute,
      p95LatencyAlertThresholdMs: settings.p95LatencyAlertThresholdMs,
      metricsRetentionHours: settings.metricsRetentionHours,
    });
  }, [settings]);

  const loadLogs = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      try {
        const response = (await fetchAdminLogs({
          levels: serverFilters.levels,
          contexts: serverFilters.contexts,
          search: serverFilters.search,
          from: toIso(serverFilters.from),
          to: toIso(serverFilters.to),
          limit: serverFilters.limit,
          offset: serverFilters.offset,
        })) as LogResponse;

        const parsed = (response.items ?? []).map(parseLogEntry);
        setLogs(parsed);
        setTotalCount(response.count ?? parsed.length);
        setSettings(response.settings ?? null);
      } catch (err) {
        setError(formatAdminError(err));
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [serverFilters],
  );

  useEffect(() => {
    if (!isActive) {
      return;
    }
    void loadLogs();
  }, [isActive, loadLogs]);

  useEffect(() => {
    if (!isActive || !autoRefresh) {
      return;
    }

    const seconds = Math.max(10, refreshSeconds);
    const timer = window.setInterval(() => {
      void loadLogs(true);
    }, seconds * 1000);

    return () => window.clearInterval(timer);
  }, [autoRefresh, isActive, loadLogs, refreshSeconds]);

  const availableContexts = useMemo(() => {
    const contextSet = new Set<string>();
    logs.forEach((log) => {
      if (log.context && log.context.trim()) {
        contextSet.add(log.context);
      }
    });
    return Array.from(contextSet).sort((a, b) => a.localeCompare(b));
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const baseline = applyClientLogFilters(logs, clientFilters);
    const minLatency = safeNumber(minLatencyMs);

    const refined = baseline.filter((entry) => {
      if (requireMetadata) {
        const metadataKeys = entry.metadata ? Object.keys(entry.metadata).length : 0;
        if (metadataKeys === 0) {
          return false;
        }
      }

      if (minLatency !== null && minLatency > 0) {
        if ((entry.latencyMs ?? -1) < minLatency) {
          return false;
        }
      }

      return true;
    });

    return sortParsedLogs(refined, sortDirection);
  }, [clientFilters, logs, minLatencyMs, requireMetadata, sortDirection]);

  const requestGroups = useMemo(() => buildRequestGroups(filteredLogs), [filteredLogs]);

  const latencyValues = useMemo(
    () => filteredLogs.map((entry) => entry.latencyMs).filter((value): value is number => typeof value === 'number'),
    [filteredLogs],
  );

  const errorCount = useMemo(
    () => filteredLogs.filter((entry) => entry.level === 'error').length,
    [filteredLogs],
  );
  const authRelatedCount = useMemo(
    () => filteredLogs.filter((entry) => entry.isAuthRelated).length,
    [filteredLogs],
  );
  const apiExceptionCount = useMemo(
    () => filteredLogs.filter((entry) => entry.isApiException).length,
    [filteredLogs],
  );

  const p50Latency = computePercentile(latencyValues, 50);
  const p95Latency = computePercentile(latencyValues, 95);
  const errorRatio = filteredLogs.length > 0 ? (errorCount / filteredLogs.length) * 100 : 0;

  const hasPreviousPage = serverFilters.offset > 0;
  const hasNextPage = serverFilters.offset + serverFilters.limit < totalCount;
  const currentFrom = totalCount === 0 ? 0 : serverFilters.offset + 1;
  const currentTo = Math.min(serverFilters.offset + serverFilters.limit, totalCount);

  const queryDirty =
    JSON.stringify({ ...serverDraft, offset: 0 }) !==
    JSON.stringify({ ...serverFilters, offset: 0 });

  const applyServerQuery = () => {
    setServerFilters({ ...serverDraft, offset: 0 });
    setMessage('Query updated.');
  };

  const resetAllFilters = () => {
    const resetState = {
      ...DEFAULT_SERVER_FILTERS,
      from: toInputDateTime(new Date(Date.now() - 60 * 60 * 1000)),
      to: toInputDateTime(new Date()),
    };

    setServerDraft(resetState);
    setServerFilters({ ...resetState, offset: 0 });
    setClientFilters(INITIAL_CLIENT_FILTERS);
    setMinLatencyMs('');
    setRequireMetadata(false);
    setSortDirection('newest');
    setMessage('Filters reset to default incident window.');
  };

  const applyQuickPreset = (preset: 'auth' | 'api' | 'slow' | 'noisy') => {
    if (preset === 'auth') {
      setClientFilters((prev) => ({
        ...prev,
        onlyErrors: true,
        onlyAuthRelated: true,
        onlyApiExceptions: false,
      }));
      setSortDirection('newest');
      setMessage('Preset applied: authentication incidents');
      return;
    }

    if (preset === 'api') {
      setClientFilters((prev) => ({
        ...prev,
        onlyErrors: false,
        onlyAuthRelated: false,
        onlyApiExceptions: true,
      }));
      setSortDirection('newest');
      setMessage('Preset applied: API exceptions');
      return;
    }

    if (preset === 'slow') {
      setClientFilters((prev) => ({
        ...prev,
        onlyErrors: false,
        onlyAuthRelated: false,
      }));
      setMinLatencyMs('1000');
      setSortDirection('newest');
      setMessage('Preset applied: slow requests >= 1000ms');
      return;
    }

    setClientFilters((prev) => ({
      ...prev,
      onlyErrors: true,
      onlyApiExceptions: false,
      onlyAuthRelated: false,
    }));
    setServerDraft((prev) => ({
      ...prev,
      levels: ['warn', 'error'],
      offset: 0,
    }));
    setMessage('Preset applied: warn/error noise sweep');
  };

  const exportCsv = () => {
    const csv = toCsv(filteredLogs);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    downloadTextFile(`operational-logs-${timestamp}.csv`, csv, 'text/csv;charset=utf-8');
    setMessage('CSV export generated.');
  };

  const copyPayload = async (entry: ParsedLogEntry) => {
    try {
      if (!navigator.clipboard) {
        setMessage('Clipboard API unavailable in this browser context.');
        return;
      }

      await navigator.clipboard.writeText(JSON.stringify(entry, null, 2));
      setMessage(`Copied log #${entry.id} payload.`);
    } catch {
      setMessage('Failed to copy payload.');
    }
  };

  const saveRetentionSettings = async () => {
    if (!settingsDraft) {
      return;
    }

    setSavingSettings(true);
    setError(null);

    try {
      await updateLogRetentionSettings(settingsDraft);
      setMessage('Retention and alert settings updated.');
      await loadLogs(true);
    } catch (err) {
      setError(formatAdminError(err));
    } finally {
      setSavingSettings(false);
    }
  };

  const purgeExpired = async () => {
    setMaintenanceBusy(true);
    setError(null);

    try {
      const result = await runAdminLogRetention();
      const deleted = typeof result?.deleted === 'number' ? result.deleted : 0;
      setMessage(`Retention cleanup complete. Deleted ${deleted} log entries.`);
      await loadLogs(true);
    } catch (err) {
      setError(formatAdminError(err));
    } finally {
      setMaintenanceBusy(false);
    }
  };

  const clearLogs = async () => {
    setMaintenanceBusy(true);
    setError(null);

    try {
      const result = await clearAdminLogs(toIso(clearBefore));
      const deleted = typeof result?.deleted === 'number' ? result.deleted : 0;
      setMessage(`Log cleanup complete. Deleted ${deleted} entries.`);
      await loadLogs(true);
    } catch (err) {
      setError(formatAdminError(err));
    } finally {
      setMaintenanceBusy(false);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/95 shadow-xl backdrop-blur-md">
      <header className="border-b border-slate-200 px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Operational Logs</h2>
            <p className="text-sm text-slate-500">
              Incident-first triage console with correlation, anomaly filters, and retention controls.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(event) => setAutoRefresh(event.target.checked)}
                className="h-4 w-4"
              />
              Auto refresh
            </label>
            <select
              value={refreshSeconds}
              onChange={(event) => setRefreshSeconds(Number(event.target.value))}
              className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
            >
              <option value={10}>10s</option>
              <option value={20}>20s</option>
              <option value={30}>30s</option>
              <option value={60}>60s</option>
            </select>
            <button
              type="button"
              onClick={() => void loadLogs()}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>
        </div>
        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {message && !error && (
          <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>
        )}
      </header>

      <div className="grid gap-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Loaded</p>
          <p className="text-2xl font-semibold text-slate-900">{filteredLogs.length}</p>
          <p className="text-xs text-slate-500">of {totalCount} queried logs</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Errors</p>
          <p className={`text-2xl font-semibold ${metricTone(errorRatio, 30)}`}>{errorCount}</p>
          <p className="text-xs text-slate-500">{errorRatio.toFixed(1)}% error ratio</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Auth/API Signals</p>
          <p className="text-2xl font-semibold text-slate-900">{authRelatedCount + apiExceptionCount}</p>
          <p className="text-xs text-slate-500">{authRelatedCount} auth, {apiExceptionCount} API exceptions</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Latency</p>
          <p className="text-2xl font-semibold text-slate-900">
            {p95Latency !== null ? `${Math.round(p95Latency)}ms` : 'n/a'}
          </p>
          <p className="text-xs text-slate-500">
            p50 {p50Latency !== null ? `${Math.round(p50Latency)}ms` : 'n/a'}
          </p>
        </article>
      </div>

      <div className="grid gap-4 border-b border-slate-200 px-6 py-5 xl:grid-cols-[2fr_1fr]">
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-800">Server Query Filters</h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyQuickPreset('auth')}
                className="rounded-full border border-slate-300 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100"
              >
                Auth incidents
              </button>
              <button
                type="button"
                onClick={() => applyQuickPreset('api')}
                className="rounded-full border border-slate-300 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100"
              >
                API exceptions
              </button>
              <button
                type="button"
                onClick={() => applyQuickPreset('slow')}
                className="rounded-full border border-slate-300 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100"
              >
                Slow requests
              </button>
              <button
                type="button"
                onClick={() => applyQuickPreset('noisy')}
                className="rounded-full border border-slate-300 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100"
              >
                Warn/Error sweep
              </button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <label className="space-y-1 text-xs text-slate-600">
              Search message/stack
              <input
                type="text"
                value={serverDraft.search}
                onChange={(event) =>
                  setServerDraft((prev) => ({ ...prev, search: event.target.value }))
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                placeholder="request id, keyword, exception"
              />
            </label>

            <label className="space-y-1 text-xs text-slate-600">
              From
              <input
                type="datetime-local"
                value={serverDraft.from}
                onChange={(event) =>
                  setServerDraft((prev) => ({ ...prev, from: event.target.value }))
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </label>

            <label className="space-y-1 text-xs text-slate-600">
              To
              <input
                type="datetime-local"
                value={serverDraft.to}
                onChange={(event) =>
                  setServerDraft((prev) => ({ ...prev, to: event.target.value }))
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </label>

            <label className="space-y-1 text-xs text-slate-600">
              Page size
              <select
                value={serverDraft.limit}
                onChange={(event) =>
                  setServerDraft((prev) => ({ ...prev, limit: Number(event.target.value) }))
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={300}>300</option>
                <option value={500}>500</option>
              </select>
            </label>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Levels</p>
            <div className="flex flex-wrap gap-2">
              {LEVEL_OPTIONS.map((level) => {
                const active = serverDraft.levels.includes(level);
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() =>
                      setServerDraft((prev) => ({
                        ...prev,
                        levels: toggleArray(prev.levels, level),
                      }))
                    }
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                      active
                        ? 'bg-slate-800 text-white'
                        : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Contexts</p>
            <div className="flex max-h-24 flex-wrap gap-2 overflow-auto pr-1">
              {availableContexts.length === 0 && (
                <span className="text-xs text-slate-500">No contexts in current result set.</span>
              )}
              {availableContexts.map((context) => {
                const active = serverDraft.contexts.includes(context);
                return (
                  <button
                    key={context}
                    type="button"
                    onClick={() =>
                      setServerDraft((prev) => ({
                        ...prev,
                        contexts: toggleArray(prev.contexts, context),
                      }))
                    }
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      active
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {context}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={loading || !queryDirty}
              onClick={applyServerQuery}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Run query
            </button>
            <button
              type="button"
              onClick={resetAllFilters}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Reset filters
            </button>
            <button
              type="button"
              onClick={exportCsv}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Export CSV
            </button>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-800">Client Investigation Filters</h3>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">HTTP Method</p>
            <div className="flex flex-wrap gap-2">
              {METHOD_OPTIONS.map((method) => {
                const active = clientFilters.methods.includes(method);
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() =>
                      setClientFilters((prev) => ({
                        ...prev,
                        methods: toggleArray(prev.methods, method),
                      }))
                    }
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      active
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {method}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-xs text-slate-600">
              Request ID contains
              <input
                type="text"
                value={clientFilters.requestId}
                onChange={(event) =>
                  setClientFilters((prev) => ({ ...prev, requestId: event.target.value }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="UUID fragment"
              />
            </label>
            <label className="space-y-1 text-xs text-slate-600">
              Path contains
              <input
                type="text"
                value={clientFilters.pathContains}
                onChange={(event) =>
                  setClientFilters((prev) => ({ ...prev, pathContains: event.target.value }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="/api/auth"
              />
            </label>
            <label className="space-y-1 text-xs text-slate-600">
              User ID
              <input
                type="number"
                value={clientFilters.userId}
                onChange={(event) =>
                  setClientFilters((prev) => ({ ...prev, userId: event.target.value }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="123"
              />
            </label>
            <label className="space-y-1 text-xs text-slate-600">
              Organisation ID
              <input
                type="number"
                value={clientFilters.organisationId}
                onChange={(event) =>
                  setClientFilters((prev) => ({ ...prev, organisationId: event.target.value }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="456"
              />
            </label>
            <label className="space-y-1 text-xs text-slate-600">
              Min latency (ms)
              <input
                type="number"
                min={0}
                value={minLatencyMs}
                onChange={(event) => setMinLatencyMs(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="1000"
              />
            </label>
            <label className="space-y-1 text-xs text-slate-600">
              Sort direction
              <select
                value={sortDirection}
                onChange={(event) =>
                  setSortDirection(event.target.value === 'oldest' ? 'oldest' : 'newest')
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </label>
          </div>

          <div className="grid gap-2 text-xs text-slate-700 md:grid-cols-2">
            <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <input
                type="checkbox"
                checked={clientFilters.onlyErrors}
                onChange={(event) =>
                  setClientFilters((prev) => ({ ...prev, onlyErrors: event.target.checked }))
                }
                className="h-4 w-4"
              />
              Errors only
            </label>
            <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <input
                type="checkbox"
                checked={clientFilters.onlyApiExceptions}
                onChange={(event) =>
                  setClientFilters((prev) => ({
                    ...prev,
                    onlyApiExceptions: event.target.checked,
                  }))
                }
                className="h-4 w-4"
              />
              API exceptions only
            </label>
            <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <input
                type="checkbox"
                checked={clientFilters.onlyAuthRelated}
                onChange={(event) =>
                  setClientFilters((prev) => ({
                    ...prev,
                    onlyAuthRelated: event.target.checked,
                  }))
                }
                className="h-4 w-4"
              />
              Auth related only
            </label>
            <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <input
                type="checkbox"
                checked={clientFilters.onlyWithStack}
                onChange={(event) =>
                  setClientFilters((prev) => ({
                    ...prev,
                    onlyWithStack: event.target.checked,
                  }))
                }
                className="h-4 w-4"
              />
              Only with stack traces
            </label>
            <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 md:col-span-2">
              <input
                type="checkbox"
                checked={requireMetadata}
                onChange={(event) => setRequireMetadata(event.target.checked)}
                className="h-4 w-4"
              />
              Require metadata payload
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setClientFilters(INITIAL_CLIENT_FILTERS)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
            >
              Reset client filters
            </button>
            <button
              type="button"
              onClick={() => setMinLatencyMs('')}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
            >
              Clear latency gate
            </button>
          </div>
        </section>
      </div>

      <div className="border-b border-slate-200 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                viewMode === 'table'
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Table
            </button>
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                viewMode === 'timeline'
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Timeline
            </button>
            <button
              type="button"
              onClick={() => setViewMode('requests')}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                viewMode === 'requests'
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Request groups
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span>
              Showing {currentFrom}-{currentTo} of {totalCount}
            </span>
            <button
              type="button"
              disabled={!hasPreviousPage || loading}
              onClick={() =>
                setServerFilters((prev) => ({
                  ...prev,
                  offset: Math.max(0, prev.offset - prev.limit),
                }))
              }
              className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!hasNextPage || loading}
              onClick={() =>
                setServerFilters((prev) => ({
                  ...prev,
                  offset: prev.offset + prev.limit,
                }))
              }
              className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 px-6 py-5 xl:grid-cols-[3fr_1fr]">
        <section className="min-h-[420px] rounded-2xl border border-slate-200 bg-white p-4">
          {loading && <p className="text-sm text-slate-500">Loading logs...</p>}
          {!loading && filteredLogs.length === 0 && (
            <p className="text-sm text-slate-500">No logs match the current filter set.</p>
          )}

          {!loading && filteredLogs.length > 0 && viewMode === 'table' && (
            <div className="max-h-[640px] overflow-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-100 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Time</th>
                    <th className="px-3 py-2 font-semibold">Level</th>
                    <th className="px-3 py-2 font-semibold">Context</th>
                    <th className="px-3 py-2 font-semibold">Message</th>
                    <th className="px-3 py-2 font-semibold">Request</th>
                    <th className="px-3 py-2 font-semibold">Latency</th>
                    <th className="px-3 py-2 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((entry) => (
                    <React.Fragment key={entry.id}>
                      <tr className="border-t border-slate-200 align-top">
                        <td className="px-3 py-2 text-slate-600">{formatDateTime(entry.createdAt)}</td>
                        <td className="px-3 py-2">
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${levelBadgeClass[entry.level]}`}>
                            {entry.level}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-700">{entry.context ?? 'n/a'}</td>
                        <td className="max-w-[520px] px-3 py-2 text-slate-800">{entry.message}</td>
                        <td className="px-3 py-2 text-[11px] text-slate-600">
                          {entry.requestId ? (
                            <button
                              type="button"
                              onClick={() =>
                                setClientFilters((prev) => ({ ...prev, requestId: entry.requestId ?? '' }))
                              }
                              className="font-mono text-blue-700 hover:underline"
                            >
                              {entry.requestId.slice(0, 8)}...
                            </button>
                          ) : (
                            'n/a'
                          )}
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {typeof entry.latencyMs === 'number' ? `${entry.latencyMs}ms` : 'n/a'}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedRows((prev) => ({ ...prev, [entry.id]: !prev[entry.id] }))
                              }
                              className="rounded border border-slate-300 px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-50"
                            >
                              {expandedRows[entry.id] ? 'Hide' : 'Details'}
                            </button>
                            <button
                              type="button"
                              onClick={() => void copyPayload(entry)}
                              className="rounded border border-slate-300 px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-50"
                            >
                              Copy
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedRows[entry.id] && (
                        <tr className="border-t border-slate-100 bg-slate-50/70">
                          <td colSpan={7} className="px-3 py-3">
                            <div className="grid gap-3 lg:grid-cols-2">
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Metadata</p>
                                <pre className="mt-1 max-h-44 overflow-auto rounded-lg bg-slate-900 p-2 text-[11px] text-slate-100">
                                  {entry.metadata ? JSON.stringify(entry.metadata, null, 2) : '{}'}
                                </pre>
                              </div>
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Stack</p>
                                <pre className="mt-1 max-h-44 overflow-auto rounded-lg bg-slate-900 p-2 text-[11px] text-slate-100">
                                  {entry.stack?.trim() || 'No stack trace'}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filteredLogs.length > 0 && viewMode === 'timeline' && (
            <div className="max-h-[640px] space-y-3 overflow-auto pr-1">
              {filteredLogs.map((entry) => (
                <article key={entry.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${levelBadgeClass[entry.level]}`}>
                        {entry.level}
                      </span>
                      <span className="text-xs text-slate-500">{entry.context ?? 'n/a'}</span>
                      {entry.method && (
                        <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700">
                          {entry.method}
                        </span>
                      )}
                      {entry.path && <span className="font-mono text-[11px] text-slate-600">{entry.path}</span>}
                    </div>
                    <span className="text-[11px] text-slate-500">{formatDateTime(entry.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-800">{entry.message}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                    <span>req: {entry.requestId ?? 'n/a'}</span>
                    <span>user: {entry.userId ?? 'n/a'}</span>
                    <span>org: {entry.organisationId ?? 'n/a'}</span>
                    <span>
                      latency: {typeof entry.latencyMs === 'number' ? `${entry.latencyMs}ms` : 'n/a'}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!loading && filteredLogs.length > 0 && viewMode === 'requests' && (
            <div className="max-h-[640px] space-y-3 overflow-auto pr-1">
              {requestGroups.map((group) => {
                const duration = getDurationMs(group.startedAt, group.endedAt);
                return (
                  <article key={group.id} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-xs text-slate-700">
                          {group.requestId ?? `single-entry-${group.entries[0]?.id ?? 0}`}
                        </p>
                        <p className="text-xs text-slate-500">{group.entries.length} log lines</p>
                      </div>
                      <div className="text-right text-xs text-slate-600">
                        <p>{formatDateTime(group.startedAt)}</p>
                        <p>duration {duration}ms</p>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-600">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5">errors: {group.errorCount}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5">methods: {group.methods.join(', ') || 'n/a'}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5">paths: {group.paths.length}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedGroups((prev) => ({ ...prev, [group.id]: !prev[group.id] }))
                      }
                      className="mt-2 rounded border border-slate-300 px-2.5 py-1 text-[11px] text-slate-700 hover:bg-slate-50"
                    >
                      {expandedGroups[group.id] ? 'Hide entries' : 'Show entries'}
                    </button>

                    {expandedGroups[group.id] && (
                      <div className="mt-2 space-y-2 border-t border-slate-200 pt-2">
                        {group.entries.map((entry) => (
                          <div key={entry.id} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${levelBadgeClass[entry.level]}`}>
                                {entry.level}
                              </span>
                              <span className="text-[11px] text-slate-500">{formatDateTime(entry.createdAt)}</span>
                            </div>
                            <p className="mt-1 text-slate-800">{entry.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <h3 className="text-sm font-semibold text-slate-800">Retention & Alerts</h3>
            {settingsDraft ? (
              <div className="mt-3 space-y-3">
                <label className="space-y-1 text-xs text-slate-600">
                  Retention days
                  <input
                    type="number"
                    min={0}
                    value={settingsDraft.retentionDays}
                    onChange={(event) =>
                      setSettingsDraft((prev) =>
                        prev
                          ? { ...prev, retentionDays: Number(event.target.value) }
                          : prev
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1 text-xs text-slate-600">
                  Error rate threshold/min
                  <input
                    type="number"
                    min={1}
                    value={settingsDraft.errorRateAlertThresholdPerMinute}
                    onChange={(event) =>
                      setSettingsDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              errorRateAlertThresholdPerMinute: Number(event.target.value),
                            }
                          : prev
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1 text-xs text-slate-600">
                  p95 latency threshold (ms)
                  <input
                    type="number"
                    min={100}
                    value={settingsDraft.p95LatencyAlertThresholdMs}
                    onChange={(event) =>
                      setSettingsDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              p95LatencyAlertThresholdMs: Number(event.target.value),
                            }
                          : prev
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </label>

                <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={settingsDraft.autoCleanupEnabled}
                    onChange={(event) =>
                      setSettingsDraft((prev) =>
                        prev
                          ? { ...prev, autoCleanupEnabled: event.target.checked }
                          : prev
                      )
                    }
                    className="h-4 w-4"
                  />
                  Auto cleanup enabled
                </label>
                <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={settingsDraft.realtimeCriticalAlertsEnabled}
                    onChange={(event) =>
                      setSettingsDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              realtimeCriticalAlertsEnabled: event.target.checked,
                            }
                          : prev
                      )
                    }
                    className="h-4 w-4"
                  />
                  Realtime critical alerts enabled
                </label>

                <button
                  type="button"
                  disabled={savingSettings}
                  onClick={() => void saveRetentionSettings()}
                  className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {savingSettings ? 'Saving...' : 'Save settings'}
                </button>
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-500">Settings will appear after first query response.</p>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <h3 className="text-sm font-semibold text-slate-800">Maintenance</h3>
            <div className="mt-3 space-y-3">
              <button
                type="button"
                disabled={maintenanceBusy}
                onClick={() => void purgeExpired()}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-60"
              >
                Run retention purge now
              </button>

              <label className="space-y-1 text-xs text-slate-600">
                Clear logs before
                <input
                  type="datetime-local"
                  value={clearBefore}
                  onChange={(event) => setClearBefore(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </label>

              <button
                type="button"
                disabled={maintenanceBusy}
                onClick={() => void clearLogs()}
                className="w-full rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                {clearBefore ? 'Delete logs before timestamp' : 'Delete all logs'}
              </button>
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
};

export default AdminLogsPanel;
