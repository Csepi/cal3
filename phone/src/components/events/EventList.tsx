import React from 'react';
import { FlatList, StyleSheet, View, RefreshControl } from 'react-native';
import { Text, Divider, useTheme } from 'react-native-paper';
import { EventCard } from './EventCard';
import { EmptyState, Loading, ErrorView } from '@components/common';
import type { Event } from '@types/Event';
import { format, parseISO, isSameDay } from 'date-fns';

/**
 * Event List Component
 * Displays a list of events grouped by date
 *
 * Usage:
 * ```tsx
 * <EventList
 *   events={events}
 *   onEventPress={(event) => navigate('EventDetail', { eventId: event.id })}
 *   isLoading={isLoading}
 *   error={error}
 *   onRefresh={refetch}
 * />
 * ```
 */

interface EventListProps {
  /** Array of events */
  events?: Event[];
  /** Event press handler */
  onEventPress?: (event: Event) => void;
  /** Event long press handler */
  onEventLongPress?: (event: Event) => void;
  /** Loading state */
  isLoading?: boolean;
  /** Error message */
  error?: string | null;
  /** Refresh handler */
  onRefresh?: () => void;
  /** Refreshing state */
  isRefreshing?: boolean;
  /** Time format */
  timeFormat?: '12h' | '24h';
  /** Show date headers */
  showDateHeaders?: boolean;
}

export const EventList: React.FC<EventListProps> = ({
  events = [],
  onEventPress,
  onEventLongPress,
  isLoading = false,
  error = null,
  onRefresh,
  isRefreshing = false,
  timeFormat = '12h',
  showDateHeaders = true,
}) => {
  const theme = useTheme();

  // Loading state
  if (isLoading && events.length === 0) {
    return <Loading message="Loading events..." />;
  }

  // Error state
  if (error && events.length === 0) {
    return <ErrorView message={error} onRetry={onRefresh} />;
  }

  // Empty state
  if (events.length === 0) {
    return (
      <EmptyState
        icon="calendar-blank"
        title="No Events"
        message="You don't have any events yet."
      />
    );
  }

  // Group events by date
  const groupedEvents = showDateHeaders ? groupEventsByDate(events) : null;

  const renderItem = ({ item, index }: { item: Event; index: number }) => {
    const showDateHeader =
      showDateHeaders &&
      groupedEvents &&
      (index === 0 ||
        !isSameDay(parseISO(item.startDate), parseISO(events[index - 1].startDate)));

    return (
      <View>
        {showDateHeader && (
          <View style={styles.dateHeader}>
            <Text variant="titleMedium" style={{ color: theme.colors.primary }}>
              {format(parseISO(item.startDate), 'EEEE, MMMM d, yyyy')}
            </Text>
            <Divider style={styles.divider} />
          </View>
        )}
        <EventCard
          event={item}
          onPress={() => onEventPress?.(item)}
          onLongPress={() => onEventLongPress?.(item)}
          timeFormat={timeFormat}
        />
      </View>
    );
  };

  return (
    <FlatList
      data={events}
      renderItem={renderItem}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={styles.listContent}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        ) : undefined
      }
    />
  );
};

/**
 * Helper function to group events by date
 */
const groupEventsByDate = (events: Event[]): Map<string, Event[]> => {
  const groups = new Map<string, Event[]>();

  events.forEach((event) => {
    const dateKey = format(parseISO(event.startDate), 'yyyy-MM-dd');
    const existing = groups.get(dateKey) || [];
    groups.set(dateKey, [...existing, event]);
  });

  return groups;
};

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
  },
  dateHeader: {
    marginTop: 16,
    marginBottom: 8,
  },
  divider: {
    marginTop: 8,
  },
});
