import { useState, useCallback, useEffect } from 'react';
import { profileApi } from '../services/profileApi';

export interface CalendarSettings {
  weekStartDay: number; // 0 = Sunday, 1 = Monday, etc.
  defaultView: 'month' | 'week';
  selectedCalendars: number[]; // IDs of visible calendars
}

interface UseCalendarSettingsReturn {
  settings: CalendarSettings;
  updateWeekStartDay: (day: number) => Promise<void>;
  updateDefaultView: (view: 'month' | 'week') => void;
  toggleCalendarVisibility: (calendarId: number) => void;
  setSelectedCalendars: (calendarIds: number[]) => void;
  saveSettings: () => Promise<void>;
  loadSettings: () => void;
}

const STORAGE_KEY = 'calendarSettings';

const defaultSettings: CalendarSettings = {
  weekStartDay: 1, // Monday
  defaultView: 'month',
  selectedCalendars: []
};

export const useCalendarSettings = (): UseCalendarSettingsReturn => {
  const [settings, setSettings] = useState<CalendarSettings>(defaultSettings);

  // Load settings from localStorage and user profile
  const loadSettings = useCallback(() => {
    try {
      // Load from localStorage first (includes selected calendars which aren't stored server-side)
      const savedSettings = localStorage.getItem(STORAGE_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      }

      // Load user profile settings (weekStartDay, defaultView)
      const loadUserProfile = async () => {
        try {
          const profile = await profileApi.getUserProfile() as {
            weekStartDay?: number;
            defaultCalendarView?: 'month' | 'week';
          };
          setSettings(prev => ({
            ...prev,
            weekStartDay: profile.weekStartDay ?? 1,
            defaultView: profile.defaultCalendarView ?? 'month'
          }));
        } catch (error) {
          console.warn('Failed to load user profile settings:', error);
        }
      };

      loadUserProfile();
    } catch (error) {
      console.warn('Failed to load calendar settings:', error);
    }
  }, []);

  // Save settings to localStorage
  const saveToLocalStorage = useCallback((newSettings: CalendarSettings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.warn('Failed to save settings to localStorage:', error);
    }
  }, []);

  // Update week start day (saves to server)
  const updateWeekStartDay = useCallback(async (day: number) => {
    try {
      await profileApi.updateUserProfile({ weekStartDay: day });
      const newSettings = { ...settings, weekStartDay: day };
      setSettings(newSettings);
      saveToLocalStorage(newSettings);
    } catch (error) {
      console.error('Failed to update week start day:', error);
      throw error;
    }
  }, [settings, saveToLocalStorage]);

  // Update default view (local only)
  const updateDefaultView = useCallback((view: 'month' | 'week') => {
    const newSettings = { ...settings, defaultView: view };
    setSettings(newSettings);
    saveToLocalStorage(newSettings);
  }, [settings, saveToLocalStorage]);

  // Toggle calendar visibility
  const toggleCalendarVisibility = useCallback((calendarId: number) => {
    const newSelectedCalendars = settings.selectedCalendars.includes(calendarId)
      ? settings.selectedCalendars.filter(id => id !== calendarId)
      : [...settings.selectedCalendars, calendarId];

    const newSettings = { ...settings, selectedCalendars: newSelectedCalendars };
    setSettings(newSettings);
    saveToLocalStorage(newSettings);
  }, [settings, saveToLocalStorage]);

  // Set selected calendars
  const setSelectedCalendars = useCallback((calendarIds: number[]) => {
    const newSettings = { ...settings, selectedCalendars: calendarIds };
    setSettings(newSettings);
    saveToLocalStorage(newSettings);
  }, [settings, saveToLocalStorage]);

  // Save user profile settings to server
  const saveSettings = useCallback(async () => {
    try {
      await profileApi.updateUserProfile({
        weekStartDay: settings.weekStartDay,
        defaultCalendarView: settings.defaultView
      });
    } catch (error) {
      console.error('Failed to save settings to server:', error);
      throw error;
    }
  }, [settings]);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    updateWeekStartDay,
    updateDefaultView,
    toggleCalendarVisibility,
    setSelectedCalendars,
    saveSettings,
    loadSettings
  };
};

export default useCalendarSettings;
