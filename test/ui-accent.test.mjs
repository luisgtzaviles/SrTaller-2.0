import assert from 'node:assert/strict';
import test from 'node:test';

import {
  BRAND_DEFAULT,
  contrastRatio,
  measureBrandFidelity,
  normalizeHex,
  resolveTenantAccent,
} from '../apps/dev-preview-web/src/foundation/accent.mjs';

const colors = ['#2563EB', '#4F46E5', '#7C3AED', '#16A34A', '#D97706', '#EA580C', '#FF6F00', '#DC2626', '#FFF3B0', '#050505', '#FF00FF'];
const requiredRoles = [
  'base', 'onBase', 'action', 'actionHover', 'actionActive', 'subtle', 'muted', 'surface',
  'surfaceRaised', 'surfaceHover', 'surfaceActive', 'border', 'contrast',
  'focus', 'surfaceFocus',
];

test('tenant brand resolver emits the complete governed role contract', () => {
  for (const input of colors) {
    for (const theme of ['light', 'dark']) {
      const result = resolveTenantAccent(input, theme);
      for (const role of requiredRoles) assert.match(result[role], /^#[0-9A-F]{6}$/u, `${input} ${theme} ${role}`);
      assert.equal(result.base, input, `${input} ${theme} base preserves selection`);
      assert.ok(contrastRatio(result.base, result.onBase) >= 4.5, `${input} ${theme} base/onBase`);
      assert.ok(result.actionSurfaceRatio >= 3, `${input} ${theme} action boundary`);
      assert.ok(result.actionContrastRatio >= 4.5, `${input} ${theme} action/contrast`);
      assert.ok(result.surfaceContrastRatio >= 4.5, `${input} ${theme} branded surface/contrast`);
      assert.ok(result.borderSurfaceRatio >= 3, `${input} ${theme} branded boundary`);
      assert.notEqual(result.surface, result.action, `${input} ${theme} brand surface/action separation`);
      assert.equal(result.focus, result.action);
      assert.ok(contrastRatio(result.actionHover, result.contrast) >= 4.5, `${input} ${theme} action hover/contrast`);
      assert.ok(contrastRatio(result.actionActive, result.contrast) >= 4.5, `${input} ${theme} action active/contrast`);
    }
  }
});

test('brand fidelity preserves hue and governed chroma without per-color branches', () => {
  for (const input of colors) {
    for (const theme of ['light', 'dark']) {
      const result = resolveTenantAccent(input, theme);
      const surface = measureBrandFidelity(input, result.surface);
      const action = measureBrandFidelity(input, result.action);
      assert.ok(surface.hueDelta <= 2, `${input} ${theme} surface hue drift`);
      assert.ok(action.hueDelta <= 2, `${input} ${theme} action hue drift`);
      assert.ok(surface.chromaRetention >= 0.6, `${input} ${theme} surface chroma retention`);
      assert.ok(action.chromaRetention >= 0.8, `${input} ${theme} action chroma retention`);
    }
  }
});

test('critical orange stays orange and prefers a light action foreground in Dark', () => {
  const light = resolveTenantAccent('#FF6F00', 'light');
  const dark = resolveTenantAccent('#FF6F00', 'dark');
  const lightSurface = measureBrandFidelity('#FF6F00', light.surface);
  const darkSurface = measureBrandFidelity('#FF6F00', dark.surface);
  assert.ok(lightSurface.chromaRetention >= 0.65);
  assert.ok(darkSurface.chromaRetention >= 0.6);
  assert.ok(lightSurface.hueDelta <= 2);
  assert.ok(darkSurface.hueDelta <= 2);
  assert.equal(light.contrast, '#FFFFFF');
  assert.ok(light.actionContrastRatio >= 4.5);
  assert.equal(dark.contrast, '#FFFFFF');
  assert.ok(dark.actionContrastRatio >= 4.5);
  assert.equal(dark.fallback, false);
});

test('Dark prefers light action foreground except when a chromatic input is inherently too light', () => {
  for (const input of colors.filter((color) => color !== '#FFF3B0')) {
    assert.equal(resolveTenantAccent(input, 'dark').contrast, '#FFFFFF', input);
  }
  const veryLight = resolveTenantAccent('#FFF3B0', 'dark');
  assert.equal(veryLight.contrast, '#111827');
  assert.equal(veryLight.action, '#FFF3B0');
});

test('reference brand produces stable Light and Dark derivations from one input', () => {
  const light = resolveTenantAccent(BRAND_DEFAULT, 'light');
  const dark = resolveTenantAccent(BRAND_DEFAULT, 'dark');
  assert.deepEqual(
    [light.action, light.actionHover, light.surface, light.border, light.contrast],
    ['#B45309', '#A44900', '#83431C', '#DA936C', '#FFFFFF'],
  );
  assert.deepEqual(
    [dark.action, dark.actionHover, dark.surface, dark.border, dark.contrast],
    ['#B45309', '#B45309', '#763D1A', '#CC8B69', '#FFFFFF'],
  );
});

test('brand base remains exact while action is independently contrast-safe', () => {
  const result = resolveTenantAccent('#36B7E8', 'light');
  assert.equal(result.base, '#36B7E8');
  assert.equal(result.onBase, '#111827');
  assert.notEqual(result.action, result.base);
  assert.ok(contrastRatio(result.action, result.contrast) >= 4.5);
});

test('tenant brand normalizes only opaque #RRGGBB and fails safely', () => {
  assert.equal(normalizeHex(' #b45309 '), '#B45309');
  for (const invalid of ['B45309', '#ABC', '#B45309FF', 'oklch(50% 1 1)', '', null]) assert.equal(normalizeHex(invalid), null);
  assert.equal(resolveTenantAccent('invalid', 'light').reason, 'invalid-input');
  assert.equal(resolveTenantAccent('invalid', 'dark').fallback, true);
  assert.equal(resolveTenantAccent('#FFF3B0', 'light').fallback, false);
  assert.equal(resolveTenantAccent('#050505', 'dark').fallback, false);
  assert.throws(() => measureBrandFidelity('#ABC', '#FFFFFF'), /opaque #RRGGBB/u);
});

test('semantic status colors remain outside the tenant brand result', () => {
  const result = resolveTenantAccent('#FF00FF', 'light');
  for (const semantic of ['success', 'warning', 'danger', 'info']) assert.equal(semantic in result, false);
  assert.ok(contrastRatio(result.action, result.contrast) >= 4.5);
});
