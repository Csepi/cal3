import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import { MonthGrid } from '@components/calendar';
import { FAB } from '@components/common';
import type { MainTabScreenProps } from '@navigation/types';

/**
 * Enhanced Calendar Screen
 * Displays a monthly calendar view
 *
 * Features:
 * - Month grid view
 * - Date selection
 * - Event indicators
 * - FAB for creating events
 */

type Props = MainTabScreenProps<'Calendar'>;

export const CalendarScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // TODO: Load events from API in Phase 4
  const eventDates: Date[] = [];

  const handleDatePress = (date: Date) => {
    setSelectedDate(date);
    // TODO: Navigate to day view or show events for selected date
  };

  const handleCreateEvent = () => {
    // TODO: Navigate to create event screen in Phase 4
    console.log('Create event');
  };

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
