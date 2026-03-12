import React, { useState, useEffect } from 'react';
import { profileApi } from '../services/profileApi';
import { calendarApi } from '../services/calendarApi';
import { getSimpleThemeGradient, LOADING_MESSAGES } from '../constants';
import { Button } from './ui';
import {
  ThemeSelector,
  PersonalInfoForm,
  PasswordChangeForm,
  type PersonalInfoFormData,
  type PasswordFormData
} from './profile';
import { useScreenSize } from '../hooks/useScreenSize';
import {
  clearWidgetDiagnosticsLog,
  getWidgetDiagnosticsLog,
} from '../services/widgetDiagnostics';
import { useAppTranslation } from '../i18n/useAppTranslation';
import { applyLanguagePreference } from '../i18n';
import { onboardingConfig } from '../config/onboardingConfig';

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
type TasksCalendarOption = {
  id: number;
  name: string;
  isTasksCalendar?: boolean;
  ownerId?: number;
};

interface UserProfileData {
  id: number;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string | null;
  timezone?: string;
  timeFormat?: string;
  language?: string;
  themeColor?: string;
  hideReservationsTab?: boolean;
  usagePlans?: string[];
  defaultTasksCalendarId?: number | null;
  onboardingCompleted?: boolean;
  onboardingCompletedAt?: string;
  onboardingUseCase?: string | null;
  onboardingGoogleCalendarSyncRequested?: boolean;
  onboardingMicrosoftCalendarSyncRequested?: boolean;
  privacyPolicyAcceptedAt?: string | null;
  privacyPolicyVersion?: string | null;
}

