# Cal3 Mobile - Design System

This document defines the UI/UX design system for the Cal3 Mobile application, ensuring consistency across all screens and components.

---

## Table of Contents

1. [Design Principles](#design-principles)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing](#spacing)
5. [Components](#components)
6. [Touch Interactions](#touch-interactions)
7. [Animations](#animations)
8. [Accessibility](#accessibility)
9. [Platform Differences](#platform-differences)

---

## Design Principles

### 1. Mobile-First
- Design for small screens, scale up for tablets
- Touch-friendly interactions (minimum 44pt touch targets)
- Thumb-reachable navigation (bottom tabs)

### 2. Consistency
- Match Cal3 web application where appropriate
- Use platform-specific patterns where needed
- Maintain visual hierarchy across screens

### 3. Performance
- Smooth 60 FPS animations
- Fast response to user interactions
- Minimal loading states

### 4. Clarity
- Clear visual feedback for actions
- Descriptive labels and helpful error messages
- Intuitive navigation structure

### 5. Accessibility
- Support for screen readers
- High contrast ratios (WCAG AA)
- Scalable text sizes
- Alternative input methods

---

## Color System

### Theme Colors (16 Rainbow Colors)

The app supports 16 theme colors matching the web application:

```typescript
// src/constants/theme.ts
export const THEME_COLORS = {
  red: { primary: '#ef4444', light: '#fca5a5', dark: '#b91c1c' },
  orange: { primary: '#f59e0b', light: '#fbbf24', dark: '#d97706' },
  yellow: { primary: '#eab308', light: '#fde047', dark: '#ca8a04' },
  lime: { primary: '#84cc16', light: '#bef264', dark: '#65a30d' },
  green: { primary: '#10b981', light: '#6ee7b7', dark: '#047857' },
  emerald: { primary: '#22c55e', light: '#86efac', dark: '#16a34a' },
  teal: { primary: '#14b8a6', light: '#5eead4', dark: '#0f766e' },
  cyan: { primary: '#06b6d4', light: '#67e8f9', dark: '#0e7490' },
  sky: { primary: '#0ea5e9', light: '#7dd3fc', dark: '#0369a1' },
  blue: { primary: '#3b82f6', light: '#93c5fd', dark: '#1e40af' },
  indigo: { primary: '#6366f1', light: '#a5b4fc', dark: '#4338ca' },
  violet: { primary: '#7c3aed', light: '#c4b5fd', dark: '#5b21b6' },
  purple: { primary: '#8b5cf6', light: '#c4b5fd', dark: '#6d28d9' },
  pink: { primary: '#ec4899', light: '#f9a8d4', dark: '#be185d' },
  rose: { primary: '#f43f5e', light: '#fda4af', dark: '#be123c' },
  slate: { primary: '#64748b', light: '#cbd5e1', dark: '#334155' },
};
```

### Semantic Colors

```typescript
export const SEMANTIC_COLORS = {
  // UI Colors
  background: '#ffffff',
  backgroundSecondary: '#f8fafc',
  surface: '#ffffff',
  border: '#e2e8f0',

  // Text Colors
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
  textDisabled: '#94a3b8',

  // Status Colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.25)',
};
```

### Dark Mode Support

```typescript
export const DARK_COLORS = {
  background: '#0f172a',
  backgroundSecondary: '#1e293b',
  surface: '#1e293b',
  border: '#334155',

  textPrimary: '#f1f5f9',
  textSecondary: '#cbd5e1',
  textDisabled: '#64748b',
};
```

### Color Usage Guidelines

| Purpose | Color | Usage |
|---------|-------|-------|
| Primary Actions | Theme color | Buttons, links, active states |
| Backgrounds | Neutral grays | Screen backgrounds, cards |
| Text | Dark grays | Body text, headings |
| Success | Green | Success messages, checkmarks |
| Warning | Orange/Yellow | Warnings, cautions |
| Error | Red | Error messages, destructive actions |
| Info | Blue | Information, neutral notifications |

---

## Typography

### Font Family

```typescript
export const FONTS = {
  regular: Platform.select({
    ios: 'System',
    android: 'Roboto',
  }),
  medium: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
  }),
  semibold: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
  }),
  bold: Platform.select({
    ios: 'System',
    android: 'Roboto-Bold',
  }),
};
```

### Type Scale

```typescript
export const TYPOGRAPHY = {
  // Display - Large headlines
  display: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700' as const,
  },

  // Heading - Section titles
  heading: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600' as const,
  },

  // Title - Card titles, small headings
  title: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600' as const,
  },

  // Subheading - Subsection titles
  subheading: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '500' as const,
  },

  // Body - Primary text
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },

  // Caption - Secondary text, labels
  caption: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
  },

  // Small - Tertiary text, timestamps
  small: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
  },
};
```

### Typography Usage

```typescript
import { Text, StyleSheet } from 'react-native';
import { TYPOGRAPHY, SEMANTIC_COLORS } from '../constants/theme';

<Text style={styles.display}>Welcome to Cal3</Text>
<Text style={styles.heading}>Your Calendars</Text>
<Text style={styles.body}>You have 3 events today</Text>

const styles = StyleSheet.create({
  display: {
    ...TYPOGRAPHY.display,
    color: SEMANTIC_COLORS.textPrimary,
  },
  heading: {
    ...TYPOGRAPHY.heading,
    color: SEMANTIC_COLORS.textPrimary,
  },
  body: {
    ...TYPOGRAPHY.body,
    color: SEMANTIC_COLORS.textSecondary,
  },
});
```

---

## Spacing

### Spacing Scale

```typescript
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};
```

### Usage Guidelines

| Size | Usage |
|------|-------|
| xs (4px) | Tight spacing, icon padding |
| sm (8px) | Small gaps, list item spacing |
| md (16px) | Default spacing, card padding |
| lg (24px) | Section spacing, screen margins |
| xl (32px) | Large spacing between sections |
| 2xl (48px) | Extra large spacing |
| 3xl (64px) | Maximum spacing |

### Layout Examples

```typescript
// Screen padding
const styles = StyleSheet.create({
  screen: {
    padding: SPACING.lg, // 24px padding
  },
  card: {
    padding: SPACING.md, // 16px padding
    marginBottom: SPACING.md, // 16px margin
  },
  listItem: {
    paddingVertical: SPACING.sm, // 8px vertical
    paddingHorizontal: SPACING.md, // 16px horizontal
  },
});
```

---

## Components

### Button

```typescript
// src/components/common/Button.tsx
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, styles[variant], styles[size]]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text style={styles.text}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    minHeight: 44, // Minimum touch target
  },
  primary: {
    backgroundColor: THEME_COLORS.blue.primary,
  },
  secondary: {
    backgroundColor: SEMANTIC_COLORS.backgroundSecondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: SEMANTIC_COLORS.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  small: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  medium: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  large: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
});
```

### Input

```typescript
// src/components/common/Input.tsx
interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  error,
  disabled,
  multiline,
  leftIcon,
  rightIcon,
}) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, error && styles.inputError]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry}
          editable={!disabled}
          multiline={multiline}
          placeholderTextColor={SEMANTIC_COLORS.textDisabled}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};
```

### Card

```typescript
// src/components/common/Card.tsx
interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const Card: React.FC<CardProps> = ({ children, onPress, style }) => {
  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {children}
    </Component>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: SEMANTIC_COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});
```

### Badge

```typescript
// src/components/common/Badge.tsx
interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'small' | 'medium';
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'medium',
}) => {
  return (
    <View style={[styles.badge, styles[variant], styles[size]]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
};
```

---

## Touch Interactions

### Touch Target Sizes

**Minimum touch target**: 44pt × 44pt (iOS) / 48dp × 48dp (Android)

```typescript
const TOUCH_TARGET_SIZE = {
  minimum: 44,
  comfortable: 56,
};

// Extend touch target invisibly if needed
const styles = StyleSheet.create({
  button: {
    minWidth: TOUCH_TARGET_SIZE.minimum,
    minHeight: TOUCH_TARGET_SIZE.minimum,
  },
});
```

### Gestures

| Gesture | Action | Usage |
|---------|--------|-------|
| Tap | Select/Activate | Select event, open detail |
| Long Press | Context menu | Show event options |
| Swipe Left | Delete/Archive | Delete event from list |
| Swipe Right | Mark complete | Complete task |
| Swipe Up/Down | Scroll | Navigate lists |
| Swipe Left/Right | Navigate | Change month/week |
| Pinch | Zoom | Zoom calendar view |
| Pull Down | Refresh | Refresh data |

### Gesture Implementation

```typescript
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

const SwipeableEventCard = ({ event, onDelete }) => {
  const swipeGesture = Gesture.Pan()
    .onUpdate((e) => {
      // Update animation
    })
    .onEnd((e) => {
      if (e.translationX < -100) {
        onDelete(event);
      }
    });

  return (
    <GestureDetector gesture={swipeGesture}>
      <EventCard event={event} />
    </GestureDetector>
  );
};
```

---

## Animations

### Animation Principles

1. **Purpose**: Animations should clarify, not distract
2. **Speed**: Fast enough to feel responsive, slow enough to follow
3. **Easing**: Natural curves (ease-in-out)
4. **Consistency**: Same actions = same animations

### Animation Durations

```typescript
export const ANIMATION_DURATION = {
  fast: 150,
  normal: 250,
  slow: 400,
};
```

### Common Animations

```typescript
import Animated, {
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';

// Fade in
const fadeIn = (opacity) => {
  return withTiming(opacity, {
    duration: ANIMATION_DURATION.normal,
  });
};

// Slide in
const slideIn = (translateY) => {
  return withSpring(translateY, {
    damping: 15,
    stiffness: 90,
  });
};

// Scale
const scale = (scale) => {
  return withTiming(scale, {
    duration: ANIMATION_DURATION.fast,
  });
};
```

---

## Accessibility

### Screen Reader Support

```typescript
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Create new event"
  accessibilityHint="Opens a form to create a new calendar event"
  accessibilityRole="button"
  onPress={handleCreateEvent}
>
  <Icon name="plus" />
</TouchableOpacity>
```

### Color Contrast

All text must meet WCAG AA standards:
- Normal text (< 18pt): 4.5:1 contrast ratio
- Large text (≥ 18pt): 3:1 contrast ratio

### Dynamic Text Size

Support iOS Dynamic Type and Android font scaling:

```typescript
import { useWindowDimensions, PixelRatio } from 'react-native';

const scaledFontSize = (size: number) => {
  const scale = PixelRatio.getFontScale();
  return size * scale;
};
```

### Keyboard Navigation

Ensure all interactive elements are accessible via keyboard (external keyboard support).

---

## Platform Differences

### iOS vs Android

| Element | iOS | Android |
|---------|-----|---------|
| **Navigation** | Swipe from left edge to go back | Back button in navigation bar |
| **Date Picker** | Spinner-style picker | Calendar-style picker |
| **Time Picker** | Spinner-style picker | Clock-style picker |
| **Action Sheet** | Bottom sheet with Cancel button | Dialog with actions |
| **Switch** | iOS-style toggle | Material switch |
| **Loading** | UIActivityIndicatorView | CircularProgressIndicator |

### Platform-Specific Components

```typescript
import { Platform } from 'react-native';

const DatePicker = Platform.select({
  ios: DatePickerIOS,
  android: DatePickerAndroid,
});

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.select({
      ios: 20, // Status bar height
      android: 0,
    }),
  },
});
```

---

## Summary

The Cal3 Mobile design system provides:

- **16 Theme Colors**: Consistent with web app
- **Typography Scale**: Clear hierarchy with 7 sizes
- **Spacing System**: Consistent spacing using multiples of 4/8
- **Touch-Optimized**: Minimum 44pt touch targets
- **Accessible**: WCAG AA compliance, screen reader support
- **Platform-Aware**: iOS and Android patterns

For implementation examples, see the component library in `src/components/common/`.
