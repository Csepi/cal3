import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface UserProfileProps {
  onThemeChange: (color: string) => void;
  currentTheme: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ onThemeChange, currentTheme }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [profileForm, setProfileForm] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    timezone: '',
    timeFormat: '',
    usagePlans: ['user']
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const themeColorOptions = [
    { name: 'Red', value: '#ef4444', gradient: 'from-red-500 to-red-600' },
    { name: 'Orange', value: '#f59e0b', gradient: 'from-orange-500 to-orange-600' },
    { name: 'Yellow', value: '#eab308', gradient: 'from-yellow-500 to-yellow-600' },
    { name: 'Lime', value: '#84cc16', gradient: 'from-lime-500 to-lime-600' },
    { name: 'Green', value: '#10b981', gradient: 'from-green-500 to-green-600' },
    { name: 'Emerald', value: '#22c55e', gradient: 'from-emerald-500 to-emerald-600' },
    { name: 'Teal', value: '#14b8a6', gradient: 'from-teal-500 to-teal-600' },
    { name: 'Cyan', value: '#06b6d4', gradient: 'from-cyan-500 to-cyan-600' },
    { name: 'Sky', value: '#0ea5e9', gradient: 'from-sky-500 to-sky-600' },
    { name: 'Blue', value: '#3b82f6', gradient: 'from-blue-500 to-blue-600' },
    { name: 'Indigo', value: '#6366f1', gradient: 'from-indigo-500 to-indigo-600' },
    { name: 'Violet', value: '#7c3aed', gradient: 'from-violet-500 to-violet-600' },
    { name: 'Purple', value: '#8b5cf6', gradient: 'from-purple-500 to-purple-600' },
    { name: 'Pink', value: '#ec4899', gradient: 'from-pink-500 to-pink-600' },
    { name: 'Rose', value: '#f43f5e', gradient: 'from-rose-500 to-rose-600' },
    { name: 'Slate', value: '#64748b', gradient: 'from-slate-500 to-slate-600' }
  ];

  const usagePlanOptions = [
    { value: 'child', label: 'Child', description: 'Basic features for children' },
    { value: 'user', label: 'User', description: 'Standard user features' },
    { value: 'store', label: 'Store', description: 'Advanced features for businesses' },
    { value: 'enterprise', label: 'Enterprise', description: 'Full enterprise features' }
  ];

  const timezoneOptions = [
    // UTC
    { name: 'UTC (Coordinated Universal Time)', value: 'UTC' },

    // Americas
    { name: 'Alaska Time (Anchorage)', value: 'America/Anchorage' },
    { name: 'Pacific Time (Los Angeles)', value: 'America/Los_Angeles' },
    { name: 'Mountain Time (Denver)', value: 'America/Denver' },
    { name: 'Central Time (Chicago)', value: 'America/Chicago' },
    { name: 'Eastern Time (New York)', value: 'America/New_York' },
    { name: 'Atlantic Time (Halifax)', value: 'America/Halifax' },
    { name: 'Newfoundland Time (St. Johns)', value: 'America/St_Johns' },
    { name: 'Mexico City', value: 'America/Mexico_City' },
    { name: 'Guatemala City', value: 'America/Guatemala' },
    { name: 'Bogotá', value: 'America/Bogota' },
    { name: 'Lima', value: 'America/Lima' },
    { name: 'Santiago', value: 'America/Santiago' },
    { name: 'São Paulo', value: 'America/Sao_Paulo' },
    { name: 'Buenos Aires', value: 'America/Argentina/Buenos_Aires' },
    { name: 'Montevideo', value: 'America/Montevideo' },

    // Europe
    { name: 'London (GMT/BST)', value: 'Europe/London' },
    { name: 'Dublin', value: 'Europe/Dublin' },
    { name: 'Paris', value: 'Europe/Paris' },
    { name: 'Berlin', value: 'Europe/Berlin' },
    { name: 'Amsterdam', value: 'Europe/Amsterdam' },
    { name: 'Brussels', value: 'Europe/Brussels' },
    { name: 'Vienna', value: 'Europe/Vienna' },
    { name: 'Zurich', value: 'Europe/Zurich' },
    { name: 'Rome', value: 'Europe/Rome' },
    { name: 'Madrid', value: 'Europe/Madrid' },
    { name: 'Stockholm', value: 'Europe/Stockholm' },
    { name: 'Copenhagen', value: 'Europe/Copenhagen' },
    { name: 'Oslo', value: 'Europe/Oslo' },
    { name: 'Helsinki', value: 'Europe/Helsinki' },
    { name: 'Warsaw', value: 'Europe/Warsaw' },
    { name: 'Prague', value: 'Europe/Prague' },
    { name: 'Budapest', value: 'Europe/Budapest' },
    { name: 'Athens', value: 'Europe/Athens' },
    { name: 'Istanbul', value: 'Europe/Istanbul' },
    { name: 'Moscow', value: 'Europe/Moscow' },
    { name: 'Kiev', value: 'Europe/Kiev' },

    // Africa
    { name: 'Cairo', value: 'Africa/Cairo' },
    { name: 'Lagos', value: 'Africa/Lagos' },
    { name: 'Johannesburg', value: 'Africa/Johannesburg' },
    { name: 'Nairobi', value: 'Africa/Nairobi' },
    { name: 'Casablanca', value: 'Africa/Casablanca' },
    { name: 'Algiers', value: 'Africa/Algiers' },

    // Asia
    { name: 'Dubai', value: 'Asia/Dubai' },
    { name: 'Tehran', value: 'Asia/Tehran' },
    { name: 'Kabul', value: 'Asia/Kabul' },
    { name: 'Karachi', value: 'Asia/Karachi' },
    { name: 'Mumbai (Kolkata)', value: 'Asia/Kolkata' },
    { name: 'Dhaka', value: 'Asia/Dhaka' },
    { name: 'Yangon', value: 'Asia/Yangon' },
    { name: 'Bangkok', value: 'Asia/Bangkok' },
    { name: 'Jakarta', value: 'Asia/Jakarta' },
    { name: 'Singapore', value: 'Asia/Singapore' },
    { name: 'Manila', value: 'Asia/Manila' },
    { name: 'Hong Kong', value: 'Asia/Hong_Kong' },
    { name: 'Taipei', value: 'Asia/Taipei' },
    { name: 'Shanghai', value: 'Asia/Shanghai' },
    { name: 'Beijing', value: 'Asia/Beijing' },
    { name: 'Seoul', value: 'Asia/Seoul' },
    { name: 'Tokyo', value: 'Asia/Tokyo' },
    { name: 'Vladivostok', value: 'Asia/Vladivostok' },

    // Australia & Pacific
    { name: 'Perth', value: 'Australia/Perth' },
    { name: 'Adelaide', value: 'Australia/Adelaide' },
    { name: 'Darwin', value: 'Australia/Darwin' },
    { name: 'Brisbane', value: 'Australia/Brisbane' },
    { name: 'Sydney', value: 'Australia/Sydney' },
    { name: 'Melbourne', value: 'Australia/Melbourne' },
    { name: 'Hobart', value: 'Australia/Hobart' },
    { name: 'Auckland', value: 'Pacific/Auckland' },
    { name: 'Fiji', value: 'Pacific/Fiji' },
    { name: 'Honolulu', value: 'Pacific/Honolulu' },
    { name: 'Samoa', value: 'Pacific/Samoa' },
    { name: 'Tahiti', value: 'Pacific/Tahiti' }
  ];

  // Time format options for user preference
  const userTimeFormatOptions = [
    { name: '12-hour (1:30 PM)', value: '12h' },
    { name: '24-hour (13:30)', value: '24h' }
  ];

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const userProfile = await apiService.getUserProfile();
      setUser(userProfile);
      setProfileForm({
        username: userProfile.username || '',
        email: userProfile.email || '',
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        timezone: userProfile.timezone || 'UTC',
        timeFormat: userProfile.timeFormat || '24h',
        usagePlans: userProfile.usagePlans || ['user']
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced validation functions
  const validateProfileForm = (): string[] => {
    const errors: string[] = [];

    if (!profileForm.username.trim()) {
      errors.push('Username is required');
    } else if (profileForm.username.trim().length < 3) {
      errors.push('Username must be at least 3 characters long');
    } else if (profileForm.username.trim().length > 20) {
      errors.push('Username must be less than 20 characters');
    } else if (!/^[a-zA-Z0-9_]+$/.test(profileForm.username.trim())) {
      errors.push('Username can only contain letters, numbers, and underscores');
    }

    if (!profileForm.email.trim()) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email.trim())) {
      errors.push('Please enter a valid email address');
    }

    if (profileForm.firstName && profileForm.firstName.length > 50) {
      errors.push('First name must be less than 50 characters');
    }

    if (profileForm.lastName && profileForm.lastName.length > 50) {
      errors.push('Last name must be less than 50 characters');
    }

    if (!profileForm.timezone) {
      errors.push('Please select a timezone');
    }

    if (!profileForm.timeFormat) {
      errors.push('Please select a time format');
    }

    return errors;
  };

  const validatePasswordForm = (): string[] => {
    const errors: string[] = [];

    if (!passwordForm.currentPassword) {
      errors.push('Current password is required');
    }

    if (!passwordForm.newPassword) {
      errors.push('New password is required');
    } else if (passwordForm.newPassword.length < 6) {
      errors.push('New password must be at least 6 characters long');
    } else if (passwordForm.newPassword.length > 100) {
      errors.push('New password must be less than 100 characters');
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordForm.newPassword)) {
      errors.push('New password must contain at least one uppercase letter, one lowercase letter, and one number');
    }

    if (!passwordForm.confirmPassword) {
      errors.push('Please confirm your new password');
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.push('New passwords do not match');
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      errors.push('New password must be different from current password');
    }

    return errors;
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate form before proceeding
    const validationErrors = validateProfileForm();
    if (validationErrors.length > 0) {
      setError(`Please fix the following errors:\n${validationErrors.join('\n')}`);
      return;
    }

    try {
      const updatedUser = await apiService.updateUserProfile(profileForm);
      setUser(updatedUser);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  const handleThemeChange = async (color: string) => {
    try {
      await apiService.updateUserTheme(color);
      onThemeChange(color);
      setSuccess('Theme updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update theme');
    }
  };

  const handleUsagePlanChange = (planValue: string) => {
    const currentPlans = profileForm.usagePlans;
    let newPlans;

    if (currentPlans.includes(planValue)) {
      // Remove if already selected (but keep at least one plan)
      if (currentPlans.length > 1) {
        newPlans = currentPlans.filter(plan => plan !== planValue);
      } else {
        newPlans = currentPlans; // Don't allow removing the last plan
      }
    } else {
      // Add if not selected
      newPlans = [...currentPlans, planValue];
    }

    setProfileForm(prev => ({
      ...prev,
      usagePlans: newPlans
    }));
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate form before proceeding
    const validationErrors = validatePasswordForm();
    if (validationErrors.length > 0) {
      setError(`Please fix the following errors:\n${validationErrors.join('\n')}`);
      return;
    }

    try {
      await apiService.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
      setSuccess('Password changed successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    }
  };

  // Helper function to get theme-based colors
  const getThemeColors = (color: string) => {
    const colorMap: Record<string, any> = {
      '#ef4444': { gradient: 'from-red-50 via-red-100 to-red-200', primary: 'red', ring: 'ring-red-500', text: 'text-red-900', border: 'border-red-200' },
      '#f59e0b': { gradient: 'from-orange-50 via-orange-100 to-orange-200', primary: 'orange', ring: 'ring-orange-500', text: 'text-orange-900', border: 'border-orange-200' },
      '#eab308': { gradient: 'from-yellow-50 via-yellow-100 to-yellow-200', primary: 'yellow', ring: 'ring-yellow-500', text: 'text-yellow-900', border: 'border-yellow-200' },
      '#84cc16': { gradient: 'from-lime-50 via-lime-100 to-lime-200', primary: 'lime', ring: 'ring-lime-500', text: 'text-lime-900', border: 'border-lime-200' },
      '#10b981': { gradient: 'from-green-50 via-green-100 to-green-200', primary: 'green', ring: 'ring-green-500', text: 'text-green-900', border: 'border-green-200' },
      '#22c55e': { gradient: 'from-emerald-50 via-emerald-100 to-emerald-200', primary: 'emerald', ring: 'ring-emerald-500', text: 'text-emerald-900', border: 'border-emerald-200' },
      '#14b8a6': { gradient: 'from-teal-50 via-teal-100 to-teal-200', primary: 'teal', ring: 'ring-teal-500', text: 'text-teal-900', border: 'border-teal-200' },
      '#06b6d4': { gradient: 'from-cyan-50 via-cyan-100 to-cyan-200', primary: 'cyan', ring: 'ring-cyan-500', text: 'text-cyan-900', border: 'border-cyan-200' },
      '#0ea5e9': { gradient: 'from-sky-50 via-sky-100 to-sky-200', primary: 'sky', ring: 'ring-sky-500', text: 'text-sky-900', border: 'border-sky-200' },
      '#3b82f6': { gradient: 'from-blue-50 via-blue-100 to-blue-200', primary: 'blue', ring: 'ring-blue-500', text: 'text-blue-900', border: 'border-blue-200' },
      '#6366f1': { gradient: 'from-indigo-50 via-indigo-100 to-indigo-200', primary: 'indigo', ring: 'ring-indigo-500', text: 'text-indigo-900', border: 'border-indigo-200' },
      '#7c3aed': { gradient: 'from-violet-50 via-violet-100 to-violet-200', primary: 'violet', ring: 'ring-violet-500', text: 'text-violet-900', border: 'border-violet-200' },
      '#8b5cf6': { gradient: 'from-purple-50 via-purple-100 to-purple-200', primary: 'purple', ring: 'ring-purple-500', text: 'text-purple-900', border: 'border-purple-200' },
      '#ec4899': { gradient: 'from-pink-50 via-pink-100 to-pink-200', primary: 'pink', ring: 'ring-pink-500', text: 'text-pink-900', border: 'border-pink-200' },
      '#f43f5e': { gradient: 'from-rose-50 via-rose-100 to-rose-200', primary: 'rose', ring: 'ring-rose-500', text: 'text-rose-900', border: 'border-rose-200' },
      '#64748b': { gradient: 'from-slate-50 via-slate-100 to-slate-200', primary: 'slate', ring: 'ring-slate-500', text: 'text-slate-900', border: 'border-slate-200' }
    };
    return colorMap[color] || colorMap['#3b82f6'];
  };

  const themeColors = getThemeColors(currentTheme);

  if (loading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${themeColors.gradient} flex items-center justify-center`}>
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 border-${themeColors.primary}-600 mx-auto`}></div>
          <p className="text-gray-700 mt-4 text-center">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${themeColors.gradient} p-6`}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className={`bg-white/80 backdrop-blur-xl ${themeColors.border} rounded-3xl shadow-2xl p-8`}>
          <h1 className={`text-4xl font-thin mb-2 ${themeColors.text}`}>
            User Profile
          </h1>
          <p className={themeColors.text}>Manage your account settings and preferences</p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-300 text-green-700 px-6 py-4 rounded-2xl">
            <div className="flex items-center gap-2">
              <span>✅</span>
              {success}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-300 rounded-2xl p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Please fix the following errors:</h3>
                <div className="mt-2 text-sm text-red-700">
                  <div className="whitespace-pre-line">
                    {error.split('\n').slice(1).map((errorLine, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <span className="text-red-500">•</span>
                        <span>{errorLine}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Information */}
          <div className={`bg-white/80 backdrop-blur-xl ${themeColors.border} rounded-3xl shadow-2xl p-8`}>
            <h2 className={`text-2xl font-medium ${themeColors.text} mb-6 flex items-center gap-2`}>
              👤 Profile Information
            </h2>

            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={profileForm.username}
                  onChange={(e) => setProfileForm(prev => ({...prev, username: e.target.value}))}
                  className={`w-full px-4 py-3 bg-white border border-gray-300 text-gray-800 rounded-xl focus:ring-2 ${themeColors.ring} focus:border-${themeColors.primary}-500 outline-none transition-all duration-300`}
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm(prev => ({...prev, email: e.target.value}))}
                  className={`w-full px-4 py-3 bg-white border border-gray-300 text-gray-800 rounded-xl focus:ring-2 ${themeColors.ring} focus:border-${themeColors.primary}-500 outline-none transition-all duration-300`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm(prev => ({...prev, firstName: e.target.value}))}
                    className={`w-full px-4 py-3 bg-white border border-gray-300 text-gray-800 rounded-xl focus:ring-2 ${themeColors.ring} focus:border-${themeColors.primary}-500 outline-none transition-all duration-300`}
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm(prev => ({...prev, lastName: e.target.value}))}
                    className={`w-full px-4 py-3 bg-white border border-gray-300 text-gray-800 rounded-xl focus:ring-2 ${themeColors.ring} focus:border-${themeColors.primary}-500 outline-none transition-all duration-300`}
                  />
                </div>
              </div>


              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-2">
                    🌍 Timezone
                  </label>
                  <select
                    id="timezone"
                    value={profileForm.timezone}
                    onChange={(e) => setProfileForm(prev => ({...prev, timezone: e.target.value}))}
                    className={`w-full px-4 py-3 bg-white border border-gray-300 text-gray-800 rounded-xl focus:ring-2 ${themeColors.ring} focus:border-${themeColors.primary}-500 outline-none transition-all duration-300`}
                  >
                    {timezoneOptions.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="timeFormat" className="block text-sm font-medium text-gray-700 mb-2">
                    🕐 Time Format
                  </label>
                  <select
                    id="timeFormat"
                    value={profileForm.timeFormat}
                    onChange={(e) => setProfileForm(prev => ({...prev, timeFormat: e.target.value}))}
                    className={`w-full px-4 py-3 bg-white border border-gray-300 text-gray-800 rounded-xl focus:ring-2 ${themeColors.ring} focus:border-${themeColors.primary}-500 outline-none transition-all duration-300`}
                  >
                    {userTimeFormatOptions.map((format) => (
                      <option key={format.value} value={format.value}>
                        {format.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className={`w-full bg-${themeColors.primary}-500 hover:bg-${themeColors.primary}-600 text-white py-3 px-6 rounded-xl font-medium transition-all duration-300 hover:scale-105 focus:ring-2 ${themeColors.ring} outline-none shadow-lg`}
              >
                💾 Update Profile
              </button>
            </form>

            {/* Password Section */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className={`text-${themeColors.primary}-600 hover:text-${themeColors.primary}-700 font-medium transition-colors duration-200 flex items-center gap-2`}
              >
                🔒 {showPasswordForm ? 'Hide' : 'Change'} Password
              </button>

              {showPasswordForm && (
                <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({...prev, currentPassword: e.target.value}))}
                      className={`w-full px-4 py-3 bg-white border border-gray-300 text-gray-800 rounded-xl focus:ring-2 ${themeColors.ring} focus:border-${themeColors.primary}-500 outline-none transition-all duration-300`}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({...prev, newPassword: e.target.value}))}
                      className={`w-full px-4 py-3 bg-white border border-gray-300 text-gray-800 rounded-xl focus:ring-2 ${themeColors.ring} focus:border-${themeColors.primary}-500 outline-none transition-all duration-300`}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({...prev, confirmPassword: e.target.value}))}
                      className={`w-full px-4 py-3 bg-white border border-gray-300 text-gray-800 rounded-xl focus:ring-2 ${themeColors.ring} focus:border-${themeColors.primary}-500 outline-none transition-all duration-300`}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-6 rounded-xl font-medium transition-all duration-300 hover:scale-105 focus:ring-2 focus:ring-orange-500 outline-none shadow-lg"
                  >
                    🔄 Change Password
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Theme Customization */}
          <div className={`bg-white/80 backdrop-blur-xl ${themeColors.border} rounded-3xl shadow-2xl p-8`}>
            <h2 className={`text-2xl font-medium ${themeColors.text} mb-6 flex items-center gap-2`}>
              🎨 Theme Customization
            </h2>

            <p className="text-gray-600 mb-6">
              Choose your preferred color theme. This will affect the appearance of the entire application.
            </p>

            <div className="grid grid-cols-4 gap-3">
              {themeColorOptions.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleThemeChange(color.value)}
                  className={`relative group p-3 rounded-xl border-2 transition-all duration-300 hover:scale-110 ${
                    currentTheme === color.value
                      ? 'border-gray-800 ring-2 ring-gray-400 shadow-lg'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div
                    className="w-full h-8 rounded-lg mb-2 shadow-md"
                    style={{
                      background: `linear-gradient(135deg, ${color.value}40, ${color.value}80, ${color.value})`
                    }}
                  ></div>
                  <p className="text-xs font-medium text-gray-700 text-center truncate">{color.name}</p>
                  {currentTheme === color.value && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      ✓
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* User Info */}
            {user && (
              <div className={`mt-8 pt-6 border-t ${themeColors.border}`}>
                <h3 className={`text-lg font-medium ${themeColors.text} mb-4`}>Account Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Member since:</span>
                    <span className="font-medium">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Role:</span>
                    <span className={`font-medium ${user.role === 'admin' ? 'text-red-600' : 'text-blue-600'}`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last updated:</span>
                    <span className="font-medium">
                      {new Date(user.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Usage Plans - Read Only Display */}
                  <div className="pt-3 mt-3 border-t border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-gray-600">Usage Plans:</span>
                      {user.role !== 'admin' && (
                        <span className="text-xs text-gray-400 italic">Admin Only</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {user.usagePlans?.map((plan: string) => (
                        <span
                          key={plan}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-300"
                        >
                          {usagePlanOptions.find(p => p.value === plan)?.label || plan}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;