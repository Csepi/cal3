/**
 * Core Calendar Hook
 *
 * Main hook for calendar state management and business logic
 */

import { useState, useCallback, useMemo } from 'react';
import type { Event } from '../../types/Event';
import type {
  CalendarState,
  CalendarActions,
  UseCalendarReturn,
  EventFilter,
  EventSort,
  CalendarSelection
} from '../types';
import {
  isToday as utilIsToday,
  isSameDay,
  addDays,
  addWeeks,
  addMonths,
  startOfMonth,
  endOfMonth
} from '../../../utils/calendar';

const initialFilter: EventFilter = {
  calendarIds: [],
  categories: [],
  searchText: '',
  tags: [],
};

const initialSort: EventSort = {
  field: 'startDate',
  direction: 'asc'
};

type SortValue = number | string;
type WeekRange = { startDate: Date; endDate: Date };

export const useCalendar = (
  initialDate: Date = new Date(),
  initialView: 'month' | 'week' | 'day' = 'month'
): UseCalendarReturn => {
  // Core state
  const [state, setState] = useState<CalendarState>({
    currentDate: initialDate,
    selectedDate: undefined,
    highlightedDates: [],
    view: initialView,
    events: [],
    loading: false,
    error: null,
    selection: undefined,
    filter: initialFilter,
    sort: initialSort
  });

  // Action callbacks
  const setCurrentDate = useCallback((date: Date) => {
    setState(prev => ({ ...prev, currentDate: date }));
  }, []);

  const setSelectedDate = useCallback((date?: Date) => {
    setState(prev => ({ ...prev, selectedDate: date }));
  }, []);

  const setHighlightedDates = useCallback((dates: Date[]) => {
    setState(prev => ({ ...prev, highlightedDates: dates }));
  }, []);

  const setView = useCallback((view: 'month' | 'week' | 'day') => {
    setState(prev => ({ ...prev, view }));
  }, []);

  const setEvents = useCallback((events: Event[]) => {
    setState(prev => ({ ...prev, events }));
  }, []);

  const addEvent = useCallback((event: Event) => {
    setState(prev => ({
      ...prev,
      events: [...prev.events, event]
    }));
  }, []);

  const updateEvent = useCallback((eventId: number, updates: Partial<Event>) => {
    setState(prev => ({
      ...prev,
      events: prev.events.map(event =>
        event.id === eventId ? { ...event, ...updates } : event
      )
    }));
  }, []);

  const removeEvent = useCallback((eventId: number) => {
    setState(prev => ({
      ...prev,
      events: prev.events.filter(event => event.id !== eventId)
    }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const setSelection = useCallback((selection?: CalendarSelection) => {
    setState(prev => ({ ...prev, selection }));
  }, []);

  const setFilter = useCallback((filter: Partial<EventFilter>) => {
    setState(prev => ({
      ...prev,
      filter: { ...prev.filter, ...filter }
    }));
  }, []);

  const setSort = useCallback((sort: EventSort) => {
    setState(prev => ({ ...prev, sort }));
  }, []);

  const navigate = useCallback((direction: 'previous' | 'next' | 'today') => {
    setState(prev => {
      let newDate: Date;

      if (direction === 'today') {
        newDate = new Date();
      } else {
        const increment = direction === 'next' ? 1 : -1;

        switch (prev.view) {
          case 'day':
            newDate = addDays(prev.currentDate, increment);
            break;
          case 'week':
            newDate = addWeeks(prev.currentDate, increment);
            break;
          case 'month':
            newDate = addMonths(prev.currentDate, increment);
            break;
          default:
            newDate = prev.currentDate;
        }
      }

      return { ...prev, currentDate: newDate };
    });
  }, []);

  const goToDate = useCallback((date: Date) => {
    setState(prev => ({ ...prev, currentDate: date }));
  }, []);

  // Actions object
  const actions: CalendarActions = useMemo(() => ({
    setCurrentDate,
    setSelectedDate,
    setHighlightedDates,
    setView,
    setEvents,
    addEvent,
    updateEvent,
    removeEvent,
    setLoading,
    setError,
    setSelection,
    setFilter,
    setSort,
    navigate,
    goToDate
  }), []);

  // Computed values
  const computed = useMemo(() => {
    // Filter events
    const filteredEvents = state.events.filter(event => {
      const { filter } = state;

      // Calendar filter
      if (filter.calendarIds && filter.calendarIds.length > 0) {
        if (!filter.calendarIds.includes(event.calendar.id)) {
          return false;
        }
      }

      // Search text filter
      if (filter.searchText) {
        const searchLower = filter.searchText.toLowerCase();
        const matchesTitle = event.title.toLowerCase().includes(searchLower);
        const matchesDescription = event.description?.toLowerCase().includes(searchLower);
        const matchesLocation = event.location?.toLowerCase().includes(searchLower);

        if (!matchesTitle && !matchesDescription && !matchesLocation) {
          return false;
        }
      }

      // Date range filter
      if (filter.dateRange) {
        const eventDate = new Date(event.startDate);
        if (eventDate < filter.dateRange.start || eventDate > filter.dateRange.end) {
          return false;
        }
      }

      return true;
    });

    // Sort events
    const sortedEvents = [...filteredEvents].sort((a, b) => {
      const { sort } = state;
      let aValue: SortValue;
      let bValue: SortValue;

      switch (sort.field) {
        case 'startDate':
          aValue = new Date(a.startDate).getTime();
          bValue = new Date(b.startDate).getTime();
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'calendar':
          aValue = a.calendar.name.toLowerCase();
          bValue = b.calendar.name.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sort.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sort.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return {
      filteredEvents,
      sortedEvents,
      eventsForDate: (date: Date) => {
        return sortedEvents.filter(event => {
          const eventDate = new Date(event.startDate);
          return isSameDay(eventDate, date);
        });
      },
      eventsForWeek: (week: WeekRange) => {
        const weekStart = week.startDate;
        const weekEnd = week.endDate;

        return sortedEvents.filter(event => {
          const eventDate = new Date(event.startDate);
          return eventDate >= weekStart && eventDate <= weekEnd;
        });
      },
      eventsForMonth: (year: number, month: number) => {
        const monthStart = startOfMonth(new Date(year, month, 1));
        const monthEnd = endOfMonth(new Date(year, month, 1));

        return sortedEvents.filter(event => {
          const eventDate = new Date(event.startDate);
          return eventDate >= monthStart && eventDate <= monthEnd;
        });
      },
      isToday: (date: Date) => utilIsToday(date),
      isSelected: (date: Date) => {
        return state.selectedDate ? isSameDay(date, state.selectedDate) : false;
      },
      isHighlighted: (date: Date) => {
        return state.highlightedDates.some(highlightedDate =>
          isSameDay(date, highlightedDate)
        );
      }
    };
  }, [
    state.events,
    state.filter,
    state.sort,
    state.selectedDate,
    state.highlightedDates
  ]);

  return {
    state,
    actions,
    computed
  };
};
