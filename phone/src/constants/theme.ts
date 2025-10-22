import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

/**
 * Material Design 3 Theme Configuration
 * Customizes React Native Paper theme
 */

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    // Primary colors (Blue)
    primary: 'rgb(0, 95, 175)',
    onPrimary: 'rgb(255, 255, 255)',
    primaryContainer: 'rgb(212, 227, 255)',
    onPrimaryContainer: 'rgb(0, 28, 58)',

    // Secondary colors
    secondary: 'rgb(82, 95, 112)',
    onSecondary: 'rgb(255, 255, 255)',
    secondaryContainer: 'rgb(214, 227, 246)',
    onSecondaryContainer: 'rgb(15, 28, 42)',

    // Tertiary colors
    tertiary: 'rgb(106, 87, 121)',
    onTertiary: 'rgb(255, 255, 255)',
    tertiaryContainer: 'rgb(240, 219, 255)',
    onTertiaryContainer: 'rgb(36, 20, 50)',

    // Error colors
    error: 'rgb(186, 26, 26)',
    onError: 'rgb(255, 255, 255)',
    errorContainer: 'rgb(255, 218, 214)',
    onErrorContainer: 'rgb(65, 0, 2)',

    // Background colors
    background: 'rgb(253, 252, 255)',
    onBackground: 'rgb(26, 28, 30)',

    // Surface colors
    surface: 'rgb(253, 252, 255)',
    onSurface: 'rgb(26, 28, 30)',
    surfaceVariant: 'rgb(224, 226, 236)',
    onSurfaceVariant: 'rgb(67, 71, 78)',

    // Outline
    outline: 'rgb(116, 119, 127)',
    outlineVariant: 'rgb(195, 198, 207)',

    // Other
    shadow: 'rgb(0, 0, 0)',
    scrim: 'rgb(0, 0, 0)',
    inverseSurface: 'rgb(47, 48, 51)',
    inverseOnSurface: 'rgb(241, 240, 244)',
    inversePrimary: 'rgb(165, 200, 255)',

    // Elevation
    elevation: {
      level0: 'transparent',
      level1: 'rgb(240, 244, 251)',
      level2: 'rgb(233, 239, 249)',
      level3: 'rgb(226, 235, 248)',
      level4: 'rgb(224, 233, 247)',
      level5: 'rgb(219, 230, 246)',
    },

    // Surface disabled
    surfaceDisabled: 'rgba(26, 28, 30, 0.12)',
    onSurfaceDisabled: 'rgba(26, 28, 30, 0.38)',

    // Backdrop
    backdrop: 'rgba(45, 49, 56, 0.4)',
  },
  // Roundness
  roundness: 12,
};

/**
 * Calendar color palette
 * Matches Cal3 web app colors
 */
export const calendarColors = {
  red: '#ef4444',
  orange: '#f59e0b',
  yellow: '#eab308',
  lime: '#84cc16',
  green: '#10b981',
  emerald: '#22c55e',
  teal: '#14b8a6',
  cyan: '#06b6d4',
  sky: '#0ea5e9',
  blue: '#3b82f6',
  indigo: '#6366f1',
  violet: '#7c3aed',
  purple: '#8b5cf6',
  pink: '#ec4899',
  rose: '#f43f5e',
  slate: '#64748b',
} as const;

export type CalendarColor = keyof typeof calendarColors;
