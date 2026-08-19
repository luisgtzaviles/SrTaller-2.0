import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { ACCENT_FALLBACK, resolveTenantAccent } from './accent.mjs';
import type { ResolvedTheme, TenantAccentResult } from './accent.mjs';

export type ThemePreference = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'srtaller.theme';
interface ThemeContextValue {
  readonly preference: ThemePreference;
  readonly resolvedTheme: ResolvedTheme;
  readonly accent: TenantAccentResult;
  setPreference(preference: ThemePreference): void;
  setSyntheticAccent(input: string | null): void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

function readPreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

function systemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  const [preference, setPreferenceState] = useState<ThemePreference>(readPreference);
  const [systemPreference, setSystemPreference] = useState<ResolvedTheme>(systemTheme);
  const [syntheticAccent, setSyntheticAccent] = useState<string | null>(null);
  const resolvedTheme = preference === 'system' ? systemPreference : preference;
  const accent = useMemo(
    () => resolveTenantAccent(syntheticAccent ?? ACCENT_FALLBACK[resolvedTheme], resolvedTheme),
    [resolvedTheme, syntheticAccent],
  );

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const update = (): void => setSystemPreference(query.matches ? 'dark' : 'light');
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = resolvedTheme;
    root.dataset.themePreference = preference;
    root.style.setProperty('--color-accent', accent.accent);
    root.style.setProperty('--color-accent-hover', accent.hover);
    root.style.setProperty('--color-accent-active', accent.active);
    root.style.setProperty('--color-accent-subtle', accent.subtle);
    root.style.setProperty('--color-on-accent', accent.contrast);
  }, [accent, preference, resolvedTheme]);

  const setPreference = useCallback((nextPreference: ThemePreference): void => {
    setPreferenceState(nextPreference);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextPreference);
    } catch {
      // Rendering remains correct when persistence is unavailable.
    }
  }, []);

  const value = useMemo<ThemeContextValue>(() => ({
    preference,
    resolvedTheme,
    accent,
    setPreference,
    setSyntheticAccent,
  }), [accent, preference, resolvedTheme, setPreference]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider.');
  return value;
}
