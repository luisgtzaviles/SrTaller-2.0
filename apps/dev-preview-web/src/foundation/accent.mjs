const HEX_COLOR = /^#[0-9A-F]{6}$/u;

export const BRAND_DEFAULT = '#B45309';

export const BRAND_FALLBACK = Object.freeze({
  light: BRAND_DEFAULT,
  dark: '#F59E0B',
});

const THEME_SURFACE = Object.freeze({
  light: '#FFFFFF',
  dark: '#0B0F14',
});

const THEME_TEXT = Object.freeze({
  light: '#111827',
  dark: '#F9FAFB',
});

const LIGHT_FOREGROUND = '#FFFFFF';
const DARK_FOREGROUND = '#111827';
const ACTION_FOREGROUNDS = Object.freeze([LIGHT_FOREGROUND, DARK_FOREGROUND]);
const TEXT_CONTRAST_MINIMUM = 4.5;
const UI_BOUNDARY_MINIMUM = 3;
const MAX_ACTION_LIGHTNESS_SHIFT = 0.36;
const MAX_NEUTRAL_ACTION_LIGHTNESS_SHIFT = 0.45;
// The critical Dark orange retains 0.824 chroma with white text; 0.8 protects that
// recognizable character while leaving a small gamut-mapping allowance.
const MIN_ACTION_CHROMA_RETENTION = 0.8;
// The matrix remains recognizable at 0.6; theme targets stay above that floor so
// large surfaces are controlled without repeating V4's brown/gray drift.
const MIN_SURFACE_CHROMA_RETENTION = 0.6;
const MAX_HUE_DRIFT_DEGREES = 2;
const CHROMATIC_THRESHOLD = 0.02;
const SURFACE_CHROMA_RETENTION = Object.freeze({ light: 0.7, dark: 0.64 });
const SURFACE_LIGHTNESS_DELTA = Object.freeze({ light: 0.1, dark: 0.13 });
const SURFACE_LIGHTNESS_CAP = Object.freeze({ light: 0.58, dark: 0.52 });
const SURFACE_LIGHTNESS_FLOOR = Object.freeze({ light: 0.18, dark: 0.3 });

