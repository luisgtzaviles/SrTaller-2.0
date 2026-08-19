import assert from 'node:assert/strict';
import test from 'node:test';

import { contrastRatio, normalizeHex, resolveTenantAccent } from '../apps/dev-preview-web/src/foundation/accent.mjs';

const vectors = [
  ['#B45309', 'light', '#B45309', '#A44900', '#934100', '#FAF7F6', false],
  ['#F59E0B', 'dark', '#F59E0B', '#FFAD3C', '#FFBF73', '#6C4513', false],
  ['#FFF3B0', 'light', '#B45309', '#A44900', '#934100', '#FAF7F6', true],
  ['#FFF3B0', 'dark', '#FFF3B0', '#FFFFFB', '#FFFFFF', '#706B4E', false],
  ['#050505', 'light', '#050505', '#010101', '#000000', '#F6F6F6', false],
  ['#050505', 'dark', '#F59E0B', '#FFAD3C', '#FFBF73', '#6C4513', true],
  ['#FF00FF', 'light', '#D000D0', '#BE00BE', '#AC00AC', '#FCF6FC', false],
  ['#FF00FF', 'dark', '#FF00FF', '#FF58FD', '#FF7DFC', '#700D71', false],
];

test('tenant accent reproduces all governed reference vectors', () => {
  for (const [input, theme, accent, hover, active, subtle, fallback] of vectors) {
    const result = resolveTenantAccent(input, theme);
    assert.deepEqual([result.accent, result.hover, result.active, result.subtle, result.fallback], [accent, hover, active, subtle, fallback]);
    assert.ok(result.surfaceRatio >= 4.5);
    assert.ok(result.contrastRatio >= 4.5);
  }
});

test('tenant accent normalizes only opaque #RRGGBB and fails safely', () => {
  assert.equal(normalizeHex(' #b45309 '), '#B45309');
  for (const invalid of ['B45309', '#ABC', '#B45309FF', 'oklch(50% 1 1)', '', null]) assert.equal(normalizeHex(invalid), null);
  assert.equal(resolveTenantAccent('invalid', 'light').reason, 'invalid-input');
  assert.equal(resolveTenantAccent('invalid', 'dark').accent, '#F59E0B');
});

test('semantic colors remain outside the tenant accent result', () => {
  const result = resolveTenantAccent('#FF00FF', 'light');
  for (const semantic of ['success', 'warning', 'danger', 'info']) assert.equal(semantic in result, false);
  assert.ok(contrastRatio(result.accent, result.contrast) >= 4.5);
});
