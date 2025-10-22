import React from 'react';
import { StyleSheet, ViewStyle, Pressable } from 'react-native';
import { Surface, useTheme } from 'react-native-paper';

/**
 * Card Component
 * Reusable Material Design card with elevation
 *
 * Usage:
 * ```tsx
 * <Card onPress={() => navigate('Detail')}>
 *   <Text>Card content</Text>
 * </Card>
 * ```
 */

interface CardProps {
  /** Card content */
  children: React.ReactNode;
  /** Optional press handler */
  onPress?: () => void;
  /** Optional long press handler */
  onLongPress?: () => void;
  /** Elevation level (1-5) */
  elevation?: 1 | 2 | 3 | 4 | 5;
  /** Additional styles */
  style?: ViewStyle;
  /** Disable card interaction */
  disabled?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  onLongPress,
  elevation = 1,
  style,
  disabled = false,
}) => {
  const theme = useTheme();

  const cardContent = (
    <Surface
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
        },
        style,
      ]}
      elevation={elevation}
    >
      {children}
    </Surface>
  );

  if (onPress || onLongPress) {
    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={disabled}
        style={({ pressed }) => [
          pressed && !disabled && styles.pressed,
        ]}
      >
        {cardContent}
      </Pressable>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  pressed: {
    opacity: 0.7,
  },
});
