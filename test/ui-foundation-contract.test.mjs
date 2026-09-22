import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

import { validateUiFoundation } from '../scripts/lib/ui-foundation-contract.mjs';

test('current frontend has one governed visual foundation', async () => {
  assert.deepEqual(await validateUiFoundation(), []);
});

async function withFixture(run) {
  const root = await mkdtemp(join(tmpdir(), 'srtaller-ui-contract-'));
  try {
    await cp(resolve('apps/dev-preview-web'), resolve(root, 'apps/dev-preview-web'), { recursive: true, filter: (source) => !source.includes('node_modules') });
    await run(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test('checker rejects a reintroduced legacy foundation', async () => withFixture(async (root) => {
  await writeFile(resolve(root, 'apps/dev-preview-web/src/styles.css'), ':root { --accent: #ed5f2c; }\n');
  assert.ok((await validateUiFoundation(root)).some((problem) => problem.includes('legacy foundation')));
}));

test('checker rejects arbitrary component colors and breakpoints', async () => withFixture(async (root) => {
  const path = resolve(root, 'apps/dev-preview-web/src/pages/pages.module.css');
  await writeFile(path, `${await readFile(path, 'utf8')}\n.probe { color: #123456; }\n@media (max-width: 820px) { .probe { display: block; } }\n`);
  const failures = await validateUiFoundation(root);
  assert.ok(failures.some((problem) => problem.includes('hardcoded color')));
  assert.ok(failures.some((problem) => problem.includes('820px')));
}));

test('checker rejects legacy accent consumers that bypass semantic brand roles', async () => withFixture(async (root) => {
  const path = resolve(root, 'apps/dev-preview-web/src/pages/pages.module.css');
  await writeFile(path, `${await readFile(path, 'utf8')}\n.probe { color: var(--color-accent); }\n`);
  assert.ok((await validateUiFoundation(root)).some((problem) => problem.includes('legacy accent token')));
}));

test('checker requires the shared brand chrome roles', async () => withFixture(async (root) => {
  const path = resolve(root, 'apps/dev-preview-web/src/styles/tokens.css');
  await writeFile(path, (await readFile(path, 'utf8')).replace(/\s*--color-brand-chrome-border:[^;]+;/u, ''));
  assert.ok((await validateUiFoundation(root)).some((problem) => problem.includes('brand chrome token')));
}));

test('checker rejects dynamic Lucide and inline SVG', async () => withFixture(async (root) => {
  const path = resolve(root, 'apps/dev-preview-web/src/pages/probe.tsx');
  await writeFile(path, "import { DynamicIcon } from 'lucide-react';\nexport const probe = <svg />;\n");
  const failures = await validateUiFoundation(root);
  assert.ok(failures.some((problem) => problem.includes('DynamicIcon')));
  assert.ok(failures.some((problem) => problem.includes('inline SVG')));
}));

test('checker rejects arbitrary radius tokens and named colors', async () => withFixture(async (root) => {
  const path = resolve(root, 'apps/dev-preview-web/src/pages/pages.module.css');
  await writeFile(path, `${await readFile(path, 'utf8')}\n.probe { border-radius: var(--space-2); color: rebeccapurple; }\n`);
  const failures = await validateUiFoundation(root);
  assert.ok(failures.some((problem) => problem.includes('canonical radius token')));
  assert.ok(failures.some((problem) => problem.includes('hardcoded named color')));
}));

test('checker reads a minified final radius declaration without consuming the next selector', async () => withFixture(async (root) => {
  const path = resolve(root, 'apps/dev-preview-web/src/pages/pages.module.css');
  await writeFile(path, `${await readFile(path, 'utf8')}\n.probe{border-radius:var(--radius-md)}.next{display:block}\n`);
  const failures = await validateUiFoundation(root);
  assert.equal(
    failures.some((problem) => problem.includes('component radius')),
    false,
  );
}));

test('checker limits important declarations to the exact reduced-motion exception', async () => withFixture(async (root) => {
  const path = resolve(root, 'apps/dev-preview-web/src/styles/base.css');
  await writeFile(path, `${await readFile(path, 'utf8')}\n.probe { color: inherit !important; }\n`);
  assert.ok((await validateUiFoundation(root)).some((problem) => problem.includes('exact reduced-motion')));
}));

test('checker rejects an eager catalog import even when the lazy import remains', async () => withFixture(async (root) => {
  const path = resolve(root, 'apps/dev-preview-web/src/App.tsx');
  await writeFile(path, `import EagerCatalog from './catalog/UiCatalogPage.js';\n${await readFile(path, 'utf8')}\nvoid EagerCatalog;\n`);
  assert.ok((await validateUiFoundation(root)).some((problem) => problem.includes('imported eagerly')));
}));

test('checker rejects a second functional icon family', async () => withFixture(async (root) => {
  const path = resolve(root, 'apps/dev-preview-web/package.json');
  const manifest = JSON.parse(await readFile(path, 'utf8'));
  manifest.dependencies['react-feather'] = '2.0.10';
  await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`);
  assert.ok((await validateUiFoundation(root)).some((problem) => problem.includes('exactly one functional icon dependency')));
}));