function clamp(value, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

function channelToLinear(channel) {
  const value = channel / 255;
  return value <= 0.04045
    ? value / 12.92
    : ((value + 0.055) / 1.055) ** 2.4;
}

function linearToChannel(channel) {
  const value = clamp(channel);
  const encoded = value <= 0.0031308
    ? 12.92 * value
    : 1.055 * value ** (1 / 2.4) - 0.055;
  return Math.round(clamp(encoded) * 255);
}

export function normalizeHex(input) {
  if (typeof input !== 'string') return null;
  const normalized = input.trim().toUpperCase();
  return HEX_COLOR.test(normalized) ? normalized : null;
}

function hexToLinearRgb(hex) {
  return {
    r: channelToLinear(Number.parseInt(hex.slice(1, 3), 16)),
    g: channelToLinear(Number.parseInt(hex.slice(3, 5), 16)),
    b: channelToLinear(Number.parseInt(hex.slice(5, 7), 16)),
  };
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b]
    .map((channel) => linearToChannel(channel).toString(16).padStart(2, '0'))
    .join('')}`.toUpperCase();
}

function linearRgbToOklch({ r, g, b }) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bAxis = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const chroma = Math.hypot(a, bAxis);
  return {
    l: lightness,
    c: chroma,
    h: chroma < 0.000001 ? 0 : Math.atan2(bAxis, a),
  };
}

function oklchToLinearRgb({ l, c, h }) {
  const a = c * Math.cos(h);
  const bAxis = c * Math.sin(h);
  const lRoot = l + 0.3963377774 * a + 0.2158037573 * bAxis;
  const mRoot = l - 0.1055613458 * a - 0.0638541728 * bAxis;
  const sRoot = l - 0.0894841775 * a - 1.291485548 * bAxis;
  const lCube = lRoot ** 3;
  const mCube = mRoot ** 3;
  const sCube = sRoot ** 3;
  return {
    r: 4.0767416621 * lCube - 3.3077115913 * mCube + 0.2309699292 * sCube,
    g: -1.2684380046 * lCube + 2.6097574011 * mCube - 0.3413193965 * sCube,
    b: -0.0041960863 * lCube - 0.7034186147 * mCube + 1.707614701 * sCube,
  };
}

function inGamut({ r, g, b }) {
  const epsilon = 0.0000001;
  return r >= -epsilon && r <= 1 + epsilon && g >= -epsilon && g <= 1 + epsilon && b >= -epsilon && b <= 1 + epsilon;
}

function mapToGamut(color) {
  const direct = oklchToLinearRgb(color);
  if (inGamut(direct)) return { color, rgb: direct };

  let low = 0;
  let high = color.c;
  let mapped = { ...color, c: 0 };
  for (let iteration = 0; iteration < 28; iteration += 1) {
    const candidate = { ...color, c: (low + high) / 2 };
    if (inGamut(oklchToLinearRgb(candidate))) {
      low = candidate.c;
      mapped = candidate;
    } else {
      high = candidate.c;
    }
  }
  return { color: mapped, rgb: oklchToLinearRgb(mapped) };
}

export function contrastRatio(firstHex, secondHex) {
  const luminance = (hex) => {
    const { r, g, b } = hexToLinearRgb(hex);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const first = luminance(firstHex);
  const second = luminance(secondHex);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

function hueDeltaDegrees(firstHue, secondHue) {
  const firstDegrees = firstHue * 180 / Math.PI;
  const secondDegrees = secondHue * 180 / Math.PI;
  return Math.abs(((firstDegrees - secondDegrees + 540) % 360) - 180);
}

function fidelityMetrics(original, candidate) {
  const chromatic = original.c >= CHROMATIC_THRESHOLD;
  return {
    hueDelta: chromatic ? hueDeltaDegrees(original.h, candidate.h) : 0,
    chromaDelta: candidate.c - original.c,
    chromaRetention: chromatic ? candidate.c / original.c : 1,
    lightnessDelta: candidate.l - original.l,
  };
}

export function measureBrandFidelity(inputHex, outputHex) {
  const normalizedInput = normalizeHex(inputHex);
  const normalizedOutput = normalizeHex(outputHex);
  if (!normalizedInput || !normalizedOutput) {
    throw new TypeError('Brand fidelity requires opaque #RRGGBB colors.');
  }
  const input = linearRgbToOklch(hexToLinearRgb(normalizedInput));
  const output = linearRgbToOklch(hexToLinearRgb(normalizedOutput));
  return Object.freeze({
    input: Object.freeze({ lightness: input.l, chroma: input.c, hue: input.h * 180 / Math.PI }),
    output: Object.freeze({ lightness: output.l, chroma: output.c, hue: output.h * 180 / Math.PI }),
    ...fidelityMetrics(input, output),
  });
}

function actionLightnessLimit(original) {
  return original.c < CHROMATIC_THRESHOLD
    ? MAX_NEUTRAL_ACTION_LIGHTNESS_SHIFT
    : MAX_ACTION_LIGHTNESS_SHIFT;
}

function isFaithfulAction(original, candidate) {
  const fidelity = fidelityMetrics(original, candidate);
  return Math.abs(fidelity.lightnessDelta) <= actionLightnessLimit(original) + Number.EPSILON
    && fidelity.hueDelta <= MAX_HUE_DRIFT_DEGREES
    && fidelity.chromaRetention >= MIN_ACTION_CHROMA_RETENTION;
}

function isSafeAction(hex, foreground, theme) {
  return contrastRatio(hex, foreground) >= TEXT_CONTRAST_MINIMUM
    && contrastRatio(hex, THEME_SURFACE[theme]) >= UI_BOUNDARY_MINIMUM;
}

function findActionForForeground(original, foreground, theme) {
  const preferredDirection = foreground === LIGHT_FOREGROUND ? -1 : 1;
  for (let step = 0; step <= actionLightnessLimit(original) * 200; step += 1) {
    const delta = step * 0.005;
    const directions = step === 0 ? [0] : [preferredDirection, -preferredDirection];
    for (const direction of directions) {
      const mapped = mapToGamut({ ...original, l: clamp(original.l + direction * delta) });
      const hex = rgbToHex(mapped.rgb);
      if (isFaithfulAction(original, mapped.color) && isSafeAction(hex, foreground, theme)) {
        return { ...mapped, foreground, hex, fidelity: fidelityMetrics(original, mapped.color) };
      }
    }
  }
  return null;
}

function chooseAction(original, theme) {
  const light = findActionForForeground(original, LIGHT_FOREGROUND, theme);
  const dark = findActionForForeground(original, DARK_FOREGROUND, theme);
  // Brand actions keep a light foreground whenever a faithful, accessible
  // variant can support it. This preserves a consistent CTA hierarchy in
  // Light as well as Dark; inherently light accents fall back to dark text.
  return light ?? dark;
}

function deriveVariant(accentColor, foreground, theme, delta, previousHex) {
  const direction = theme === 'light' ? -1 : 1;
  const mapped = mapToGamut({
    ...accentColor,
    l: clamp(accentColor.l + direction * delta),
  });
  const candidate = rgbToHex(mapped.rgb);
  return isSafeAction(candidate, foreground, theme)
    ? { color: mapped.color, hex: candidate }
    : { color: accentColor, hex: previousHex };
}

function mixLinear(foregroundHex, backgroundHex, foregroundWeight) {
  const foreground = hexToLinearRgb(foregroundHex);
  const background = hexToLinearRgb(backgroundHex);
  const backgroundWeight = 1 - foregroundWeight;
  return rgbToHex({
    r: foreground.r * foregroundWeight + background.r * backgroundWeight,
    g: foreground.g * foregroundWeight + background.g * backgroundWeight,
    b: foreground.b * foregroundWeight + background.b * backgroundWeight,
  });
}

function deriveTint(accentHex, theme, preferredWeight) {
  for (let step = Math.round(preferredWeight * 100); step >= 0; step -= 1) {
    const candidate = mixLinear(accentHex, THEME_SURFACE[theme], step / 100);
    if (contrastRatio(THEME_TEXT[theme], candidate) >= 4.5) return candidate;
  }
  return THEME_SURFACE[theme];
}

function chooseSurfaceForeground(surfaceHex) {
  return ACTION_FOREGROUNDS.reduce((best, candidate) => (
    contrastRatio(candidate, surfaceHex) > contrastRatio(best, surfaceHex) ? candidate : best
  ));
}

function deriveLargeSurface(original, theme) {
  const preferredLightness = Math.max(
    Math.min(clamp(original.l - SURFACE_LIGHTNESS_DELTA[theme]), SURFACE_LIGHTNESS_CAP[theme]),
    SURFACE_LIGHTNESS_FLOOR[theme],
  );
  for (let step = 0; step <= preferredLightness * 200; step += 1) {
    const mapped = mapToGamut({
      ...original,
      c: original.c * SURFACE_CHROMA_RETENTION[theme],
      l: clamp(preferredLightness - step * 0.005),
    });
    const hex = rgbToHex(mapped.rgb);
    const focus = chooseSurfaceForeground(hex);
    const fidelity = fidelityMetrics(original, mapped.color);
    if (contrastRatio(focus, hex) >= TEXT_CONTRAST_MINIMUM
      && fidelity.hueDelta <= MAX_HUE_DRIFT_DEGREES
      && fidelity.chromaRetention >= MIN_SURFACE_CHROMA_RETENTION) {
      return { color: mapped.color, focus, hex };
    }
  }
  throw new Error('Governed brand surface cannot satisfy contrast and fidelity.');
}

function deriveSurfaceState(surfaceColor, surfaceHex, surfaceFocus, delta) {
  const direction = surfaceFocus === '#FFFFFF' ? 1 : -1;
  let safe = { color: surfaceColor, hex: surfaceHex };
  for (let step = 0.005; step <= delta + Number.EPSILON; step += 0.005) {
    const mapped = mapToGamut({
      ...surfaceColor,
      l: clamp(surfaceColor.l + direction * step),
    });
    const hex = rgbToHex(mapped.rgb);
    if (contrastRatio(surfaceFocus, hex) < TEXT_CONTRAST_MINIMUM) break;
    safe = { color: mapped.color, hex };
  }
  return safe;
}

function deriveBoundary(surfaceColor, surfaceHex, surfaceFocus) {
  const direction = surfaceFocus === '#FFFFFF' ? 1 : -1;
  for (let step = 1; step <= 55; step += 1) {
    const candidate = mapToGamut({
      ...surfaceColor,
      l: clamp(surfaceColor.l + direction * step * 0.01),
    });
    const candidateHex = rgbToHex(candidate.rgb);
    if (contrastRatio(candidateHex, surfaceHex) >= UI_BOUNDARY_MINIMUM) return candidateHex;
  }
  return surfaceFocus;
}

function fallbackResult(theme, reason) {
  const fallback = BRAND_FALLBACK[theme];
  return resolveValidBrand(fallback, theme, true, reason);
}

function resolveValidBrand(normalized, theme, fallback, reason) {
  const original = linearRgbToOklch(hexToLinearRgb(normalized));
  const onBase = chooseSurfaceForeground(normalized);
  const selected = chooseAction(original, theme);

  if (!selected) {
    if (fallback) throw new Error('Governed accent fallback cannot satisfy contrast.');
    return fallbackResult(theme, 'contrast');
  }

  const actionHover = deriveVariant(selected.color, selected.foreground, theme, 0.04, selected.hex);
  const actionActive = deriveVariant(selected.color, selected.foreground, theme, 0.08, actionHover.hex);
  const surface = deriveLargeSurface(original, theme);
  const surfaceRaised = deriveSurfaceState(surface.color, surface.hex, surface.focus, 0.04);
  const surfaceHover = deriveSurfaceState(surface.color, surface.hex, surface.focus, 0.06);
  const surfaceActive = deriveSurfaceState(surface.color, surface.hex, surface.focus, 0.1);
  const border = deriveBoundary(surface.color, surface.hex, surface.focus);
  const subtle = deriveTint(normalized, theme, theme === 'light' ? 0.08 : 0.16);
  const muted = deriveTint(normalized, theme, theme === 'light' ? 0.18 : 0.3);

  return Object.freeze({
    input: normalized,
    theme,
    base: normalized,
    onBase,
    action: selected.hex,
    actionHover: actionHover.hex,
    actionActive: actionActive.hex,
    subtle,
    muted,
    surface: surface.hex,
    surfaceRaised: surfaceRaised.hex,
    surfaceHover: surfaceHover.hex,
    surfaceActive: surfaceActive.hex,
    border,
    contrast: selected.foreground,
    focus: selected.hex,
    surfaceFocus: surface.focus,
    actionSurfaceRatio: contrastRatio(selected.hex, THEME_SURFACE[theme]),
    actionContrastRatio: contrastRatio(selected.hex, selected.foreground),
    surfaceContrastRatio: contrastRatio(surface.hex, surface.focus),
    borderSurfaceRatio: contrastRatio(border, surface.hex),
    fallback,
    reason,
  });
}

export function resolveTenantAccent(input, theme) {
  if (theme !== 'light' && theme !== 'dark') {
    throw new TypeError('Tenant accent theme must be light or dark.');
  }
  const normalized = normalizeHex(input);
  return normalized
    ? resolveValidBrand(normalized, theme, false, null)
    : fallbackResult(theme, 'invalid-input');
}
