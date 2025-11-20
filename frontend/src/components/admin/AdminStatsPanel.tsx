/**
 * AdminStatsPanel component for displaying executive-grade live metrics.
 *
 * The redesigned dashboard blends strategic KPIs, operational insights, and
 * actionable notices so administrators can react instantly. Data is refreshed
 * automatically while keeping manual controls for on-demand updates.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '../ui';
import { loadAdminData, formatAdminError } from './adminApiService';
import type { AdminTab, DatabaseStats } from './types';

export interface AdminStatsPanelProps {
  /** Current theme color for styling */
  themeColor?: string;
  /** Whether the panel is currently active/visible */
  isActive?: boolean;
  /** Optional callback to deep-link into another admin tab */
  onNavigate?: (tab: AdminTab) => void;
}

/**
 * Convert a hex color to rgba for translucent UI accents.
 */
const hexToRgba = (hex: string, alpha: number): string => {
  const sanitized = hex.replace('#', '');
  const normalized =
    sanitized.length === 3
      ? sanitized
          .split('')
          .map((char) => `${char}${char}`)
          .join('')
      : sanitized.padEnd(6, '0').slice(0, 6);

  const bigint = Number.parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const formatNumber = (value: number, digits = 0) => {
  if (!Number.isFinite(value)) {
    return '0';
  }
  return value.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

const clampPercentage = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

/**
 * Statistics panel component displaying key database metrics with refresh capability
 */
export const AdminStatsPanel: React.FC<AdminStatsPanelProps> = ({
  themeColor = '#2563eb',
  isActive = false,
  onNavigate,
}) => {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [lastRefreshTs, setLastRefreshTs] = useState<string | null>(null);

  /**
   * Load database statistics from the API
   */
  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const statsData = await loadAdminData<DatabaseStats>('/admin/stats');
      setStats(statsData);
      setLastRefreshTs(new Date().toISOString());
    } catch (err) {
      console.error('Error loading stats:', err);
      setError(formatAdminError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Auto-load stats when component becomes active
   */
  useEffect(() => {
    if (isActive && !stats) {
      loadStats();
    }
  }, [isActive, stats, loadStats]);

  /**
   * Keep live data flowing with a quiet background refresh.
   */
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      loadStats();
    }, 60000);
    return () => clearInterval(interval);
  }, [isActive, loadStats]);

  const handleNavigate = useCallback(
    (tab: AdminTab) => {
      if (onNavigate) {
        onNavigate(tab);
      }
    },
    [onNavigate]
  );

  /**
   * Calculate derived statistics
   */
  const derivedStats = useMemo(() => {
    if (!stats) return null;

    const activeUserPercentage = stats.users.total > 0 ? (stats.users.active / stats.users.total) * 100 : 0;
    const adminPercentage = stats.users.total > 0 ? (stats.users.admins / stats.users.total) * 100 : 0;
    const eventsPerCalendar = stats.calendars.total > 0 ? stats.events.total / stats.calendars.total : 0;
    const eventsPerActiveUser = stats.users.active > 0 ? stats.events.total / stats.users.active : 0;
    const sharesPerUser = stats.users.total > 0 ? stats.shares.total / stats.users.total : 0;

    return {
      activeUserPercentage,
      adminPercentage,
      eventsPerCalendar,
      eventsPerActiveUser,
      sharesPerUser,
    };
  }, [stats]);

  const liveUpdatedAt = stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleString() : 'Awaiting first sync';
  const manualRefreshLabel = lastRefreshTs
    ? new Date(lastRefreshTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—';

  const kpiCards = useMemo(() => {
    if (!stats || !derivedStats) {
      return [];
    }

    return [
      {
        key: 'users',
        label: 'Total Accounts',
        value: stats.users.total.toLocaleString(),
        caption: `${stats.users.active.toLocaleString()} active (${Math.round(derivedStats.activeUserPercentage)}%)`,
        icon: '👥',
        gradient: 'from-sky-500 to-indigo-500',
        action: () => handleNavigate('users'),
        cta: 'user explorer',
      },
      {
        key: 'engagement',
        label: 'Active Engagement',
        value: `${Math.round(derivedStats.activeUserPercentage)}%`,
        caption: 'Live adoption rate',
        icon: '⚡',
        gradient: 'from-emerald-500 to-teal-500',
        action: () => handleNavigate('users'),
        cta: 'activity stream',
      },
      {
        key: 'events',
        label: 'Event Volume',
        value: stats.events.total.toLocaleString(),
        caption: `${formatNumber(derivedStats.eventsPerCalendar, 1)} avg per calendar`,
        icon: '📅',
        gradient: 'from-purple-500 to-fuchsia-500',
        action: () => handleNavigate('events'),
        cta: 'event registry',
      },
      {
        key: 'shares',
        label: 'Collaboration',
        value: stats.shares.total.toLocaleString(),
        caption: `${formatNumber(derivedStats.sharesPerUser, 1)} shares per user`,
        icon: '🔗',
        gradient: 'from-amber-500 to-orange-500',
        action: () => handleNavigate('shares'),
        cta: 'sharing center',
      },
    ];
  }, [stats, derivedStats, handleNavigate]);

  const adoptionItems = useMemo(() => {
    if (!stats || !derivedStats) {
      return [];
    }

    const adminToUserRatio = stats.users.admins > 0 ? Math.round(stats.users.total / stats.users.admins) : stats.users.total;
    const saturationPercent = derivedStats.eventsPerActiveUser ? Math.min(derivedStats.eventsPerActiveUser / 12, 1) * 100 : 0;

    return [
      {
        key: 'active',
        label: 'Active adoption',
        value: `${stats.users.active.toLocaleString()} active users`,
        percent: clampPercentage(derivedStats.activeUserPercentage),
        description: `${stats.users.total.toLocaleString()} total accounts`,
        icon: '🌐',
        badge: 'bg-emerald-50 text-emerald-700',
      },
      {
        key: 'admins',
        label: 'Admin coverage',
        value: `${stats.users.admins.toLocaleString()} administrators`,
        percent: clampPercentage(derivedStats.adminPercentage),
        description:
          adminToUserRatio > 0 ? `1 admin per ${adminToUserRatio.toLocaleString()} users` : 'Add administrators',
        icon: '🛡️',
        badge: 'bg-indigo-50 text-indigo-700',
      },
      {
        key: 'capacity',
        label: 'Capacity load',
        value: `${formatNumber(derivedStats.eventsPerActiveUser, 1)} events per active user`,
        percent: clampPercentage(saturationPercent),
        description: 'Target ≤ 12 events per active user',
        icon: '📈',
        badge: 'bg-amber-50 text-amber-700',
      },
    ];
  }, [stats, derivedStats]);

  const insights = useMemo(() => {
    if (!stats || !derivedStats) {
      return [];
    }

    const engagementSeverity = derivedStats.activeUserPercentage >= 60 ? 'success' : 'warning';
    const adminSeverity = derivedStats.adminPercentage >= 8 ? 'info' : 'warning';
    const collaborationSeverity = derivedStats.sharesPerUser >= 1 ? 'success' : 'info';
    const loadSeverity =
      derivedStats.eventsPerCalendar > 150 ? 'danger' : derivedStats.eventsPerCalendar > 120 ? 'warning' : 'info';

    return [
      {
        title: 'Engagement pace',
        detail: `${Math.round(derivedStats.activeUserPercentage)}% of users touched the platform in the current cycle.`,
        severity: engagementSeverity,
        icon: '🚀',
        tab: 'users' as AdminTab,
      },
      {
        title: 'Executive coverage',
        detail: `${stats.users.admins.toLocaleString()} admins on duty (${Math.round(
          derivedStats.adminPercentage
        )}% of accounts).`,
        severity: adminSeverity,
        icon: '🎯',
        tab: 'organizations' as AdminTab,
      },
      {
        title: 'Collaboration heat',
        detail: `${formatNumber(derivedStats.sharesPerUser, 1)} shares per user keeps knowledge flowing.`,
        severity: collaborationSeverity,
        icon: '✨',
        tab: 'shares' as AdminTab,
      },
      {
        title: 'Calendar load',
        detail: `${formatNumber(derivedStats.eventsPerCalendar, 1)} events per calendar scheduled.`,
        severity: loadSeverity,
        icon: '📊',
        tab: 'events' as AdminTab,
      },
    ];
  }, [stats, derivedStats]);

  const notices = useMemo(() => {
    if (!stats || !derivedStats) {
      return [];
    }

    return [
      {
        title: 'Audit trail review',
        message: 'Keep security tight with a 24h check of log streams.',
        accent: 'border-indigo-200 bg-indigo-50 text-indigo-900',
        icon: '🛡️',
        actionLabel: 'Open logs',
        tab: 'logs' as AdminTab,
      },
      {
        title: 'Notification hygiene',
        message: 'Executive alerts should stay actionable. Tune templates as usage grows.',
        accent: 'border-amber-200 bg-amber-50 text-amber-900',
        icon: '🔔',
        actionLabel: 'Notification center',
        tab: 'notifications' as AdminTab,
      },
      {
        title: 'Configuration drift',
        message: 'Validate OAuth + feature flags when onboarding new orgs.',
        accent: 'border-teal-200 bg-teal-50 text-teal-900',
        icon: '🧭',
        actionLabel: 'System configuration',
        tab: 'configuration' as AdminTab,
      },
    ];
  }, [stats, derivedStats]);

  const quickActions = useMemo(() => {
    if (!stats) {
      return [
        {
          title: 'Account health',
          description: 'Monitor adoption in real time.',
          icon: '👥',
          gradient: 'from-sky-500 to-cyan-500',
          tab: 'users' as AdminTab,
        },
      ];
    }

    return [
      {
        title: 'Account health',
        description: `${stats.users.active.toLocaleString()} active users online right now.`,
        icon: '👥',
        gradient: 'from-sky-500 to-cyan-500',
        tab: 'users' as AdminTab,
      },
      {
        title: 'Operational logs',
        description: 'Stream audit entries & infrastructure events.',
        icon: '📝',
        gradient: 'from-indigo-500 to-purple-500',
        tab: 'logs' as AdminTab,
      },
      {
        title: 'Automation',
        description: 'Ensure alerts and workflows match demand.',
        icon: '🤖',
        gradient: 'from-amber-500 to-orange-500',
        tab: 'notifications' as AdminTab,
      },
      {
        title: 'System setup',
        description: 'Verify OAuth + feature flags per environment.',
        icon: '⚙️',
        gradient: 'from-emerald-500 to-lime-500',
        tab: 'configuration' as AdminTab,
      },
    ];
  }, [stats]);

  const heroBackground = `linear-gradient(125deg, ${themeColor}, ${hexToRgba(themeColor, 0.35)})`;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white shadow-xl shadow-slate-200/60">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.4fr_1fr]">
          <div
            className="rounded-2xl border border-white/20 p-6 text-white shadow-inner"
            style={{ background: heroBackground }}
          >
            <div className="flex flex-wrap items-center gap-3 text-sm font-semibold uppercase tracking-wide text-white/80">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-50" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
                </span>
                Live executive feed
              </span>
              <span className="text-white/70">Updated at {liveUpdatedAt}</span>
            </div>

            <h2 className="mt-5 text-3xl font-semibold leading-tight text-white lg:text-4xl">
              Command the entire platform from one live surface.
            </h2>
            <p className="mt-3 text-white/80">
              Track adoption, calendar throughput, and collaboration velocity with instant drill-downs into deeper admin
              tools.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                size="sm"
                onClick={loadStats}
                loading={loading}
                themeColor={themeColor}
                className="bg-white/20 text-white hover:bg-white/30"
              >
                Refresh data
              </Button>
              <Button
                size="sm"
                variant="outline"
                themeColor={themeColor}
                className="border-white/60 text-white hover:bg-white/10"
                onClick={() => handleNavigate('logs')}
              >
                View live logs
              </Button>
              <a
                href="mailto:ops@executive-hq"
                className="inline-flex items-center text-sm font-semibold text-white/80 underline-offset-4 hover:text-white hover:underline"
              >
                Escalate to ops
              </a>
            </div>

            <div className="mt-6 grid gap-4 text-sm text-white/80 md:grid-cols-2">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wide text-white/70">Manual refresh</p>
                <p className="text-2xl font-semibold text-white">{manualRefreshLabel}</p>
                <p className="text-xs text-white/70">Auto refresh every 60s</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wide text-white/70">Live source</p>
                <p className="text-2xl font-semibold text-white">{process.env.NODE_ENV || 'development'}</p>
                <p className="text-xs text-white/70">Runtime environment</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white/70 p-6 backdrop-blur">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-500">Executive signal</p>
              <span className="text-xs font-semibold text-emerald-600">LIVE</span>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Active accounts</p>
                <p className="text-3xl font-bold text-gray-900">{stats ? stats.users.active.toLocaleString() : '—'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Calendars deployed</p>
                <p className="text-3xl font-bold text-gray-900">{stats ? stats.calendars.total.toLocaleString() : '—'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Event flow</p>
                <p className="text-3xl font-bold text-gray-900">{stats ? stats.events.total.toLocaleString() : '—'}</p>
              </div>
              <div className="rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-gray-600">
                Keep the data stream open in a dedicated screen or pop out the logs to supervise incident response in
                real time.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">
              ⚠️
            </span>
            <div>
              <p className="font-semibold">Unable to load live metrics</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && !stats && (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          <p className="text-gray-600">Activating live executive data…</p>
        </div>
      )}

      {/* Statistics Grid */}
      {stats && derivedStats && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {kpiCards.map((card) => (
              <button
                type="button"
                key={card.key}
                onClick={card.action}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                <div
                  className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} text-2xl text-white shadow-lg`}
                >
                  <span aria-hidden="true">{card.icon}</span>
                </div>
                <p className="text-sm font-medium text-gray-500">{card.label}</p>
                <p className="text-3xl font-semibold text-gray-900">{card.value}</p>
                <p className="mt-1 text-sm text-gray-600">{card.caption}</p>
                <span className="mt-4 inline-flex items-center text-sm font-semibold text-gray-600 transition group-hover:text-gray-900">
                  Open {card.cta}
                  <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </button>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Adoption intelligence</p>
                    <h3 className="text-lg font-semibold text-gray-900">Engagement & capacity</h3>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Live</span>
                </div>
                <div className="mt-6 space-y-5">
                  {adoptionItems.map((item) => (
                    <div key={item.key} className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${item.badge}`}>
                            <span aria-hidden="true">{item.icon}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">{item.label}</p>
                            <p className="text-lg font-semibold text-gray-900">{item.value}</p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-gray-700">{item.percent}%</span>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-white">
                        <span
                          className="block h-full rounded-full"
                          style={{
                            width: `${item.percent}%`,
                            background: `linear-gradient(90deg, ${themeColor}, ${hexToRgba(themeColor, 0.4)})`,
                          }}
                        />
                      </div>
                      <p className="mt-2 text-sm text-gray-500">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Insights</p>
                    <h3 className="text-lg font-semibold text-gray-900">Operational intelligence</h3>
                  </div>
                  <Button size="sm" variant="ghost" themeColor={themeColor} onClick={() => handleNavigate('logs')}>
                    Audit last 24h
                  </Button>
                </div>
                <div className="mt-6 space-y-4">
                  {insights.map((insight) => {
                    const severityClasses: Record<
                      string,
                      { container: string; text: string }
                    > = {
                      success: { container: 'border-emerald-100 bg-emerald-50', text: 'text-emerald-900' },
                      warning: { container: 'border-amber-100 bg-amber-50', text: 'text-amber-900' },
                      danger: { container: 'border-rose-100 bg-rose-50', text: 'text-rose-900' },
                      info: { container: 'border-sky-100 bg-sky-50', text: 'text-sky-900' },
                    };
                    const palette = severityClasses[insight.severity] || severityClasses.info;
                    return (
                      <div
                        key={insight.title}
                        className={`flex items-start gap-4 rounded-2xl border p-4 ${palette.container} ${palette.text}`}
                      >
                        <div className="text-2xl" aria-hidden="true">
                          {insight.icon}
                        </div>
                        <div>
                          <p className="font-semibold">{insight.title}</p>
                          <p className="text-sm">{insight.detail}</p>
                          <button
                            type="button"
                            onClick={() => handleNavigate(insight.tab)}
                            className="mt-2 inline-flex items-center text-xs font-semibold underline-offset-4 hover:underline"
                          >
                            Jump to {insight.tab.replace('-', ' ')}
                            <svg className="ml-1 h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M6 4l7 6-7 6V4z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Quick actions</p>
                    <h3 className="text-lg font-semibold text-gray-900">One-tap command</h3>
                  </div>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">Clickable</span>
                </div>
                <div className="mt-6 grid gap-4">
                  {quickActions.map((action) => (
                    <button
                      type="button"
                      key={action.title}
                      onClick={() => handleNavigate(action.tab)}
                      className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-gray-50/80 p-4 text-left transition hover:bg-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-200"
                    >
                      <span
                        className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${action.gradient} text-2xl text-white`}
                      >
                        {action.icon}
                      </span>
                      <div>
                        <p className="font-semibold text-gray-900">{action.title}</p>
                        <p className="text-sm text-gray-600">{action.description}</p>
                      </div>
                      <svg className="ml-auto h-5 w-5 text-gray-400" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Executive notices</p>
                    <h3 className="text-lg font-semibold text-gray-900">Stay ahead</h3>
                  </div>
                  <span className="text-xs font-semibold text-gray-500">LIVE</span>
                </div>
                <div className="mt-6 space-y-4">
                  {notices.map((notice) => (
                    <div
                      key={notice.title}
                      className={`rounded-2xl border p-4 ${notice.accent} shadow-sm transition hover:shadow-md`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl" aria-hidden="true">
                          {notice.icon}
                        </span>
                        <div>
                          <p className="font-semibold">{notice.title}</p>
                          <p className="text-sm">{notice.message}</p>
                          <button
                            type="button"
                            onClick={() => handleNavigate(notice.tab)}
                            className="mt-2 inline-flex items-center text-xs font-semibold underline-offset-4 hover:underline"
                          >
                            {notice.actionLabel}
                            <svg className="ml-1 h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M6 4l7 6-7 6V4z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !stats && !error && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-3xl">
            📊
          </div>
          <p className="text-xl font-semibold text-gray-900">No statistics yet</p>
          <p className="mt-1 text-gray-600">Connect to the admin API to stream live executive data.</p>
          <Button variant="primary" onClick={loadStats} themeColor={themeColor} className="mt-6">
            Load statistics
          </Button>
        </div>
      )}
    </div>
  );
};
