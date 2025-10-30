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

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Login } from './auth';
import Calendar from './Calendar';
import AdminPanel from './AdminPanel';
import AgentSettingsPage from './agent/AgentSettingsPage';
import UserProfile from './UserProfile';
import CalendarSync from './sync/CalendarSync';
import ReservationsPanel from './ReservationsPanel';
import { AutomationPanel } from './automation/AutomationPanel';
import { apiService } from '../services/api';
import { UserPermissionsService } from '../services/userPermissions';
import { THEME_COLORS, getThemeConfig } from '../constants/theme';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import { ResponsiveNavigation } from './mobile/organisms/ResponsiveNavigation';
import { FloatingActionButton } from './mobile/organisms/FloatingActionButton';
import { MobileLayout } from './mobile/templates/MobileLayout';
import { useScreenSize } from '../hooks/useScreenSize';
import type { TabId } from './mobile/organisms/BottomTabBar';

/**
 * View types for the main navigation
 */
type DashboardView = 'calendar' | 'admin' | 'profile' | 'sync' | 'reservations' | 'automation' | 'agent';

const Dashboard: React.FC = () => {
  // Hooks
  const { i18n } = useTranslation();
  const { flags: featureFlags, loading: featureFlagsLoading } = useFeatureFlags();
  const { isMobile } = useScreenSize();

  // Authentication and user state
  const [user, setUser] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('user');

  // UI state management
  const [currentView, setCurrentView] = useState<DashboardView>('calendar');
  const [themeColor, setThemeColor] = useState<string>(THEME_COLORS.BLUE);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Permissions state
  const [canAccessReservations, setCanAccessReservations] = useState<boolean>(false);
  const [permissionsLoading, setPermissionsLoading] = useState<boolean>(true);

  /**
   * Handles user login and initializes user session
   *
   * @param username - The logged-in user's username
   * @param token - Optional JWT authentication token
   * @param role - User role (admin/user), defaults to 'user'
   * @param userData - Additional user profile data including theme preferences
   */
  const handleLogin = (username: string, token?: string, role?: string, userData?: any) => {
    // Update component state
    setUser(username);
    setUserRole(role || 'user');

    // Store authentication data in localStorage for session persistence
    localStorage.setItem('username', username);
    localStorage.setItem('userRole', role || 'user');
    if (token) {
      localStorage.setItem('authToken', token);
      // Note: apiService automatically reads token from localStorage in getAuthHeaders()
    }

    // Apply user's theme preference if available
    if (userData && userData.themeColor) {
      setThemeColor(userData.themeColor);
    }

    // Load complete user profile from server
    loadUserProfile();

    // Load user permissions
    loadUserPermissions();
  };

  /**
   * Handles user logout and clears all session data
   * Resets component state to default values and clears localStorage
   */
  const handleLogout = () => {
    // Reset component state to defaults
    setUser(null);
    setUserRole('user');
    setCurrentView('calendar');
    setThemeColor(THEME_COLORS.BLUE);
    setUserProfile(null);

    // Reset permissions state
    setCanAccessReservations(false);
    setPermissionsLoading(true);

    // Clear all authentication data from localStorage
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    localStorage.removeItem('authToken');
    localStorage.removeItem('admin_token');

    // Clear permissions cache
    UserPermissionsService.clearCache();

    // Notify API service to clear any cached tokens
    apiService.logout();
  };

  /**
   * Loads user profile from the server and applies theme preferences
   * Called after login and when user updates their profile
   */
  const loadUserProfile = async () => {
    try {
      const profile = await apiService.getUserProfile();
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
      console.warn('Could not load user profile:', err);
    }
  };

  /**
   * Loads user permissions from the server
   * Called after login and when permissions need to be refreshed
   */
  const loadUserPermissions = async () => {
    try {
      setPermissionsLoading(true);
      const hasReservationAccess = await UserPermissionsService.canAccessReservations();
      setCanAccessReservations(hasReservationAccess);
    } catch (err) {
      console.warn('Could not load user permissions:', err);
      setCanAccessReservations(false);
    } finally {
      setPermissionsLoading(false);
    }
  };

  /**
   * Handles theme color changes from UserProfile component
   *
   * @param newTheme - The new theme color hex value
   */
  const handleThemeChange = (newTheme: string) => {
    setThemeColor(newTheme);
  };

  // Initialize authentication state from localStorage on component mount
  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const storedRole = localStorage.getItem('userRole');
    const authToken = localStorage.getItem('authToken');

    if (storedUsername && authToken) {
      setUser(storedUsername);
      setUserRole(storedRole || 'user');
      // Note: apiService automatically reads token from localStorage in getAuthHeaders()
    }
  }, []);

  // Load user profile and permissions on component mount if logged in
  useEffect(() => {
    if (user && apiService.isAuthenticated()) {
      loadUserProfile();
      loadUserPermissions();
    }
  }, [user]);

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
    }
  }, [featureFlagsLoading, permissionsLoading, currentView, featureFlags, canAccessReservations]);

  // Get centralized theme configuration
  const themeConfig = getThemeConfig(themeColor);

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Handle tab change (works for both mobile and desktop)
  const handleTabChange = (tabId: TabId) => {
    setCurrentView(tabId as DashboardView);
  };

  // FAB primary action (create event)
  const handleCreateEvent = () => {
    // This will be connected to calendar's create event
    console.log('Create new event');
  };

  // Refresh handler for pull-to-refresh
  const handleRefresh = async () => {
    await loadUserProfile();
    await loadUserPermissions();
  };

  return (
    <div className={`min-h-screen ${isMobile ? 'bg-white' : `bg-gradient-to-br ${themeConfig.gradient.background}`}`}>
      {/* Responsive Navigation - Adapts to screen size */}
      <ResponsiveNavigation
        activeTab={currentView as TabId}
        onTabChange={handleTabChange}
        themeColor={themeColor}
        userRole={userRole}
        userName={user || ''}
        onLogout={handleLogout}
        featureFlags={featureFlags}
        canAccessReservations={canAccessReservations}
        hideReservationsTab={userProfile?.hideReservationsTab}
        themeConfig={themeConfig}
      />

      {/* Main Content Area with Mobile Layout Wrapper */}
      <MobileLayout
        showBottomNav={isMobile}
        onRefresh={handleRefresh}
        noPadding={currentView === 'calendar'}
      >
        <div className={isMobile ? '' : 'relative'}>
          {currentView === 'calendar' && (
            <Calendar themeColor={themeColor} timeFormat={userProfile?.timeFormat || '12h'} />
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
            <AgentSettingsPage />
          )}
          {currentView === 'reservations' && featureFlags.reservations && canAccessReservations && !userProfile?.hideReservationsTab && (
            <ReservationsPanel themeColor={themeColor} />
          )}
          {/* Admin Panel - Only accessible to admin users */}
          {currentView === 'admin' && userRole === 'admin' && (
            <AdminPanel themeColor={themeColor} />
          )}
        </div>
      </MobileLayout>

      {/* FAB - Only shows on mobile, only on calendar view */}
      {currentView === 'calendar' && (
        <FloatingActionButton
          primaryAction={{
            icon: '+',
            label: 'New Event',
            onClick: handleCreateEvent,
          }}
          themeColor={themeColor}
        />
      )}
    </div>
  );
};

export default Dashboard;



