import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';

/**
 * Loading Component
 * Displays a centered loading indicator with optional message
 *
 * Usage:
 * ```tsx
 * <Loading message="Loading events..." />
 * ```
 */

interface LoadingProps {
  /** Optional loading message */
  message?: string;
  /** Size of the spinner */
  size?: 'small' | 'large';
  /** Background color override */
  backgroundColor?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  message,
  size = 'large',
  backgroundColor,
}) => {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: backgroundColor || theme.colors.background },
      ]}
    >
      <ActivityIndicator size={size} color={theme.colors.primary} />
      {message && (
        <Text
          variant="bodyMedium"
          style={[styles.message, { color: theme.colors.onBackground }]}
        >
          {message}
        </Text>
      )}
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
  message: {
    marginTop: 16,
    textAlign: 'center',
  },
});
