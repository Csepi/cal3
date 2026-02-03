import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchAdminLogs,
  updateLogRetentionSettings,
  clearAdminLogs,
  runAdminLogRetention,
  formatAdminError,
} from './adminApiService';
import type { LogEntry, LogLevel, LogSettings } from './types';

type RangePreset = '5m' | '15m' | '1h' | '24h' | '7d' | '30d' | 'custom';

const LEVEL_OPTIONS: { value: LogLevel; label: string; description: string }[] = [
  { value: 'error', label: 'Errors', description: 'Unhandled failures and critical exceptions' },
  { value: 'warn', label: 'Warnings', description: 'Recoverable issues that need attention' },
  { value: 'log', label: 'Information', description: 'Key lifecycle and status messages' },
  { value: 'debug', label: 'Debug', description: 'Detailed diagnostics for investigation' },
  { value: 'verbose', label: 'Verbose', description: 'Highly granular tracing output' },
];

const LEVEL_BADGES: Record<LogLevel, { label: string; classes: string }> = {
  error: { label: 'Error', classes: 'bg-red-100 text-red-700 border border-red-200' },
  warn: { label: 'Warning', classes: 'bg-amber-100 text-amber-700 border border-amber-200' },
  log: { label: 'Info', classes: 'bg-blue-100 text-blue-700 border border-blue-200' },
  debug: { label: 'Debug', classes: 'bg-purple-100 text-purple-700 border border-purple-200' },
  verbose: { label: 'Verbose', classes: 'bg-slate-100 text-slate-700 border border-slate-200' },
};

const RANGE_PRESETS: Array<{ value: RangePreset; label: string }> = [
  { value: '5m', label: 'Last 5 minutes' },
  { value: '15m', label: 'Last 15 minutes' },
  { value: '1h', label: 'Last hour' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'custom', label: 'Custom range' },
];

interface AdminLogsPanelProps {
  themeColor?: string;
  isActive?: boolean;
}

interface FilterDraft {
  levels: LogLevel[];
  contexts: string[];
  search: string;
  rangePreset: RangePreset;
  customFrom: string;
  customTo: string;
}

const defaultFilters: FilterDraft = {
  levels: [],
  contexts: [],
  search: '',
  rangePreset: '24h',
  customFrom: '',
  customTo: '',
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value));

const computeRange = (filters: FilterDraft): { from?: string; to?: string } => {
  const now = new Date();
  switch (filters.rangePreset) {
    case '5m': {
      const from = new Date(now.getTime() - 5 * 60 * 1000);
      return { from: from.toISOString(), to: now.toISOString() };
    }
    case '15m': {
      const from = new Date(now.getTime() - 15 * 60 * 1000);
      return { from: from.toISOString(), to: now.toISOString() };
    }
    case '1h': {
      const from = new Date(now.getTime() - 60 * 60 * 1000);
      return { from: from.toISOString(), to: now.toISOString() };
    }
    case '24h': {
      const from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      return { from: from.toISOString(), to: now.toISOString() };
    }
    case '7d': {
      const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { from: from.toISOString(), to: now.toISOString() };
    }
    case '30d': {
      const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { from: from.toISOString(), to: now.toISOString() };
    }
    case 'custom': {
      const from = filters.customFrom ? new Date(filters.customFrom) : undefined;
      const to = filters.customTo ? new Date(filters.customTo) : undefined;
      return {
        from: from && !Number.isNaN(from.getTime()) ? from.toISOString() : undefined,
        to: to && !Number.isNaN(to.getTime()) ? to.toISOString() : undefined,
      };
    }
    default:
      return {};
  }
};

