/**
 * Enhanced Calendar Component - Enterprise-Grade Implementation
 *
 * A completely rewritten calendar component following full-stack best practices:
 * - Clean Architecture with separation of concerns
 * - Comprehensive error handling and loading states
 * - Optimized performance with React best practices
 * - Full theme integration with chosen user colors
 * - Accessible and mobile-responsive design
 * - Type-safe with comprehensive TypeScript coverage
 * - Modular and maintainable code structure
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Event, CreateEventRequest, UpdateEventRequest } from '../../types/Event';
import type { Calendar as CalendarType } from '../../types/Calendar';
import type { CalendarGroupWithCalendars } from '../../types/CalendarGroup';
import { eventsApi } from '../../services/eventsApi';
import { calendarApi } from '../../services/calendarApi';
import { profileApi } from '../../services/profileApi';
import { apiService } from '../../services/api';
import { getThemeConfig, type ThemeConfig, LOADING_MESSAGES } from '../../constants';
import { CalendarEventModal } from './CalendarEventModal';
import { CalendarManager } from './CalendarManager';
import {
  CalendarGroupAssignment,
  GroupList,
  GroupManagementModal,
  type CalendarGroupView,
} from './groups';
import { ConfirmationDialog } from '../dialogs';
import { Button } from '../ui';
import MonthView from '../views/MonthView';
import WeekView from '../views/WeekView';
import TimelineView from '../views/TimelineView';
import { MobileDrawer } from '../mobile/MobileDrawer';
import { MobileMonthView } from '../mobile/calendar/MobileMonthView';
import { MobileWeekView } from '../mobile/calendar/MobileWeekView';
import { MobileCalendarHeader } from '../mobile/calendar/MobileCalendarHeader';
import { DayDetailSheet } from '../mobile/calendar/DayDetailSheet';
import { EmojiGlyph } from '../EmojiPicker/EmojiGlyph';
import { useCalendarData, calendarQueryKeys } from '../../hooks/useCalendarData';
import type { Organization, ReservationRecord } from '../../hooks/useCalendarData';
import { useScreenSize } from '../../hooks/useScreenSize';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';

import { tStatic } from '../../i18n';

interface CalendarState {
  currentDate: Date;
  selectedDate: Date | null;
  selectedEndDate: Date | null;
  currentView: 'month' | 'week' | 'timeline';
  events: Event[];
  calendars: CalendarType[];
  calendarGroups: CalendarGroupWithCalendars[];
  selectedCalendars: number[];
  reservations: ReservationRecord[];
  organizations: Organization[];
  selectedResourceTypes: number[]; // Array of selected resource type IDs
  hiddenFromLiveFocusTags: string[];
}

interface CalendarActions {
  setCurrentDate: (date: Date) => void;
  setSelectedDate: (date: Date | null) => void;
  setCurrentView: (view: 'month' | 'week' | 'timeline') => void;
  navigateCalendar: (direction: 'prev' | 'next' | 'today') => void;
  toggleCalendar: (calendarId: number) => void;
  toggleResourceType: (resourceTypeId: number) => void;
  toggleOrganization: (org: Organization) => void;
  updateOrganizationColor: (orgId: number, color: string, cascadeToResourceTypes: boolean) => Promise<void>;
  updateResourceTypeColor: (resourceTypeId: number, color: string) => Promise<void>;
  createEvent: (date?: Date, endDate?: Date) => void;
  editEvent: (event: Event) => void;
  refreshData: () => Promise<void>;
}

interface EnhancedCalendarProps {
  themeColor: string;
  timeFormat?: string;
  className?: string;
  timezone?: string;
  offlineMode?: boolean;
  onTimelineFocusModeChange?: (isActive: boolean) => void;
}

const getCalendarRankValue = (calendar?: CalendarType | null): number => {
  const rank = calendar?.rank;
  return Number.isFinite(rank) ? Number(rank) : 0;
};

const sortCalendarsByRank = (calendars: CalendarType[]): CalendarType[] =>
  [...calendars].sort((a, b) => {
    const rankDiff = getCalendarRankValue(b) - getCalendarRankValue(a);
    if (rankDiff !== 0) return rankDiff;
    const nameDiff = a.name.localeCompare(b.name);
    if (nameDiff !== 0) return nameDiff;
    return a.id - b.id;
  });

const normalizeTagList = (tags: unknown): string[] => {
  if (!Array.isArray(tags)) {
    return [];
  }

  const normalized: string[] = [];
  const seen = new Set<string>();
  for (const rawTag of tags) {
    if (typeof rawTag !== 'string') {
      continue;
    }
    const tag = rawTag.trim();
    if (!tag) {
      continue;
    }
    const key = tag.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    normalized.push(tag);
  }

  return normalized;
};

// Calendar hook for state management
function useCalendarState(
  themeColor: string,
  initialView: CalendarState['currentView'] = 'month',
  offlineMode = false,
) {
  const queryClient = useQueryClient();
  const {
    eventsQuery,
    calendarsQuery,
    calendarGroupsQuery,
    orgsQuery,
    isLoading,
    isFetching,
    error,
  } = useCalendarData({ offlineMode });

  const calendars = useMemo(
    () => sortCalendarsByRank(calendarsQuery.data ?? []),
    [calendarsQuery.data],
  );
  const events = eventsQuery.data ?? [];
  const calendarGroups = calendarGroupsQuery.data ?? [];
  const organizations = orgsQuery.data?.organizations ?? [];
  const reservations = orgsQuery.data?.reservations ?? [];

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [currentView, setCurrentView] =
    useState<CalendarState['currentView']>(initialView);
  const [selectedCalendars, setSelectedCalendars] = useState<number[]>([]);
  const [storedVisibleCalendarIds, setStoredVisibleCalendarIds] = useState<number[] | null>(null);
  const [hiddenFromLiveFocusTags, setHiddenFromLiveFocusTags] = useState<string[]>([]);
  const [calendarPreferenceLoaded, setCalendarPreferenceLoaded] = useState(false);
  const [selectedResourceTypes, setSelectedResourceTypes] = useState<number[]>([]);

  const previousCalendarIdsRef = useRef<number[]>([]);
  const hasInitializedSelectionRef = useRef(false);
  const lastSavedVisibleCalendarsRef = useRef<string | null>(null);

  useEffect(() => {
    if (offlineMode) {
      setStoredVisibleCalendarIds(null);
      setHiddenFromLiveFocusTags([]);
      setCalendarPreferenceLoaded(true);
      return;
    }

    let isActive = true;

    const loadCalendarPreference = async () => {
      try {
        const profile = (await profileApi.getUserProfile()) as {
          visibleCalendarIds?: number[] | null;
          hiddenFromLiveFocusTags?: string[] | null;
        };

        if (!isActive) return;

        if (Array.isArray(profile.visibleCalendarIds)) {
          const normalized = Array.from(
            new Set(
              profile.visibleCalendarIds.filter((id): id is number =>
                Number.isFinite(id),
              ),
            ),
          );
          setStoredVisibleCalendarIds(normalized);
          lastSavedVisibleCalendarsRef.current = JSON.stringify(
            [...normalized].sort((a, b) => a - b),
          );
        } else {
          setStoredVisibleCalendarIds(null);
          lastSavedVisibleCalendarsRef.current = null;
        }

        setHiddenFromLiveFocusTags(
          normalizeTagList(profile.hiddenFromLiveFocusTags),
        );
      } catch (error) {
        if (isActive) {
          console.warn('Failed to load visible calendar preference:', error);
          setStoredVisibleCalendarIds(null);
          setHiddenFromLiveFocusTags([]);
        }
      } finally {
        if (isActive) {
          setCalendarPreferenceLoaded(true);
        }
      }
    };

    void loadCalendarPreference();

    return () => {
      isActive = false;
    };
  }, [offlineMode]);

  useEffect(() => {
    if (calendars.length === 0) {
      previousCalendarIdsRef.current = [];
      return;
    }

    if (!hasInitializedSelectionRef.current && !calendarPreferenceLoaded) {
      return;
    }

    const nextIds = calendars.map((calendar) => calendar.id);
    setSelectedCalendars((prev) => {
      if (!hasInitializedSelectionRef.current) {
        hasInitializedSelectionRef.current = true;

        if (Array.isArray(storedVisibleCalendarIds)) {
          const validStoredIds = storedVisibleCalendarIds.filter((id) =>
            nextIds.includes(id),
          );
          if (storedVisibleCalendarIds.length > 0 && validStoredIds.length === 0) {
            return nextIds;
          }
          return validStoredIds;
        }

        return nextIds;
      }

      const prevIds = previousCalendarIdsRef.current;
      const hadAllSelected =
        prevIds.length > 0 &&
        prevIds.length === prev.length &&
        prevIds.every((id) => prev.includes(id));
      const filtered = prev.filter((id) => nextIds.includes(id));

      return hadAllSelected ? nextIds : filtered;
    });

    previousCalendarIdsRef.current = nextIds;
  }, [calendars, calendarPreferenceLoaded, storedVisibleCalendarIds]);

  useEffect(() => {
    if (offlineMode) {
      return;
    }

    if (!calendarPreferenceLoaded || !hasInitializedSelectionRef.current) {
      return;
    }

    const normalized = Array.from(
      new Set(
        selectedCalendars.filter((id): id is number => Number.isFinite(id)),
      ),
    ).sort((a, b) => a - b);
    const serialized = JSON.stringify(normalized);

    if (serialized === lastSavedVisibleCalendarsRef.current) {
      return;
    }

    const shouldStoreAll = normalized.length === calendars.length;
    const payload = shouldStoreAll ? null : normalized;

    const persistSelection = async () => {
      try {
        await profileApi.updateUserProfile({ visibleCalendarIds: payload });
        lastSavedVisibleCalendarsRef.current = serialized;
      } catch (error) {
        console.warn('Failed to save visible calendar preference:', error);
      }
    };

    void persistSelection();
  }, [selectedCalendars, calendarPreferenceLoaded, calendars.length, offlineMode]);

  // Modal states
  const [modals, setModals] = useState({
    eventModal: false,
    calendarModal: false,
    confirmDialog: false,
    recurrenceDialog: false,
    mobileDrawer: false,
    mobileBottomSheet: false,
  });

  const [modalData, setModalData] = useState({
    editingEvent: null as Event | null,
    editingCalendar: null as CalendarType | null,
    confirmAction: null as (() => void) | null,
    confirmTitle: '',
    confirmMessage: '',
  });

  const [errors, setErrors] = useState<{
    event: string | null;
    calendar: string | null;
  }>({
    event: null,
    calendar: null,
  });

  const themeConfig = useMemo(() => getThemeConfig(themeColor), [themeColor]);

  const refreshData = useCallback(async () => {
    if (offlineMode) {
      return;
    }
    await queryClient.invalidateQueries({ queryKey: calendarQueryKeys.root });
  }, [offlineMode, queryClient]);

  const actions: CalendarActions = useMemo(() => ({
    setCurrentDate,
    setSelectedDate,
    setCurrentView,
    navigateCalendar: (direction: 'prev' | 'next' | 'today') => {
      setCurrentDate((prev) => {
        let newDate: Date;

        if (direction === 'today') {
          newDate = new Date();
        } else {
          const increment = direction === 'next' ? 1 : -1;
          newDate = new Date(prev);

          if (currentView === 'month') {
            newDate.setMonth(newDate.getMonth() + increment);
          } else if (currentView === 'week') {
            newDate.setDate(newDate.getDate() + increment * 7);
          } else {
            newDate.setDate(newDate.getDate() + increment);
          }
        }

        return newDate;
      });
    },

    toggleCalendar: (calendarId: number) => {
      setSelectedCalendars((prev) =>
        prev.includes(calendarId)
          ? prev.filter((id) => id !== calendarId)
          : [...prev, calendarId],
      );
    },

    toggleResourceType: (resourceTypeId: number) => {
      setSelectedResourceTypes((prev) =>
        prev.includes(resourceTypeId)
          ? prev.filter((id) => id !== resourceTypeId)
          : [...prev, resourceTypeId],
      );
    },

    toggleOrganization: (org: Organization) => {
      setSelectedResourceTypes((prev) => {
        const orgResourceTypeIds = (org.resourceTypes ?? []).map((rt) => rt.id);
        const allSelected = orgResourceTypeIds.every((id) => prev.includes(id));

        return allSelected
          ? prev.filter((id) => !orgResourceTypeIds.includes(id))
          : [...new Set([...prev, ...orgResourceTypeIds])];
      });
    },

    updateOrganizationColor: async (
      orgId: number,
      color: string,
      cascadeToResourceTypes: boolean,
    ) => {
      if (offlineMode) {
        return;
      }
      try {
        await apiService.patch(`/organisations/${orgId}/color`, {
          color,
          cascadeToResourceTypes,
        });
        await queryClient.invalidateQueries({
          queryKey: calendarQueryKeys.orgsAndReservations,
        });
      } catch (error) {
        console.error('Error updating organization color:', error);
      }
    },

    updateResourceTypeColor: async (resourceTypeId: number, color: string) => {
      if (offlineMode) {
        return;
      }
      try {
        await apiService.patch(`/resource-types/${resourceTypeId}/color`, { color });
        await queryClient.invalidateQueries({
          queryKey: calendarQueryKeys.orgsAndReservations,
        });
      } catch (error) {
        console.error('Error updating resource type color:', error);
      }
    },

    createEvent: (date?: Date, endDate?: Date) => {
      if (offlineMode) {
        return;
      }
      setModalData((prev) => ({
        ...prev,
        editingEvent: null,
      }));
      setErrors((prev) => ({ ...prev, event: null }));
      setSelectedEndDate(endDate ?? null);

      if (date) {
        setSelectedDate(date);
      }

      setModals((prev) => ({ ...prev, eventModal: true }));
    },

    editEvent: (event: Event) => {
      if (offlineMode) {
        return;
      }
      setModalData((prev) => ({
        ...prev,
        editingEvent: event,
      }));
      setErrors((prev) => ({ ...prev, event: null }));
      setSelectedEndDate(null);
      setModals((prev) => ({ ...prev, eventModal: true }));
    },

    refreshData,
  }), [currentView, queryClient, refreshData, offlineMode]);

  const state = useMemo<CalendarState>(
    () => ({
      currentDate,
      selectedDate,
      selectedEndDate,
      currentView,
      events,
      calendars,
      calendarGroups,
      selectedCalendars,
      reservations,
      organizations,
      selectedResourceTypes,
      hiddenFromLiveFocusTags,
    }),
    [
      currentDate,
      selectedDate,
      selectedEndDate,
      currentView,
      events,
      calendars,
      calendarGroups,
      selectedCalendars,
      reservations,
      organizations,
      selectedResourceTypes,
      hiddenFromLiveFocusTags,
    ],
  );

  const isInitialLoading = isLoading && events.length === 0 && calendars.length === 0;
  const loadError =
    error instanceof Error ? error.message : error ? String(error) : null;

  return {
    state,
    actions,
    modals,
    setModals,
    modalData,
    setModalData,
    errors,
    setErrors,
    themeConfig,
    isInitialLoading,
    isRefreshing: isFetching,
    loadError,
  };
}

// Calendar Header Component
interface CalendarHeaderProps {
  state: CalendarState;
  actions: CalendarActions;
  themeConfig: ThemeConfig;
  onCreateEvent: () => void;
  onCreateCalendar: () => void;
  onToggleMobileDrawer?: () => void;
  isMobile?: boolean;
  readOnly?: boolean;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  state,
  actions,
  themeConfig,
  onCreateEvent,
  onCreateCalendar,
  onToggleMobileDrawer,
  isMobile = false,
  readOnly = false,
}) => {
  const formatTitle = useMemo(() => {
    const { currentDate, currentView } = state;

    if (currentView === 'timeline') {
      return `Focus timeline - ${currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      })}`;
    }

    if (currentView === 'month') {
      return currentDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });
    } else {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      return `${startOfWeek.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })} - ${endOfWeek.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })}`;
    }
  }, [state.currentDate, state.currentView]);

  return (
    <header className={`bg-gradient-to-r ${themeConfig.gradient.header} text-white shadow-lg rounded-t-3xl`}>
      <div className="px-4 md:px-8 py-4 md:py-6">
        <div className="flex items-center justify-between">
          {/* Mobile Menu Button */}
          {isMobile && onToggleMobileDrawer && (
            <button
              onClick={onToggleMobileDrawer}
              className="p-2 mr-2 text-white hover:bg-white/30 rounded-lg transition-colors duration-200"
              aria-label={tStatic('common:auto.frontend.k197101e9db29')}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          {/* Navigation */}
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => actions.navigateCalendar('prev')}
                className="text-white hover:bg-white/30 border border-white/30 rounded-lg backdrop-blur-sm shadow-sm transition-all duration-200 hover:shadow-md"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                }
              />

              <Button
                variant="ghost"
                size="sm"
                onClick={() => actions.navigateCalendar('next')}
                className="text-white hover:bg-white/30 border border-white/30 rounded-lg backdrop-blur-sm shadow-sm transition-all duration-200 hover:shadow-md"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                }
              />
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => actions.navigateCalendar('today')}
              className="text-white hover:bg-white/30 border border-white/30 rounded-lg backdrop-blur-sm shadow-sm transition-all duration-200 hover:shadow-md font-medium"
            >
              {tStatic('common:auto.frontend.k24345a14377f')}</Button>

            <h1 className="text-lg md:text-2xl font-bold ml-2 md:ml-4 truncate">{formatTitle}</h1>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* View Toggle */}
            <div className="flex items-center bg-white/20 rounded-lg p-1 backdrop-blur-sm border border-white/30">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => actions.setCurrentView('month')}
                className={`px-4 py-2 rounded-md transition-all duration-200 ${
                  state.currentView === 'month'
                    ? 'bg-white text-gray-800 shadow-md font-semibold'
                    : 'text-white/90 hover:bg-white/30 hover:text-white'
                }`}
              >
                {tStatic('common:auto.frontend.k082bc378cd60')}</Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => actions.setCurrentView('week')}
                className={`px-4 py-2 rounded-md transition-all duration-200 ${
                  state.currentView === 'week'
                    ? 'bg-white text-gray-800 shadow-md font-semibold'
                    : 'text-white/90 hover:bg-white/30 hover:text-white'
                }`}
              >
                {tStatic('common:auto.frontend.kf82be68a7fb4')}</Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => actions.setCurrentView('timeline')}
                className={`px-4 py-2 rounded-md transition-all duration-200 ${
                  state.currentView === 'timeline'
                    ? 'bg-white text-gray-800 shadow-md font-semibold'
                    : 'text-white/90 hover:bg-white/30 hover:text-white'
                }`}
              >
                {tStatic('common:auto.frontend.k018514a3d58a')}</Button>
            </div>

            {/* Create Actions */}
            {!readOnly && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onCreateEvent}
                  className="bg-white/20 text-white hover:bg-white/30 border border-white/30 rounded-lg backdrop-blur-sm shadow-sm transition-all duration-200 hover:shadow-md font-medium"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  }
                >
                  <span className="hidden md:inline">{tStatic('common:auto.frontend.k6396b65c4ecf')}</span>
                </Button>

                {!isMobile && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={onCreateCalendar}
                    className="bg-white/20 text-white hover:bg-white/30 border border-white/30 rounded-lg backdrop-blur-sm shadow-sm transition-all duration-200 hover:shadow-md font-medium"
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    }
                  >
                    <span className="hidden md:inline">{tStatic('common:auto.frontend.kfe0b9a9de658')}</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

