import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import type { MainTabScreenProps } from '@navigation/types';

/**
 * Events Screen (Placeholder)
 * Will show list of upcoming events
 * TODO: Implement in Phase 4
 */

type Props = MainTabScreenProps<'Events'>;

export const EventsScreen: React.FC<Props> = () => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineMedium">Events Screen</Text>
      <Text variant="bodyMedium" style={styles.placeholder}>
        Events list coming in Phase 4
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  placeholder: {
    marginTop: 8,
    textAlign: 'center',
  },
});
