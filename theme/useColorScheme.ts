import { useColorScheme as useSystemColorScheme } from 'react-native';

import { useTheme } from './theme.context';

/**
 * Returns the app color scheme, respecting the user's theme preference
 * from the ThemeProvider (falls back to the system scheme).
 */
export function useColorScheme() {
  const { colorScheme } = useTheme();
  const systemColorScheme = useSystemColorScheme();
  return colorScheme ?? systemColorScheme;
}
