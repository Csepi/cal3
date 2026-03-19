/**
 * Dashboard Component
 *
 * Main application dashboard that serves as the primary layout container for the calendar application.
 * Handles user authentication, navigation between different views, and provides a consistent header/navigation bar.
 *
 * Features:
 * - User authentication state management
 * - Theme color personalization with real-time updates
 * - Role-based access control (admin/user)
 * - Persistent session management via localStorage
 * - Responsive navigation between application views (Calendar, Profile, Sync, Reservations, Admin)
 * - Gradient backgrounds with theme-based styling
 *
 * @component
 */

import { useState, useEffect, useRef } from 'react';
import { useAppTranslation } from '../i18n/useAppTranslation';
import { Login } from './auth';
import Calendar from './Calendar';
import AdminPanel from './AdminPanel';
import AgentSettingsPage from './agent/AgentSettingsPage';
import UserProfile from './UserProfile';
import CalendarSync from './sync/CalendarSync';
import ReservationsPanel from './ReservationsPanel';
import { AutomationPanel } from './automation/AutomationPanel';
import { authApi } from '../services/authApi';
import { profileApi } from '../services/profileApi';
import { sessionManager } from '../services/sessionManager';
import { THEME_COLORS } from '../constants/theme';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { usePermissions } from '../hooks/usePermissions';
import { Navigation } from './Navigation';
import { FloatingActionButton } from './mobile/organisms/FloatingActionButton';
import { MobileLayout } from './mobile/templates/MobileLayout';
import { useScreenSize } from '../hooks/useScreenSize';
import type { TabId } from './mobile/organisms/BottomTabBar';
import { NotificationCenter, NotificationSettingsPanel } from './notifications';
import { TasksWorkspace, type TasksWorkspaceHandle } from './tasks/TasksWorkspace';
import { clientLogger } from '../utils/clientLogger';
import { isNativeClient } from '../services/clientPlatform';
import AppErrorBoundary from './common/AppErrorBoundary';
import PersonalLogsPanel from './profile/PersonalLogsPanel';
import { CalendarPageTemplate } from './layout/CalendarPageTemplate';
import {
  hasOfflineTimelineSnapshot,
  isNavigatorOffline,
} from '../services/offlineTimelineCache';
import { applyLanguagePreference } from '../i18n';

/**
 * View types for the main navigation
 */
type DashboardView =
  | 'calendar'
  | 'tasks'
  | 'admin'
  | 'profile'
  | 'sync'
  | 'reservations'
  | 'automation'
  | 'agent'
  | 'notifications'
  | 'notification-settings'
  | 'personal-logs';

interface DashboardProps {
  initialView?: DashboardView;
}

