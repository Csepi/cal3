// @ts-nocheck
import React, { type ReactElement } from 'react';
import type { AdminTab } from './types';
import { getThemeConfig } from '../../constants';

export interface AdminNavigationProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  themeColor?: string;
  className?: string;
}

type TabIcon = 'KPI' | 'USR' | 'ORG' | 'CAL' | 'EVT' | 'ACL' | 'RES' | 'LOG' | 'CFG' | 'SYS' | 'NOT';

const ICONS: Record<TabIcon, ReactElement> = {
  KPI: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h16" />
      <rect x="6" y="11" width="3" height="7" rx="1" />
      <rect x="11" y="7" width="3" height="11" rx="1" />
      <rect x="16" y="4" width="3" height="14" rx="1" />
    </svg>
  ),
  USR: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8.5" cy="8" r="3" />
      <circle cx="16.5" cy="9.5" r="2.5" />
      <path d="M4 19c0-2.5 2-4.5 4.5-4.5S13 16.5 13 19v1H4z" />
      <path d="M14.5 19c0-1.7 1.4-3.1 3.1-3.1 1.7 0 3.1 1.4 3.1 3.1V20h-6.2z" />
    </svg>
  ),
  ORG: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20V9l8-4 8 4v11" />
      <path d="M9 20v-6h6v6" />
      <path d="M9 14h6" />
    </svg>
  ),
  CAL: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M7.5 3v4" />
      <path d="M16.5 3v4" />
      <path d="M3.5 10h17" />
    </svg>
  ),
  EVT: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 5h14v14H5z" />
      <path d="M5 11h14" />
      <path d="M11 5v4" />
      <path d="M13.5 16l1.8 2.4L18 15" />
    </svg>
  ),
  ACL: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17l-3-3 3-3" />
      <path d="M17 7l3 3-3 3" />
      <path d="M5 14h14" />
      <circle cx="9" cy="7" r="2.5" />
      <circle cx="15" cy="17" r="2.5" />
    </svg>
  ),
  RES: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4.5" y="4.5" width="15" height="15" rx="2" />
      <path d="M8 8h8" />
      <path d="M8 12h6" />
      <path d="M8 16h4" />
    </svg>
  ),
  LOG: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4h9l5 5v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
      <path d="M14 4v4h4" />
      <path d="M9 12h6" />
      <path d="M9 16h4" />
    </svg>
  ),
  CFG: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v3" />
      <path d="M12 18v3" />
      <path d="M3 12h3" />
      <path d="M18 12h3" />
      <circle cx="12" cy="12" r="3" />
      <path d="M6.22 6.22l2.12 2.12" />
      <path d="M15.66 15.66l2.12 2.12" />
      <path d="M17.78 6.22l-2.12 2.12" />
      <path d="M8.34 15.66l-2.12 2.12" />
    </svg>
  ),
  SYS: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M4.05 7a8 8 0 0115.9 0M4.05 17a8 8 0 0015.9 0" />
      <path d="M12 5v2" />
      <path d="M12 17v2" />
      <path d="M5 12h2" />
      <path d="M17 12h2" />
    </svg>
  ),
  NOT: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13.8V11a6 6 0 0 0-12 0v2.8a2 2 0 0 1-.6 1.4L4 17h16l-1.4-1.8a2 2 0 0 1-.6-1.4z" />
      <path d="M9 21a3 3 0 0 0 6 0" />
    </svg>
  ),
};

const TAB_CONFIG: Record<AdminTab, { label: string; icon: TabIcon; description: string }> = {
  stats: { label: 'Executive Dashboard', icon: 'KPI', description: 'High-level KPIs and adoption metrics' },
  users: { label: 'People Directory', icon: 'USR', description: 'Manage users, roles, and usage plans' },
  organizations: { label: 'Organizations', icon: 'ORG', description: 'Control org membership and governance' },
  calendars: { label: 'Calendars', icon: 'CAL', description: 'Ownership, visibility, and lifecycle' },
  events: { label: 'Events', icon: 'EVT', description: 'Audit and curate scheduled events' },
  shares: { label: 'Sharing & Access', icon: 'ACL', description: 'Review calendar access policies' },
  reservations: { label: 'Resource Bookings', icon: 'RES', description: 'Track reservations and capacity' },
  notifications: { label: 'Notification Platform', icon: 'NOT', description: 'Channel providers, batching, and digests' },
  logs: { label: 'Operational Logs', icon: 'LOG', description: 'Monitor backend activity and errors' },
  configuration: { label: 'Runtime Configuration', icon: 'CFG', description: 'Manage OAuth credentials and feature flags' },
  'system-info': { label: 'System Health', icon: 'SYS', description: 'Runtime diagnostics and configuration' },
};

