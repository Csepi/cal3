import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Card } from '@components/common';
import { calendarColors } from '@constants/theme';
import type { Event } from '@types/Event';
import { format, parseISO } from 'date-fns';

/**
 * Event Card Component
 * Displays event information in a card format
 *
 * Usage:
 * ```tsx
 * <EventCard
 *   event={event}
 *   onPress={() => navigate('EventDetail', { eventId: event.id })}
 * />
 * ```
 */

interface EventCardProps {
  /** Event data */
  event: Event;
  /** Optional press handler */
  onPress?: () => void;
  /** Optional long press handler */
  onLongPress?: () => void;
  /** Time format (12h or 24h) */
  timeFormat?: '12h' | '24h';
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onPress,
  onLongPress,
  timeFormat = '12h',
}) => {
  const theme = useTheme();

  // Parse dates
  const startDate = parseISO(event.startDate);
  const endDate = parseISO(event.endDate);

  // Format date and time
  const dateFormat = 'MMM d, yyyy';
  const timeFormatStr = timeFormat === '12h' ? 'h:mm a' : 'HH:mm';

  const startDateStr = format(startDate, dateFormat);
  const startTimeStr = event.isAllDay ? 'All Day' : format(startDate, timeFormatStr);
  const endTimeStr = event.isAllDay ? '' : format(endDate, timeFormatStr);

  // Get event color
  const eventColor = event.color
    ? calendarColors[event.color]
    : event.calendar?.color
    ? calendarColors[event.calendar.color]
    : theme.colors.primary;

  // Status icons and colors
  const getStatusInfo = () => {
    switch (event.status) {
      case 'tentative':
        return { icon: 'help-circle', color: theme.colors.secondary };
      case 'cancelled':
        return { icon: 'cancel', color: theme.colors.error };
      default:
        return { icon: 'check-circle', color: theme.colors.primary };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Card onPress={onPress} onLongPress={onLongPress}>
      <View style={styles.container}>
        {/* Color indicator */}
        <View style={[styles.colorIndicator, { backgroundColor: eventColor }]} />

        {/* Content */}
        <View style={styles.content}>
          {/* Title and Status */}
          <View style={styles.header}>
            <Text variant="titleMedium" style={styles.title} numberOfLines={2}>
              {event.title}
            </Text>
            {event.status && event.status !== 'confirmed' && (
              <Icon
                name={statusInfo.icon}
                size={20}
                color={statusInfo.color}
              />
            )}
          </View>

          {/* Date and Time */}
          <View style={styles.row}>
            <Icon
              name="calendar"
              size={16}
              color={theme.colors.onSurfaceVariant}
              style={styles.icon}
            />
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {startDateStr}
            </Text>
          </View>

          {!event.isAllDay && (
            <View style={styles.row}>
              <Icon
                name="clock-outline"
                size={16}
                color={theme.colors.onSurfaceVariant}
                style={styles.icon}
              />
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {startTimeStr} - {endTimeStr}
              </Text>
            </View>
          )}

          {event.isAllDay && (
            <View style={styles.row}>
              <Icon
                name="clock-outline"
                size={16}
                color={theme.colors.onSurfaceVariant}
                style={styles.icon}
              />
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {startTimeStr}
              </Text>
            </View>
          )}

          {/* Location */}
          {event.location && (
            <View style={styles.row}>
              <Icon
                name="map-marker"
                size={16}
                color={theme.colors.onSurfaceVariant}
                style={styles.icon}
              />
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant }}
                numberOfLines={1}
              >
                {event.location}
              </Text>
            </View>
          )}

          {/* Calendar */}
          {event.calendar && (
            <View style={styles.row}>
              <Chip
                mode="outlined"
                compact
                style={styles.chip}
                textStyle={styles.chipText}
              >
                {event.calendar.name}
              </Chip>
            </View>
          )}
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  colorIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    marginRight: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  icon: {
    marginRight: 8,
  },
  chip: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  chipText: {
    fontSize: 12,
  },
});
