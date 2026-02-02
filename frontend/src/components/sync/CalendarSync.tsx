import React, { useState, useEffect } from 'react';
import { calendarApi } from '../../services/calendarApi';
import { LoadingScreen } from '../common';
import { useLoadingProgress } from '../../hooks/useLoadingProgress';
import { getAutomationRules } from '../../services/automationService';
import type { AutomationRuleDto } from '../../types/Automation';
import { clientLogger } from '../../utils/clientLogger';

interface CalendarSyncProps {
  themeColor: string;
}

interface ExternalCalendar {
  id: string;
  name: string;
  description?: string;
  primary?: boolean;
}

interface ProviderSyncStatus {
  provider: 'google' | 'microsoft';
  isConnected: boolean;
  calendars: ExternalCalendar[];
  syncedCalendars: Array<{
    localName: string;
    externalId: string;
    externalName: string;
    provider: string;
    lastSync: string;
    bidirectionalSync: boolean;
  }>;
}

interface SyncStatus {
  providers: ProviderSyncStatus[];
}

interface SyncThemeColors {
  primary: string;
  secondary: string;
  light: string;
  border: string;
  accent: string;
  hover: string;
  gradient: {
    header: string;
    today: string;
    selected: string;
    events: string;
    background: string;
  };
  text: {
    title: string;
  };
  button: string;
  focus: string;
  animatedGradient: {
    circle1: string;
    circle2: string;
    circle3: string;
  };
}