interface DashboardUserProfile {
  id: number;
  name?: string;
  fullName?: string;
  timezone?: string;
  timeFormat?: string;
  language?: string;
  themeColor?: string;
  hideReservationsTab?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ initialView = 'calendar' }) => {
  // Hooks
  const { t } = useAppTranslation('common');
  const { flags: featureFlags, loading: featureFlagsLoading } = useFeatureFlags();
  const { isMobile } = useScreenSize();
  const { currentUser, isAuthenticated, logout: authLogout } = useAuth();
  const { themeColor, themeConfig, setThemeColor } = useTheme();
  const {
    canAccessReservations,
    loading: permissionsLoading,
    refreshPermissions,
    resetPermissions,
  } = usePermissions();

  // Authentication and user state
  // UI state management
  const [currentView, setCurrentView] = useState<DashboardView>(initialView);
  const [userProfile, setUserProfile] = useState<DashboardUserProfile | null>(null);
  const [isScreenVisible, setIsScreenVisible] = useState(false);
  const [isOfflineReadOnlyMode, setIsOfflineReadOnlyMode] = useState(false);
  const [globalErrorMessage, setGlobalErrorMessage] = useState<string | null>(null);
  const [isCalendarTimelineFocusMode, setIsCalendarTimelineFocusMode] = useState(false);

  const tasksWorkspaceRef = useRef<TasksWorkspaceHandle | null>(null);

  /**
   * Handles user logout and clears all session data
   * Resets component state to default values and clears localStorage
   */
  const handleLogout = async () => {
    // Reset component state to defaults
    setCurrentView('calendar');
    setUserProfile(null);

    // Reset permissions state
    resetPermissions();

    // Notify API service to clear cached tokens
    try {
      await authLogout();
    } catch (error) {
      clientLogger.warn('dashboard', 'logout request failed', error);
    }
    setThemeColor(THEME_COLORS.BLUE);
  };

  /**
   * Loads user profile from the server and applies theme preferences
   * Called after login and when user updates their profile
   */
  const loadUserProfile = async () => {
    try {
      const profile = await profileApi.getUserProfile() as DashboardUserProfile;
      setUserProfile(profile);
      setGlobalErrorMessage(null);

      // Apply user's saved theme preference
      if (profile.themeColor) {
        setThemeColor(profile.themeColor);
      }

      // Apply user's saved language preference
      if (profile.language) {
        await applyLanguagePreference(profile.language, { persistRemote: false });
      }
    } catch (err) {
      clientLogger.warn('dashboard', 'failed to load user profile', err);
      setGlobalErrorMessage(
        t('messages.profileLoadWarning', {
          defaultValue:
            'Unable to load profile data from the server. Some features may be unavailable until connectivity is restored.',
        }),
      );
    }
  };

  /**
   * Handles theme color changes from UserProfile component
   *
   * @param newTheme - The new theme color hex value
   */
  const handleThemeChange = (newTheme: string) => {
    setThemeColor(newTheme);
    localStorage.setItem('themeColor', newTheme);
  };

  useEffect(() => {
    if (!isNativeClient()) {
      setIsOfflineReadOnlyMode(false);
      return;
    }

    const evaluateOfflineMode = () => {
      const sessionUser = sessionManager.snapshotUserMetadata();
      const cacheUser = {
        id: currentUser?.id ?? sessionUser?.id,
        username: currentUser?.username ?? sessionUser?.username,
        email: currentUser?.email ?? sessionUser?.email,
      };

      const canUseOfflineSnapshot =
        !isAuthenticated &&
        isNavigatorOffline() &&
        hasOfflineTimelineSnapshot(cacheUser);
      setIsOfflineReadOnlyMode(canUseOfflineSnapshot);
    };

    evaluateOfflineMode();

    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('online', evaluateOfflineMode);
    window.addEventListener('offline', evaluateOfflineMode);

    return () => {
      window.removeEventListener('online', evaluateOfflineMode);
      window.removeEventListener('offline', evaluateOfflineMode);
    };
  }, [
    currentUser?.email,
    currentUser?.id,
    currentUser?.username,
    isAuthenticated,
  ]);

  // Initialize authentication state from localStorage on component mount
  useEffect(() => {
    if (isOfflineReadOnlyMode || isNavigatorOffline()) {
      return;
    }
    if (!sessionManager.hasActiveSession()) {
      sessionManager.refreshAccessToken().catch(() => null);
    }
  }, [isOfflineReadOnlyMode]);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsScreenVisible(true), 10);
    return () => window.clearTimeout(timer);
  }, []);

  // Load user profile and permissions on component mount if logged in
  useEffect(() => {
    if (isOfflineReadOnlyMode || !currentUser?.username) {
      return;
    }

    const initialise = async () => {
      if (!authApi.isAuthenticated()) {
        if (isNativeClient() && isNavigatorOffline()) {
          const sessionUser = sessionManager.snapshotUserMetadata();
          const hasOfflineSnapshot = hasOfflineTimelineSnapshot({
            id: currentUser.id ?? sessionUser?.id,
            username: currentUser.username ?? sessionUser?.username,
            email: currentUser.email ?? sessionUser?.email,
          });
          if (hasOfflineSnapshot) {
            setIsOfflineReadOnlyMode(true);
            return;
          }
        }

        const refreshed = await sessionManager.refreshAccessToken();
        if (!refreshed) {
          if (isNativeClient() && isNavigatorOffline()) {
            const sessionUser = sessionManager.snapshotUserMetadata();
            const hasOfflineSnapshot = hasOfflineTimelineSnapshot({
              id: currentUser.id ?? sessionUser?.id,
              username: currentUser.username ?? sessionUser?.username,
              email: currentUser.email ?? sessionUser?.email,
            });
            if (hasOfflineSnapshot) {
              setIsOfflineReadOnlyMode(true);
              return;
            }
          }
          if (isNativeClient()) {
            clientLogger.warn(
              'dashboard',
              'native token refresh failed; preserving session metadata for offline recovery',
            );
            return;
          }
          await handleLogout();
          return;
        }
      }
      await loadUserProfile();
      try {
        await refreshPermissions();
      } catch (error) {
        clientLogger.warn('dashboard', 'failed to refresh permissions', error);
        setGlobalErrorMessage(
          t('messages.permissionsRefreshWarning', {
            defaultValue:
              'Unable to refresh permissions right now. Access checks may be stale.',
          }),
        );
      }
    };

    void initialise();
  }, [currentUser?.username, isOfflineReadOnlyMode]);

  useEffect(() => {
    if (isOfflineReadOnlyMode && currentView !== 'calendar') {
      setCurrentView('calendar');
    }
  }, [currentView, isOfflineReadOnlyMode]);

  useEffect(() => {
    if (currentView !== 'calendar' && isCalendarTimelineFocusMode) {
      setIsCalendarTimelineFocusMode(false);
    }
  }, [currentView, isCalendarTimelineFocusMode]);

  // Redirect to calendar if user loses access to current view
  useEffect(() => {
    if (featureFlagsLoading || permissionsLoading) return;

    // Redirect if current view's feature is disabled
    if (currentView === 'sync' && !featureFlags.calendarSync) {
      setCurrentView('calendar');
    } else if (currentView === 'automation' && !featureFlags.automation) {
      setCurrentView('calendar');
    } else if (currentView === 'reservations' && (!featureFlags.reservations || !canAccessReservations)) {
      setCurrentView('calendar');
    } else if (currentView === 'tasks' && !featureFlags.tasks) {
      setCurrentView('calendar');
    }
  }, [featureFlagsLoading, permissionsLoading, currentView, featureFlags, canAccessReservations]);

  // Get centralized theme configuration
  if ((!isAuthenticated || !currentUser?.username) && !isOfflineReadOnlyMode) {
    return <Login />;
  }

  // Handle tab change (works for both mobile and desktop)
  const handleTabChange = (tabId: TabId) => {
    if (isOfflineReadOnlyMode) {
      setCurrentView('calendar');
      return;
    }
    setCurrentView(tabId as DashboardView);
  };

  const handleCreateEvent = () => {
    clientLogger.debug('dashboard', 'floating action button pressed', {
      action: 'create-event',
    });
  };
  const handleCreateTask = () => {
    tasksWorkspaceRef.current?.openComposer();
  };

  // Refresh handler for pull-to-refresh
  const handleRefresh = async () => {
    if (isOfflineReadOnlyMode) {
      return;
    }
    setGlobalErrorMessage(null);
    await loadUserProfile();
    await refreshPermissions();
  };

  const activeNavigationView: TabId = (isOfflineReadOnlyMode
    ? 'calendar'
    : currentView === 'notification-settings'
      ? 'notifications'
      : currentView) as TabId;

  const shouldHideNavigation = currentView === 'calendar' && isCalendarTimelineFocusMode;
  const usesCalendarPageTemplate = [
    'tasks',
    'notifications',
    'notification-settings',
    'profile',
    'personal-logs',
    'reservations',
    'automation',
    'agent',
    'sync',
  ].includes(currentView);

  const displayName = userProfile?.name || userProfile?.fullName || currentUser?.username || '';
  const mobileSurfaceLabel = (() => {
    if (isOfflineReadOnlyMode) {
      return t('navigation.offlineTimeline', { defaultValue: 'Offline timeline' });
    }

    switch (currentView) {
      case 'calendar':
        return t('navigation.calendar');
      case 'tasks':
        return t('navigation.tasks', { defaultValue: 'Tasks' });
      case 'reservations':
        return t('navigation.reservations');
      case 'automation':
        return t('navigation.automation');
      case 'agent':
        return t('navigation.agentsShort', { defaultValue: 'Agents' });
      case 'sync':
        return t('navigation.syncShort');
      case 'admin':
        return t('navigation.adminShort');
      case 'notifications':
      case 'notification-settings':
        return t('navigation.notifications', { defaultValue: 'Notifications' });
      case 'personal-logs':
        return t('navigation.personalLogs', { defaultValue: 'Personal Logs' });
      default:
        return t('navigation.profile');
    }
  })();

  return (
    <div
      className={`min-h-screen transition-opacity duration-300 ${isScreenVisible ? 'opacity-100' : 'opacity-0'} ${
        isMobile ? 'bg-white' : `bg-gradient-to-br ${themeConfig.gradient.background}`
      }`}
    >
      {/* Unified Navigation */}
      {!shouldHideNavigation && (
        <Navigation
          activeTab={activeNavigationView}
          onTabChange={handleTabChange}
          hideReservationsTab={userProfile?.hideReservationsTab}
        />
      )}

      {/* Main Content Area with Mobile Layout Wrapper */}
      <MobileLayout
        showBottomNav={isMobile && !shouldHideNavigation}
        onRefresh={handleRefresh}
        noPadding={currentView === 'calendar' || usesCalendarPageTemplate}
        themeColor={themeColor}
        surfaceLabel={mobileSurfaceLabel}
        userName={displayName}
        hideHeader={shouldHideNavigation}
      >
        <div className={isMobile ? '' : 'relative'}>
          {globalErrorMessage && (
            <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <div className="flex items-start justify-between gap-4">
                <p>{globalErrorMessage}</p>
                <button
                  type="button"
                  onClick={() => {
                    setGlobalErrorMessage(null);
                    void handleRefresh();
                  }}
                  className="rounded-md border border-amber-300 px-2 py-1 text-xs font-medium hover:bg-amber-100"
                >
                  {t('actions.refresh')}
                </button>
              </div>
            </div>
          )}
          {currentView === 'calendar' && (
            <AppErrorBoundary fallbackTitle="Calendar module failed" inline>
              <Calendar
                themeColor={themeColor}
                timeFormat={userProfile?.timeFormat || '12h'}
                timezone={userProfile?.timezone}
                offlineMode={isOfflineReadOnlyMode}
                onTimelineFocusModeChange={setIsCalendarTimelineFocusMode}
              />
            </AppErrorBoundary>
          )}
          {currentView === 'tasks' && featureFlags.tasks && (
            <CalendarPageTemplate>
              <AppErrorBoundary fallbackTitle="Tasks module failed" inline>
                <TasksWorkspace
                  ref={tasksWorkspaceRef}
                  themeColor={themeColor}
                  timeFormat={userProfile?.timeFormat}
                  timezone={userProfile?.timezone}
                  locale={userProfile?.language}
                />
              </AppErrorBoundary>
            </CalendarPageTemplate>
          )}
          {currentView === 'profile' && (
            <CalendarPageTemplate>
              <AppErrorBoundary fallbackTitle="Profile module failed" inline>
                <UserProfile
                  onThemeChange={handleThemeChange}
                  currentTheme={themeColor}
                />
              </AppErrorBoundary>
            </CalendarPageTemplate>
          )}
          {currentView === 'personal-logs' && (
            <CalendarPageTemplate>
              <AppErrorBoundary fallbackTitle="Personal logs module failed" inline>
                <PersonalLogsPanel themeColor={themeColor} />
              </AppErrorBoundary>
            </CalendarPageTemplate>
          )}
          {currentView === 'sync' && featureFlags.calendarSync && (
            <CalendarPageTemplate>
              <AppErrorBoundary fallbackTitle="Calendar sync module failed" inline>
                <CalendarSync themeColor={themeColor} />
              </AppErrorBoundary>
            </CalendarPageTemplate>
          )}
          {currentView === 'automation' && featureFlags.automation && (
            <CalendarPageTemplate>
              <AppErrorBoundary fallbackTitle="Automation module failed" inline>
                <AutomationPanel themeColor={themeColor} />
              </AppErrorBoundary>
            </CalendarPageTemplate>
          )}
          {currentView === 'agent' && featureFlags.agents && (
            <CalendarPageTemplate>
              <AppErrorBoundary fallbackTitle="Agent module failed" inline>
                <AgentSettingsPage themeColor={themeColor} />
              </AppErrorBoundary>
            </CalendarPageTemplate>
          )}
          {currentView === 'reservations' && featureFlags.reservations && canAccessReservations && !userProfile?.hideReservationsTab && (
            <CalendarPageTemplate>
              <AppErrorBoundary fallbackTitle="Reservations module failed" inline>
                <ReservationsPanel themeColor={themeColor} />
              </AppErrorBoundary>
            </CalendarPageTemplate>
          )}
          {currentView === 'notifications' && (
            <CalendarPageTemplate>
              <AppErrorBoundary fallbackTitle="Notifications module failed" inline>
                <NotificationCenter onOpenSettings={() => setCurrentView('notification-settings')} />
              </AppErrorBoundary>
            </CalendarPageTemplate>
          )}
          {currentView === 'notification-settings' && (
            <CalendarPageTemplate>
              <AppErrorBoundary fallbackTitle="Notification settings failed" inline>
                <NotificationSettingsPanel onBack={() => setCurrentView('notifications')} />
              </AppErrorBoundary>
            </CalendarPageTemplate>
          )}
          {/* Admin Panel - Only accessible to admin users */}
          {currentView === 'admin' && (currentUser?.role || 'user') === 'admin' && (
            <AppErrorBoundary fallbackTitle="Admin panel failed" inline>
              <AdminPanel themeColor={themeColor} />
            </AppErrorBoundary>
          )}
        </div>
      </MobileLayout>

      {/* FAB quick actions */}
      {currentView === 'calendar' && !isOfflineReadOnlyMode && !isCalendarTimelineFocusMode && (
        <FloatingActionButton
          primaryAction={{
            icon: '+',
            label: t('calendar:events.newEvent', { defaultValue: 'New Event' }),
            onClick: handleCreateEvent,
          }}
          themeColor={themeColor}
        />
      )}
      {currentView === 'tasks' && featureFlags.tasks && !isOfflineReadOnlyMode && (
        <FloatingActionButton
          primaryAction={{
            icon: '+',
            label: t('messages.newTask', { defaultValue: 'New Task' }),
            onClick: handleCreateTask,
          }}
          themeColor={themeColor}
        />
      )}
    </div>
  );
};

export default Dashboard;



