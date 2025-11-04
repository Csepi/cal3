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

interface AdminPanelProps {
  themeColor?: string;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ themeColor = '#3b82f6' }) => {
  const { isMobile } = useScreenSize();
  const { loadingState } = useLoadingProgress();
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');

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
    <div className={`min-h-screen ${isMobile ? 'bg-gray-50' : 'bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200'}`}>
      {!isMobile && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 animate-pulse rounded-full bg-gradient-to-r from-blue-300 to-indigo-300 opacity-30 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 animate-pulse rounded-full bg-gradient-to-r from-indigo-300 to-purple-300 opacity-30 blur-3xl animation-delay-2000" />
          <div className="absolute left-1/2 top-1/2 h-60 w-60 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-gradient-to-r from-purple-300 to-blue-300 opacity-20 blur-3xl animation-delay-4000" />
        </div>
      )}

      {!isMobile && (
        <header className="relative z-10 border-b border-blue-200 bg-white/60 py-6 backdrop-blur-sm">
          <div className="container mx-auto flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-semibold text-blue-900">Admin Control Center</h1>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
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