const NAV_GROUPS: Array<{
  label: string;
  description: string;
  tabs: AdminTab[];
}> = [
  {
    label: 'Overview',
    description: 'Key indicators for leadership',
    tabs: ['stats'],
  },
  {
    label: 'People & Governance',
    description: 'Who can access what',
    tabs: ['users', 'organizations'],
  },
  {
    label: 'Scheduling Operations',
    description: 'Calendars, events, and resource usage',
    tabs: ['calendars', 'events', 'shares', 'reservations'],
  },
  {
    label: 'Platform Operations',
    description: 'Logs and system diagnostics',
    tabs: ['logs', 'notifications', 'configuration', 'system-info'],
  },
];

const ICON_BACKGROUNDS: Record<TabIcon, string> = {
  KPI: 'from-emerald-400 to-lime-500',
  USR: 'from-sky-400 to-blue-600',
  ORG: 'from-purple-400 to-indigo-500',
  CAL: 'from-amber-400 to-orange-500',
  EVT: 'from-rose-400 to-pink-500',
  ACL: 'from-teal-400 to-emerald-500',
  RES: 'from-cyan-400 to-blue-500',
  LOG: 'from-slate-500 to-slate-700',
  CFG: 'from-amber-500 to-orange-600',
  SYS: 'from-zinc-500 to-gray-700',
};

const IconBadge: React.FC<{ code: TabIcon; emphasize: boolean }> = ({ code, emphasize }) => (
  <span
    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${ICON_BACKGROUNDS[code]} text-white transition ${
      emphasize ? 'ring-2 ring-white shadow-lg' : 'opacity-90'
    }`}
    aria-hidden="true"
  >
    {ICONS[code]}
  </span>
);

export const AdminNavigation: React.FC<AdminNavigationProps> = ({
  activeTab,
  onTabChange,
  themeColor = '#3b82f6',
  className = '',
}) => {
  const themeConfig = getThemeConfig(themeColor);

  const handleClick = (tab: AdminTab) => {
    onTabChange(tab);
  };

  const handleKeyDown = (event: React.KeyboardEvent, tab: AdminTab) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick(tab);
    }
  };

  return (
    <aside
      className={`backdrop-blur-md bg-white/75 border border-blue-200 rounded-3xl shadow-xl hover:bg-white/85 transition-all duration-300 ${className}`}
    >
      <div className="px-6 py-5 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
            AD
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">PrimeCal Administration</p>
            <h1 className="text-lg font-semibold text-gray-900">Control Center</h1>
          </div>
        </div>
      </div>

      <nav className="px-4 py-3 space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="px-2 pb-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">{group.label}</h2>
              <p className="text-xs text-gray-400">{group.description}</p>
            </div>
            <div className="space-y-1.5">
              {group.tabs.map((tab) => {
                const config = TAB_CONFIG[tab];
                const isActive = activeTab === tab;

                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => handleClick(tab)}
                    onKeyDown={(event) => handleKeyDown(event, tab)}
                    className={`w-full rounded-2xl px-4 py-3 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      isActive
                        ? `bg-gradient-to-r ${themeConfig.gradientBg} text-gray-900 shadow-md`
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    role="tab"
                    aria-selected={isActive}
                    aria-label={config.label}
                  >
                    <div className="flex items-start gap-3">
                      <IconBadge code={config.icon} emphasize={isActive} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
                            {config.label}
                          </span>
                          {isActive && (
                            <span className="ml-2 inline-flex h-2 w-2 items-center justify-center rounded-full bg-white/90">
                              <span className={`h-2 w-2 rounded-full ${themeConfig.gradientBg}`} aria-hidden="true" />
                            </span>
                          )}
                        </div>
                        <p className={`text-xs mt-1 ${isActive ? 'text-gray-700' : 'text-gray-500'}`}>
                          {config.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/70 rounded-b-3xl">
        <p className="text-xs text-gray-500">
          Current focus:{' '}
          <span className="font-medium text-gray-700">{TAB_CONFIG[activeTab].label}</span>
        </p>
      </div>
    </aside>
  );
};

