import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'nativewind';

/** The user's chosen preference. `system` follows the OS setting. */
export type ThemeMode = 'light' | 'dark' | 'system';

/** The actually-applied scheme after resolving `system`. */
export type ResolvedScheme = 'light' | 'dark';

interface ThemeContextValue {
  /** The user's preference: 'light' | 'dark' | 'system'. */
  mode: ThemeMode;
  /** The scheme currently rendered (system resolved to light/dark). */
  scheme: ResolvedScheme;
  /** Set the preference explicitly. */
  setMode: (mode: ThemeMode) => void;
  /** Flip between light and dark. */
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { colorScheme, setColorScheme } = useColorScheme();

  // NativeWind only reports the resolved scheme (light/dark), never the user's
  // 'system' preference — so we track the chosen mode ourselves.
  const [mode, setModeState] = useState<ThemeMode>('system');

  const setMode = useCallback(
    (next: ThemeMode) => {
      setModeState(next);
      setColorScheme(next);
    },
    [setColorScheme]
  );

  const toggle = useCallback(() => {
    setMode(colorScheme === 'dark' ? 'light' : 'dark');
  }, [colorScheme, setMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      // The resolved scheme from NativeWind; default to light until hydrated.
      scheme: (colorScheme ?? 'light') as ResolvedScheme,
      setMode,
      toggle,
    }),
    [mode, colorScheme, setMode, toggle]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Access the current theme and controls. Must be used under <ThemeProvider>. */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a <ThemeProvider>');
  }
  return ctx;
}
