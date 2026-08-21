import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { BRAND_DEFAULT, normalizeHex, resolveTenantAccent } from './accent.mjs';
import type { ResolvedTheme, TenantBrandResult } from './accent.mjs';

export type ThemePreference = 'light' | 'dark';

const THEME_STORAGE_KEY = 'srtaller.theme';
const BRAND_ACCENT_STORAGE_KEY = 'srtaller.brand-accent';
interface ThemeContextValue {
  readonly preference: ThemePreference;
  readonly resolvedTheme: ResolvedTheme;
  readonly brand: TenantBrandResult;
  readonly syntheticAccent: string | null;
  setPreference(preference: ThemePreference): void;
  setSyntheticAccent(input: string | null): void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'light' || value === 'dark';
}

function readPreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : 'light';
  } catch {
    return 'light';
  }
}

function readBrandAccent(): string | null {
  try {
    return normalizeHex(window.localStorage.getItem(BRAND_ACCENT_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function ThemeProvider({ children }: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  const [preference, setPreferenceState] = useState<ThemePreference>(readPreference);
  const [syntheticAccent, setSyntheticAccentState] = useState<string | null>(readBrandAccent);
  const resolvedTheme: ResolvedTheme = preference;
  const brand = useMemo(
    () => resolveTenantAccent(syntheticAccent ?? BRAND_DEFAULT, resolvedTheme),
    [resolvedTheme, syntheticAccent],
  );

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = resolvedTheme;
    root.dataset.themePreference = preference;
    root.style.setProperty('--color-brand-base', brand.base);
    root.style.setProperty('--color-brand-on-base', brand.onBase);
    root.style.setProperty('--color-brand-action', brand.action);
    root.style.setProperty('--color-brand-action-hover', brand.actionHover);
    root.style.setProperty('--color-brand-action-active', brand.actionActive);
    root.style.setProperty('--color-brand-subtle', brand.subtle);
    root.style.setProperty('--color-brand-muted', brand.muted);
    root.style.setProperty('--color-brand-surface', brand.surface);
    root.style.setProperty('--color-brand-surface-raised', brand.surfaceRaised);
    root.style.setProperty('--color-brand-surface-hover', brand.surfaceHover);
    root.style.setProperty('--color-brand-surface-active', brand.surfaceActive);
    root.style.setProperty('--color-brand-border', brand.border);
    root.style.setProperty('--color-brand-contrast', brand.contrast);
    root.style.setProperty('--color-brand-focus', brand.focus);
    root.style.setProperty('--color-brand-surface-focus', brand.surfaceFocus);
  }, [brand, preference, resolvedTheme]);

  const setPreference = useCallback((nextPreference: ThemePreference): void => {
    setPreferenceState(nextPreference);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextPreference);
    } catch {
      // Rendering remains correct when persistence is unavailable.
    }
  }, []);

  const setSyntheticAccent = useCallback((input: string | null): void => {
    const normalized = normalizeHex(input);
    setSyntheticAccentState(input === null ? null : normalized ?? input);
    try {
      if (normalized) window.localStorage.setItem(BRAND_ACCENT_STORAGE_KEY, normalized);
      else window.localStorage.removeItem(BRAND_ACCENT_STORAGE_KEY);
    } catch {
      // The local preview remains usable when browser storage is unavailable.
    }
  }, []);

  const value = useMemo<ThemeContextValue>(() => ({
    preference,
    resolvedTheme,
    brand,
    syntheticAccent,
    setPreference,
    setSyntheticAccent,
  }), [brand, preference, resolvedTheme, setPreference, setSyntheticAccent, syntheticAccent]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider.');
  return value;
}
