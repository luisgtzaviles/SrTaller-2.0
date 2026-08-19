export type ResolvedTheme = 'light' | 'dark';

export interface TenantAccentResult {
  readonly input: string;
  readonly theme: ResolvedTheme;
  readonly accent: string;
  readonly hover: string;
  readonly active: string;
  readonly subtle: string;
  readonly contrast: string;
  readonly surfaceRatio: number;
  readonly contrastRatio: number;
  readonly fallback: boolean;
  readonly reason: string | null;
}

export const ACCENT_FALLBACK: Readonly<Record<ResolvedTheme, string>>;
export function normalizeHex(input: unknown): string | null;
export function contrastRatio(firstHex: string, secondHex: string): number;
export function resolveTenantAccent(input: unknown, theme: ResolvedTheme): TenantAccentResult;
