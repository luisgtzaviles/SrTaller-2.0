import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { contrastRatio } from '../apps/dev-preview-web/src/foundation/accent.mjs';

const tokensSource = await readFile('apps/dev-preview-web/src/styles/tokens.css', 'utf8');
const shellSource = await readFile('apps/dev-preview-web/src/components/shell/application-shell.module.css', 'utf8');
const shellComponentSource = await readFile('apps/dev-preview-web/src/components/shell/ApplicationShell.tsx', 'utf8');
const uiSource = await readFile('apps/dev-preview-web/src/components/ui/ui.module.css', 'utf8');
const overlaySource = await readFile('apps/dev-preview-web/src/components/ui/overlays.tsx', 'utf8');
const catalogSource = await readFile('apps/dev-preview-web/src/catalog/UiCatalogPage.tsx', 'utf8');
const repairDetailSource = await readFile('apps/dev-preview-web/src/pages/RepairDetailPage.tsx', 'utf8');
const repairsSource = await readFile('apps/dev-preview-web/src/pages/RepairsPage.tsx', 'utf8');

function themeTokens(theme) {
  const selector = theme === 'light' ? ':root,\n[data-theme="light"]' : '[data-theme="dark"]';
  const start = tokensSource.indexOf(`${selector} {`);
  assert.notEqual(start, -1, `${theme} token block is missing`);
  const end = tokensSource.indexOf('\n}', start);
  assert.notEqual(end, -1, `${theme} token block is not closed`);
  return Object.fromEntries([...tokensSource.slice(start, end).matchAll(/--([a-z0-9-]+):\s*(#[0-9A-F]{6});/gu)]
    .map((match) => [match[1], match[2]]));
}

test('normal text and semantic status tokens preserve WCAG AA contrast', () => {
  for (const theme of ['light', 'dark']) {
    const tokens = themeTokens(theme);
    for (const foreground of ['color-text', 'color-text-muted', 'color-text-subtle']) {
      for (const background of ['color-canvas', 'color-surface', 'color-surface-raised', 'color-surface-subtle']) {
        assert.ok(contrastRatio(tokens[foreground], tokens[background]) >= 4.5, `${theme} ${foreground} on ${background}`);
      }
    }
    for (const tone of ['success', 'warning', 'danger', 'info']) {
      assert.ok(contrastRatio(tokens[`color-${tone}`], tokens[`color-${tone}-subtle`]) >= 4.5, `${theme} ${tone}`);
    }
    for (const foreground of ['color-shell-text', 'color-shell-muted']) {
      for (const background of ['color-shell', 'color-shell-raised']) {
        assert.ok(contrastRatio(tokens[foreground], tokens[background]) >= 4.5, `${theme} ${foreground} on ${background}`);
      }
    }
    assert.ok(contrastRatio(tokens['color-on-accent'], tokens['color-accent']) >= 4.5, `${theme} on-accent`);
    assert.ok(contrastRatio(tokens['color-border-strong'], tokens['color-surface']) >= 3, `${theme} control boundary`);
  }
});

test('mobile shell and entity cards remain active below the lg breakpoint', () => {
  assert.doesNotMatch(shellSource, /@media \(min-width: 768px\)/u);
  assert.match(shellSource, /@media \(min-width: 1024px\) \{[\s\S]*?grid-template-columns: var\(--sidebar-expanded\)/u);
  assert.doesNotMatch(uiSource, /@media \(min-width: 768px\)/u);
  assert.match(uiSource, /@media \(min-width: 1024px\) \{[\s\S]*?\.tableViewport \{ display: block/u);
});

test('focus and touch contracts are explicit for shared controls', () => {
  assert.match(uiSource, /\.input:focus-visible \{ outline: 3px solid var\(--color-focus\); outline-offset: 2px; \}/u);
  assert.match(uiSource, /@media \(pointer: coarse\) \{[\s\S]*?\.input \{ min-height: var\(--touch-target\); \}/u);
  assert.match(catalogSource, /aria-pressed=\{preference === theme\}/u);
  assert.doesNotMatch(shellComponentSource, /<button[^>]+drawerBackdrop/gu);
  assert.doesNotMatch(overlaySource, /<button[^>]+backdrop/gu);
  assert.match(repairDetailSource, /title="Detalle de reparación"/u);
  assert.match(repairsSource, /failed \? 'Conteo no disponible' : loading \? 'Cargando…'/u);
});
