import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getThemeConfig, THEME_COLORS } from '../constants/theme';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  theme: ThemeMode;
  themeColor: string;
  themeConfig: ReturnType<typeof getThemeConfig>;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  setThemeColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const readStoredTheme = (): ThemeMode => {
  if (typeof window === 'undefined') {
    return 'light';
  }
  const stored = localStorage.getItem('themeMode');
  return stored === 'dark' ? 'dark' : 'light';
};

const readStoredThemeColor = (): string => {
  if (typeof window === 'undefined') {
    return THEME_COLORS.BLUE;
  }
  return localStorage.getItem('themeColor') || THEME_COLORS.BLUE;
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeMode>(readStoredTheme);
  const [themeColor, setThemeColorState] = useState<string>(readStoredThemeColor);

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    setThemeState(nextTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('themeMode', nextTheme);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [setTheme, theme]);

  const setThemeColor = useCallback((color: string) => {
    setThemeColorState(color);
    if (typeof window !== 'undefined') {
      localStorage.setItem('themeColor', color);
    }
  }, []);

  const themeConfig = useMemo(() => getThemeConfig(themeColor), [themeColor]);

  const contextValue = useMemo<ThemeContextValue>(() => ({
    theme,
    themeColor,
    themeConfig,
    toggleTheme,
    setTheme,
    setThemeColor,
  }), [theme, themeColor, themeConfig, toggleTheme, setTheme, setThemeColor]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
