import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const panelPaths = Object.freeze({
  risks: 'apps/dev-preview-web/src/components/RepairRiskCatalogPanel.tsx',
  brands: 'apps/dev-preview-web/src/components/RepairBrandCatalogPanel.tsx',
  models: 'apps/dev-preview-web/src/components/RepairModelCatalogPanel.tsx',
  categories: 'apps/dev-preview-web/src/components/RepairProblemCategoryCatalogPanel.tsx',
});

test('the four domain panels compose the same catalog administration primitives', async () => {
  const entries = await Promise.all(Object.entries(panelPaths).map(async ([name, path]) => [name, await readFile(path, 'utf8')]));
  for (const [name, source] of entries) {
    for (const primitive of [
      'CatalogPanel',
      'CatalogHeader',
      'CatalogToolbar',
      'CatalogLifecycleFilter',
      'CatalogTable',
      'CatalogScopeBadge',
      'CatalogStatusBadge',
      'CatalogUsage',
      'CatalogRowActions',
    ]) assert.match(source, new RegExp(`<${primitive}\\b`, 'u'), `${name} must render ${primitive}`);
    assert.doesNotMatch(source, /GenericCatalog/u);
  }
});

test('shared primitives own lifecycle, reconciliation, read-only, usage, and row-action presentation', async () => {
  const source = await readFile('apps/dev-preview-web/src/components/catalogs/CatalogAdministration.tsx', 'utf8');
  assert.match(source, /Activos/u);
  assert.match(source, /Inactivos/u);
  assert.match(source, /Todos/u);
  assert.match(source, /aria-pressed=\{value === option\.value\}/u);
  assert.match(source, /onClick=\{\(\) => onChange\(option\.value\)\}/u);
  assert.match(source, /pendingCount === 0 && value === 'canonical'/u);
  assert.match(source, /pendingCount > 0/u);
  assert.match(source, /onChange\('pending'\)/u);
  assert.match(source, /Sólo lectura/u);
  assert.match(source, /count === 1 \? 'reparación' : 'reparaciones'/u);
  assert.match(source, /count === 1 \? 'resultado' : 'resultados'/u);
  assert.match(source, /canonicalCount === 1 \? 'canónica' : 'canónicas'/u);
  assert.match(source, /actions\.length === 0/u);
});

test('reconciliation and domain exceptions stay owned by the correct panels', async () => {
  const [risks, brands, models, categories] = await Promise.all(Object.values(panelPaths).map((path) => readFile(path, 'utf8')));
  assert.doesNotMatch(risks, /CatalogReconciliationSummary/u);
  assert.doesNotMatch(risks, /Eliminar|Trash2|delete/u);
  for (const source of [brands, models, categories]) assert.match(source, /<CatalogReconciliationSummary\b/u);
  assert.match(models, /contextualFilter=\{brandFilter\}/u);
  assert.match(models, /<Select id="model-brand-filter"/u);
  assert.match(models, /Todas las marcas/u);
  assert.match(models, /La marca del modelo no puede cambiar después de crearlo/u);
  assert.match(categories, /if \(item\.deletable\) result\.push/u);
  assert.match(categories, /Eliminar definitivamente/u);
});

test('URL selection mounts one domain panel without changing domain ownership', async () => {
  const source = await readFile('apps/dev-preview-web/src/pages/RepairCatalogsPage.tsx', 'utf8');
  for (const catalog of ['risks', 'brands', 'models', 'categories']) assert.match(source, new RegExp(`catalog === '${catalog}'`, 'u'));
  assert.match(source, /next\.set\('catalog', catalog\)/u);
  assert.match(source, /setSearchParams\(next, \{ replace: true \}\)/u);
  assert.doesNotMatch(source, /GenericCatalog/u);
});
