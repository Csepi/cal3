import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

/**
 * Month Grid Component
 * Displays a calendar month grid view
 *
 * Usage:
 * ```tsx
 * <MonthGrid
 *   selectedDate={new Date()}
 *   onDatePress={(date) => setSelectedDate(date)}
 *   eventDates={eventDates}
 * />
 * ```
 */

interface MonthGridProps {
  /** Selected date */
  selectedDate: Date;
  /** Date press handler */
  onDatePress?: (date: Date) => void;
  /** Array of dates that have events */
  eventDates?: Date[];
  /** Month to display (defaults to selectedDate month) */
  currentMonth?: Date;
  /** Month change handler */
  onMonthChange?: (date: Date) => void;
}

export const MonthGrid: React.FC<MonthGridProps> = ({
  selectedDate,
  onDatePress,
  eventDates = [],
  currentMonth = selectedDate,
  onMonthChange,
}) => {
  const theme = useTheme();

  // Calculate calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Days of week header
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Check if date has events
  const hasEvents = (date: Date): boolean => {
    return eventDates.some((eventDate) => isSameDay(date, eventDate));
  };

  // Handle month navigation
  const handlePrevMonth = () => {
    const prevMonth = subMonths(currentMonth, 1);
    onMonthChange?.(prevMonth);
  };

  const handleNextMonth = () => {
    const nextMonth = addMonths(currentMonth, 1);
    onMonthChange?.(nextMonth);
  };

  const handleToday = () => {
    onMonthChange?.(new Date());
  };

  return (
    <View style={styles.container}>
      {/* Month Header */}
      <View style={styles.header}>
        <Pressable onPress={handlePrevMonth} style={styles.navButton}>
          <Icon name="chevron-left" size={24} color={theme.colors.onSurface} />
        </Pressable>

        <Pressable onPress={handleToday}>
          <Text variant="titleLarge">
            {format(currentMonth, 'MMMM yyyy')}
          </Text>
        </Pressable>

        <Pressable onPress={handleNextMonth} style={styles.navButton}>
          <Icon name="chevron-right" size={24} color={theme.colors.onSurface} />
        </Pressable>
      </View>

      {/* Weekday Headers */}
      <View style={styles.weekDaysRow}>
        {weekDays.map((day) => (
          <View key={day} style={styles.weekDay}>
            <Text
              variant="labelSmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.grid}>
        {days.map((day, index) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = isSameDay(day, selectedDate);
          const isDayToday = isToday(day);
          const dayHasEvents = hasEvents(day);

          return (
            <Pressable
              key={index}
              onPress={() => onDatePress?.(day)}
              style={({ pressed }) => [
                styles.day,
                isSelected && { backgroundColor: theme.colors.primary },
                isDayToday && !isSelected && {
                  borderWidth: 2,
                  borderColor: theme.colors.primary,
                },
                pressed && styles.dayPressed,
              ]}
              disabled={!isCurrentMonth}
            >
              <Text
                variant="bodyMedium"
                style={[
                  styles.dayText,
                  !isCurrentMonth && { color: theme.colors.onSurfaceDisabled },
                  isSelected && { color: theme.colors.onPrimary },
                  isDayToday && !isSelected && { color: theme.colors.primary },
                ]}
              >
                {format(day, 'd')}
              </Text>
              {dayHasEvents && isCurrentMonth && (
                <View
                  style={[
                    styles.eventDot,
                    {
                      backgroundColor: isSelected
                        ? theme.colors.onPrimary
                        : theme.colors.primary,
                    },
                  ]}
                />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  day: {
    width: '14.28%', // 100% / 7 days
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  dayPressed: {
    opacity: 0.7,
  },
  dayText: {
    textAlign: 'center',
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
});
