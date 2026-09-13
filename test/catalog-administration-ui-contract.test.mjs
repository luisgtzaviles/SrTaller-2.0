import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const panelPaths = Object.freeze({
  risks: 'apps/dev-preview-web/src/components/RepairRiskCatalogPanel.tsx',
  deviceTypes: 'apps/dev-preview-web/src/components/RepairDeviceTypeCatalogPanel.tsx',
  brands: 'apps/dev-preview-web/src/components/RepairBrandCatalogPanel.tsx',
  models: 'apps/dev-preview-web/src/components/RepairModelCatalogPanel.tsx',
  categories: 'apps/dev-preview-web/src/components/RepairProblemCategoryCatalogPanel.tsx',
});

test('the five Repairs domain panels compose the same catalog administration primitives', async () => {
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
      'CatalogSafeDeleteDialog',
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
  assert.match(source, /singular = 'reparación', plural = 'reparaciones'/u);
  assert.match(source, /count === 1 \? singular : plural/u);
  assert.match(source, /count === 1 \? 'resultado' : 'resultados'/u);
  assert.match(source, /canonicalCount === 1 \? 'canónica' : 'canónicas'/u);
  assert.match(source, /actions\.length === 0/u);
  assert.match(source, /export function CatalogSectionTabs/u);
  assert.match(source, /export function CatalogCanonicalUsageHeader/u);
  assert.match(source, /Reparaciones vinculadas por identidad canónica/u);
  assert.match(source, /No cuenta coincidencias del texto histórico/u);
  assert.match(source, /className=\{styles\.sectionTabs\}/u);
  assert.match(source, /aria-current=\{value === option\.value \? 'page'/u);
  assert.match(source, /export function deriveCatalogLifecycleActions/u);
  assert.match(source, /if \(input\.deletable\) return Object\.freeze\(\[edit, \{ key: 'delete'/u);
  assert.match(source, /if \(input\.status === 'inactive'\) return Object\.freeze\(\[edit, \{ key: 'reactivate'/u);
  assert.match(source, /key: 'deactivate', label: 'Desactivar'/u);
  assert.match(source, /export function CatalogSafeDeleteDialog/u);
  assert.match(source, /nunca ha sido utilizado/u);
  assert.match(source, /Eliminar definitivamente/u);
  assert.match(source, /export function CatalogMergeDialog/u);
  assert.match(source, /reassignmentCount/u);
  assert.match(source, /Las identidades fuente quedarán retiradas/u);
});

test('reconciliation stays domain-owned while safe-delete actions share one contract', async () => {
  const [risks, deviceTypes, brands, models, categories] = await Promise.all(Object.values(panelPaths).map((path) => readFile(path, 'utf8')));
  assert.doesNotMatch(risks, /CatalogReconciliationSummary/u);
  for (const source of [deviceTypes, brands, models, categories]) assert.match(source, /<CatalogReconciliationSummary\b/u);
  for (const source of [risks, deviceTypes, brands, models, categories]) {
    assert.match(source, /deriveCatalogLifecycleActions/u);
    assert.match(source, /<CatalogSafeDeleteDialog\b/u);
  }
  assert.match(models, /contextualFilter=\{brandFilter\}/u);
  assert.match(models, /<Select id="model-brand-filter"/u);
  assert.match(models, /Todas las marcas/u);
  assert.match(models, /La marca del modelo no puede cambiar después de crearlo/u);
  assert.match(categories, /deletable: item\.deletable/u);
});

test('URL selection mounts one domain panel without changing domain ownership', async () => {
  const source = await readFile('apps/dev-preview-web/src/pages/RepairCatalogsPage.tsx', 'utf8');
  for (const catalog of ['risks', 'brands', 'models', 'categories']) assert.match(source, new RegExp(`catalog === '${catalog}'`, 'u'));
  assert.match(source, /next\.set\('catalog', catalog\)/u);
  assert.match(source, /setSearchParams\(next, \{ replace: true \}\)/u);
  assert.match(source, /<CatalogSectionTabs/u);
  assert.doesNotMatch(source, /GenericCatalog/u);
});

test('Repairs and Price List use one shared visual language for catalog sections', async () => {
  const [page, priceList, sharedStyles, pageStyles] = await Promise.all([
    readFile('apps/dev-preview-web/src/pages/RepairCatalogsPage.tsx', 'utf8'),
    readFile('apps/dev-preview-web/src/components/CatalogPriceListReferencesPanel.tsx', 'utf8'),
    readFile('apps/dev-preview-web/src/components/catalogs/catalog-administration.module.css', 'utf8'),
    readFile('apps/dev-preview-web/src/pages/repair-catalogs-page.module.css', 'utf8'),
  ]);
  assert.match(page, /<CatalogSectionTabs/u);
  assert.match(priceList, /<CatalogSectionTabs/u);
  assert.match(priceList, /CatalogPanel/u);
  assert.match(priceList, /CatalogLifecycleFilter/u);
  assert.match(priceList, /CatalogStatusBadge/u);
  assert.match(priceList, /CatalogRowActions/u);
  assert.match(priceList, /singular="artículo" plural="artículos"/u);
  assert.match(priceList, /Artículos vinculados por identidad canónica/u);
  assert.match(sharedStyles, /\.sectionTabs button:hover:not\(:disabled\)/u);
  assert.match(sharedStyles, /\.sectionTabs button:focus-visible/u);
  assert.match(sharedStyles, /\.sectionTabs button\[aria-current='page'\]/u);
  assert.doesNotMatch(pageStyles, /\.catalogTabs/u);
});

test('Price List governance filters canonical and pending references by server applicability', async () => {
  const source = await readFile('apps/dev-preview-web/src/components/CatalogPriceListReferencesPanel.tsx', 'utf8');
  assert.match(source, /const \[typeFilter, setTypeFilter\] = useState<CatalogItemKind \| 'all'>\('all'\)/u);
  assert.match(source, /<option value="all">Todos<\/option>/u);
  for (const [kind, label] of [['PART', 'Refacción'], ['SERVICE', 'Servicio'], ['PRODUCT', 'Producto'], ['SUPPLY', 'Insumo']]) {
    assert.match(source, new RegExp(`${kind}: '${label}'`, 'u'));
  }
  assert.match(source, /allItems\.filter\(\(item\) => item\.applicableKinds\.includes\(typeFilter\)\)/u);
  assert.match(source, /allPending\.filter\(\(item\) => pendingKinds\(item\)\.includes\(typeFilter\)\)/u);
  assert.match(source, /type=\{referenceKind === 'category' \? 'radio' : 'checkbox'\}/u);
  assert.match(source, /deriveCatalogLifecycleActions/u);
  assert.match(source, /catalogSafeDeleteFailure/u);
  assert.match(source, /<CatalogSafeDeleteDialog\b/u);
});
