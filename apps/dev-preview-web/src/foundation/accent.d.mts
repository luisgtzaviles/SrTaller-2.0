export type ResolvedTheme = 'light' | 'dark';

export interface BrandColorCoordinates {
  readonly lightness: number;
  readonly chroma: number;
  readonly hue: number;
}

export interface BrandFidelityMetrics {
  readonly input: BrandColorCoordinates;
  readonly output: BrandColorCoordinates;
  readonly hueDelta: number;
  readonly chromaDelta: number;
  readonly chromaRetention: number;
  readonly lightnessDelta: number;
}

export interface TenantBrandResult {
  readonly input: string;
  readonly theme: ResolvedTheme;
  readonly base: string;
  readonly onBase: string;
  readonly action: string;
  readonly actionHover: string;
  readonly actionActive: string;
  readonly subtle: string;
  readonly muted: string;
  readonly surface: string;
  readonly surfaceRaised: string;
  readonly surfaceHover: string;
  readonly surfaceActive: string;
  readonly border: string;
  readonly contrast: string;
  readonly focus: string;
  readonly surfaceFocus: string;
  readonly actionSurfaceRatio: number;
  readonly actionContrastRatio: number;
  readonly surfaceContrastRatio: number;
  readonly borderSurfaceRatio: number;
  readonly fallback: boolean;
  readonly reason: string | null;
}

export const BRAND_DEFAULT: string;
export const BRAND_FALLBACK: Readonly<Record<ResolvedTheme, string>>;
export function normalizeHex(input: unknown): string | null;
export function contrastRatio(firstHex: string, secondHex: string): number;
export function measureBrandFidelity(inputHex: string, outputHex: string): BrandFidelityMetrics;
export function resolveTenantAccent(input: unknown, theme: ResolvedTheme): TenantBrandResult;
