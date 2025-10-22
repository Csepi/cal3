import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import type { MainTabScreenProps } from '@navigation/types';

/**
 * Calendar Screen (Placeholder)
 * Will show monthly/weekly calendar view
 * TODO: Implement in Phase 4
 */

type Props = MainTabScreenProps<'Calendar'>;

export const CalendarScreen: React.FC<Props> = () => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineMedium">Calendar Screen</Text>
      <Text variant="bodyMedium" style={styles.placeholder}>
        Calendar view coming in Phase 4
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