export const AdminLogsPanel: React.FC<AdminLogsPanelProps> = ({ themeColor = '#3b82f6', isActive = false }) => {
const [filters, setFilters] = useState<FilterDraft>(defaultFilters);
const [appliedFilters, setAppliedFilters] = useState<FilterDraft>(defaultFilters);
const [logs, setLogs] = useState<LogEntry[]>([]);
const [availableContexts, setAvailableContexts] = useState<string[]>([]);
const [settings, setSettings] = useState<LogSettings | null>(null);
const [expandedLogId, setExpandedLogId] = useState<number | null>(null);
const [isLoading, setIsLoading] = useState(false);
const [isSavingSettings, setIsSavingSettings] = useState(false);
const [isClearing, setIsClearing] = useState(false);
const [isRunningCleanup, setIsRunningCleanup] = useState(false);
const [retentionDraft, setRetentionDraft] = useState<{ retentionDays: number; autoCleanupEnabled: boolean }>({
  retentionDays: 30,
  autoCleanupEnabled: true,
});
const [error, setError] = useState<string | null>(null);
const [status, setStatus] = useState<string | null>(null);
const [isLevelsOpen, setIsLevelsOpen] = useState(false);
const [isContextsOpen, setIsContextsOpen] = useState(false);

const levelsDropdownRef = useRef<HTMLDivElement>(null);
const contextsDropdownRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (levelsDropdownRef.current && !levelsDropdownRef.current.contains(event.target as Node)) {
      setIsLevelsOpen(false);
    }
    if (contextsDropdownRef.current && !contextsDropdownRef.current.contains(event.target as Node)) {
      setIsContextsOpen(false);
    }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { levels, contexts, search, rangePreset, customFrom, customTo } = appliedFilters;
      const { from, to } = computeRange({ levels, contexts, search, rangePreset, customFrom, customTo });

      const response = await fetchAdminLogs({
        levels: levels.length > 0 ? levels : undefined,
        contexts: contexts.length > 0 ? contexts : undefined,
        search: search.trim() || undefined,
        from,
        to,
      });

      const nextLogs = response.items ?? [];
      setLogs(nextLogs);

      const contextSet = new Set<string>(
        nextLogs
          .map((log) => (log.context || '').trim())
          .filter((context) => context.length > 0),
      );
      const sortedContexts = Array.from(contextSet).sort();
      setAvailableContexts(sortedContexts);
      setFilters((prev) => ({
        ...prev,
        contexts: prev.contexts.filter((ctx) => contextSet.has(ctx)),
      }));
      setAppliedFilters((prev) => ({
        ...prev,
        contexts: prev.contexts.filter((ctx) => contextSet.has(ctx)),
      }));

      if (response.settings) {
        setSettings(response.settings);
        setRetentionDraft({
          retentionDays: response.settings.retentionDays,
          autoCleanupEnabled: response.settings.autoCleanupEnabled,
        });
      }
      setStatus(null);
    } catch (err) {
      setError(formatAdminError(err));
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    if (isActive) {
      loadLogs();
    }
  }, [isActive, loadLogs]);

  const levelStats = useMemo(() => {
    const tally: Record<LogLevel, number> = { error: 0, warn: 0, log: 0, debug: 0, verbose: 0 };
    logs.forEach((log) => {
      tally[log.level] += 1;
    });
    return tally;
  }, [logs]);

  const handleLevelToggle = (level: LogLevel) => {
    setFilters((prev) => {
      const exists = prev.levels.includes(level);
      const nextLevels = exists ? prev.levels.filter((item) => item !== level) : [...prev.levels, level];
      return { ...prev, levels: nextLevels };
    });
  };

  const handleContextToggle = (context: string) => {
    setFilters((prev) => {
      const exists = prev.contexts.includes(context);
      const nextContexts = exists ? prev.contexts.filter((item) => item !== context) : [...prev.contexts, context];
      return { ...prev, contexts: nextContexts };
    });
  };

const handlePresetChange = (value: RangePreset) => {
  setFilters((prev) => ({
    ...prev,
    rangePreset: value,
  }));
  };

const handleApplyFilters = () => {
  setAppliedFilters({ ...filters });
  setIsLevelsOpen(false);
  setIsContextsOpen(false);
};

const handleResetFilters = () => {
  setFilters(defaultFilters);
  setAppliedFilters(defaultFilters);
  setIsLevelsOpen(false);
  setIsContextsOpen(false);
};

const selectAllLevels = () => {
  setFilters((prev) => ({ ...prev, levels: LEVEL_OPTIONS.map((option) => option.value) }));
};

const clearLevels = () => {
  setFilters((prev) => ({ ...prev, levels: [] }));
};

const selectAllContexts = () => {
  setFilters((prev) => ({ ...prev, contexts: availableContexts }));
};

