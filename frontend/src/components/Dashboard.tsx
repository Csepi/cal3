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
import { useTranslation } from 'react-i18next';
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
import { ResponsiveNavigation } from './mobile/organisms/ResponsiveNavigation';
import { FloatingActionButton } from './mobile/organisms/FloatingActionButton';
import { MobileLayout } from './mobile/templates/MobileLayout';
import { useScreenSize } from '../hooks/useScreenSize';
import type { TabId } from './mobile/organisms/BottomTabBar';
import { NotificationCenter, NotificationSettingsPanel } from './notifications';
import { TasksWorkspace, type TasksWorkspaceHandle } from './tasks/TasksWorkspace';
import { clientLogger } from '../utils/clientLogger';
import { isNativeClient } from '../services/clientPlatform';
import {
  hasOfflineTimelineSnapshot,
  isNavigatorOffline,
} from '../services/offlineTimelineCache';

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
  | 'notification-settings';

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
  const { i18n } = useTranslation();
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

      // Apply user's saved theme preference
      if (profile.themeColor) {
        setThemeColor(profile.themeColor);
      }

      // Apply user's saved language preference
      if (profile.language) {
        i18n.changeLanguage(profile.language);
      }
    } catch (err) {
      clientLogger.warn('dashboard', 'failed to load user profile', err);
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
      await refreshPermissions();
    };

    void initialise();
  }, [currentUser?.username, isOfflineReadOnlyMode]);

  useEffect(() => {
    if (isOfflineReadOnlyMode && currentView !== 'calendar') {
      setCurrentView('calendar');
    }
  }, [currentView, isOfflineReadOnlyMode]);

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
    await loadUserProfile();
    await refreshPermissions();
  };

  const activeNavigationView: TabId = (isOfflineReadOnlyMode
    ? 'calendar'
    : currentView === 'notification-settings'
      ? 'notifications'
      : currentView) as TabId;

  const displayName = userProfile?.name || userProfile?.fullName || currentUser?.username || '';
  const mobileSurfaceLabel = (() => {
    if (isOfflineReadOnlyMode) {
      return 'Offline timeline';
    }

    switch (currentView) {
      case 'calendar':
        return 'Timeline';
      case 'tasks':
        return 'Tasks';
      case 'reservations':
        return 'Bookings';
      case 'automation':
        return 'Automation';
      case 'agent':
        return 'Agents';
      case 'sync':
        return 'Sync';
      case 'admin':
        return 'Admin';
      case 'notifications':
      case 'notification-settings':
        return 'Notifications';
      default:
        return 'Profile';
    }
  })();

  return (
    <div
      className={`min-h-screen transition-opacity duration-300 ${isScreenVisible ? 'opacity-100' : 'opacity-0'} ${
        isMobile ? 'bg-white' : `bg-gradient-to-br ${themeConfig.gradient.background}`
      }`}
    >
      {/* Responsive Navigation - Adapts to screen size */}
      <ResponsiveNavigation
        activeTab={activeNavigationView}
        onTabChange={handleTabChange}
        hideReservationsTab={userProfile?.hideReservationsTab}
      />

      {/* Main Content Area with Mobile Layout Wrapper */}
      <MobileLayout
        showBottomNav={isMobile}
        onRefresh={handleRefresh}
        noPadding={currentView === 'calendar'}
        themeColor={themeColor}
        surfaceLabel={mobileSurfaceLabel}
        userName={displayName}
      >
        <div className={isMobile ? '' : 'relative'}>
          {currentView === 'calendar' && (
            <Calendar
              themeColor={themeColor}
              timeFormat={userProfile?.timeFormat || '12h'}
              timezone={userProfile?.timezone}
              offlineMode={isOfflineReadOnlyMode}
            />
          )}
          {currentView === 'tasks' && featureFlags.tasks && (
            <TasksWorkspace
              ref={tasksWorkspaceRef}
              themeColor={themeColor}
              timeFormat={userProfile?.timeFormat}
              timezone={userProfile?.timezone}
              locale={userProfile?.language}
            />
          )}
          {currentView === 'profile' && (
            <UserProfile
              onThemeChange={handleThemeChange}
              currentTheme={themeColor}
            />
          )}
          {currentView === 'sync' && featureFlags.calendarSync && (
            <CalendarSync themeColor={themeColor} />
          )}
          {currentView === 'automation' && featureFlags.automation && (
            <AutomationPanel themeColor={themeColor} />
          )}
          {currentView === 'agent' && featureFlags.agents && (
            <AgentSettingsPage themeColor={themeColor} />
          )}
          {currentView === 'reservations' && featureFlags.reservations && canAccessReservations && !userProfile?.hideReservationsTab && (
            <ReservationsPanel themeColor={themeColor} />
          )}
          {currentView === 'notifications' && (
            <NotificationCenter onOpenSettings={() => setCurrentView('notification-settings')} />
          )}
          {currentView === 'notification-settings' && (
            <NotificationSettingsPanel onBack={() => setCurrentView('notifications')} />
          )}
          {/* Admin Panel - Only accessible to admin users */}
          {currentView === 'admin' && (currentUser?.role || 'user') === 'admin' && (
            <AdminPanel themeColor={themeColor} />
          )}
        </div>
      </MobileLayout>

      {/* FAB quick actions */}
      {currentView === 'calendar' && !isOfflineReadOnlyMode && (
        <FloatingActionButton
          primaryAction={{
            icon: '+',
            label: 'New Event',
            onClick: handleCreateEvent,
          }}
          themeColor={themeColor}
        />
      )}
      {currentView === 'tasks' && featureFlags.tasks && !isOfflineReadOnlyMode && (
        <FloatingActionButton
          primaryAction={{
            icon: '+',
            label: 'New Task',
            onClick: handleCreateTask,
          }}
          themeColor={themeColor}
        />
      )}
    </div>
  );
};

export default Dashboard;



