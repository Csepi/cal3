import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { getSimpleThemeGradient, LOADING_MESSAGES } from '../constants';
import { Button } from './ui';
import {
  ThemeSelector,
  PersonalInfoForm,
  PasswordChangeForm,
  type PersonalInfoFormData,
  type PasswordFormData
} from './profile';

/**
 * UserProfile component - Main user profile management interface
 *
 * This component serves as the main container for user profile management,
 * orchestrating the various profile-related subcomponents and handling
 * the overall state management and API interactions.
 */

interface UserProfileProps {
  /** Function to call when theme color changes */
  onThemeChange: (color: string) => void;
  /** Currently selected theme color */
  currentTheme: string;
}

/**
 * Main UserProfile component that manages user profile information,
 * theme preferences, and password changes through modular subcomponents.
 */
const UserProfile: React.FC<UserProfileProps> = ({ onThemeChange, currentTheme }) => {
  // Core state management
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Form data state
  const [profileForm, setProfileForm] = useState<PersonalInfoFormData>({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    timezone: '',
    timeFormat: '',
    usagePlans: ['user']
  });

  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Loading states for individual operations
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Form validation errors
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  /**
   * Load user profile data from the API and populate form fields
   */
  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      const userData = await apiService.getUserProfile();
      setUser(userData);

      // Populate profile form with user data
      setProfileForm({
        username: userData.username || '',
        email: userData.email || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        timezone: userData.timezone || '',
        timeFormat: userData.timeFormat || '12',
        usagePlans: userData.usagePlans || ['user']
      });

    } catch (err) {
      console.error('Error loading user data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle profile form field changes
   */
  const handleProfileFormChange = (field: string, value: string) => {
    setProfileForm(prev => ({ ...prev, [field]: value }));
    // Clear specific field error when user starts typing
    if (profileErrors[field]) {
      setProfileErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  /**
   * Handle password form field changes
   */
  const handlePasswordFormChange = (field: string, value: string) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
    // Clear specific field error when user starts typing
    if (passwordErrors[field]) {
      setPasswordErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  /**
   * Validate profile form data
   */
  const validateProfileForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!profileForm.username.trim()) {
      errors.username = 'Username is required';
    } else if (profileForm.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    if (!profileForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!profileForm.timezone) {
      errors.timezone = 'Please select a timezone';
    }

    if (!profileForm.timeFormat) {
      errors.timeFormat = 'Please select a time format';
    }

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Validate password form data
   */
  const validatePasswordForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!passwordForm.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    }

    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle profile form submission
   */
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateProfileForm()) return;

    try {
      setProfileLoading(true);
      setError(null);

      await apiService.updateUserProfile(profileForm);

      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 3000);

      // Reload user data to ensure consistency
      await loadUserData();

    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  /**
   * Handle password change submission
   */
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePasswordForm()) return;

    try {
      setPasswordLoading(true);
      setError(null);

      await apiService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      setSuccess('Password changed successfully!');
      setTimeout(() => setSuccess(null), 3000);

      // Reset password form and hide it
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordForm(false);

    } catch (err) {
      console.error('Error changing password:', err);
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  /**
   * Handle theme color change
   */
  const handleThemeChange = (color: string) => {
    onThemeChange(color);
  };

  // Load user data on component mount
  useEffect(() => {
    loadUserData();
  }, []);

  // Show loading screen while initial data is loading
  if (loading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${getSimpleThemeGradient(currentTheme)} flex justify-center items-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-800 mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-gray-800">{LOADING_MESSAGES.PROFILE}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getSimpleThemeGradient(currentTheme)}`}>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 text-gray-800 py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">👤 User Profile</h1>
              <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
            </div>
            {user && (
              <div className="text-right">
                <p className="text-sm text-gray-500">Welcome back,</p>
                <p className="text-lg font-semibold text-gray-800">
                  {user.firstName || user.username || 'User'}
                </p>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Status Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-green-700">{success}</p>
            </div>
          </div>
        )}

        {/* Profile Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Personal Information Form */}
            <PersonalInfoForm
              formData={profileForm}
              onFormDataChange={handleProfileFormChange}
              onSubmit={handleProfileSubmit}
              loading={profileLoading}
              themeColor={currentTheme}
              errors={profileErrors}
            />

            {/* Password Management */}
            {!showPasswordForm ? (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">🔒 Password</h3>
                    <p className="text-gray-600 text-sm">Keep your account secure with a strong password</p>
                  </div>
                  <Button
                    variant="outline"
                    themeColor={currentTheme}
                    onClick={() => setShowPasswordForm(true)}
                  >
                    Change Password
                  </Button>
                </div>
              </div>
            ) : (
              <PasswordChangeForm
                formData={passwordForm}
                onFormDataChange={handlePasswordFormChange}
                onSubmit={handlePasswordSubmit}
                loading={passwordLoading}
                themeColor={currentTheme}
                errors={passwordErrors}
                onCancel={() => {
                  setShowPasswordForm(false);
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setPasswordErrors({});
                }}
              />
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Theme Selector */}
            <ThemeSelector
              currentTheme={currentTheme}
              onThemeChange={handleThemeChange}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserProfile;