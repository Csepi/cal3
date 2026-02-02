/**
 * Theme constants and color definitions for the PrimeCal Calendar application
 *
 * This file contains all theme-related constants including:
 * - Color palette definitions
 * - Theme color configurations with gradients, buttons, and utilities
 * - Shared theme functions and helpers
 */

// Core theme color values in rainbow order
export const THEME_COLORS = {
  RED: '#ef4444',
  ORANGE: '#f59e0b',
  YELLOW: '#eab308',
  LIME: '#84cc16',
  GREEN: '#10b981',
  EMERALD: '#22c55e',
  TEAL: '#14b8a6',
  CYAN: '#06b6d4',
  SKY: '#0ea5e9',
  BLUE: '#3b82f6',
  INDIGO: '#6366f1',
  VIOLET: '#7c3aed',
  PURPLE: '#8b5cf6',
  PINK: '#ec4899',
  ROSE: '#f43f5e',
  SLATE: '#64748b'
} as const;

// Theme color options for user selection (maintains rainbow order)
export const THEME_COLOR_OPTIONS = [
  { name: 'Red', value: THEME_COLORS.RED, gradient: 'from-red-500 to-red-600' },
  { name: 'Orange', value: THEME_COLORS.ORANGE, gradient: 'from-orange-500 to-orange-600' },
  { name: 'Yellow', value: THEME_COLORS.YELLOW, gradient: 'from-yellow-500 to-yellow-600' },
  { name: 'Lime', value: THEME_COLORS.LIME, gradient: 'from-lime-500 to-lime-600' },
  { name: 'Green', value: THEME_COLORS.GREEN, gradient: 'from-green-500 to-green-600' },
  { name: 'Emerald', value: THEME_COLORS.EMERALD, gradient: 'from-emerald-500 to-emerald-600' },
  { name: 'Teal', value: THEME_COLORS.TEAL, gradient: 'from-teal-500 to-teal-600' },
  { name: 'Cyan', value: THEME_COLORS.CYAN, gradient: 'from-cyan-500 to-cyan-600' },
  { name: 'Sky', value: THEME_COLORS.SKY, gradient: 'from-sky-500 to-sky-600' },
  { name: 'Blue', value: THEME_COLORS.BLUE, gradient: 'from-blue-500 to-blue-600' },
  { name: 'Indigo', value: THEME_COLORS.INDIGO, gradient: 'from-indigo-500 to-indigo-600' },
  { name: 'Violet', value: THEME_COLORS.VIOLET, gradient: 'from-violet-500 to-violet-600' },
  { name: 'Purple', value: THEME_COLORS.PURPLE, gradient: 'from-purple-500 to-purple-600' },
  { name: 'Pink', value: THEME_COLORS.PINK, gradient: 'from-pink-500 to-pink-600' },
  { name: 'Rose', value: THEME_COLORS.ROSE, gradient: 'from-rose-500 to-rose-600' },
  { name: 'Slate', value: THEME_COLORS.SLATE, gradient: 'from-slate-500 to-slate-600' }
] as const;

// Comprehensive theme configuration with all styling variants
export interface ThemeConfig {
  primary: string;
  secondary?: string;
  light: string;
  border: string;
  accent: string;
  hover: string;
  text: string;
  button: string;
  focus: string;
  gradient: {
    background: string;
    header?: string;
    today?: string;
    selected?: string;
    events?: string;
    primary?: string;
  };
  // Legacy aliases kept for compatibility with older components
  gradientBg?: string;
  gradientFrom?: string;
  gradientTo?: string;
  bgColor?: string;
  animatedGradient?: {
    circle1: string;
    circle2: string;
    circle3: string;
  };
}

// Complete theme configuration map
const THEME_CONFIG_MAP: Record<string, ThemeConfig> = {
  [THEME_COLORS.RED]: {
    primary: 'red',
    secondary: 'rose',
    light: 'red-100',
    border: 'red-200',
    accent: 'red-400',
    hover: 'red-200',
    text: 'red-700',
    button: 'bg-red-500 hover:bg-red-600',
    focus: 'focus:ring-red-500',
    gradient: {
      background: 'from-red-50 via-red-100 to-red-200',
      header: 'from-red-500 to-rose-500',
      today: 'from-red-400 to-rose-500',
      selected: 'from-rose-500 to-red-600',
      events: 'from-red-100 to-rose-100',
    },
    animatedGradient: {
      circle1: 'from-red-300 to-rose-300',
      circle2: 'from-rose-300 to-pink-300',
      circle3: 'from-pink-300 to-red-300'
    }
  },

  [THEME_COLORS.ORANGE]: {
    primary: 'orange',
    secondary: 'amber',
    light: 'orange-100',
    border: 'orange-200',
    accent: 'orange-400',
    hover: 'orange-200',
    text: 'orange-700',
    button: 'bg-orange-500 hover:bg-orange-600',
    focus: 'focus:ring-orange-500',
    gradient: {
      background: 'from-orange-50 via-orange-100 to-orange-200',
      header: 'from-orange-500 to-amber-500',
      today: 'from-orange-400 to-amber-500',
      selected: 'from-amber-500 to-orange-600',
      events: 'from-orange-100 to-amber-100',
    },
    animatedGradient: {
      circle1: 'from-orange-300 to-amber-300',
      circle2: 'from-amber-300 to-yellow-300',
      circle3: 'from-yellow-300 to-orange-300'
    }
  },

  [THEME_COLORS.YELLOW]: {
    primary: 'yellow',
    secondary: 'amber',
    light: 'yellow-100',
    border: 'yellow-200',
    accent: 'yellow-400',
    hover: 'yellow-200',
    text: 'yellow-700',
    button: 'bg-yellow-500 hover:bg-yellow-600',
    focus: 'focus:ring-yellow-500',
    gradient: {
      background: 'from-yellow-50 via-yellow-100 to-yellow-200',
      header: 'from-yellow-500 to-amber-500',
      today: 'from-yellow-400 to-amber-500',
      selected: 'from-amber-500 to-yellow-600',
      events: 'from-yellow-100 to-amber-100',
    },
    animatedGradient: {
      circle1: 'from-yellow-300 to-amber-300',
      circle2: 'from-amber-300 to-orange-300',
      circle3: 'from-orange-300 to-yellow-300'
    }
  },

  [THEME_COLORS.LIME]: {
    primary: 'lime',
    secondary: 'yellow',
    light: 'lime-100',
    border: 'lime-200',
    accent: 'lime-400',
    hover: 'lime-200',
    text: 'lime-700',
    button: 'bg-lime-500 hover:bg-lime-600',
    focus: 'focus:ring-lime-500',
    gradient: {
      background: 'from-lime-50 via-lime-100 to-lime-200',
      header: 'from-lime-500 to-yellow-500',
      today: 'from-lime-400 to-yellow-500',
      selected: 'from-yellow-500 to-lime-600',
      events: 'from-lime-100 to-yellow-100',
    },
    animatedGradient: {
      circle1: 'from-lime-300 to-yellow-300',
      circle2: 'from-yellow-300 to-green-300',
      circle3: 'from-green-300 to-lime-300'
    }
  },

  [THEME_COLORS.GREEN]: {
    primary: 'green',
    secondary: 'emerald',
    light: 'green-100',
    border: 'green-200',
    accent: 'green-400',
    hover: 'green-200',
    text: 'green-700',
    button: 'bg-green-500 hover:bg-green-600',
    focus: 'focus:ring-green-500',
    gradient: {
      background: 'from-green-50 via-green-100 to-green-200',
      header: 'from-green-500 to-emerald-500',
      today: 'from-green-400 to-emerald-500',
      selected: 'from-emerald-500 to-green-600',
      events: 'from-green-100 to-emerald-100',
    },
    animatedGradient: {
      circle1: 'from-green-300 to-emerald-300',
      circle2: 'from-emerald-300 to-teal-300',
      circle3: 'from-teal-300 to-green-300'
    }
  },

  [THEME_COLORS.EMERALD]: {
    primary: 'emerald',
    secondary: 'green',
    light: 'emerald-100',
    border: 'emerald-200',
    accent: 'emerald-400',
    hover: 'emerald-200',
    text: 'emerald-700',
    button: 'bg-emerald-500 hover:bg-emerald-600',
    focus: 'focus:ring-emerald-500',
    gradient: {
      background: 'from-emerald-50 via-emerald-100 to-emerald-200',
      header: 'from-emerald-500 to-green-500',
      today: 'from-emerald-400 to-green-500',
      selected: 'from-green-500 to-emerald-600',
      events: 'from-emerald-100 to-green-100',
    },
    animatedGradient: {
      circle1: 'from-emerald-300 to-green-300',
      circle2: 'from-green-300 to-teal-300',
      circle3: 'from-teal-300 to-emerald-300'
    }
  },

  [THEME_COLORS.TEAL]: {
    primary: 'teal',
    secondary: 'cyan',
    light: 'teal-100',
    border: 'teal-200',
    accent: 'teal-400',
    hover: 'teal-200',
    text: 'teal-700',
    button: 'bg-teal-500 hover:bg-teal-600',
    focus: 'focus:ring-teal-500',
    gradient: {
      background: 'from-teal-50 via-teal-100 to-teal-200',
      header: 'from-teal-500 to-cyan-500',
      today: 'from-teal-400 to-cyan-500',
      selected: 'from-cyan-500 to-teal-600',
      events: 'from-teal-100 to-cyan-100',
    },
    animatedGradient: {
      circle1: 'from-teal-300 to-cyan-300',
      circle2: 'from-cyan-300 to-sky-300',
      circle3: 'from-sky-300 to-teal-300'
    }
  },

  [THEME_COLORS.CYAN]: {
    primary: 'cyan',
    secondary: 'sky',
    light: 'cyan-100',
    border: 'cyan-200',
    accent: 'cyan-400',
    hover: 'cyan-200',
    text: 'cyan-700',
    button: 'bg-cyan-500 hover:bg-cyan-600',
    focus: 'focus:ring-cyan-500',
    gradient: {
      background: 'from-cyan-50 via-cyan-100 to-cyan-200',
      header: 'from-cyan-500 to-sky-500',
      today: 'from-cyan-400 to-sky-500',
      selected: 'from-sky-500 to-cyan-600',
      events: 'from-cyan-100 to-sky-100',
    },
    animatedGradient: {
      circle1: 'from-cyan-300 to-sky-300',
      circle2: 'from-sky-300 to-blue-300',
      circle3: 'from-blue-300 to-cyan-300'
    }
  },

  [THEME_COLORS.SKY]: {
    primary: 'sky',
    secondary: 'blue',
    light: 'sky-100',
    border: 'sky-200',
    accent: 'sky-400',
    hover: 'sky-200',
    text: 'sky-700',
    button: 'bg-sky-500 hover:bg-sky-600',
    focus: 'focus:ring-sky-500',
    gradient: {
      background: 'from-sky-50 via-sky-100 to-sky-200',
      header: 'from-sky-500 to-blue-500',
      today: 'from-sky-400 to-blue-500',
      selected: 'from-blue-500 to-sky-600',
      events: 'from-sky-100 to-blue-100',
    },
    animatedGradient: {
      circle1: 'from-sky-300 to-blue-300',
      circle2: 'from-blue-300 to-indigo-300',
      circle3: 'from-indigo-300 to-sky-300'
    }
  },

  [THEME_COLORS.BLUE]: {
    primary: 'blue',
    secondary: 'indigo',
    light: 'blue-100',
    border: 'blue-200',
    accent: 'blue-400',
    hover: 'blue-200',
    text: 'blue-700',
    button: 'bg-blue-500 hover:bg-blue-600',
    focus: 'focus:ring-blue-500',
    gradient: {
      background: 'from-blue-50 via-blue-100 to-blue-200',
      header: 'from-blue-500 to-indigo-500',
      today: 'from-blue-400 to-indigo-500',
      selected: 'from-indigo-500 to-purple-500',
      events: 'from-blue-100 to-indigo-100',
    },
    animatedGradient: {
      circle1: 'from-blue-300 to-indigo-300',
      circle2: 'from-indigo-300 to-purple-300',
      circle3: 'from-purple-300 to-blue-300'
    }
  },

  [THEME_COLORS.INDIGO]: {
    primary: 'indigo',
    secondary: 'blue',
    light: 'indigo-100',
    border: 'indigo-200',
    accent: 'indigo-400',
    hover: 'indigo-200',
    text: 'indigo-700',
    button: 'bg-indigo-500 hover:bg-indigo-600',
    focus: 'focus:ring-indigo-500',
    gradient: {
      background: 'from-indigo-50 via-indigo-100 to-indigo-200',
      header: 'from-indigo-500 to-blue-500',
      today: 'from-indigo-400 to-blue-500',
      selected: 'from-blue-500 to-indigo-600',
      events: 'from-indigo-100 to-blue-100',
    },
    animatedGradient: {
      circle1: 'from-indigo-300 to-blue-300',
      circle2: 'from-blue-300 to-sky-300',
      circle3: 'from-sky-300 to-indigo-300'
    }
  },

  [THEME_COLORS.VIOLET]: {
    primary: 'violet',
    secondary: 'purple',
    light: 'violet-100',
    border: 'violet-200',
    accent: 'violet-400',
    hover: 'violet-200',
    text: 'violet-700',
    button: 'bg-violet-500 hover:bg-violet-600',
    focus: 'focus:ring-violet-500',
    gradient: {
      background: 'from-violet-50 via-violet-100 to-violet-200',
      header: 'from-violet-500 to-purple-500',
      today: 'from-violet-400 to-purple-500',
      selected: 'from-purple-500 to-violet-600',
      events: 'from-violet-100 to-purple-100',
    },
    animatedGradient: {
      circle1: 'from-violet-300 to-purple-300',
      circle2: 'from-purple-300 to-indigo-300',
      circle3: 'from-indigo-300 to-violet-300'
    }
  },

  [THEME_COLORS.PURPLE]: {
    primary: 'purple',
    secondary: 'violet',
    light: 'purple-100',
    border: 'purple-200',
    accent: 'purple-400',
    hover: 'purple-200',
    text: 'purple-700',
    button: 'bg-purple-500 hover:bg-purple-600',
    focus: 'focus:ring-purple-500',
    gradient: {
      background: 'from-purple-50 via-purple-100 to-purple-200',
      header: 'from-purple-500 to-violet-500',
      today: 'from-purple-400 to-violet-500',
      selected: 'from-violet-500 to-purple-600',
      events: 'from-purple-100 to-violet-100',
    },
    animatedGradient: {
      circle1: 'from-purple-300 to-violet-300',
      circle2: 'from-violet-300 to-indigo-300',
      circle3: 'from-indigo-300 to-purple-300'
    }
  },

  [THEME_COLORS.PINK]: {
    primary: 'pink',
    secondary: 'rose',
    light: 'pink-100',
    border: 'pink-200',
    accent: 'pink-400',
    hover: 'pink-200',
    text: 'pink-700',
    button: 'bg-pink-500 hover:bg-pink-600',
    focus: 'focus:ring-pink-500',
    gradient: {
      background: 'from-pink-50 via-pink-100 to-pink-200',
      header: 'from-pink-500 to-rose-500',
      today: 'from-pink-400 to-rose-500',
      selected: 'from-rose-500 to-pink-600',
      events: 'from-pink-100 to-rose-100',
    },
    animatedGradient: {
      circle1: 'from-pink-300 to-rose-300',
      circle2: 'from-rose-300 to-red-300',
      circle3: 'from-red-300 to-pink-300'
    }
  },

  [THEME_COLORS.ROSE]: {
    primary: 'rose',
    secondary: 'pink',
    light: 'rose-100',
    border: 'rose-200',
    accent: 'rose-400',
    hover: 'rose-200',
    text: 'rose-700',
    button: 'bg-rose-500 hover:bg-rose-600',
    focus: 'focus:ring-rose-500',
    gradient: {
      background: 'from-rose-50 via-rose-100 to-rose-200',
      header: 'from-rose-500 to-pink-500',
      today: 'from-rose-400 to-pink-500',
      selected: 'from-pink-500 to-rose-600',
      events: 'from-rose-100 to-pink-100',
    },
    animatedGradient: {
      circle1: 'from-rose-300 to-pink-300',
      circle2: 'from-pink-300 to-red-300',
      circle3: 'from-red-300 to-rose-300'
    }
  },

  [THEME_COLORS.SLATE]: {
    primary: 'slate',
    secondary: 'gray',
    light: 'slate-100',
    border: 'slate-200',
    accent: 'slate-400',
    hover: 'slate-200',
    text: 'slate-700',
    button: 'bg-slate-500 hover:bg-slate-600',
    focus: 'focus:ring-slate-500',
    gradient: {
      background: 'from-slate-50 via-slate-100 to-slate-200',
      header: 'from-slate-500 to-gray-500',
      today: 'from-slate-400 to-gray-500',
      selected: 'from-gray-500 to-slate-600',
      events: 'from-slate-100 to-gray-100',
    },
    animatedGradient: {
      circle1: 'from-slate-300 to-gray-300',
      circle2: 'from-gray-300 to-zinc-300',
      circle3: 'from-zinc-300 to-slate-300'
    }
  }
};

/**
 * Get theme configuration for a given color
 * @param color - Theme color value (hex string)
 * @returns Complete theme configuration object
 */
export function getThemeConfig(color: string): ThemeConfig {
  const config = THEME_CONFIG_MAP[color] || THEME_CONFIG_MAP[THEME_COLORS.BLUE];
  return {
    ...config,
    gradient: {
      ...config.gradient,
      primary: config.gradient.background,
    },
    gradientBg: config.gradient.background,
    gradientFrom: config.gradient.header?.split(' ')[0] ?? '',
    gradientTo: config.gradient.header?.split(' ').slice(1).join(' ') ?? '',
    bgColor: `bg-${config.light}`,
  };
}

/**
 * Get simple background gradient for a theme color
 * @param color - Theme color value (hex string)
 * @returns Tailwind CSS gradient class string
 */
export function getSimpleThemeGradient(color: string): string {
  const config = getThemeConfig(color);
  return config.gradient.background;
}

/**
 * Get theme colors configuration (legacy compatibility)
 * @param color - Theme color value (hex string)
 * @returns Theme colors object with common properties
 */
export function getThemeColors(color: string) {
  const config = getThemeConfig(color);
  return {
    gradient: config.gradient.background,
    button: config.button,
    primary: config.primary,
    light: config.light,
    text: config.text,
    hover: config.hover,
    border: config.border,
    focus: config.focus
  };
}

// Default theme color
export const DEFAULT_THEME_COLOR = THEME_COLORS.BLUE;
