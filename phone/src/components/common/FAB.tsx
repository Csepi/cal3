import React from 'react';
import { StyleSheet } from 'react-native';
import { FAB as PaperFAB, useTheme } from 'react-native-paper';

/**
 * Floating Action Button (FAB) Component
 * Material Design FAB for primary actions
 *
 * Usage:
 * ```tsx
 * <FAB
 *   icon="plus"
 *   label="Create Event"
 *   onPress={() => navigate('CreateEvent')}
 * />
 * ```
 */

interface FABProps {
  /** Icon name from MaterialCommunityIcons */
  icon: string;
  /** Optional label text */
  label?: string;
  /** Press handler */
  onPress: () => void;
  /** Loading state */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Variant */
  variant?: 'primary' | 'secondary' | 'tertiary' | 'surface';
}

export const FAB: React.FC<FABProps> = ({
  icon,
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
}) => {
  const theme = useTheme();

  return (
    <PaperFAB
      icon={icon}
      label={label}
      onPress={onPress}
      loading={loading}
      disabled={disabled}
      variant={variant}
      style={styles.fab}
    />
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