// Calendar Grid Component
interface CalendarGridProps {
  state: CalendarState;
  actions: CalendarActions;
  themeConfig: ThemeConfig;
  timeFormat: string;
  accentColor: string;
  timelineFocusMode: boolean;
  onToggleTimelineFocusMode: () => void;
  isMobile?: boolean;
  onShowDayDetails?: (date: Date) => void;
  timezone?: string;
  readOnly?: boolean;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  state,
  actions,
  themeConfig,
  timeFormat,
  accentColor,
  timelineFocusMode,
  onToggleTimelineFocusMode,
  isMobile = false,
  onShowDayDetails,
  timezone,
  readOnly = false,
}) => {
  const {
    currentDate,
    currentView,
    events,
    selectedCalendars,
    reservations,
    selectedResourceTypes,
    organizations,
    hiddenFromLiveFocusTags,
  } = state;

  // Filter reservations based on selected resource types
  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
      const resourceTypeId = r.resource?.resourceType?.id;
      return resourceTypeId && selectedResourceTypes.includes(resourceTypeId);
    });
  }, [reservations, selectedResourceTypes]);

  // Filter events based on selected calendars
  const filteredEvents = useMemo(() => {
    const calendarEvents = events.filter((event) => {
      const calendarId = event.calendar?.id ?? event.calendarId;
      return calendarId ? selectedCalendars.includes(calendarId) : false;
    });

    // Convert filtered reservations to event format
    const reservationEvents = filteredReservations
      .map((r) => {
        // Find the resource type to get its color
        const resourceTypeId = r.resource?.resourceType?.id;
        let resourceTypeColor = '#f97316'; // Default orange
        const startDateObj = r.startTime ? new Date(r.startTime) : null;
        const endDateObj = r.endTime ? new Date(r.endTime) : null;
        const startTimeLabel = startDateObj
          ? startDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '';
        const endTimeLabel = endDateObj
          ? endDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '';

        if (resourceTypeId) {
          for (const org of organizations) {
            const resourceType = (org.resourceTypes ?? []).find((rt) => rt.id === resourceTypeId);
            if (resourceType) {
              resourceTypeColor = resourceType.color || resourceTypeColor;
              break;
            }
          }
        }

        const fallbackTimestamp = new Date().toISOString();
        return {
          id: -1000000 - r.id,
          title: r.resource?.name || 'Reservation',
          start: r.startTime,
          end: r.endTime,
          startDate: r.startTime,
          endDate: r.endTime,
          startTime: startTimeLabel,
          endTime: endTimeLabel,
          color: resourceTypeColor,
          isAllDay: false,
          notes: r.description || r.notes || `${r.status} - ${r.customerName || 'No customer'}`,
          tags: [] as string[],
          createdAt: r.startTime || fallbackTimestamp,
          updatedAt: r.endTime || r.startTime || fallbackTimestamp,
          calendar: {
            id: -1, // Special ID for reservations
            name: 'Reservations',
            color: resourceTypeColor,
            visibility: 'private',
            isActive: true,
            createdAt: fallbackTimestamp,
            updatedAt: fallbackTimestamp,
            ownerId: 0,
          },
          isReservation: true, // Flag to identify reservation events
          reservationData: r // Keep original reservation data
        };
      });

    // Combine calendar events and reservation events
    return [...calendarEvents, ...reservationEvents];
  }, [events, selectedCalendars, filteredReservations, organizations]);

  const hiddenLiveFocusTagSet = useMemo(
    () => new Set(hiddenFromLiveFocusTags.map((tag) => tag.toLowerCase())),
    [hiddenFromLiveFocusTags],
  );

  const liveFilteredEvents = useMemo(() => {
    if (hiddenLiveFocusTagSet.size === 0) {
      return filteredEvents;
    }

    return filteredEvents.filter((event) => {
      if (!Array.isArray(event.tags) || event.tags.length === 0) {
        return true;
      }
      return !event.tags.some((tag) =>
        hiddenLiveFocusTagSet.has(tag.trim().toLowerCase()),
      );
    });
  }, [filteredEvents, hiddenLiveFocusTagSet]);

  const handleDateClick = useCallback((date: Date) => {
    actions.setSelectedDate(date);
    // On mobile, show bottom sheet with day details
    if (isMobile && onShowDayDetails) {
      onShowDayDetails(date);
    }
  }, [actions, isMobile, onShowDayDetails]);

  const handleEventClick = useCallback((event: Event) => {
    if (readOnly) {
      return;
    }
    actions.editEvent(event);
  }, [actions, readOnly]);

  const handleTimeRangeSelect = useCallback((date: Date) => {
    if (readOnly) {
      return;
    }
    // Create event with time range
    actions.createEvent(date);
  }, [actions, readOnly]);

  // Swipe gestures for navigation
  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: () => actions.navigateCalendar('next'),
    onSwipeRight: () => actions.navigateCalendar('prev'),
    threshold: 50,
    preventScroll: true,
  });

  // Timeline view (desktop + mobile)
  if (currentView === 'timeline') {
    const wrapperProps = isMobile ? swipeHandlers : {};
    return (
      <div {...wrapperProps}>
        <TimelineView
          currentDate={currentDate}
          events={liveFilteredEvents}
          onEventClick={handleEventClick}
          onCreateEvent={(date, endDate) => {
            if (readOnly) {
              return;
            }
            actions.createEvent(date, endDate);
          }}
          accentColor={accentColor}
          focusMode={timelineFocusMode}
          onToggleFocusMode={onToggleTimelineFocusMode}
          calendars={state.calendars}
          selectedCalendars={state.selectedCalendars}
          onToggleCalendar={actions.toggleCalendar}
          isMobile={isMobile}
          timeFormat={timeFormat === '12h' ? '12' : '24'}
          timezone={timezone}
        />
      </div>
    );
  }

  // On mobile in week view, show mobile-optimized week view
  if (isMobile && currentView === 'week') {
    return (
      <div {...swipeHandlers}>
        <MobileWeekView
          currentDate={currentDate}
          events={filteredEvents}
          selectedDate={state.selectedDate}
          onDateClick={handleDateClick}
          onEventClick={handleEventClick}
          onTimeSlotClick={(date, hour) => {
            if (readOnly) {
              return;
            }
            const eventDate = new Date(date);
            eventDate.setHours(hour, 0, 0, 0);
            actions.createEvent(eventDate);
          }}
          themeColor={themeConfig.primary}
          timeFormat={timeFormat === '12h' ? '12' : '24'}
        />
      </div>
    );
  }

  // On mobile in month view, show mobile-optimized month view
  if (isMobile && currentView === 'month') {
    return (
      <div {...swipeHandlers}>
        <MobileMonthView
          currentDate={currentDate}
          events={filteredEvents}
          selectedDate={state.selectedDate}
          onDateClick={handleDateClick}
          weekStartDay={1}
          themeColor={themeConfig.primary}
        />
      </div>
    );
  }

  // Desktop views
  if (currentView === 'month') {
    return (
      <MonthView
        currentDate={currentDate}
        events={filteredEvents}
        selectedDate={state.selectedDate}
        onDateClick={handleDateClick}
        onEventClick={handleEventClick}
        weekStartDay={1} // Monday start
        themeColor={themeConfig.primary}
        reservations={filteredReservations}
        organizations={organizations}
      />
    );
  } else {
    return (
      <WeekView
        currentDate={currentDate}
        events={filteredEvents}
        onDateClick={handleDateClick}
        onEventClick={handleEventClick}
        onTimeRangeSelect={handleTimeRangeSelect}
        weekStartDay={1} // Monday start
        themeColor={themeConfig.primary}
        reservations={filteredReservations}
        userTimezone={timezone}
        timeFormat={timeFormat === '12h' ? '12' : '24'}
      />
    );
  }
};

