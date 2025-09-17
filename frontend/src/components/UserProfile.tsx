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
    lastName: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const themeColorOptions = [
    { name: 'Blue', value: '#3b82f6', gradient: 'from-blue-500 to-blue-600' },
    { name: 'Purple', value: '#8b5cf6', gradient: 'from-purple-500 to-purple-600' },
    { name: 'Green', value: '#10b981', gradient: 'from-green-500 to-green-600' },
    { name: 'Red', value: '#ef4444', gradient: 'from-red-500 to-red-600' },
    { name: 'Orange', value: '#f59e0b', gradient: 'from-orange-500 to-orange-600' },
    { name: 'Pink', value: '#ec4899', gradient: 'from-pink-500 to-pink-600' },
    { name: 'Indigo', value: '#6366f1', gradient: 'from-indigo-500 to-indigo-600' },
    { name: 'Teal', value: '#14b8a6', gradient: 'from-teal-500 to-teal-600' }
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
        lastName: userProfile.lastName || ''
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

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

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
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
      '#3b82f6': { gradient: 'from-blue-50 via-blue-100 to-blue-200', primary: 'blue', ring: 'ring-blue-500' },
      '#8b5cf6': { gradient: 'from-purple-50 via-purple-100 to-purple-200', primary: 'purple', ring: 'ring-purple-500' },
      '#10b981': { gradient: 'from-green-50 via-green-100 to-green-200', primary: 'green', ring: 'ring-green-500' },
      '#ef4444': { gradient: 'from-red-50 via-red-100 to-red-200', primary: 'red', ring: 'ring-red-500' },
      '#f59e0b': { gradient: 'from-orange-50 via-orange-100 to-orange-200', primary: 'orange', ring: 'ring-orange-500' },
      '#ec4899': { gradient: 'from-pink-50 via-pink-100 to-pink-200', primary: 'pink', ring: 'ring-pink-500' },
      '#6366f1': { gradient: 'from-indigo-50 via-indigo-100 to-indigo-200', primary: 'indigo', ring: 'ring-indigo-500' },
      '#14b8a6': { gradient: 'from-teal-50 via-teal-100 to-teal-200', primary: 'teal', ring: 'ring-teal-500' }
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
        <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl shadow-2xl p-8">
          <h1 className={`text-4xl font-thin mb-2 bg-gradient-to-r from-${themeColors.primary}-600 via-${themeColors.primary}-700 to-${themeColors.primary}-800 bg-clip-text text-transparent`}>
            User Profile
          </h1>
          <p className="text-gray-700">Manage your account settings and preferences</p>
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
          <div className="bg-red-50 border border-red-300 text-red-700 px-6 py-4 rounded-2xl">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              {error}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Information */}
          <div className="bg-white/80 backdrop-blur-xl border border-blue-200 rounded-3xl shadow-2xl p-8">
            <h2 className="text-2xl font-medium text-gray-800 mb-6 flex items-center gap-2">
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
          <div className="bg-white/80 backdrop-blur-xl border border-blue-200 rounded-3xl shadow-2xl p-8">
            <h2 className="text-2xl font-medium text-gray-800 mb-6 flex items-center gap-2">
              🎨 Theme Customization
            </h2>

            <p className="text-gray-600 mb-6">
              Choose your preferred color theme. This will affect the appearance of the entire application.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {themeColorOptions.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleThemeChange(color.value)}
                  className={`relative group p-4 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                    currentTheme === color.value
                      ? 'border-gray-800 ring-2 ring-gray-400 shadow-lg'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className={`w-full h-12 bg-gradient-to-r ${color.gradient} rounded-xl mb-3 shadow-md`}></div>
                  <p className="text-sm font-medium text-gray-700 text-center">{color.name}</p>
                  {currentTheme === color.value && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      ✓
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* User Info */}
            {user && (
              <div className="mt-8 pt-6 border-t border-blue-200">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Account Information</h3>
                <div className="space-y-2 text-sm">
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