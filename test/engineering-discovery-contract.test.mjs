import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const COMPONENT_FILES = Object.freeze([
  'apps/dev-preview-web/src/components/ui/SearchAutocomplete.tsx',
  'apps/dev-preview-web/src/components/ui/controls.tsx',
  'apps/dev-preview-web/src/components/ui/data-display.tsx',
  'apps/dev-preview-web/src/components/ui/feedback.tsx',
  'apps/dev-preview-web/src/components/ui/navigation.tsx',
  'apps/dev-preview-web/src/components/ui/overlays.tsx',
  'apps/dev-preview-web/src/components/ui/primitives.tsx',
]);

const REQUIRED_ENGINEERING_ROUTES = Object.freeze([
  'architecture/dec-005-policy.json',
  'MULTITENANCY_MODEL.md',
  'DATA_ARCHITECTURE.md',
  'dec-049-persistence-ownership',
  'dec-044-error-strategy',
  'dec-051-testing-ci-strategy',
  'DEFINITION_OF_DONE.md',
  'COMPONENT_CATALOG.md',
]);

function exportedNames(source) {
  return [...source.matchAll(/^export\s+(?:type\s+|interface\s+|function\s+|const\s+)([A-Za-z][A-Za-z0-9]*)/gmu)]
    .map((match) => match[1]);
}

test('AGENTS routes fresh work to the module guide and component catalog', async () => {
  const agents = await readFile('AGENTS.md', 'utf8');
  assert.match(agents, /docs\/engineering\/MODULE_CREATION\.md/u);
  assert.match(agents, /docs\/design-system\/COMPONENT_CATALOG\.md/u);
});

test('module guide routes every cross-cutting creation concern to its authority', async () => {
  const guide = await readFile('docs/engineering/MODULE_CREATION.md', 'utf8');
  for (const route of REQUIRED_ENGINEERING_ROUTES) {
    assert.ok(guide.includes(route), `module guide must route to ${route}`);
  }
  assert.match(guide, /Si cambio X, verifico Y/u);
  assert.match(guide, /Dry run: ampliar Customers sin implementarlo/u);
});

test('component catalog names every public shared UI export', async () => {
  const catalog = await readFile('docs/design-system/COMPONENT_CATALOG.md', 'utf8');
  const exports = [];
  for (const path of COMPONENT_FILES) {
    exports.push(...exportedNames(await readFile(path, 'utf8')));
  }
  assert.ok(exports.length > 0);
  for (const name of exports) {
    assert.ok(catalog.includes(`\`${name}\``), `component catalog must list ${name}`);
  }
});