// Calendar Sidebar Component
interface CalendarSidebarProps {
  state: CalendarState;
  actions: CalendarActions;
  themeConfig: ThemeConfig;
  onCreateCalendar: () => void;
  onEditCalendar?: (calendar: CalendarType) => void;
  onDeleteCalendar?: (calendar: CalendarType) => void;
  readOnly?: boolean;
}

const CalendarSidebar: React.FC<CalendarSidebarProps> = ({
  state,
  actions,
  themeConfig,
  onCreateCalendar,
  onEditCalendar,
  onDeleteCalendar,
  readOnly = false,
}) => {
  const [groupModalState, setGroupModalState] = React.useState<{
    mode: 'create' | 'edit';
    group?: CalendarGroupView;
  } | null>(null);
  const [assignmentTargetGroup, setAssignmentTargetGroup] =
    React.useState<CalendarGroupView | null>(null);
  const [groupActionLoading, setGroupActionLoading] = React.useState(false);
  const [groupOrder, setGroupOrder] = React.useState<number[]>(() => {
    const raw = localStorage.getItem('primecal:calendar-group-order');
    if (!raw) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed
        .filter((entry): entry is number => Number.isFinite(entry))
        .map((entry) => Number(entry));
    } catch {
      return [];
    }
  });
  // Collapsible sidebar state - persisted in localStorage
  const [isCollapsed, setIsCollapsed] = React.useState(() => {
    const saved = localStorage.getItem('enhancedCalendarSidebarCollapsed');
    return saved ? JSON.parse(saved) : true; // Default to collapsed for more screen space
  });
  const [calendarOrder, setCalendarOrder] = React.useState<CalendarType[]>([]);
  const [draggingCalendarId, setDraggingCalendarId] = React.useState<number | null>(null);
  const [isPersistingOrder, setIsPersistingOrder] = React.useState(false);
  const calendarOrderRef = React.useRef<CalendarType[]>([]);
  const didDropRef = React.useRef(false);

  // Save collapse state to localStorage
  React.useEffect(() => {
    localStorage.setItem('enhancedCalendarSidebarCollapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  React.useEffect(() => {
    const handleOpenGroups = () => {
      setIsCollapsed(false);
    };

    window.addEventListener('primecal:open-groups', handleOpenGroups as EventListener);
    return () => {
      window.removeEventListener(
        'primecal:open-groups',
        handleOpenGroups as EventListener,
      );
    };
  }, []);

  React.useEffect(() => {
    localStorage.setItem('primecal:calendar-group-order', JSON.stringify(groupOrder));
  }, [groupOrder]);

  React.useEffect(() => {
    if (!draggingCalendarId) {
      setCalendarOrder(state.calendars);
    }
  }, [state.calendars, draggingCalendarId]);

  React.useEffect(() => {
    calendarOrderRef.current = calendarOrder;
  }, [calendarOrder]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const moveCalendarInList = React.useCallback(
    (list: CalendarType[], draggedId: number, overId: number) => {
      if (draggedId === overId) return list;
      const fromIndex = list.findIndex((cal) => cal.id === draggedId);
      const toIndex = list.findIndex((cal) => cal.id === overId);
      if (fromIndex === -1 || toIndex === -1) return list;
      const next = [...list];
      const [dragged] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, dragged);
      return next;
    },
    [],
  );

  const persistCalendarOrder = React.useCallback(
    async (ordered: CalendarType[]) => {
      if (ordered.length === 0) return;
      const originalOrder = state.calendars.map((calendar) => calendar.id);
      const nextOrder = ordered.map((calendar) => calendar.id);
      if (
        originalOrder.length === nextOrder.length &&
        originalOrder.every((id, index) => id === nextOrder[index])
      ) {
        return;
      }
      const supportsRank = ordered.some((calendar) =>
        Number.isFinite(calendar.rank),
      );
      if (!supportsRank) {
        alert(tStatic('common:auto.frontend.kd6c923c0ba86'));
        setCalendarOrder(state.calendars);
        return;
      }
      const total = ordered.length;
      const updates = ordered
        .map((calendar, index) => {
          const nextRank = (total - index) * 10;
          return {
            id: calendar.id,
            nextRank,
            currentRank: Number.isFinite(calendar.rank) ? Number(calendar.rank) : 0,
          };
        })
        .filter((update) => update.currentRank !== update.nextRank);

      if (updates.length === 0) return;

      setIsPersistingOrder(true);
      try {
        for (const update of updates) {
        await calendarApi.updateCalendar(update.id, { rank: update.nextRank });
        }
        await actions.refreshData();
      } catch (err) {
        console.error('Failed to update calendar ranks', err);
        const message =
          err instanceof Error ? err.message : 'Failed to update calendar order';
        if (message.includes('rank should not exist')) {
          alert(tStatic('common:auto.frontend.k09ba7c20211a'));
        } else {
          alert(message);
        }
        setCalendarOrder(state.calendars);
      } finally {
        setIsPersistingOrder(false);
      }
    },
    [actions, state.calendars],
  );

  const handleDragStart = React.useCallback(
    (event: React.DragEvent<HTMLSpanElement>, calendarId: number) => {
      if (isPersistingOrder || readOnly) return;
      didDropRef.current = false;
      setCalendarOrder(state.calendars);
      setDraggingCalendarId(calendarId);
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(calendarId));
    },
    [isPersistingOrder, readOnly, state.calendars],
  );

  const handleDragOver = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>, calendarId: number) => {
      if (draggingCalendarId === null || isPersistingOrder || readOnly) return;
      event.preventDefault();
      setCalendarOrder((prev) =>
        moveCalendarInList(prev, draggingCalendarId, calendarId),
      );
    },
    [draggingCalendarId, isPersistingOrder, moveCalendarInList, readOnly],
  );

  const handleDrop = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>, calendarId: number) => {
      if (draggingCalendarId === null || isPersistingOrder || readOnly) return;
      event.preventDefault();
      didDropRef.current = true;
      const reordered = moveCalendarInList(
        calendarOrderRef.current,
        draggingCalendarId,
        calendarId,
      );
      setCalendarOrder(reordered);
      setDraggingCalendarId(null);
      void persistCalendarOrder(reordered);
    },
    [draggingCalendarId, isPersistingOrder, moveCalendarInList, persistCalendarOrder, readOnly],
  );

  const handleDragEnd = React.useCallback(() => {
    if (draggingCalendarId === null) return;
    if (!didDropRef.current) {
      setCalendarOrder(state.calendars);
    }
    didDropRef.current = false;
    setDraggingCalendarId(null);
  }, [draggingCalendarId, state.calendars]);

  const handleOpenCreateGroup = React.useCallback(() => {
    if (readOnly) {
      return;
    }
    setGroupModalState({ mode: 'create' });
  }, [readOnly]);

  const handleOpenEditGroup = React.useCallback(
    (group: CalendarGroupView) => {
      if (readOnly) {
        return;
      }
      setGroupModalState({ mode: 'edit', group });
    },
    [readOnly],
  );

  const handleSubmitGroupModal = React.useCallback(
    async (payload: { name: string; isVisible: boolean }) => {
      if (!groupModalState) {
        return;
      }

      setGroupActionLoading(true);
      try {
        if (groupModalState.mode === 'create') {
          await calendarApi.createCalendarGroup({
            name: payload.name,
            isVisible: payload.isVisible,
          });
        } else if (groupModalState.group) {
          await calendarApi.updateCalendarGroup(groupModalState.group.id, {
            name: payload.name,
            isVisible: payload.isVisible,
          });
        }

        setGroupModalState(null);
        await actions.refreshData();
      } catch (error) {
        console.error('Failed to save calendar group', error);
        alert(error instanceof Error ? error.message : 'Failed to save group');
      } finally {
        setGroupActionLoading(false);
      }
    },
    [actions, groupModalState],
  );

  const handleDeleteGroup = React.useCallback(
    async (group: CalendarGroupView) => {
      if (readOnly) {
        return;
      }

      const confirmed = window.confirm(
        `Delete group "${group.name}"? Calendars will remain and become ungrouped.`,
      );
      if (!confirmed) {
        return;
      }

      setGroupActionLoading(true);
      try {
        await calendarApi.deleteCalendarGroup(group.id);
        setAssignmentTargetGroup((current) =>
          current?.id === group.id ? null : current,
        );
        await actions.refreshData();
      } catch (error) {
        console.error('Failed to delete calendar group', error);
        alert(error instanceof Error ? error.message : 'Failed to delete group');
      } finally {
        setGroupActionLoading(false);
      }
    },
    [actions, readOnly],
  );

  const handleToggleGroupVisibility = React.useCallback(
    async (group: CalendarGroupView) => {
      if (readOnly) {
        return;
      }

      setGroupActionLoading(true);
      try {
        await calendarApi.updateCalendarGroup(group.id, {
          isVisible: !group.isVisible,
        });
        await actions.refreshData();
      } catch (error) {
        console.error('Failed to toggle calendar group visibility', error);
        alert(error instanceof Error ? error.message : 'Failed to update visibility');
      } finally {
        setGroupActionLoading(false);
      }
    },
    [actions, readOnly],
  );

  const handleSaveGroupAssignment = React.useCallback(
    async (nextCalendarIds: number[]) => {
      if (!assignmentTargetGroup) {
        return;
      }

      setGroupActionLoading(true);
      try {
        const currentlyAssigned = assignmentTargetGroup.calendars.map(
          (calendar) => calendar.id,
        );
        const nextSet = new Set(nextCalendarIds);
        const currentSet = new Set(currentlyAssigned);

        const toAssign = nextCalendarIds.filter((calendarId) => !currentSet.has(calendarId));
        const toUnassign = currentlyAssigned.filter((calendarId) => !nextSet.has(calendarId));

        if (toAssign.length > 0) {
          await calendarApi.assignCalendarsToGroup(assignmentTargetGroup.id, {
            calendarIds: toAssign,
          });
        }
        if (toUnassign.length > 0) {
          await calendarApi.unassignCalendarsFromGroup(assignmentTargetGroup.id, {
            calendarIds: toUnassign,
          });
        }

        setAssignmentTargetGroup(null);
        await actions.refreshData();
      } catch (error) {
        console.error('Failed to assign calendars to group', error);
        alert(error instanceof Error ? error.message : 'Failed to assign calendars');
      } finally {
        setGroupActionLoading(false);
      }
    },
    [actions, assignmentTargetGroup],
  );

  const handleToggleGroupCalendars = React.useCallback(
    (group: CalendarGroupView, allSelected: boolean) => {
      const groupCalendarIds = group.calendars.map((calendar) => calendar.id);
      if (allSelected) {
        groupCalendarIds.forEach((calendarId) => actions.toggleCalendar(calendarId));
        return;
      }
      groupCalendarIds.forEach((calendarId) => {
        if (!state.selectedCalendars.includes(calendarId)) {
          actions.toggleCalendar(calendarId);
        }
      });
    },
    [actions, state.selectedCalendars],
  );

  const handleDropCalendarToGroup = React.useCallback(
    async (group: CalendarGroupView, calendarId: number) => {
      if (readOnly) {
        return;
      }

      if (group.calendars.some((calendar) => calendar.id === calendarId)) {
        return;
      }

      setGroupActionLoading(true);
      try {
        await calendarApi.assignCalendarsToGroup(group.id, {
          calendarIds: [calendarId],
        });
        await actions.refreshData();
      } catch (error) {
        console.error('Failed to move calendar into group', error);
        alert(error instanceof Error ? error.message : 'Failed to move calendar to group');
      } finally {
        setGroupActionLoading(false);
      }
    },
    [actions, readOnly],
  );

  const groupedCalendars = React.useMemo(() => {
    const byId = new Map<number, CalendarType>();
    state.calendars.forEach((cal) => byId.set(cal.id, cal));

    const groups = state.calendarGroups.map((group) => {
      const calendars = group.calendars
        .map((cal) => byId.get(cal.id))
        .filter(Boolean) as CalendarType[];
      return { ...group, calendars: sortCalendarsByRank(calendars) };
    });

    const groupIndex = new Map(groups.map((group) => [group.id, group]));
    const orderedGroupIds = [
      ...groupOrder.filter((groupId) => groupIndex.has(groupId)),
      ...groups.map((group) => group.id).filter((groupId) => !groupOrder.includes(groupId)),
    ];
    const orderedGroups = orderedGroupIds
      .map((groupId) => groupIndex.get(groupId))
      .filter((group): group is CalendarGroupView => Boolean(group));

    const groupedIds = new Set(orderedGroups.flatMap((g) => g.calendars.map((c) => c.id)));
    const ungrouped = sortCalendarsByRank(
      state.calendars.filter((cal) => !groupedIds.has(cal.id)),
    );

    return { groups: orderedGroups, ungrouped };
  }, [groupOrder, state.calendars, state.calendarGroups]);

  React.useEffect(() => {
    const incomingIds = groupedCalendars.groups.map((group) => group.id);
    setGroupOrder((previous) => {
      const kept = previous.filter((groupId) => incomingIds.includes(groupId));
      const missing = incomingIds.filter((groupId) => !kept.includes(groupId));
      const merged = [...kept, ...missing];
      if (
        merged.length === previous.length &&
        merged.every((groupId, index) => groupId === previous[index])
      ) {
        return previous;
      }
      return merged;
    });
  }, [groupedCalendars.groups]);

  const calendarsToRender =
    calendarOrder.length > 0 ? calendarOrder : state.calendars;

  const renderCalendarRow = (calendar: CalendarType) => (
    <div
      key={calendar.id}
      className={`
        flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200
        hover:shadow-md border-l-4 group
        ${state.selectedCalendars.includes(calendar.id) ? 'shadow-sm' : ''}
      `}
      style={{
        borderLeftColor: calendar.color || '#64748b',
        background: state.selectedCalendars.includes(calendar.id)
          ? `linear-gradient(135deg, ${calendar.color || '#64748b'}15, white)`
          : `linear-gradient(135deg, ${calendar.color || '#64748b'}08, transparent)`
      }}
      onClick={() => actions.toggleCalendar(calendar.id)}
    >
      <div
        className="w-4 h-4 rounded border-2 flex items-center justify-center"
        style={{
          backgroundColor: state.selectedCalendars.includes(calendar.id)
            ? (calendar.color || '#64748b')
            : 'transparent',
          borderColor: calendar.color || '#64748b'
        }}
      >
        {state.selectedCalendars.includes(calendar.id) && (
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </div>
      {calendar.icon && (
        <div className="text-xl mr-2 flex-shrink-0">
          <EmojiGlyph value={calendar.icon} imageClassName="h-6 w-6 rounded object-cover" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-800 truncate">{calendar.name}</div>
        {calendar.description && (
          <div className="text-sm text-gray-600 truncate">{calendar.description}</div>
        )}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onEditCalendar && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditCalendar(calendar);
            }}
            className="p-1 hover:bg-gray-200 rounded transition-all duration-200"
            title={tStatic('common:auto.frontend.k65c10a34b7c9')}
          >
            <span className="text-xs">✎</span>
          </button>
        )}
        {onDeleteCalendar && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteCalendar(calendar);
            }}
            className="p-1 hover:bg-red-100 rounded transition-all duration-200"
            title={tStatic('common:auto.frontend.k63ba33f6ca07')}
          >
            <span className="text-xs">🗑</span>
          </button>
        )}
      </div>
    </div>
  );

  // Collapsed view - icon-only sidebar
  if (isCollapsed) {
    return (
      <aside className="w-16 bg-white border-r border-gray-200 flex flex-col transition-all duration-300">
        {/* Expand button */}
        <div className="p-2 border-b border-gray-200">
          <button
            onClick={toggleCollapse}
            className="w-full p-2 hover:bg-gray-100 rounded-lg transition-all duration-200"
            title={tStatic('common:auto.frontend.kf462e889fd88')}
          >
            <span className="text-xl">▶</span>
          </button>
        </div>

        {/* Calendar icons */}
        <div className="flex-1 p-2 space-y-2 overflow-y-auto">
          {state.calendars.map((calendar) => {
            const isSelected = state.selectedCalendars.includes(calendar.id);
            return (
              <button
                key={calendar.id}
                onClick={() => actions.toggleCalendar(calendar.id)}
                className={`w-full p-2 rounded-lg transition-all duration-200 relative ${
                  isSelected ? 'bg-blue-50' : 'hover:bg-gray-100'
                }`}
                title={calendar.name}
              >
                <div className="relative w-8 h-8 mx-auto">
                  <div
                    className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                    style={{
                      background: `linear-gradient(135deg, ${calendar.color || '#64748b'}, ${calendar.color || '#64748b'}dd)`,
                      boxShadow: `0 2px 4px ${calendar.color || '#64748b'}40, inset 0 1px 2px rgba(255,255,255,0.3)`
                    }}
                  />
                  {calendar.icon && (
                    <div className="absolute inset-0 flex items-center justify-center text-lg">
                      <EmojiGlyph value={calendar.icon} imageClassName="h-6 w-6 rounded object-cover" />
                    </div>
                  )}
                </div>
                {isSelected && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>
      </aside>
    );
  }

  // Expanded view
  return (
    <aside className={`w-80 bg-gradient-to-b ${themeConfig.gradient.background} border-r border-gray-200 p-6 transition-all duration-300`}>
      <div className="space-y-6">
        {/* Collapse button at top */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <h3 className={`text-lg font-semibold text-${themeConfig.text}`}>
            {state.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <button
            onClick={toggleCollapse}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-all duration-200"
            title={tStatic('common:auto.frontend.k9e6876286e45')}
          >
            <span className="text-lg">◀</span>
          </button>
        </div>

        {/* Calendar Groups */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className={`text-md font-semibold text-${themeConfig.text}`}>{tStatic('common:auto.frontend.kae9629f4ebb8')}</h3>
              <span className="text-xs text-gray-500">{groupedCalendars.groups.length} {tStatic('common:auto.frontend.k5a537e209151')}</span>
            </div>
            {!readOnly && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenCreateGroup}
                disabled={groupActionLoading}
                className={`text-${themeConfig.primary}-600 hover:bg-${themeConfig.primary}-100`}
              >
                {tStatic('common:auto.frontend.k74a33ebc8648')}
              </Button>
            )}
          </div>

          <GroupList
            groups={groupedCalendars.groups}
            selectedCalendarIds={state.selectedCalendars}
            readOnly={readOnly}
            onToggleGroupCalendars={handleToggleGroupCalendars}
            onRenameGroup={handleOpenEditGroup}
            onDeleteGroup={handleDeleteGroup}
            onAssignCalendars={setAssignmentTargetGroup}
            onToggleVisibility={handleToggleGroupVisibility}
            onReorderGroups={setGroupOrder}
            onDropCalendarToGroup={handleDropCalendarToGroup}
            renderCalendarRow={renderCalendarRow}
          />
        </div>
        {/* Calendars List */}
        <div>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className={`text-lg font-semibold text-${themeConfig.text}`}>{tStatic('common:auto.frontend.ked5b05b30d74')}</h3>
              {!readOnly && (
                <p className="text-xs text-gray-500">{tStatic('common:auto.frontend.k894709238e27')}</p>
              )}
              {isPersistingOrder && !readOnly && (
                <p className="text-xs text-gray-400">{tStatic('common:auto.frontend.k86ec79b780bf')}</p>
              )}
            </div>
            {!readOnly && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCreateCalendar}
                className={`text-${themeConfig.primary}-600 hover:bg-${themeConfig.primary}-100`}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                }
              />
            )}
          </div>

          <div className="space-y-2">
            {calendarsToRender.map(calendar => (
              <div
                key={calendar.id}
                className={`
                  flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200
                  hover:shadow-md border-l-4 group
                  ${state.selectedCalendars.includes(calendar.id) ? 'shadow-sm' : ''}
                  ${draggingCalendarId === calendar.id ? 'ring-2 ring-blue-200' : ''}
                  ${isPersistingOrder ? 'opacity-70' : ''}
                `}
                style={{
                  borderLeftColor: calendar.color || '#64748b',
                  background: state.selectedCalendars.includes(calendar.id)
                    ? `linear-gradient(135deg, ${calendar.color || '#64748b'}15, white)`
                    : `linear-gradient(135deg, ${calendar.color || '#64748b'}08, transparent)`
                }}
                onClick={() => actions.toggleCalendar(calendar.id)}
                onDragOver={(event) => handleDragOver(event, calendar.id)}
                onDrop={(event) => handleDrop(event, calendar.id)}
              >
                {!readOnly && (
                  <span
                    className="text-xs text-gray-400 px-1 cursor-grab"
                    title={tStatic('common:auto.frontend.ke7541faf0a7e')}
                    draggable={!isPersistingOrder}
                    onDragStart={(event) => handleDragStart(event, calendar.id)}
                    onDragEnd={handleDragEnd}
                    onClick={(event) => event.stopPropagation()}
                  >
                    |||
                  </span>
                )}
                <div
                  className="w-4 h-4 rounded border-2 flex items-center justify-center"
                  style={{
                    backgroundColor: state.selectedCalendars.includes(calendar.id)
                      ? (calendar.color || '#64748b')
                      : 'transparent',
                    borderColor: calendar.color || '#64748b'
                  }}
                >
                  {state.selectedCalendars.includes(calendar.id) && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                {calendar.icon && (
                  <div className="text-xl mr-2 flex-shrink-0">
                    <EmojiGlyph value={calendar.icon} imageClassName="h-6 w-6 rounded object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 truncate">{calendar.name}</div>
                  {calendar.description && (
                    <div className="text-sm text-gray-600 truncate">{calendar.description}</div>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onEditCalendar && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditCalendar(calendar);
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition-all duration-200"
                      title={tStatic('common:auto.frontend.k65c10a34b7c9')}
                    >
                      <span className="text-xs">✏️</span>
                    </button>
                  )}
                  {onDeleteCalendar && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCalendar(calendar);
                      }}
                      className="p-1 hover:bg-red-100 rounded transition-all duration-200"
                      title={tStatic('common:auto.frontend.k63ba33f6ca07')}
                    >
                      <span className="text-xs">🗑️</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reservations by Organization and Resource Type */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold text-${themeConfig.text}`}>{tStatic('common:auto.frontend.kfe5c54bbae46')}</h3>
          </div>

          <div className="space-y-3">
            {state.organizations && state.organizations.length > 0 ? (
              state.organizations.map(org => {
                const orgResourceTypeIds = (org.resourceTypes ?? []).map((rt) => rt.id);
                const allOrgResourceTypesSelected = orgResourceTypeIds.length > 0 &&
                  orgResourceTypeIds.every(id => state.selectedResourceTypes.includes(id));

                return (
                  <div key={org.id} className="space-y-2">
                    {/* Organization header with checkbox and color picker */}
                    <div className="flex items-center space-x-2 mb-2 p-2 rounded hover:bg-gray-50">
                      <div
                        className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 cursor-pointer"
                        style={{
                          backgroundColor: allOrgResourceTypesSelected ? org.color : 'transparent',
                          borderColor: org.color
                        }}
                        onClick={() => actions.toggleOrganization(org)}
                      >
                        {allOrgResourceTypesSelected && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-shrink-0 relative group">
                        <input
                          type="color"
                          value={org.color}
                          onChange={async (e) => {
                            if (readOnly) {
                              return;
                            }
                            e.stopPropagation();
                            const cascadeConfirm = window.confirm(
                              `Update color for ${org.name}?\n\n` +
                              `Click OK to also update all resource types under this organization.\n` +
                              `Click Cancel to only update the organization color.`
                            );
                            await actions.updateOrganizationColor(org.id, e.target.value, cascadeConfirm);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          disabled={readOnly}
                          className="w-6 h-6 rounded cursor-pointer border-2 border-gray-300"
                          title={tStatic('common:auto.frontend.k5ce071a801c8')}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-700 cursor-pointer" onClick={() => actions.toggleOrganization(org)}>🏢 {org.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        org.role === 'ORG_ADMIN'
                          ? 'bg-purple-100 text-purple-700'
                          : org.role === 'EDITOR'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {org.role === 'ORG_ADMIN' ? 'Admin' : org.role === 'EDITOR' ? 'Editor' : 'User'}
                      </span>
                    </div>

                  {/* Resource Types for this organization */}
                  {org.resourceTypes && org.resourceTypes.length > 0 ? (
                    <div className="ml-4 space-y-1">
                      {org.resourceTypes.map(resourceType => {
                        const isSelected = state.selectedResourceTypes.includes(resourceType.id);
                        const reservationsForType = state.reservations.filter(
                          (r) => r.resource?.resourceType?.id === resourceType.id
                        );

                        return (
                          <div
                            key={resourceType.id}
                            className={`
                              flex items-center space-x-2 p-2 rounded-lg transition-all duration-200
                              hover:shadow-md border-l-4
                              ${isSelected ? 'shadow-sm' : ''}
                            `}
                            style={{
                              borderLeftColor: resourceType.color,
                              background: isSelected
                                ? `linear-gradient(135deg, ${resourceType.color}14, white)`
                                : `linear-gradient(135deg, ${resourceType.color}08, transparent)`
                            }}
                          >
                            <div
                              className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 cursor-pointer"
                              style={{
                                backgroundColor: isSelected ? resourceType.color : 'transparent',
                                borderColor: resourceType.color
                              }}
                              onClick={() => actions.toggleResourceType(resourceType.id)}
                            >
                              {isSelected && (
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-shrink-0 relative group">
                              <input
                                type="color"
                                value={resourceType.color}
                                onChange={async (e) => {
                                  if (readOnly) {
                                    return;
                                  }
                                  e.stopPropagation();
                                  await actions.updateResourceTypeColor(resourceType.id, e.target.value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                disabled={readOnly}
                                className="w-5 h-5 rounded cursor-pointer border border-gray-300"
                                title={tStatic('common:auto.frontend.k0cb317bcb48d')}
                              />
                            </div>
                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => actions.toggleResourceType(resourceType.id)}>
                              <div className="font-medium text-gray-800 text-sm flex items-center">
                                📅 {resourceType.name}
                                {reservationsForType.length > 0 && (
                                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{
                                    backgroundColor: `${resourceType.color}20`,
                                    color: resourceType.color
                                  }}>
                                    {reservationsForType.length}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="ml-4 text-xs text-gray-500 italic">{tStatic('common:auto.frontend.k954fce4e485c')}</div>
                  )}
                </div>
                );
              })
            ) : (
              <div className="text-sm text-gray-500 text-center py-4">
                {tStatic('common:auto.frontend.k83dff77c0c5b')}</div>
            )}
          </div>
        </div>
      </div>

      <GroupManagementModal
        isOpen={groupModalState !== null}
        mode={groupModalState?.mode ?? 'create'}
        initialName={groupModalState?.group?.name}
        initialVisible={groupModalState?.group?.isVisible ?? true}
        loading={groupActionLoading}
        onClose={() => setGroupModalState(null)}
        onSubmit={handleSubmitGroupModal}
      />

      <CalendarGroupAssignment
        isOpen={Boolean(assignmentTargetGroup)}
        groupName={assignmentTargetGroup?.name ?? 'group'}
        calendars={sortCalendarsByRank(state.calendars)}
        assignedCalendarIds={assignmentTargetGroup?.calendars.map((calendar) => calendar.id) ?? []}
        loading={groupActionLoading}
        onClose={() => setAssignmentTargetGroup(null)}
        onSave={handleSaveGroupAssignment}
      />
    </aside>
  );
};

// Main Enhanced Calendar Component
export const EnhancedCalendar: React.FC<EnhancedCalendarProps> = ({
  themeColor,
  timeFormat = '12h',
  className = '',
  timezone,
  offlineMode = false,
  onTimelineFocusModeChange,
}) => {
  // Mobile detection (used to choose the default calendar view)
  const { isMobile } = useScreenSize();

  const {
    state,
    actions,
    modals,
    setModals,
    modalData,
    setModalData,
    errors,
    setErrors,
    themeConfig,
    isInitialLoading,
    isRefreshing,
    loadError,
  } = useCalendarState(themeColor, 'timeline', offlineMode);
  const [timelineFocusMode, setTimelineFocusMode] = useState(false);
  const resolvedTimezone = useMemo(
    () => timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    [timezone],
  );
  const isTimelineFocusActive =
    state.currentView === 'timeline' && timelineFocusMode;

  useEffect(() => {
    if (state.currentView !== 'timeline' && timelineFocusMode) {
      setTimelineFocusMode(false);
    }
  }, [state.currentView, timelineFocusMode]);

  useEffect(() => {
    onTimelineFocusModeChange?.(isTimelineFocusActive);
  }, [isTimelineFocusActive, onTimelineFocusModeChange]);

  useEffect(() => {
    return () => {
      onTimelineFocusModeChange?.(false);
    };
  }, [onTimelineFocusModeChange]);

  const queryClient = useQueryClient();

  const resolveEventCalendar = useCallback(
    (event: Event, fallbackCalendarId?: number, previousEvent?: Event) => {
      if (event.calendar) return event;
      const calendarId =
        event.calendarId ??
        fallbackCalendarId ??
        previousEvent?.calendarId ??
        previousEvent?.calendar?.id;
      if (!calendarId) return event;
      if (previousEvent?.calendar) {
        return { ...event, calendar: previousEvent.calendar, calendarId };
      }
      const calendars = queryClient.getQueryData<CalendarType[]>(
        calendarQueryKeys.calendars,
      );
      const calendar = calendars?.find((item) => item.id === calendarId);
      if (!calendar) {
        return { ...event, calendarId };
      }
      return {
        ...event,
        calendar: calendar as Event['calendar'],
        calendarId,
      };
    },
    [queryClient],
  );

  const createEventMutation = useMutation<Event, Error, CreateEventRequest>({
    mutationFn: (eventData: CreateEventRequest) =>
      eventsApi.createEvent(eventData),
    onSuccess: (createdEvent, variables) => {
      const resolvedEvent = resolveEventCalendar(
        createdEvent,
        variables.calendarId,
      );
      queryClient.setQueryData<Event[]>(
        calendarQueryKeys.events,
        (previous = []) => [...previous, resolvedEvent],
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: calendarQueryKeys.events });
    },
  });

  const updateEventMutation = useMutation<
    Event,
    Error,
    { eventId: number; eventData: UpdateEventRequest }
  >({
    mutationFn: ({
      eventId,
      eventData,
    }: {
      eventId: number;
      eventData: UpdateEventRequest;
    }) => eventsApi.updateEvent(eventId, eventData),
    onSuccess: (updatedEvent, variables) => {
      queryClient.setQueryData<Event[]>(
        calendarQueryKeys.events,
        (previous = []) => {
          const existingEvent = previous.find(
            (event) => event.id === updatedEvent.id,
          );
          const resolvedEvent = resolveEventCalendar(
            updatedEvent,
            variables.eventData.calendarId,
            existingEvent,
          );
          return previous.map((event) =>
            event.id === updatedEvent.id ? resolvedEvent : event,
          );
        },
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: calendarQueryKeys.events });
    },
  });

  const deleteEventMutation = useMutation<
    void,
    Error,
    number,
    { previous?: Event[] }
  >({
    mutationFn: (eventId: number) => eventsApi.deleteEvent(eventId),
    onMutate: async (eventId: number) => {
      await queryClient.cancelQueries({ queryKey: calendarQueryKeys.events });
      const previous = queryClient.getQueryData<Event[]>(calendarQueryKeys.events);
      queryClient.setQueryData<Event[]>(
        calendarQueryKeys.events,
        (current = []) => current.filter((event) => event.id !== eventId),
      );
      return { previous };
    },
    onError: (_error, _eventId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(calendarQueryKeys.events, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: calendarQueryKeys.events });
    },
  });

  const deleteCalendarMutation = useMutation<
    void,
    Error,
    number,
    { previous?: CalendarType[] }
  >({
    mutationFn: (calendarId: number) => calendarApi.deleteCalendar(calendarId),
    onMutate: async (calendarId: number) => {
      await queryClient.cancelQueries({ queryKey: calendarQueryKeys.calendars });
      const previous = queryClient.getQueryData<CalendarType[]>(
        calendarQueryKeys.calendars,
      );
      queryClient.setQueryData<CalendarType[]>(
        calendarQueryKeys.calendars,
        (current = []) => current.filter((calendar) => calendar.id !== calendarId),
      );
      return { previous };
    },
    onError: (_error, _calendarId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(calendarQueryKeys.calendars, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: calendarQueryKeys.calendars });
      queryClient.invalidateQueries({ queryKey: calendarQueryKeys.calendarGroups });
      queryClient.invalidateQueries({ queryKey: calendarQueryKeys.events });
    },
  });

  // Event handlers
  const handleSaveEvent = useCallback(
    async (eventData: CreateEventRequest | UpdateEventRequest) => {
      if (offlineMode) {
        return;
      }
      try {
        setErrors((prev) => ({ ...prev, event: null }));

        if (modalData.editingEvent) {
          await updateEventMutation.mutateAsync({
            eventId: modalData.editingEvent.id,
            eventData: eventData as UpdateEventRequest,
          });
        } else {
          await createEventMutation.mutateAsync(eventData as CreateEventRequest);
        }

        setModals((prev) => ({ ...prev, eventModal: false }));
      } catch (error) {
        console.error('Error saving event:', error);
        setErrors((prev) => ({
          ...prev,
          event: error instanceof Error ? error.message : 'Failed to save event',
        }));
        throw error; // Re-throw to prevent modal from closing
      }
    },
    [
      modalData.editingEvent,
      createEventMutation,
      updateEventMutation,
      setErrors,
      setModals,
      offlineMode,
    ],
  );

  const handleDeleteEvent = useCallback(
    async (eventId: number) => {
      if (offlineMode) {
        return;
      }
      try {
        await deleteEventMutation.mutateAsync(eventId);
        setModals((prev) => ({ ...prev, eventModal: false }));
      } catch (error) {
        console.error('Error deleting event:', error);
        setErrors((prev) => ({
          ...prev,
          event: error instanceof Error ? error.message : 'Failed to delete event',
        }));
        throw error;
      }
    },
    [deleteEventMutation, setErrors, setModals, offlineMode],
  );

  const handleCalendarChange = useCallback(async () => {
    if (offlineMode) {
      return;
    }
    try {
      await queryClient.invalidateQueries({
        queryKey: calendarQueryKeys.calendars,
      });
      await queryClient.invalidateQueries({
        queryKey: calendarQueryKeys.calendarGroups,
      });
      await queryClient.invalidateQueries({
        queryKey: calendarQueryKeys.events,
      });
      setModals((prev) => ({ ...prev, calendarModal: false }));
    } catch (error) {
      console.error('Error refreshing calendar data:', error);
      setErrors((prev) => ({
        ...prev,
        calendar:
          error instanceof Error ? error.message : 'Failed to refresh calendar data',
      }));
    }
  }, [queryClient, setErrors, setModals, offlineMode]);

  const handleEditCalendar = useCallback((calendar: CalendarType) => {
    setModalData(prev => ({ ...prev, editingCalendar: calendar }));
    setModals(prev => ({ ...prev, calendarModal: true }));
  }, [setModalData, setModals]);

  const handleDeleteCalendar = useCallback(
    async (calendar: CalendarType) => {
      if (offlineMode) {
        return;
      }
      if (
        !confirm(
          `Are you sure you want to delete "${calendar.name}"? This will also delete all events in this calendar.`,
        )
      ) {
        return;
      }

      try {
        await deleteCalendarMutation.mutateAsync(calendar.id);
      } catch (error) {
        console.error('Error deleting calendar:', error);
        alert(error instanceof Error ? error.message : 'Failed to delete calendar');
      }
    },
    [deleteCalendarMutation, offlineMode],
  );

  // Loading state
  if (isInitialLoading) {
    return (
      <div className={`${className} flex items-center justify-center min-h-96 bg-white rounded-3xl shadow-2xl`}>
        <div className="text-center">
          <div className={`inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r ${themeConfig.gradient.primary} text-white shadow-lg`}>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm font-medium">
              {Object.values(LOADING_MESSAGES)[Math.floor(Math.random() * Object.values(LOADING_MESSAGES).length)]}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div className={`${className} flex items-center justify-center min-h-96 bg-white rounded-3xl shadow-2xl`}>
        <div className="text-center max-w-md">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{tStatic('common:auto.frontend.k4682f16ef04e')}</h3>
          <p className="text-sm text-gray-600 mb-4">{loadError}</p>
          <Button
            variant="primary"
            onClick={actions.refreshData}
            themeColor={themeColor}
          >
            {tStatic('common:auto.frontend.kcef2fe093b68')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-3xl shadow-2xl overflow-hidden relative ${className}`}>
      {isRefreshing && !isInitialLoading && !offlineMode && (
        <div className="pointer-events-none absolute right-6 top-4 text-[10px] uppercase tracking-[0.3em] text-slate-400">
          {tStatic('common:auto.frontend.k4ae6fa22bc99')}</div>
      )}
      {offlineMode && (
        <div className="px-4 py-2 text-xs font-medium text-amber-800 bg-amber-50 border-b border-amber-200">
          {tStatic('common:auto.frontend.k3dbc98afa55f')}</div>
      )}
      {/* Header - Conditional Mobile/Desktop */}
      {isMobile ? (
        <MobileCalendarHeader
          currentDate={state.currentDate}
          currentView={state.currentView}
          onViewChange={(view) => actions.setCurrentView(view)}
          onNavigate={(direction) => actions.navigateCalendar(direction)}
          onOpenCalendarSelector={() => setModals(prev => ({ ...prev, mobileDrawer: true }))}
          themeColor={themeConfig.primary}
        />
      ) : !isTimelineFocusActive ? (
        <CalendarHeader
          state={state}
          actions={actions}
          themeConfig={themeConfig}
          onCreateEvent={() => actions.createEvent(state.selectedDate || undefined)}
          onCreateCalendar={() => {
            setModalData(prev => ({ ...prev, editingCalendar: null }));
            setModals(prev => ({ ...prev, calendarModal: true }));
          }}
          onToggleMobileDrawer={() => setModals(prev => ({ ...prev, mobileDrawer: true }))}
          isMobile={isMobile}
          readOnly={offlineMode}
        />
      ) : null}

      {/* Main Content */}
      <div className="flex">
        {/* Sidebar - Hidden on mobile */}
        {!isMobile && !isTimelineFocusActive && (
          <CalendarSidebar
            state={state}
            actions={actions}
            themeConfig={themeConfig}
            onCreateCalendar={() => {
              setModalData(prev => ({ ...prev, editingCalendar: null }));
              setModals(prev => ({ ...prev, calendarModal: true }));
            }}
            onEditCalendar={offlineMode ? undefined : handleEditCalendar}
            onDeleteCalendar={offlineMode ? undefined : handleDeleteCalendar}
            readOnly={offlineMode}
          />
        )}

        {/* Mobile Drawer */}
        {isMobile && (
          <MobileDrawer
            isOpen={modals.mobileDrawer}
            onClose={() => setModals(prev => ({ ...prev, mobileDrawer: false }))}
            title={tStatic('common:auto.frontend.k9444501818e6')}
          >
            <CalendarSidebar
              state={state}
              actions={actions}
              themeConfig={themeConfig}
              onCreateCalendar={() => {
                setModals(prev => ({ ...prev, mobileDrawer: false, calendarModal: true }));
                setModalData(prev => ({ ...prev, editingCalendar: null }));
              }}
              onEditCalendar={offlineMode
                ? undefined
                : (calendar) => {
                    setModals(prev => ({ ...prev, mobileDrawer: false }));
                    handleEditCalendar(calendar);
                  }}
              onDeleteCalendar={offlineMode ? undefined : handleDeleteCalendar}
              readOnly={offlineMode}
            />
          </MobileDrawer>
        )}

        {/* Calendar Grid */}
        <main className="flex-1 min-h-96">
          <CalendarGrid
            state={state}
            actions={actions}
            themeConfig={themeConfig}
            timeFormat={timeFormat}
            accentColor={themeColor}
            timelineFocusMode={isTimelineFocusActive}
            onToggleTimelineFocusMode={() => setTimelineFocusMode((prev) => !prev)}
            isMobile={isMobile}
            timezone={resolvedTimezone}
            readOnly={offlineMode}
            onShowDayDetails={(date) => {
              actions.setSelectedDate(date);
              setModals(prev => ({ ...prev, mobileBottomSheet: true }));
            }}
          />
        </main>
      </div>

      {/* Mobile Day Detail Sheet */}
      {isMobile && state.selectedDate && (
        <DayDetailSheet
          isOpen={modals.mobileBottomSheet}
          onClose={() => setModals(prev => ({ ...prev, mobileBottomSheet: false }))}
          date={state.selectedDate}
          events={state.events.filter(event => {
            const eventDate = new Date(event.startDate);
            eventDate.setHours(0, 0, 0, 0);
            const selectedDate = new Date(state.selectedDate!);
            selectedDate.setHours(0, 0, 0, 0);
            return eventDate.getTime() === selectedDate.getTime();
          })}
          onEventClick={(event) => {
            if (offlineMode) {
              return;
            }
            setModals(prev => ({ ...prev, mobileBottomSheet: false }));
            actions.editEvent(event);
          }}
          onCreateEvent={() => {
            if (offlineMode) {
              return;
            }
            setModals(prev => ({ ...prev, mobileBottomSheet: false }));
            actions.createEvent(state.selectedDate ?? undefined);
          }}
          themeColor={themeConfig.primary}
        />
      )}

      {/* Modals */}
      {!offlineMode && (
        <>
          <CalendarEventModal
            isOpen={modals.eventModal}
            onClose={() => setModals(prev => ({ ...prev, eventModal: false }))}
            onSave={handleSaveEvent}
            onDelete={handleDeleteEvent}
            editingEvent={modalData.editingEvent}
            calendars={state.calendars}
            selectedDate={state.selectedDate}
            selectedEndDate={state.selectedEndDate}
            themeColor={themeColor}
            timeFormat={timeFormat}
            error={errors.event}
            loading={
              createEventMutation.isPending ||
              updateEventMutation.isPending ||
              deleteEventMutation.isPending
            }
          />

          <CalendarManager
            isOpen={modals.calendarModal}
            onClose={() => setModals(prev => ({ ...prev, calendarModal: false }))}
            onCalendarChange={handleCalendarChange}
            editingCalendar={modalData.editingCalendar}
            themeColor={themeColor}
            error={errors.calendar}
          />

          <ConfirmationDialog
            isOpen={modals.confirmDialog}
            onClose={() => setModals(prev => ({ ...prev, confirmDialog: false }))}
            onConfirm={modalData.confirmAction || (() => {})}
            title={modalData.confirmTitle}
            message={modalData.confirmMessage}
            themeColor={themeColor}
          />
        </>
      )}
    </div>
  );
};

export default EnhancedCalendar;

