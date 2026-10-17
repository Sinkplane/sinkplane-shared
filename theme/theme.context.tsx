import { createContext, use, PropsWithChildren, useCallback, useMemo } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

import { useStorageState } from '../storage/useStorageState';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeState {
  /** The user-selected mode ('system' follows the OS setting). */
  themeMode: ThemeMode;
  /** The resolved scheme override, or undefined when following the system. */
  colorScheme: 'light' | 'dark' | undefined;
  setThemeMode: (mode: ThemeMode) => void;
  toggleColorScheme: () => void;
}

const ThemeContext = createContext<ThemeState>({
  themeMode: 'system',
  colorScheme: undefined,
  setThemeMode: () => null,
  toggleColorScheme: () => null,
});

// This hook can be used to access the theme state.
export function useTheme() {
  return use(ThemeContext);
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [[, storedMode], setStoredMode] = useStorageState<ThemeMode>('themeMode');
  const systemColorScheme = useSystemColorScheme();

  const themeMode: ThemeMode = storedMode ?? 'system';
  const colorScheme = themeMode === 'system' ? undefined : themeMode;

  const setThemeMode = useCallback((mode: ThemeMode) => setStoredMode(mode), [setStoredMode]);

  const toggleColorScheme = useCallback(() => {
    const current = colorScheme ?? systemColorScheme ?? 'light';
    setStoredMode(current === 'dark' ? 'light' : 'dark');
  }, [colorScheme, systemColorScheme, setStoredMode]);

  const value = useMemo(
    () => ({ themeMode, colorScheme, setThemeMode, toggleColorScheme }),
    [themeMode, colorScheme, setThemeMode, toggleColorScheme],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}
