import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { EventList } from '@components/events';
import { FAB } from '@components/common';
import { useUpcomingEvents } from '@hooks/useEvents';
import { useAuth } from '@hooks/useAuth';
import type { MainTabScreenProps } from '@navigation/types';
import type { Event } from '@types/Event';

/**
 * Enhanced Events Screen
 * Displays upcoming events with real data from API
 *
 * Features:
 * - Load upcoming events (next 7 days)
 * - Pull-to-refresh
 * - Event press to view details
 * - FAB to create new event
 * - Loading/error/empty states
 */

type Props = MainTabScreenProps<'Events'>;

export const EventsScreen: React.FC<Props> = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  // Load upcoming events
  const {
    data: events = [],
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useUpcomingEvents();

  const handleEventPress = (event: Event) => {
    // TODO: Navigate to Event Detail screen in modal
    console.log('Event pressed:', event.id);
  };

  const handleCreateEvent = () => {
    navigation.navigate('CreateEvent');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <EventList
        events={events}
        onEventPress={handleEventPress}
        isLoading={isLoading}
        error={error?.message || null}
        onRefresh={refetch}
        isRefreshing={isRefetching}
        timeFormat={user?.timeFormat || '12h'}
        showDateHeaders
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
