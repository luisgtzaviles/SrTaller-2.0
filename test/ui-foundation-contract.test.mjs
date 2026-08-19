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

test('checker rejects dynamic Lucide and inline SVG', async () => withFixture(async (root) => {
  const path = resolve(root, 'apps/dev-preview-web/src/pages/probe.tsx');
  await writeFile(path, "import { DynamicIcon } from 'lucide-react';\nexport const probe = <svg />;\n");
  const failures = await validateUiFoundation(root);
  assert.ok(failures.some((problem) => problem.includes('DynamicIcon')));
  assert.ok(failures.some((problem) => problem.includes('inline SVG')));
}));