const CalendarSync: React.FC<CalendarSyncProps> = ({ themeColor }) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    providers: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCalendars, setSelectedCalendars] = useState<Record<string, string[]>>({});
  const [customCalendarNames, setCustomCalendarNames] = useState<Record<string, Record<string, string>>>({});
  const [triggerAutomation, setTriggerAutomation] = useState<Record<string, Record<string, boolean>>>({});
  const [selectedRules, setSelectedRules] = useState<Record<string, Record<string, number[]>>>({});
  const [automationRules, setAutomationRules] = useState<AutomationRuleDto[]>([]);
  const { loadingState, withProgress } = useLoadingProgress();

  // Helper function to get theme-based colors with gradients (matching Calendar component)
  const getThemeColors = (color: string): SyncThemeColors => {
    const colorMap: Record<string, SyncThemeColors> = {
      '#3b82f6': { // Blue
        primary: 'blue',
        secondary: 'indigo',
        light: 'blue-50',
        border: 'blue-200',
        accent: 'blue-400',
        hover: 'blue-600',
        gradient: {
          header: 'from-blue-500 to-indigo-500',
          today: 'from-blue-400 to-indigo-500',
          selected: 'from-indigo-500 to-purple-500',
          events: 'from-blue-100 to-indigo-100',
          background: 'from-blue-50 via-blue-100 to-blue-200'
        },
        text: {
          title: 'text-blue-900'
        },
        button: 'bg-blue-500 hover:bg-blue-600',
        focus: 'focus:ring-blue-500',
        animatedGradient: {
          circle1: 'from-blue-300 to-indigo-300',
          circle2: 'from-indigo-300 to-purple-300',
          circle3: 'from-purple-300 to-blue-300'
        }
      },
      '#8b5cf6': { // Purple
        primary: 'purple',
        secondary: 'violet',
        light: 'purple-50',
        border: 'purple-200',
        accent: 'purple-400',
        hover: 'purple-600',
        gradient: {
          header: 'from-purple-500 to-violet-500',
          today: 'from-purple-400 to-violet-500',
          selected: 'from-violet-500 to-purple-600',
          events: 'from-purple-100 to-violet-100',
          background: 'from-purple-50 via-purple-100 to-purple-200'
        },
        text: {
          title: 'text-purple-900'
        },
        button: 'bg-purple-500 hover:bg-purple-600',
        focus: 'focus:ring-purple-500',
        animatedGradient: {
          circle1: 'from-purple-300 to-violet-300',
          circle2: 'from-violet-300 to-indigo-300',
          circle3: 'from-indigo-300 to-purple-300'
        }
      },
      '#10b981': { // Green
        primary: 'green',
        secondary: 'emerald',
        light: 'green-50',
        border: 'green-200',
        accent: 'green-400',
        hover: 'green-600',
        gradient: {
          header: 'from-green-500 to-emerald-500',
          today: 'from-green-400 to-emerald-500',
          selected: 'from-emerald-500 to-green-600',
          events: 'from-green-100 to-emerald-100',
          background: 'from-green-50 via-green-100 to-green-200'
        },
        text: {
          title: 'text-green-900'
        },
        button: 'bg-green-500 hover:bg-green-600',
        focus: 'focus:ring-green-500',
        animatedGradient: {
          circle1: 'from-green-300 to-emerald-300',
          circle2: 'from-emerald-300 to-teal-300',
          circle3: 'from-teal-300 to-green-300'
        }
      },
      '#ef4444': { // Red
        primary: 'red',
        secondary: 'rose',
        light: 'red-50',
        border: 'red-200',
        accent: 'red-400',
        hover: 'red-600',
        gradient: {
          header: 'from-red-500 to-rose-500',
          today: 'from-red-400 to-rose-500',
          selected: 'from-rose-500 to-red-600',
          events: 'from-red-100 to-rose-100',
          background: 'from-red-50 via-red-100 to-red-200'
        },
        text: {
          title: 'text-red-900'
        },
        button: 'bg-red-500 hover:bg-red-600',
        focus: 'focus:ring-red-500',
        animatedGradient: {
          circle1: 'from-red-300 to-rose-300',
          circle2: 'from-rose-300 to-pink-300',
          circle3: 'from-pink-300 to-red-300'
        }
      },
      '#f59e0b': { // Orange
        primary: 'orange',
        secondary: 'amber',
        light: 'orange-50',
        border: 'orange-200',
        accent: 'orange-400',
        hover: 'orange-600',
        gradient: {
          header: 'from-orange-500 to-amber-500',
          today: 'from-orange-400 to-amber-500',
          selected: 'from-amber-500 to-orange-600',
          events: 'from-orange-100 to-amber-100',
          background: 'from-orange-50 via-orange-100 to-orange-200'
        },
        text: {
          title: 'text-orange-900'
        },
        button: 'bg-orange-500 hover:bg-orange-600',
        focus: 'focus:ring-orange-500',
        animatedGradient: {
          circle1: 'from-orange-300 to-amber-300',
          circle2: 'from-amber-300 to-yellow-300',
          circle3: 'from-yellow-300 to-orange-300'
        }
      },
      '#ec4899': { // Pink
        primary: 'pink',
        secondary: 'rose',
        light: 'pink-50',
        border: 'pink-200',
        accent: 'pink-400',
        hover: 'pink-600',
        gradient: {
          header: 'from-pink-500 to-rose-500',
          today: 'from-pink-400 to-rose-500',
          selected: 'from-rose-500 to-pink-600',
          events: 'from-pink-100 to-rose-100',
          background: 'from-pink-50 via-pink-100 to-pink-200'
        },
        text: {
          title: 'text-pink-900'
        },
        button: 'bg-pink-500 hover:bg-pink-600',
        focus: 'focus:ring-pink-500',
        animatedGradient: {
          circle1: 'from-pink-300 to-rose-300',
          circle2: 'from-rose-300 to-red-300',
          circle3: 'from-red-300 to-pink-300'
        }
      },
      '#6366f1': { // Indigo
        primary: 'indigo',
        secondary: 'blue',
        light: 'indigo-50',
        border: 'indigo-200',
        accent: 'indigo-400',
        hover: 'indigo-600',
        gradient: {
          header: 'from-indigo-500 to-blue-500',
          today: 'from-indigo-400 to-blue-500',
          selected: 'from-blue-500 to-indigo-600',
          events: 'from-indigo-100 to-blue-100',
          background: 'from-indigo-50 via-indigo-100 to-indigo-200'
        },
        text: {
          title: 'text-indigo-900'
        },
        button: 'bg-indigo-500 hover:bg-indigo-600',
        focus: 'focus:ring-indigo-500',
        animatedGradient: {
          circle1: 'from-indigo-300 to-blue-300',
          circle2: 'from-blue-300 to-sky-300',
          circle3: 'from-sky-300 to-indigo-300'
        }
      },
      '#14b8a6': { // Teal
        primary: 'teal',
        secondary: 'cyan',
        light: 'teal-50',
        border: 'teal-200',
        accent: 'teal-400',
        hover: 'teal-600',
        gradient: {
          header: 'from-teal-500 to-cyan-500',
          today: 'from-teal-400 to-cyan-500',
          selected: 'from-cyan-500 to-teal-600',
          events: 'from-teal-100 to-cyan-100',
          background: 'from-teal-50 via-teal-100 to-teal-200'
        },
        text: {
          title: 'text-teal-900'
        },
        button: 'bg-teal-500 hover:bg-teal-600',
        focus: 'focus:ring-teal-500',
        animatedGradient: {
          circle1: 'from-teal-300 to-cyan-300',
          circle2: 'from-cyan-300 to-sky-300',
          circle3: 'from-sky-300 to-teal-300'
        }
      },
      '#eab308': { // Yellow
        primary: 'yellow',
        secondary: 'amber',
        light: 'yellow-50',
        border: 'yellow-200',
        accent: 'yellow-400',
        hover: 'yellow-600',
        gradient: {
          header: 'from-yellow-500 to-amber-500',
          today: 'from-yellow-400 to-amber-500',
          selected: 'from-amber-500 to-yellow-600',
          events: 'from-yellow-100 to-amber-100',
          background: 'from-yellow-50 via-yellow-100 to-yellow-200'
        },
        text: {
          title: 'text-yellow-800'
        },
        button: 'bg-yellow-500 hover:bg-yellow-600',
        focus: 'focus:ring-yellow-500',
        animatedGradient: {
          circle1: 'from-yellow-300 to-amber-300',
          circle2: 'from-amber-300 to-orange-300',
          circle3: 'from-orange-300 to-yellow-300'
        }
      },
      '#64748b': { // Slate
        primary: 'slate',
        secondary: 'gray',
        light: 'slate-50',
        border: 'slate-200',
        accent: 'slate-400',
        hover: 'slate-600',
        gradient: {
          header: 'from-slate-500 to-gray-500',
          today: 'from-slate-400 to-gray-500',
          selected: 'from-gray-500 to-slate-600',
          events: 'from-slate-100 to-gray-100',
          background: 'from-slate-50 via-slate-100 to-slate-200'
        },
        text: {
          title: 'text-slate-800'
        },
        button: 'bg-slate-500 hover:bg-slate-600',
        focus: 'focus:ring-slate-500',
        animatedGradient: {
          circle1: 'from-slate-300 to-gray-300',
          circle2: 'from-gray-300 to-zinc-300',
          circle3: 'from-zinc-300 to-slate-300'
        }
      },
      '#22c55e': { // Emerald
        primary: 'emerald',
        secondary: 'green',
        light: 'emerald-50',
        border: 'emerald-200',
        accent: 'emerald-400',
        hover: 'emerald-600',
        gradient: {
          header: 'from-emerald-500 to-green-500',
          today: 'from-emerald-400 to-green-500',
          selected: 'from-green-500 to-emerald-600',
          events: 'from-emerald-100 to-green-100',
          background: 'from-emerald-50 via-emerald-100 to-emerald-200'
        },
        text: {
          title: 'text-emerald-800'
        },
        button: 'bg-emerald-500 hover:bg-emerald-600',
        focus: 'focus:ring-emerald-500',
        animatedGradient: {
          circle1: 'from-emerald-300 to-green-300',
          circle2: 'from-green-300 to-teal-300',
          circle3: 'from-teal-300 to-emerald-300'
        }
      },
      '#06b6d4': { // Cyan
        primary: 'cyan',
        secondary: 'sky',
        light: 'cyan-50',
        border: 'cyan-200',
        accent: 'cyan-400',
        hover: 'cyan-600',
        gradient: {
          header: 'from-cyan-500 to-sky-500',
          today: 'from-cyan-400 to-sky-500',
          selected: 'from-sky-500 to-cyan-600',
          events: 'from-cyan-100 to-sky-100',
          background: 'from-cyan-50 via-cyan-100 to-cyan-200'
        },
        text: {
          title: 'text-cyan-800'
        },
        button: 'bg-cyan-500 hover:bg-cyan-600',
        focus: 'focus:ring-cyan-500',
        animatedGradient: {
          circle1: 'from-cyan-300 to-sky-300',
          circle2: 'from-sky-300 to-blue-300',
          circle3: 'from-blue-300 to-cyan-300'
        }
      },
      '#65a30d': { // Lime
        primary: 'lime',
        secondary: 'yellow',
        light: 'lime-50',
        border: 'lime-200',
        accent: 'lime-400',
        hover: 'lime-600',
        gradient: {
          header: 'from-lime-500 to-yellow-500',
          today: 'from-lime-400 to-yellow-500',
          selected: 'from-yellow-500 to-lime-600',
          events: 'from-lime-100 to-yellow-100',
          background: 'from-lime-50 via-lime-100 to-lime-200'
        },
        text: {
          title: 'text-lime-800'
        },
        button: 'bg-lime-500 hover:bg-lime-600',
        focus: 'focus:ring-lime-500',
        animatedGradient: {
          circle1: 'from-lime-300 to-yellow-300',
          circle2: 'from-yellow-300 to-green-300',
          circle3: 'from-green-300 to-lime-300'
        }
      },
      '#f43f5e': { // Rose
        primary: 'rose',
        secondary: 'pink',
        light: 'rose-50',
        border: 'rose-200',
        accent: 'rose-400',
        hover: 'rose-600',
        gradient: {
          header: 'from-rose-500 to-pink-500',
          today: 'from-rose-400 to-pink-500',
          selected: 'from-pink-500 to-rose-600',
          events: 'from-rose-100 to-pink-100',
          background: 'from-rose-50 via-rose-100 to-rose-200'
        },
        text: {
          title: 'text-rose-800'
        },
        button: 'bg-rose-500 hover:bg-rose-600',
        focus: 'focus:ring-rose-500',
        animatedGradient: {
          circle1: 'from-rose-300 to-pink-300',
          circle2: 'from-pink-300 to-red-300',
          circle3: 'from-red-300 to-rose-300'
        }
      }
    };
    return colorMap[color] || colorMap['#3b82f6']; // Default to blue
  };

  const themeColors = getThemeColors(themeColor);

  // Simple theme gradient helper for consistency with other components
  const getSimpleThemeGradient = (color: string) => {
    const gradientMap: Record<string, string> = {
      '#ef4444': 'from-red-50 via-red-100 to-red-200',
      '#f59e0b': 'from-orange-50 via-orange-100 to-orange-200',
      '#eab308': 'from-yellow-50 via-yellow-100 to-yellow-200',
      '#10b981': 'from-green-50 via-green-100 to-green-200',
      '#3b82f6': 'from-blue-50 via-blue-100 to-blue-200',
      '#6366f1': 'from-indigo-50 via-indigo-100 to-indigo-200',
      '#8b5cf6': 'from-purple-50 via-purple-100 to-purple-200',
      '#ec4899': 'from-pink-50 via-pink-100 to-pink-200',
      '#14b8a6': 'from-teal-50 via-teal-100 to-teal-200',
      '#22c55e': 'from-emerald-50 via-emerald-100 to-emerald-200',
      '#06b6d4': 'from-cyan-50 via-cyan-100 to-cyan-200',
      '#64748b': 'from-slate-50 via-slate-100 to-slate-200'
    };
    return gradientMap[color] || gradientMap['#3b82f6'];
  };

  useEffect(() => {
    // Add meta tag for extension compatibility
    const metaTag = document.createElement('meta');
    metaTag.name = 'extension-compatibility';
    metaTag.content = 'allow-unsafe-inline';
    document.head.appendChild(metaTag);

    loadSyncStatus();
    loadAutomationRules();

    // Handle success/error URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');

    if (success === 'connected') {
      // Clear URL parameters to avoid issues with browser extensions
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);

      // Show success message
      setTimeout(() => {
        alert('Calendar connected successfully! Your events are now being synced.');
      }, 1000);
    } else if (error) {
      // Clear URL parameters to avoid issues with browser extensions
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);

      // Show error message
      const details = urlParams.get('details');
      const errorMessage = details ? `Calendar sync failed: ${decodeURIComponent(details)}` : 'Calendar sync failed. Please try again.';
      setTimeout(() => {
        alert(errorMessage);
      }, 1000);
    }

    // Suppress browser extension async response errors
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && typeof event.reason.message === 'string') {
        const message = event.reason.message.toLowerCase();
        if (message.includes('listener indicated an asynchronous response') ||
            message.includes('message channel closed before a response was received') ||
            message.includes('extension context invalidated') ||
            message.includes('chrome-extension:') ||
            message.includes('moz-extension:')) {
          // This is a browser extension error, suppress it
          event.preventDefault();
          clientLogger.debug('calendar-sync', 'suppressed browser extension rejection', {
            reason: event.reason.message,
          });
          return;
        }
      }
      // For other errors, log them for debugging
      clientLogger.warn('calendar-sync', 'unhandled promise rejection', event.reason);
    };

    // Suppress browser extension console errors
    const handleError = (event: ErrorEvent) => {
      if (event.error && event.error.message) {
        const message = event.error.message.toLowerCase();
        if (message.includes('extension context invalidated') ||
            message.includes('chrome-extension:') ||
            message.includes('moz-extension:') ||
            message.includes('listener indicated an asynchronous response')) {
          // Suppress browser extension errors
          event.preventDefault();
          clientLogger.debug('calendar-sync', 'suppressed browser extension console error', {
            reason: event.error.message,
          });
          return;
        }
      }
      // For other errors, let them through for debugging
      clientLogger.warn('calendar-sync', 'window console error', event.error);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);

      // Cleanup meta tag
      const existingMeta = document.querySelector('meta[name="extension-compatibility"]');
      if (existingMeta) {
        existingMeta.remove();
      }
    };
  }, []);

  const loadSyncStatus = async () => {
    try {
      setIsLoading(true);
      const status = await calendarApi.getCalendarSyncStatus();

      // Ensure we always have an array of providers
      if (!status.providers || !Array.isArray(status.providers)) {
        // Initialize with default providers if not present
        setSyncStatus({
          providers: [
            { provider: 'google', isConnected: false, calendars: [], syncedCalendars: [] },
            { provider: 'microsoft', isConnected: false, calendars: [], syncedCalendars: [] }
          ]
        });
      } else {
        setSyncStatus(status);
      }

      clientLogger.info('calendar-sync', 'sync status loaded', {
        providers: status.providers?.length ?? 0,
      });
    } catch (err) {
      clientLogger.warn('calendar-sync', 'failed to load sync status', err);
      // Initialize with default providers on error
      setSyncStatus({
        providers: [
          { provider: 'google', isConnected: false, calendars: [], syncedCalendars: [] },
          { provider: 'microsoft', isConnected: false, calendars: [], syncedCalendars: [] }
        ]
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAutomationRules = async () => {
    try {
      const rulesData = await getAutomationRules(1, 100, true); // Get first 100 enabled rules
      // Filter rules that would trigger on event creation/update
      const eventRules = rulesData.data.filter(rule =>
        rule.triggerType === 'event.created' ||
        rule.triggerType === 'event.updated' ||
        rule.triggerType === 'calendar.imported'
      );
      setAutomationRules(eventRules);
      clientLogger.debug('calendar-sync', 'automation rules loaded', {
        total: eventRules.length,
      });
    } catch (err) {
      clientLogger.warn('calendar-sync', 'failed to load automation rules', err);
      setAutomationRules([]);
    }
  };

  const handleProviderConnect = async (provider: 'google' | 'microsoft') => {
    try {
      setIsLoading(true);
      const authUrl = await calendarApi.getCalendarAuthUrl(provider);
      window.location.href = authUrl;
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to connect to provider');
      setIsLoading(false);
    }
  };

  const handleCalendarSelect = (provider: string, calendarId: string, isSelected: boolean) => {
    const currentSelected = selectedCalendars[provider] || [];
    const currentNames = customCalendarNames[provider] || {};

    if (isSelected) {
      setSelectedCalendars({
        ...selectedCalendars,
        [provider]: [...currentSelected, calendarId]
      });

      // Set default name
      const providerData = syncStatus.providers.find(p => p.provider === provider);
      const calendar = providerData?.calendars.find(c => c.id === calendarId);
      if (calendar) {
        setCustomCalendarNames({
          ...customCalendarNames,
          [provider]: {
            ...currentNames,
            [calendarId]: calendar.name
          }
        });
      }
    } else {
      setSelectedCalendars({
        ...selectedCalendars,
        [provider]: currentSelected.filter(id => id !== calendarId)
      });

      const newNames = { ...currentNames };
      delete newNames[calendarId];
      setCustomCalendarNames({
        ...customCalendarNames,
        [provider]: newNames
      });
    }
  };

  const handleCustomNameChange = (provider: string, calendarId: string, name: string) => {
    const currentNames = customCalendarNames[provider] || {};
    setCustomCalendarNames({
      ...customCalendarNames,
      [provider]: {
        ...currentNames,
        [calendarId]: name
      }
    });
  };

  const handleSyncCalendars = async (provider: string) => {
    try {
      const providerSelectedCalendars = selectedCalendars[provider] || [];
      const providerCustomNames = customCalendarNames[provider] || {};
      const providerTriggerAutomation = triggerAutomation[provider] || {};
      const providerSelectedRules = selectedRules[provider] || {};
      const providerData = syncStatus.providers.find(p => p.provider === provider);

      if (providerSelectedCalendars.length === 0) {
        alert('Please select at least one calendar to sync.');
        return;
      }

      await withProgress(async (updateProgress) => {
        updateProgress(10, 'Preparing calendar sync...');

        updateProgress(30, `Syncing ${providerSelectedCalendars.length} calendars with ${provider}...`);

        await calendarApi.syncCalendars({
          provider: provider as 'google' | 'microsoft',
          calendars: providerSelectedCalendars.map(id => ({
            externalId: id,
            localName: providerCustomNames[id] || providerData?.calendars.find(c => c.id === id)?.name || 'Synced Calendar',
            triggerAutomationRules: providerTriggerAutomation[id] || false,
            selectedRuleIds: providerSelectedRules[id] || []
          }))
        });

        updateProgress(70, 'Refreshing sync status...');
        await loadSyncStatus();

        updateProgress(90, 'Clearing selections...');
        // Clear selections for this provider
        setSelectedCalendars({
          ...selectedCalendars,
          [provider]: []
        });
        setCustomCalendarNames({
          ...customCalendarNames,
          [provider]: {}
        });
        setTriggerAutomation({
          ...triggerAutomation,
          [provider]: {}
        });
        setSelectedRules({
          ...selectedRules,
          [provider]: {}
        });
      }, `Syncing ${providerSelectedCalendars.length} calendars...`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to sync calendars');
    }
  };

  const handleDisconnect = async (provider: string) => {
    try {
      await withProgress(async (updateProgress) => {
        updateProgress(20, `Disconnecting from ${provider}...`);
        await calendarApi.disconnectCalendarProvider(provider as 'google' | 'microsoft');

        updateProgress(80, 'Refreshing sync status...');
        await loadSyncStatus();
      }, `Disconnecting ${provider}...`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to disconnect');
    }
  };

  const handleForcSync = async () => {
    try {
      await withProgress(async (updateProgress) => {
        updateProgress(20, 'Initializing force sync...');
        await calendarApi.forceCalendarSync();

        updateProgress(80, 'Refreshing sync status...');
        await loadSyncStatus();
      }, 'Force syncing calendars...');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to sync');
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${getSimpleThemeGradient(themeColor)} flex justify-center items-center`}>
        <div className="text-xl text-gray-600">Loading calendar sync...</div>
      </div>
    );
  }

  return (
    <>
      {loadingState.isLoading && (
        <LoadingScreen
          progress={loadingState.progress}
          message={loadingState.message}
          themeColor={themeColor}
          overlay={true}
        />
      )}
      <div className={`min-h-screen bg-gradient-to-br ${getSimpleThemeGradient(themeColor)}`}>
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r ${themeColors.animatedGradient?.circle1 || 'from-blue-300 to-indigo-300'} rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse`}></div>
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r ${themeColors.animatedGradient?.circle2 || 'from-indigo-300 to-purple-300'} rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000`}></div>
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-to-r ${themeColors.animatedGradient?.circle3 || 'from-purple-300 to-blue-300'} rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000`}></div>
      </div>

      {/* Header */}
      <header className={`relative z-10 backdrop-blur-sm bg-white/60 border-b border-${themeColors.border} text-gray-800 py-6`}>
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className={`text-3xl font-semibold ${themeColors.text.title}`}>
              🔄 Calendar Sync
            </h1>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto p-6 mt-12">

        <div className="space-y-8">
          {/* Provider Cards */}
          {syncStatus.providers.map((provider) => (
            <div key={provider.provider} className="backdrop-blur-md bg-white/70 border border-blue-200 rounded-3xl shadow-xl hover:bg-white/80 transition-all duration-300">
              {/* Provider Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 ${provider.provider === 'google' ? 'bg-blue-500' : 'bg-blue-600'} rounded-full flex items-center justify-center`}>
                      <span className="text-white text-xl">{provider.provider === 'google' ? '📧' : '🏢'}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {provider.provider === 'google' ? 'Google Calendar' : 'Microsoft Outlook'}
                      </h3>
                      <p className={`text-sm ${provider.isConnected ? 'text-green-600' : 'text-gray-600'}`}>
                        {provider.isConnected ? '✅ Connected' : '❌ Not connected'}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    {provider.isConnected ? (
                      <>
                        <button
                          onClick={handleForcSync}
                          className={`px-4 py-2 ${themeColors.button} text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-md`}
                        >
                          🔄 Force Sync
                        </button>
                        <button
                          onClick={() => handleDisconnect(provider.provider)}
                          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-md"
                        >
                          🔌 Disconnect
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleProviderConnect(provider.provider)}
                        className={`px-4 py-2 ${provider.provider === 'google' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-md`}
                      >
                        Connect {provider.provider === 'google' ? 'Google' : 'Microsoft'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Provider Content */}
              {provider.isConnected && (
                <div className="p-6 space-y-6">
                  {/* Available Calendars */}
                  {provider.calendars.length > 0 && (
                    <div>
                      <h4 className={`text-lg font-semibold ${themeColors.text.title} mb-4`}>Available Calendars</h4>
                      <div className="space-y-3">
                        {provider.calendars.map((calendar) => {
                          const providerSelectedCalendars = selectedCalendars[provider.provider] || [];
                          const providerCustomNames = customCalendarNames[provider.provider] || {};
                          return (
                            <div key={calendar.id} className={`border rounded-xl p-4 ${providerSelectedCalendars.includes(calendar.id) ? `bg-${themeColors.light} border-${themeColors.border} border-2` : 'border-gray-200'}`}>
                              <div className="flex items-start space-x-4">
                                <input
                                  type="checkbox"
                                  checked={providerSelectedCalendars.includes(calendar.id)}
                                  onChange={(e) => handleCalendarSelect(provider.provider, calendar.id, e.target.checked)}
                                  className="mt-1"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <h5 className="font-medium text-gray-800">{calendar.name}</h5>
                                    {calendar.primary && (
                                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Primary</span>
                                    )}
                                  </div>
                                  {calendar.description && (
                                    <p className="text-gray-600 text-sm mt-1">{calendar.description}</p>
                                  )}
                                  {providerSelectedCalendars.includes(calendar.id) && (
                                    <div className="mt-3 space-y-3">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Local Calendar Name:
                                        </label>
                                        <input
                                          type="text"
                                          value={providerCustomNames[calendar.id] || calendar.name}
                                          onChange={(e) => handleCustomNameChange(provider.provider, calendar.id, e.target.value)}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                          placeholder="Enter custom name for this calendar"
                                        />
                                      </div>
                                      <div className="border-t pt-3">
                                        <div className="flex items-center space-x-2 mb-2">
                                          <input
                                            type="checkbox"
                                            id={`automation-${provider.provider}-${calendar.id}`}
                                            checked={(triggerAutomation[provider.provider]?.[calendar.id]) || false}
                                            onChange={(e) => {
                                              setTriggerAutomation({
                                                ...triggerAutomation,
                                                [provider.provider]: {
                                                  ...(triggerAutomation[provider.provider] || {}),
                                                  [calendar.id]: e.target.checked
                                                }
                                              });
                                            }}
                                            className="rounded"
                                          />
                                          <label htmlFor={`automation-${provider.provider}-${calendar.id}`} className="text-sm font-medium text-gray-700">
                                            🤖 Trigger automation rules on imported events
                                          </label>
                                        </div>
                                        {(triggerAutomation[provider.provider]?.[calendar.id]) && automationRules.length > 0 && (
                                          <div className="ml-6 mt-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                              Select Rules (optional - all enabled if none selected):
                                            </label>
                                            <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-1">
                                              {automationRules.map(rule => {
                                                const triggerLabel = rule.triggerType === 'event.created' ? '📝 Created' :
                                                                   rule.triggerType === 'event.updated' ? '✏️ Updated' :
                                                                   rule.triggerType === 'calendar.imported' ? '📥 Imported' : rule.triggerType;
                                                return (
                                                  <label key={rule.id} className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded">
                                                    <input
                                                      type="checkbox"
                                                      checked={(selectedRules[provider.provider]?.[calendar.id] || []).includes(rule.id)}
                                                      onChange={(e) => {
                                                        const currentRules = selectedRules[provider.provider]?.[calendar.id] || [];
                                                        const newRules = e.target.checked
                                                          ? [...currentRules, rule.id]
                                                          : currentRules.filter(id => id !== rule.id);
                                                        setSelectedRules({
                                                          ...selectedRules,
                                                          [provider.provider]: {
                                                            ...(selectedRules[provider.provider] || {}),
                                                            [calendar.id]: newRules
                                                          }
                                                        });
                                                      }}
                                                      className="rounded"
                                                    />
                                                    <span className="text-sm text-gray-700">{rule.name}</span>
                                                    <span className="text-xs text-gray-500">({triggerLabel})</span>
                                                  </label>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        )}
                                        {(triggerAutomation[provider.provider]?.[calendar.id]) && automationRules.length === 0 && (
                                          <p className="ml-6 mt-2 text-sm text-gray-500 italic">
                                            No automation rules found. Create rules with event.created, event.updated, or calendar.imported triggers in the Automation panel.
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {(selectedCalendars[provider.provider]?.length > 0) && (
                        <div className="mt-6">
                          <button
                            onClick={() => handleSyncCalendars(provider.provider)}
                            className={`px-6 py-3 ${themeColors.button} text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg`}
                          >
                            🔄 Sync Selected Calendars ({selectedCalendars[provider.provider].length})
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Synced Calendars */}
                  {provider.syncedCalendars.length > 0 && (
                    <div>
                      <h4 className={`text-lg font-semibold ${themeColors.text.title} mb-4`}>Synced Calendars</h4>
                      <div className="space-y-3">
                        {provider.syncedCalendars.map((syncedCal, index) => (
                          <div key={index} className={`bg-${themeColors.light} border border-${themeColors.border} rounded-xl p-4`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-medium text-gray-800">{syncedCal.localName}</h5>
                                <p className="text-gray-600 text-sm">
                                  Synced from: {syncedCal.externalName}
                                </p>
                                <p className="text-gray-500 text-xs">
                                  Last sync: {new Date(syncedCal.lastSync).toLocaleString()}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                  ✅ Active
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No data states */}
                  {provider.calendars.length === 0 && provider.syncedCalendars.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-600">No calendars available for this provider.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Not connected state */}
              {!provider.isConnected && (
                <div className="p-6 text-center">
                  <p className="text-gray-600 mb-4">
                    Connect your {provider.provider === 'google' ? 'Google Calendar' : 'Microsoft Outlook'} to sync your events.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
      </div>
    </>
  );
};

export default CalendarSync;
