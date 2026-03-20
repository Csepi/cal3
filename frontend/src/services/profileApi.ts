import { apiService } from './api';

export const profileApi = {
  getUserProfile: () => apiService.getUserProfile(),
  updateUserProfile: (payload: Record<string, unknown>) => apiService.updateUserProfile(payload),
  deleteUserEventLabel: (label: string) => apiService.deleteUserEventLabel(label),
  uploadProfilePicture: (file: File) => apiService.uploadProfilePicture(file),
  updateLanguagePreference: (language: 'en' | 'hu' | 'de' | 'fr') =>
    apiService.updateLanguagePreference(language),
  updateUserTheme: (themeColor: string) => apiService.updateUserTheme(themeColor),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiService.changePassword(currentPassword, newPassword),
} as const;
