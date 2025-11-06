import React, { useMemo, useState } from 'react';
import { LoadingScreen } from './common';
import { useLoadingProgress } from '../hooks/useLoadingProgress';
import { useScreenSize } from '../hooks/useScreenSize';
import {
  AdminNavigation,
  AdminStatsPanel,
  AdminUserPanel,
  AdminOrganisationPanel,
  AdminCalendarPanel,
  AdminEventPanel,
  AdminSharePanel,
  AdminReservationPanel,
  AdminLogsPanel,
  AdminNotificationsPanel,
  type AdminTab,
} from './admin';
import SystemInfoPage from './admin/SystemInfoPage';
import AdminConfigurationPanel from './admin/AdminConfigurationPanel';
import { getThemeConfig } from '../constants/theme';

interface AdminPanelProps {
  themeColor?: string;
}

const hexToRgba = (hex: string, alpha: number): string => {
  const sanitized = hex.replace('#', '');
  const normalized =
    sanitized.length === 3
      ? sanitized
          .split('')
          .map((char) => `${char}${char}`)
          .join('')
      : sanitized.padEnd(6, '0').slice(0, 6);
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const AdminPanel: React.FC<AdminPanelProps> = ({ themeColor = '#3b82f6' }) => {
  const { isMobile } = useScreenSize();
  const { loadingState } = useLoadingProgress();
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');
  const theme = useMemo(() => getThemeConfig(themeColor), [themeColor]);
  const gradientBackground = `bg-gradient-to-br ${theme.gradient.background}`;
  const borderTint = hexToRgba(themeColor, 0.25);
  const accentTint = hexToRgba(themeColor, 0.12);

  const activePanel = useMemo(() => {
    const panelProps = { themeColor, isActive: true };
    switch (activeTab) {
      case 'stats':
        return <AdminStatsPanel {...panelProps} />;
      case 'users':
        return <AdminUserPanel {...panelProps} />;
      case 'organizations':
        return <AdminOrganisationPanel {...panelProps} />;
      case 'calendars':
        return <AdminCalendarPanel {...panelProps} />;
      case 'events':
        return <AdminEventPanel {...panelProps} />;
      case 'shares':
        return <AdminSharePanel {...panelProps} />;
      case 'reservations':
        return <AdminReservationPanel {...panelProps} />;
      case 'logs':
        return <AdminLogsPanel {...panelProps} />;
      case 'notifications':
        return <AdminNotificationsPanel {...panelProps} />;
      case 'configuration':
        return <AdminConfigurationPanel {...panelProps} />;
      case 'system-info':
        return <SystemInfoPage />;
      default:
        return (
          <div className="py-12 text-center">
            <div className="mb-4 text-4xl text-gray-400" aria-hidden="true">
              ?
            </div>
            <p className="text-gray-600">Unknown panel</p>
          </div>
        );
    }
  }, [activeTab, themeColor]);

  if (loadingState.isLoading && loadingState.progress < 100) {
    return (
      <LoadingScreen
        progress={loadingState.progress}
        message={loadingState.message}
        themeColor={themeColor}
        overlay
      />
    );
  }

  return (
    <div className={`min-h-screen ${isMobile ? 'bg-gray-50' : gradientBackground}`}>
      {!isMobile && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-40 -right-40 h-80 w-80 animate-pulse rounded-full blur-3xl opacity-30"
            style={{ background: `radial-gradient(circle, ${hexToRgba(themeColor, 0.4)} 0%, transparent 70%)` }}
          />
          <div
            className="absolute -bottom-44 -left-32 h-80 w-80 animate-pulse rounded-full blur-3xl opacity-25 animation-delay-2000"
            style={{ background: `radial-gradient(circle, ${hexToRgba(themeColor, 0.35)} 0%, transparent 70%)` }}
          />
          <div
            className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full blur-3xl opacity-20 animation-delay-4000"
            style={{ background: `radial-gradient(circle, ${hexToRgba(themeColor, 0.25)} 0%, transparent 75%)` }}
          />
        </div>
      )}

      {!isMobile && (
        <header
          className="relative z-10 border-b bg-white/70 py-6 backdrop-blur-sm"
          style={{ borderColor: borderTint }}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-semibold" style={{ color: themeColor }}>
                Admin Control Center
              </h1>
              <span
                className="rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  color: themeColor,
                  backgroundColor: accentTint,
                  border: `1px solid ${borderTint}`,
                }}
              >
                Environment: {process.env.NODE_ENV || 'development'}
              </span>
            </div>
          </div>
        </header>
      )}

      <main className={`relative z-10 mx-auto mt-6 max-w-7xl ${isMobile ? 'p-4' : 'p-6'}`}>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_1fr]">
          <div className="order-2 xl:order-1">
            <AdminNavigation activeTab={activeTab} onTabChange={setActiveTab} themeColor={themeColor} />
          </div>
          <div className="order-1 xl:order-2">{activePanel}</div>
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
