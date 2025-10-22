import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { calendarColors, type CalendarColor } from '@constants/theme';

/**
 * Color Picker Component
 * Allows users to select from Cal3 color palette
 *
 * Usage:
 * ```tsx
 * <ColorPicker
 *   selectedColor="blue"
 *   onSelectColor={(color) => updateTheme(color)}
 * />
 * ```
 */

interface ColorPickerProps {
  /** Currently selected color */
  selectedColor: CalendarColor;
  /** Color selection handler */
  onSelectColor: (color: CalendarColor) => void;
  /** Optional label */
  label?: string;
}

const colorOrder: CalendarColor[] = [
  'red',
  'orange',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'pink',
  'rose',
  'slate',
];

export const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor,
  onSelectColor,
  label = 'Select Color',
}) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {label && (
        <Text variant="titleMedium" style={styles.label}>
          {label}
        </Text>
      )}
      <View style={styles.grid}>
        {colorOrder.map((color) => {
          const isSelected = color === selectedColor;
          const colorValue = calendarColors[color];

          return (
            <Pressable
              key={color}
              onPress={() => onSelectColor(color)}
              style={({ pressed }) => [
                styles.colorButton,
                {
                  backgroundColor: colorValue,
                  transform: [{ scale: pressed ? 0.9 : 1 }],
                  borderWidth: isSelected ? 3 : 0,
                  borderColor: theme.colors.onSurface,
                },
              ]}
            >
              {isSelected && (
                <Icon
                  name="check"
                  size={24}
                  color="#ffffff"
                  style={styles.checkIcon}
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
    marginVertical: 8,
  },
  label: {
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  checkIcon: {
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
