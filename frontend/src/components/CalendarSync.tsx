import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

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

const CalendarSync: React.FC<CalendarSyncProps> = ({ themeColor }) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    providers: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);
  const [customCalendarNames, setCustomCalendarNames] = useState<Record<string, string>>({});

  // Helper function to get theme-based colors with gradients (matching Calendar component)
  const getThemeColors = (color: string) => {
    const colorMap: Record<string, any> = {
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
      }
    };
    return colorMap[color] || colorMap['#3b82f6']; // Default to blue
  };

  const themeColors = getThemeColors(themeColor);

  useEffect(() => {
    loadSyncStatus();
  }, []);

  const loadSyncStatus = async () => {
    try {
      setIsLoading(true);
      const status = await apiService.getCalendarSyncStatus();

      // Convert new multi-provider format to old single-provider format for compatibility
      let convertedStatus;
      if (status.providers && Array.isArray(status.providers)) {
        // For now, use the first connected provider or show not connected
        const connectedProvider = status.providers.find(p => p.isConnected);
        if (connectedProvider) {
          convertedStatus = {
            isConnected: true,
            provider: connectedProvider.provider,
            calendars: connectedProvider.calendars,
            syncedCalendars: connectedProvider.syncedCalendars
          };
        } else {
          // No providers connected, pick the first one for UI purposes
          const firstProvider = status.providers[0];
          convertedStatus = {
            isConnected: false,
            provider: firstProvider ? firstProvider.provider : null,
            calendars: firstProvider ? firstProvider.calendars : [],
            syncedCalendars: []
          };
        }
      } else {
        // Old format, use as-is
        convertedStatus = status;
      }

      setSyncStatus(convertedStatus);
      console.log('Sync status loaded:', convertedStatus);
    } catch (err) {
      console.warn('Could not load sync status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProviderConnect = async (provider: 'google' | 'microsoft') => {
    try {
      setIsLoading(true);
      const authUrl = await apiService.getCalendarAuthUrl(provider);
      window.location.href = authUrl;
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to connect to provider');
      setIsLoading(false);
    }
  };

  const handleCalendarSelect = (calendarId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedCalendars([...selectedCalendars, calendarId]);
      // Set default name
      const calendar = syncStatus.calendars.find(c => c.id === calendarId);
      if (calendar) {
        setCustomCalendarNames({
          ...customCalendarNames,
          [calendarId]: calendar.name
        });
      }
    } else {
      setSelectedCalendars(selectedCalendars.filter(id => id !== calendarId));
      const newNames = { ...customCalendarNames };
      delete newNames[calendarId];
      setCustomCalendarNames(newNames);
    }
  };

  const handleCustomNameChange = (calendarId: string, name: string) => {
    setCustomCalendarNames({
      ...customCalendarNames,
      [calendarId]: name
    });
  };

  const handleSyncCalendars = async () => {
    try {
      setIsLoading(true);
      await apiService.syncCalendars({
        provider: syncStatus.provider!,
        calendars: selectedCalendars.map(id => ({
          externalId: id,
          localName: customCalendarNames[id] || syncStatus.calendars.find(c => c.id === id)?.name || 'Synced Calendar'
        }))
      });
      await loadSyncStatus();
      setSelectedCalendars([]);
      setCustomCalendarNames({});
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to sync calendars');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      await apiService.disconnectCalendarProvider();
      setSyncStatus({
        isConnected: false,
        provider: null,
        calendars: [],
        syncedCalendars: []
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to disconnect');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForcSync = async () => {
    try {
      setIsLoading(true);
      await apiService.forceCalendarSync();
      await loadSyncStatus();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to sync');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${themeColors.gradient.background} flex justify-center items-center`}>
        <div className="text-xl text-gray-600">Loading calendar sync...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${themeColors.gradient.background}`}>
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

      <main className="relative z-10 max-w-4xl mx-auto p-6 mt-12">{/* Main Content Container */}

        {!syncStatus.isConnected ? (
          /* Provider Selection */
          <div className="backdrop-blur-md bg-white/70 border border-blue-200 rounded-3xl shadow-xl p-8 hover:bg-white/80 transition-all duration-300">
            <h2 className={`text-2xl font-semibold ${themeColors.text.title} mb-6`}>Connect Calendar Provider</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Google Option */}
              <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 transition-all duration-300">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xl">📧</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Google Calendar</h3>
                    <p className="text-gray-600 text-sm">Sync with your Google Calendar events</p>
                  </div>
                </div>
                <button
                  onClick={() => handleProviderConnect('google')}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-md"
                >
                  Connect Google Calendar
                </button>
              </div>

              {/* Microsoft Option */}
              <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 transition-all duration-300">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xl">🏢</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Microsoft Outlook</h3>
                    <p className="text-gray-600 text-sm">Sync with your Microsoft Outlook calendar</p>
                  </div>
                </div>
                <button
                  onClick={() => handleProviderConnect('microsoft')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-md"
                >
                  Connect Microsoft Outlook
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Connected State */
          <div className="space-y-8">
            {/* Connection Status */}
            <div className="backdrop-blur-md bg-white/70 border border-blue-200 rounded-3xl shadow-xl p-6 hover:bg-white/80 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 ${syncStatus.provider === 'google' ? 'bg-blue-500' : 'bg-blue-600'} rounded-full flex items-center justify-center`}>
                    <span className="text-white text-xl">{syncStatus.provider === 'google' ? '📧' : '🏢'}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Connected to {syncStatus.provider === 'google' ? 'Google Calendar' : 'Microsoft Outlook'}
                    </h3>
                    <p className="text-green-600 text-sm">✅ Active connection</p>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleForcSync}
                    className={`px-4 py-2 ${themeColors.button} text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-md`}
                  >
                    🔄 Force Sync
                  </button>
                  <button
                    onClick={handleDisconnect}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-md"
                  >
                    🔌 Disconnect
                  </button>
                </div>
              </div>
            </div>

            {/* Available Calendars */}
            {syncStatus.calendars.length > 0 && (
              <div className="backdrop-blur-md bg-white/70 border border-blue-200 rounded-3xl shadow-xl p-6 hover:bg-white/80 transition-all duration-300">
                <h3 className={`text-xl font-semibold ${themeColors.text.title} mb-4`}>Available Calendars</h3>
                <div className="space-y-4">
                  {syncStatus.calendars.map((calendar) => (
                    <div key={calendar.id} className={`border rounded-xl p-4 ${selectedCalendars.includes(calendar.id) ? `bg-${themeColors.light} border-${themeColors.border} border-2` : 'border-gray-200'}`}>
                      <div className="flex items-start space-x-4">
                        <input
                          type="checkbox"
                          checked={selectedCalendars.includes(calendar.id)}
                          onChange={(e) => handleCalendarSelect(calendar.id, e.target.checked)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-800">{calendar.name}</h4>
                            {calendar.primary && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Primary</span>
                            )}
                          </div>
                          {calendar.description && (
                            <p className="text-gray-600 text-sm mt-1">{calendar.description}</p>
                          )}
                          {selectedCalendars.includes(calendar.id) && (
                            <div className="mt-3">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Local Calendar Name:
                              </label>
                              <input
                                type="text"
                                value={customCalendarNames[calendar.id] || calendar.name}
                                onChange={(e) => handleCustomNameChange(calendar.id, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter custom name for this calendar"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedCalendars.length > 0 && (
                  <div className="mt-6">
                    <button
                      onClick={handleSyncCalendars}
                      className={`px-6 py-3 ${themeColors.button} text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg`}
                    >
                      🔄 Sync Selected Calendars ({selectedCalendars.length})
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Synced Calendars */}
            {syncStatus.syncedCalendars.length > 0 && (
              <div className="backdrop-blur-md bg-white/70 border border-blue-200 rounded-3xl shadow-xl p-6 hover:bg-white/80 transition-all duration-300">
                <h3 className={`text-xl font-semibold ${themeColors.text.title} mb-4`}>Synced Calendars</h3>
                <div className="space-y-4">
                  {syncStatus.syncedCalendars.map((syncedCal, index) => (
                    <div key={index} className={`bg-${themeColors.light} border border-${themeColors.border} rounded-xl p-4`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-800">{syncedCal.localName}</h4>
                          <p className="text-gray-600 text-sm">
                            Synced from: {syncedCal.externalName} ({syncedCal.provider})
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
          </div>
        )}
      </main>
    </div>
  );
};

export default CalendarSync;