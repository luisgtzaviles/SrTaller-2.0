const HEX_COLOR = /^#[0-9A-F]{6}$/u;

export const ACCENT_FALLBACK = Object.freeze({
  light: '#B45309',
  dark: '#F59E0B',
});

const THEME_SURFACE = Object.freeze({
  light: '#FFFFFF',
  dark: '#0B0F14',
});

const THEME_CONTRAST = Object.freeze({
  light: '#FFFFFF',
  dark: '#111827',
});

const THEME_TEXT = Object.freeze({
  light: '#111827',
  dark: '#F9FAFB',
});

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

function isSafeAccent(hex, theme) {
  return contrastRatio(hex, THEME_SURFACE[theme]) >= 4.5
    && contrastRatio(hex, THEME_CONTRAST[theme]) >= 4.5;
}

function deriveVariant(accentColor, theme, delta, previousHex) {
  const direction = theme === 'light' ? -1 : 1;
  const mapped = mapToGamut({
    ...accentColor,
    l: clamp(accentColor.l + direction * delta),
  });
  const candidate = rgbToHex(mapped.rgb);
  return isSafeAccent(candidate, theme) ? { color: mapped.color, hex: candidate } : { color: accentColor, hex: previousHex };
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

function fallbackResult(theme, reason) {
  const fallback = ACCENT_FALLBACK[theme];
  return resolveValidAccent(fallback, theme, true, reason);
}

function resolveValidAccent(normalized, theme, fallback, reason) {
  const original = linearRgbToOklch(hexToLinearRgb(normalized));
  const direction = theme === 'light' ? -1 : 1;
  let selected = null;

  for (let step = 0; step <= 70; step += 1) {
    const delta = step * 0.005;
    if (delta > 0.35 + Number.EPSILON) break;
    const candidate = mapToGamut({
      ...original,
      l: clamp(original.l + direction * delta),
    });
    const candidateHex = rgbToHex(candidate.rgb);
    if (isSafeAccent(candidateHex, theme)) {
      selected = { ...candidate, hex: candidateHex };
      break;
    }
  }

  if (!selected) {
    if (fallback) throw new Error('Governed accent fallback cannot satisfy contrast.');
    return fallbackResult(theme, 'contrast');
  }

  if (original.c >= 0.05 && selected.color.c / original.c < 0.4) {
    if (fallback) throw new Error('Governed accent fallback exceeds chroma-loss limit.');
    return fallbackResult(theme, 'chroma-loss');
  }

  const hover = deriveVariant(selected.color, theme, 0.04, selected.hex);
  const active = deriveVariant(selected.color, theme, 0.08, hover.hex);
  const subtle = mixLinear(
    selected.hex,
    THEME_SURFACE[theme],
    theme === 'light' ? 0.08 : 0.16,
  );
  const safeSubtle = contrastRatio(THEME_TEXT[theme], subtle) >= 4.5
    ? subtle
    : THEME_SURFACE[theme];

  return Object.freeze({
    input: normalized,
    theme,
    accent: selected.hex,
    hover: hover.hex,
    active: active.hex,
    subtle: safeSubtle,
    contrast: THEME_CONTRAST[theme],
    surfaceRatio: contrastRatio(selected.hex, THEME_SURFACE[theme]),
    contrastRatio: contrastRatio(selected.hex, THEME_CONTRAST[theme]),
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
    ? resolveValidAccent(normalized, theme, false, null)
    : fallbackResult(theme, 'invalid-input');
}
