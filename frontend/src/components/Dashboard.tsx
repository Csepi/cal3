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
import { Login } from './auth';
import Calendar from './Calendar';
import AdminPanel from './AdminPanel';
import UserProfile from './UserProfile';
import CalendarSync from './sync/CalendarSync';
import ReservationsPanel from './ReservationsPanel';
import { apiService } from '../services/api';
import { THEME_COLORS, getThemeConfig } from '../constants/theme';

/**
 * View types for the main navigation
 */
type DashboardView = 'calendar' | 'admin' | 'profile' | 'sync' | 'reservations';

const Dashboard: React.FC = () => {
  // Authentication and user state
  const [user, setUser] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('user');

  // UI state management
  const [currentView, setCurrentView] = useState<DashboardView>('calendar');
  const [themeColor, setThemeColor] = useState<string>(THEME_COLORS.BLUE);
  const [userProfile, setUserProfile] = useState<any>(null);

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

    // Clear all authentication data from localStorage
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    localStorage.removeItem('authToken');
    localStorage.removeItem('admin_token');

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
    } catch (err) {
      console.warn('Could not load user profile:', err);
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

  // Load user profile on component mount if logged in
  useEffect(() => {
    if (user && apiService.isAuthenticated()) {
      loadUserProfile();
    }
  }, [user]);

  // Get centralized theme configuration
  const themeConfig = getThemeConfig(themeColor);

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${themeConfig.gradient.background}`}>
      {/* Header Navigation Bar */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          {/* User Information and Navigation */}
          <div className="flex items-center space-x-6">
            <div className="text-gray-800">
              <span className="text-sm text-gray-600">Welcome,</span>
              <span className={`ml-2 text-lg font-medium text-${themeConfig.text}`}>{user}</span>
              {userRole === 'admin' && (
                <span className="ml-3 px-3 py-1 bg-red-100 border border-red-300 text-red-700 text-xs rounded-full font-medium">🔥 Admin</span>
              )}
            </div>

            {/* Main Navigation Tabs */}
            <div className={`flex space-x-1 bg-white/50 backdrop-blur-sm border-2 border-${themeConfig.border} rounded-2xl p-1`}>
              <button
                onClick={() => setCurrentView('calendar')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  currentView === 'calendar'
                    ? `${themeConfig.button} text-white shadow-lg`
                    : `text-${themeConfig.text} hover:bg-white/50`
                }`}
              >
                📅 Calendar
              </button>
              <button
                onClick={() => setCurrentView('profile')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  currentView === 'profile'
                    ? `${themeConfig.button} text-white shadow-lg`
                    : `text-${themeConfig.text} hover:bg-white/50`
                }`}
              >
                👤 Profile
              </button>
              <button
                onClick={() => setCurrentView('sync')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  currentView === 'sync'
                    ? `${themeConfig.button} text-white shadow-lg`
                    : `text-${themeConfig.text} hover:bg-white/50`
                }`}
              >
                🔄 Calendar Sync
              </button>
              <button
                onClick={() => setCurrentView('reservations')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  currentView === 'reservations'
                    ? `${themeConfig.button} text-white shadow-lg`
                    : `text-${themeConfig.text} hover:bg-white/50`
                }`}
              >
                📅 Reservations
              </button>
              {userRole === 'admin' && (
                <button
                  onClick={() => setCurrentView('admin')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                    currentView === 'admin'
                      ? 'bg-indigo-500 text-white shadow-lg'
                      : 'text-indigo-700 hover:text-indigo-800 hover:bg-indigo-200'
                  }`}
                >
                  ⚙️ Admin Panel
                </button>
              )}
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 border border-red-400 text-white rounded-2xl hover:bg-red-600 font-medium transition-all duration-300 hover:scale-105 shadow-md"
          >
            🚀 Sign Out
          </button>
        </div>
      </div>

      {/* Main Content Area - Conditionally Rendered Based on Active View */}
      <div className="relative">
        {currentView === 'calendar' && (
          <Calendar themeColor={themeColor} />
        )}
        {currentView === 'profile' && (
          <UserProfile
            onThemeChange={handleThemeChange}
            currentTheme={themeColor}
          />
        )}
        {currentView === 'sync' && (
          <CalendarSync themeColor={themeColor} />
        )}
        {currentView === 'reservations' && (
          <ReservationsPanel themeColor={themeColor} />
        )}
        {/* Admin Panel - Only accessible to admin users */}
        {currentView === 'admin' && userRole === 'admin' && (
          <AdminPanel themeColor={themeColor} />
        )}
      </div>
    </div>
  );
};

export default Dashboard;