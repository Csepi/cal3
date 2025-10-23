import React, { useState, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MonthGrid } from '@components/calendar';
import { FAB, Loading, ErrorView } from '@components/common';
import { useEventsByDateRange } from '@hooks/useEvents';
import { startOfMonth, endOfMonth, parseISO } from 'date-fns';
import type { MainTabScreenProps } from '@navigation/types';

/**
 * Enhanced Calendar Screen
 * Displays a monthly calendar view with real events
 *
 * Features:
 * - Month grid view
 * - Event indicators on dates with events
 * - Date selection
 * - Month navigation
 * - FAB for creating events
 * - Load events for current month
 */

type Props = MainTabScreenProps<'Calendar'>;

export const CalendarScreen: React.FC<Props> = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Calculate month date range
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  // Load events for current month
  const {
    data: events = [],
    isLoading,
    error,
    refetch,
  } = useEventsByDateRange(
    monthStart.toISOString(),
    monthEnd.toISOString()
  );

  // Extract dates that have events
  const eventDates = useMemo(() => {
    return events.map((event) => parseISO(event.startDate));
  }, [events]);

  const handleDatePress = (date: Date) => {
    setSelectedDate(date);
    // TODO: Navigate to day view or show events for selected date in Phase 4.5
  };

  const handleCreateEvent = () => {
    navigation.navigate('CreateEvent');
  };

  // Loading state
  if (isLoading) {
    return <Loading message="Loading calendar..." />;
  }

  // Error state
  if (error) {
    return (
      <ErrorView
        message={error.message || 'Failed to load calendar'}
        onRetry={refetch}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <MonthGrid
        selectedDate={selectedDate}
        currentMonth={currentMonth}
        onDatePress={handleDatePress}
        onMonthChange={setCurrentMonth}
        eventDates={eventDates}
      />
      <FAB icon="plus" onPress={handleCreateEvent} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