const UserProfile: React.FC<UserProfileProps> = ({ onThemeChange, currentTheme }) => {
  // Hooks
  const { t } = useAppTranslation(['settings', 'validation', 'common']);
  const { isMobile } = useScreenSize();

  // Core state management
  const [user, setUser] = useState<UserProfileData | null>(null);
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
    language: 'en',
    hideReservationsTab: false,
    usagePlans: ['user'],
    defaultTasksCalendarId: '',
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
  const [isThemeSaving, setIsThemeSaving] = useState(false);
  const [tasksCalendars, setTasksCalendars] = useState<TasksCalendarOption[]>([]);
  const [tasksCalendarsLoading, setTasksCalendarsLoading] = useState(false);
  const [widgetLogBusy, setWidgetLogBusy] = useState(false);
  const [widgetLogStatus, setWidgetLogStatus] = useState<string | null>(null);

  const formatDateValue = (value?: string | null): string => {
    if (!value) {
      return t('common:app.notAvailable', { defaultValue: 'Not available' });
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return parsed.toLocaleString();
  };

  const loadTasksCalendars = async (currentUserId?: number) => {
    if (!currentUserId) {
      return;
    }
    try {
      setTasksCalendarsLoading(true);
      const calendars = await calendarApi.getCalendars();
      const eligible = calendars.filter((calendar) => {
        if (!calendar || calendar.isActive === false) {
          return false;
        }
        if (calendar.ownerId === currentUserId) {
          return true;
        }
        if (Array.isArray(calendar.sharedWith)) {
          const shareEntry = calendar.sharedWith.find(
            (shared) => shared?.id === currentUserId,
          );
          if (shareEntry?.permission) {
            const permission = String(shareEntry.permission).toLowerCase();
            if (permission === 'write' || permission === 'admin') {
              return true;
            }
          }
        }
        return false;
      });
      eligible.sort((a, b) => {
        if (Boolean(a.isTasksCalendar) === Boolean(b.isTasksCalendar)) {
          return a.name.localeCompare(b.name);
        }
        return a.isTasksCalendar ? -1 : 1;
      });
      setTasksCalendars(
        eligible.map((calendar) => ({
          id: calendar.id,
          name: calendar.name,
          isTasksCalendar: Boolean(calendar.isTasksCalendar),
          ownerId: calendar.ownerId,
        })),
      );
    } catch (err) {
      console.error('Error loading calendars for Tasks selector:', err);
    } finally {
      setTasksCalendarsLoading(false);
    }
  };

  /**
   * Load user profile data from the API and populate form fields
   */
  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      const userData = await profileApi.getUserProfile() as UserProfileData;
      setUser(userData);

      // Populate profile form with user data
      setProfileForm({
        username: userData.username || '',
        email: userData.email || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        timezone: userData.timezone || '',
        timeFormat: userData.timeFormat || '12h',
        language: userData.language || 'en',
        hideReservationsTab: Boolean(userData.hideReservationsTab),
        usagePlans: userData.usagePlans || ['user'],
        defaultTasksCalendarId: userData.defaultTasksCalendarId
          ? String(userData.defaultTasksCalendarId)
          : '',
      });

      if (userData.themeColor && userData.themeColor !== currentTheme) {
        onThemeChange(userData.themeColor);
      }

      // Sync language with i18n
      if (userData.language) {
        await applyLanguagePreference(userData.language, { persistRemote: false });
      }

      await loadTasksCalendars(userData.id);

    } catch (err) {
      console.error('Error loading user data:', err);
      setError(err instanceof Error ? err.message : t('errors:generic.unexpected', { defaultValue: 'Failed to load user profile' }));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle profile form field changes
   */
  const handleProfileFormChange = (field: string, value: string | boolean) => {
    setProfileForm(prev => ({ ...prev, [field]: value }) as PersonalInfoFormData);
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
      errors.username = t('validation:required');
    } else if (profileForm.username.length < 3) {
      errors.username = t('validation:minLength', { min: 3 });
    }

    if (!profileForm.email.trim()) {
      errors.email = t('validation:required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email)) {
      errors.email = t('validation:invalidEmail');
    }

    if (!profileForm.timezone) {
      errors.timezone = t('validation:timezoneRequired');
    }

    if (!profileForm.timeFormat) {
      errors.timeFormat = t('validation:required');
    }

    if (!profileForm.language) {
      errors.language = t('validation:languageRequired');
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
      errors.currentPassword = t('validation:required');
    }

    if (!passwordForm.newPassword) {
      errors.newPassword = t('validation:required');
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = t('validation:minLength', { min: 8 });
    }

    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = t('validation:required');
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = t('validation:passwordsDoNotMatch');
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

      const { usagePlans, defaultTasksCalendarId, ...profileData } = profileForm;
      await profileApi.updateUserProfile({
        ...profileData,
        defaultTasksCalendarId: defaultTasksCalendarId
          ? Number(defaultTasksCalendarId)
          : null,
      });

      // Update i18n language if changed
      if (profileData.language) {
        await applyLanguagePreference(profileData.language, { persistRemote: false });
      }

      setSuccess(t('settings:messages.saved'));
      setTimeout(() => setSuccess(null), 3000);

      // Reload user data to ensure consistency
      await loadUserData();

    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : t('settings:messages.saveFailed'));
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

      await profileApi.changePassword(passwordForm.currentPassword, passwordForm.newPassword);

      setSuccess(t('settings:profile.changePassword'));
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
      setError(err instanceof Error ? err.message : t('errors:generic.unexpected', { defaultValue: 'Failed to change password' }));
    } finally {
      setPasswordLoading(false);
    }
  };

  /**
   * Handle theme color change
   */
  const handleThemeChange = async (color: string) => {
    if (color === currentTheme || isThemeSaving) {
      return;
    }

    const previousTheme = currentTheme;
    setError(null);
    setSuccess(null);
    setIsThemeSaving(true);
    onThemeChange(color);

    try {
      await profileApi.updateUserTheme(color);
      setSuccess(t('settings:messages.saved'));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating theme:', err);
      setError(err instanceof Error ? err.message : t('settings:messages.saveFailed'));
      onThemeChange(previousTheme);
    } finally {
      setIsThemeSaving(false);
    }
  };

  const handleCopyWidgetDiagnostics = async () => {
    setWidgetLogBusy(true);
    setWidgetLogStatus(null);
    const diagnosticsLog = await getWidgetDiagnosticsLog();
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(diagnosticsLog);
        setWidgetLogStatus(
          t('settings:security.copyWidgetLog', {
            defaultValue: 'Widget diagnostics copied to clipboard.',
          }),
        );
      } else {
        setWidgetLogStatus(diagnosticsLog);
      }
    } catch (err) {
      console.error('Failed to copy widget diagnostics:', err);
      setWidgetLogStatus(diagnosticsLog);
    } finally {
      setWidgetLogBusy(false);
    }
  };

  const handleClearWidgetDiagnostics = async () => {
    setWidgetLogBusy(true);
    setWidgetLogStatus(null);
    await clearWidgetDiagnosticsLog();
    setWidgetLogStatus(
      t('settings:security.clearWidgetLog', {
        defaultValue: 'Widget diagnostics log cleared.',
      }),
    );
    setWidgetLogBusy(false);
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
          <div className="text-xl font-semibold text-gray-800">{t('common:app.loading', { defaultValue: LOADING_MESSAGES.PROFILE })}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isMobile ? 'bg-gray-50' : `bg-gradient-to-br ${getSimpleThemeGradient(currentTheme)}`}`}>
      {/* Header - Hidden on mobile (Dashboard handles it) */}
      {!isMobile && (
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 text-gray-800 py-6">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  {t('settings:sections.profile')}
                </h1>
                <p className="text-gray-600 mt-1">{t('settings:profile.personalInformation')}</p>
              </div>
              {user && (
                <div className="text-right">
                  <p className="text-sm text-gray-500">{t('common:app.welcome')}</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {user.firstName || user.username || t('roles.user')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={`container mx-auto ${isMobile ? 'px-0 py-0' : 'px-4 py-8'}`}>
        {/* Status Messages */}
        {error && (
          <div className={`bg-red-50 border border-red-200 p-4 ${isMobile ? 'mx-4 my-4 rounded-lg' : 'mb-6 rounded-lg'}`}>
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className={`bg-green-50 border border-green-200 p-4 ${isMobile ? 'mx-4 my-4 rounded-lg' : 'mb-6 rounded-lg'}`}>
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-green-700">{success}</p>
            </div>
          </div>
        )}

        {/* Profile Content Grid */}
        <div className={`grid grid-cols-1 lg:grid-cols-2 ${isMobile ? 'gap-4' : 'gap-8'}`}>
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
              tasksCalendars={tasksCalendars}
              tasksCalendarsLoading={tasksCalendarsLoading}
            />

            {/* Password Management */}
            {!showPasswordForm ? (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className={`flex ${isMobile ? 'flex-col gap-4' : 'items-center justify-between'}`}>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('auth:labels.password')}</h3>
                    <p className="text-gray-600 text-sm">{t('auth:hints.passwordStrength', { defaultValue: 'Keep your account secure with a strong password' })}</p>
                  </div>
                  <Button
                    variant="outline"
                    themeColor={currentTheme}
                    onClick={() => setShowPasswordForm(true)}
                    className={isMobile ? 'w-full' : ''}
                  >
                    {t('settings:profile.changePassword')}
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
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex flex-col gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Onboarding & compliance</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Privacy and onboarding details saved for your account.
                  </p>
                </div>
                <dl className="grid grid-cols-1 gap-2 text-sm text-gray-700">
                  <div>
                    <dt className="font-medium text-gray-900">Onboarding status</dt>
                    <dd>{user?.onboardingCompleted ? 'Completed' : 'Pending'}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-900">Completed at</dt>
                    <dd>{formatDateValue(user?.onboardingCompletedAt)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-900">Privacy accepted</dt>
                    <dd>{formatDateValue(user?.privacyPolicyAcceptedAt)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-900">Privacy policy version</dt>
                    <dd>{user?.privacyPolicyVersion ?? onboardingConfig.privacyPolicyVersion}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-900">Calendar use case</dt>
                    <dd>{user?.onboardingUseCase ?? t('common:app.notAvailable', { defaultValue: 'Not available' })}</dd>
                  </div>
                </dl>
                <div className="flex flex-wrap gap-3 text-sm">
                  <a
                    href={onboardingConfig.privacyPolicyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-blue-700 underline"
                  >
                    Privacy policy
                  </a>
                  <a
                    href={onboardingConfig.termsOfServiceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-blue-700 underline"
                  >
                    Terms of service
                  </a>
                </div>
              </div>
            </div>

            {/* Theme Selector */}
            <ThemeSelector
              currentTheme={currentTheme}
              onThemeChange={handleThemeChange}
              isSaving={isThemeSaving}
            />

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex flex-col gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {t('settings:security.widgetDiagnostics')}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {t('settings:security.widgetDiagnosticsHelp')}
                  </p>
                </div>
                <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-3`}>
                  <Button
                    variant="outline"
                    themeColor={currentTheme}
                    onClick={handleCopyWidgetDiagnostics}
                    disabled={widgetLogBusy}
                    className={isMobile ? 'w-full' : ''}
                  >
                    {widgetLogBusy
                      ? t('common:app.saving', { defaultValue: 'Working...' })
                      : t('settings:security.copyWidgetLog')}
                  </Button>
                  <Button
                    variant="ghost"
                    themeColor={currentTheme}
                    onClick={handleClearWidgetDiagnostics}
                    disabled={widgetLogBusy}
                    className={isMobile ? 'w-full' : ''}
                  >
                    {t('settings:security.clearWidgetLog')}
                  </Button>
                </div>
                {widgetLogStatus && (
                  <p className="text-xs text-gray-600 whitespace-pre-wrap break-words">{widgetLogStatus}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserProfile;