const clearContexts = () => {
  setFilters((prev) => ({ ...prev, contexts: [] }));
};

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    setError(null);
    try {
      const payload = {
        retentionDays: Math.max(0, Number(retentionDraft.retentionDays)),
        autoCleanupEnabled: retentionDraft.autoCleanupEnabled,
      };
      const response = await updateLogRetentionSettings(payload);
      setSettings(response.settings);
      setStatus('Retention settings updated.');
    } catch (err) {
      setError(formatAdminError(err));
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm('Delete all stored logs? This action cannot be undone.')) {
      return;
    }

    setIsClearing(true);
    setError(null);

    try {
      const response = await clearAdminLogs();
      setStatus(`Cleared ${response.deleted ?? 0} log entries.`);
      await loadLogs();
    } catch (err) {
      setError(formatAdminError(err));
    } finally {
      setIsClearing(false);
    }
  };

  const handleRunCleanup = async () => {
    setIsRunningCleanup(true);
    setError(null);

    try {
      const response = await runAdminLogRetention();
      const removed = response.deleted ?? 0;
      setStatus(removed > 0 ? `Retention removed ${removed} log entries.` : 'Retention completed. No entries removed.');
      await loadLogs();
    } catch (err) {
      setError(formatAdminError(err));
    } finally {
      setIsRunningCleanup(false);
    }
  };

  const themeBorderStyle = { borderColor: themeColor };

  return (
    <section className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border" style={themeBorderStyle}>
      <header className="px-6 py-5 border-b border-gray-200 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Operational Logs</h2>
          <p className="text-sm text-gray-500">Track backend activity and errors persisted to the database.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadLogs}
            disabled={isLoading}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={handleRunCleanup}
            disabled={isRunningCleanup || isLoading}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Run Cleanup
          </button>
          <button
            type="button"
            onClick={handleClearLogs}
            disabled={isClearing || isLoading}
            className="inline-flex items-center gap-1 rounded-lg bg-red-50 text-red-600 px-3 py-2 text-sm font-medium border border-red-200 hover:bg-red-100 disabled:opacity-60"
          >
            Clear Logs
          </button>
        </div>
      </header>

      {error && (
        <div className="px-6 py-4 bg-red-50 border-b border-red-100 text-sm text-red-700">{error}</div>
      )}

      {status && (
        <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 text-sm text-emerald-700">{status}</div>
      )}

      <div className="px-6 py-5 border-b border-gray-200 space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div ref={levelsDropdownRef} className="relative">
            <button
              type="button"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
              onClick={() => setIsLevelsOpen((prev) => !prev)}
            >
              <div className="flex items-center justify-between">
                <span>
                  Levels{filters.levels.length > 0 ? ` (${filters.levels.length} selected)` : ' (All)'}
                </span>
                <span className="text-xs text-gray-400">{isLevelsOpen ? 'Hide' : 'Show'}</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">Choose which severity levels to include.</p>
            </button>
            {isLevelsOpen && (
              <div className="absolute z-20 mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-lg p-3 space-y-3">
                {LEVEL_OPTIONS.map((option) => {
                  const checked = filters.levels.includes(option.value);
                  return (
                    <label key={option.value} className="flex items-start gap-3 rounded-lg px-2 py-1 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={checked}
                        onChange={() => handleLevelToggle(option.value)}
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{option.label}</p>
                        <p className="text-xs text-gray-500">{option.description}</p>
                      </div>
                    </label>
                  );
                })}
                <div className="flex items-center justify-between border-t border-gray-200 pt-2 text-xs">
                  <button type="button" className="text-blue-600 hover:text-blue-500" onClick={selectAllLevels}>
                    Select all
                  </button>
                  <button type="button" className="text-gray-600 hover:text-gray-500" onClick={clearLevels}>
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>

          <div ref={contextsDropdownRef} className="relative">
            <button
              type="button"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
              disabled={availableContexts.length === 0}
              onClick={() => setIsContextsOpen((prev) => !prev)}
            >
              <div className="flex items-center justify-between">
                <span>
                  Event types{' '}
                  {filters.contexts.length > 0
                    ? `(${filters.contexts.length} selected)`
                    : availableContexts.length > 0
                    ? '(All)'
                    : '(Waiting for logs)'}
                </span>
                {availableContexts.length > 0 && (
                  <span className="text-xs text-gray-400">{isContextsOpen ? 'Hide' : 'Show'}</span>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {availableContexts.length > 0
                  ? 'Filter by specific Nest logger contexts.'
                  : 'Contexts appear once logs have been collected.'}
              </p>
            </button>
            {isContextsOpen && availableContexts.length > 0 && (
              <div className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg p-3 space-y-2">
                {availableContexts.map((context) => {
                  const checked = filters.contexts.includes(context);
                  return (
                    <label key={context} className="flex items-center gap-3 rounded-lg px-2 py-1 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={checked}
                        onChange={() => handleContextToggle(context)}
                      />
                      <span className="text-sm text-gray-700">{context}</span>
                    </label>
                  );
                })}
                <div className="flex items-center justify-between border-t border-gray-200 pt-2 text-xs">
                  <button type="button" className="text-blue-600 hover:text-blue-500" onClick={selectAllContexts}>
                    Select all
                  </button>
                  <button type="button" className="text-gray-600 hover:text-gray-500" onClick={clearContexts}>
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-gray-600">
            Free-text Search
            <input
              type="text"
              value={filters.search}
              onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
              placeholder="Message, stack trace, or metadata"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </label>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Time Range</p>
            <div className="flex flex-wrap gap-2">
              {RANGE_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handlePresetChange(preset.value)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    filters.rangePreset === preset.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            {filters.rangePreset === 'custom' && (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex flex-col text-xs text-gray-600 gap-1">
                  Start
                  <input
                    type="datetime-local"
                    value={filters.customFrom}
                    onChange={(event) => setFilters((prev) => ({ ...prev, customFrom: event.target.value }))}
                    className="rounded-lg border border-gray-200 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </label>
                <label className="flex flex-col text-xs text-gray-600 gap-1">
                  End
                  <input
                    type="datetime-local"
                    value={filters.customTo}
                    onChange={(event) => setFilters((prev) => ({ ...prev, customTo: event.target.value }))}
                    className="rounded-lg border border-gray-200 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4">
          <div className="text-xs text-gray-500">
            Showing {logs.length} entries{filters.levels.length > 0 ? ` | Levels: ${filters.levels.join(', ')}` : ''}
            {filters.contexts.length > 0 ? ` | Event types: ${filters.contexts.join(', ')}` : ''}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              onClick={handleResetFilters}
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleApplyFilters}
              className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 transition"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-5 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Retention Policy</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm text-gray-600">
            Keep logs for (days)
            <input
              type="number"
              min={0}
              value={retentionDraft.retentionDays}
              onChange={(event) =>
                setRetentionDraft((prev) => ({
                  ...prev,
                  retentionDays: Number(event.target.value || 0),
                }))
              }
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-600 mt-2 md:mt-6">
            <input
              type="checkbox"
              checked={retentionDraft.autoCleanupEnabled}
              onChange={(event) =>
                setRetentionDraft((prev) => ({
                  ...prev,
                  autoCleanupEnabled: event.target.checked,
                }))
              }
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Enable automatic cleanup
          </label>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={isSavingSettings}
              className="w-full inline-flex justify-center rounded-lg bg-emerald-600 text-white px-3 py-2 text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-60"
            >
              {isSavingSettings ? 'Saving...' : 'Save Policy'}
            </button>
          </div>
        </div>
        {settings && (
          <p className="text-xs text-gray-500 mt-2">
            Last updated {formatDateTime(settings.updatedAt)}. Logs older than{' '}
            <span className="font-medium">{settings.retentionDays} days</span> are removed automatically when retention is enabled.
          </p>
        )}
      </div>

      <div className="px-6 py-5 space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Object.entries(levelStats).map(([level, count]) => {
            const meta = LEVEL_BADGES[level as LogLevel];
            return (
              <div
                key={level}
                className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3 shadow-sm flex items-center justify-between"
              >
                <span className={`text-xs font-semibold uppercase ${meta.classes}`}>{meta.label}</span>
                <span className="text-lg font-semibold text-gray-900">{count}</span>
              </div>
            );
          })}
        </div>

        {isLoading && logs.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            <p className="text-sm text-gray-500">Loading logs...</p>
          </div>
        )}

        {!isLoading && logs.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="text-3xl" aria-hidden="true">
              [no-logs]
            </div>
            <p className="text-sm text-gray-600">
              No log entries match the current filters. Try expanding the time range or selecting different criteria.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {logs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            const badge = LEVEL_BADGES[log.level];
            return (
              <div key={log.id} className="border border-gray-200 rounded-xl bg-white shadow-sm">
                <button
                  type="button"
                  className="w-full flex items-start justify-between gap-4 px-4 py-3 text-left"
                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${badge.classes}`}>
                        {badge.label}
                      </span>
                      {log.context && (
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
                          {log.context}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{formatDateTime(log.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-900 line-clamp-2">{log.message}</p>
                  </div>
                  <div className="flex items-center text-gray-400">
                    <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-100 bg-gray-50/60 rounded-b-xl">
                    {log.stack && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Stack Trace</h4>
                        <pre className="max-h-56 overflow-auto bg-gray-900 text-gray-100 text-xs rounded-lg p-4 leading-relaxed">
                          {log.stack}
                        </pre>
                      </div>
                    )}
                    {log.metadata && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Metadata</h4>
                        <pre className="bg-white border border-gray-200 rounded-lg p-3 text-xs text-gray-700 overflow-auto">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

