import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

/**
 * Error View Component
 * Displays error states with retry option
 *
 * Usage:
 * ```tsx
 * <ErrorView
 *   message="Failed to load events"
 *   onRetry={() => refetch()}
 * />
 * ```
 */

interface ErrorViewProps {
  /** Error message to display */
  message: string;
  /** Optional retry button handler */
  onRetry?: () => void;
  /** Optional retry button label */
  retryLabel?: string;
}

export const ErrorView: React.FC<ErrorViewProps> = ({
  message,
  onRetry,
  retryLabel = 'Retry',
}) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: theme.colors.errorContainer },
        ]}
      >
        <Icon
          name="alert-circle"
          size={64}
          color={theme.colors.error}
        />
      </View>
      <Text variant="headlineSmall" style={styles.title}>
        Oops!
      </Text>
      <Text
        variant="bodyMedium"
        style={[styles.message, { color: theme.colors.onSurfaceVariant }]}
      >
        {message}
      </Text>
      {onRetry && (
        <Button
          mode="contained"
          onPress={onRetry}
          icon="refresh"
          style={styles.button}
        >
          {retryLabel}
        </Button>
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
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    minWidth: 150,
  },
});
