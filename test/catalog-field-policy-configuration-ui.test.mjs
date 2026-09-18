import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pagePath = 'apps/dev-preview-web/src/pages/CatalogFieldPolicyConfigurationPage.tsx';

test('field-policy settings consume the authoritative API and retain explicit local draft semantics', async () => {
  const [page, api] = await Promise.all([readFile(pagePath, 'utf8'), readFile('apps/dev-preview-web/src/catalog-api.ts', 'utf8')]);
  assert.match(api, /getCatalogFieldPolicy\([^)]*\).*configuration\/field-policy/u);
  assert.match(api, /updateCatalogFieldPolicy\(input.*expectedVersion/u);
  assert.match(api, /restoreCatalogFieldPolicyDefaults\(expectedVersion/u);
  assert.match(page, /await getCatalogFieldPolicy\(\)/u);
  assert.match(page, /expectedVersion: policy\.policyVersion/u);
  assert.match(page, /setDraft\(policy\.fieldLevels\)/u);
  assert.match(page, /policy\.registry\.some\(\(field\) => draft\[field\.key\] !== policy\.fieldLevels\[field\.key\]\)/u);
  assert.doesNotMatch(page, /analyzeSupplierVersion|publishSupplierVersion|createSupplierDraft|replaceSupplierDraft/u);
});

test('field-policy settings render registry-defined fixed and configurable fields without frontend policy rules', async () => {
  const page = await readFile(pagePath, 'utf8');
  assert.match(page, /field\.domainFixed/u);
  assert.match(page, /field\.allowedLevels\.length > 1/u);
  assert.match(page, /fixedFields\.map/u);
  assert.match(page, /configurableFields\.map/u);
  assert.match(page, /styles\.fixedBadge/u);
  assert.match(page, /styles\.configurableBadge/u);
  assert.match(page, /field\.allowedLevels\.map/u);
  assert.match(page, /disabled=\{!canManage \|\| busy\}/u);
  assert.match(page, /referenceCostSensitive/u);
});

test('field-policy route and Settings navigation compose configuration and reference-cost authority', async () => {
  const [app, settings] = await Promise.all([readFile('apps/dev-preview-web/src/App.tsx', 'utf8'), readFile('apps/dev-preview-web/src/pages/SettingsPage.tsx', 'utf8')]);
  assert.match(app, /function CatalogFieldPolicyBoundary/u);
  assert.match(app, /'catalog\.configuration\.read'\) && hasOperationalCapability\(capabilities, 'catalog\.reference_cost\.read'/u);
  assert.match(app, /'catalog\.configuration\.manage'\) && hasOperationalCapability\(administrationCapabilities, 'catalog\.reference_cost\.manage'/u);
  assert.match(app, /\/configuracion\/catalogos\/lista-de-precios\/campos-de-carga/u);
  assert.match(settings, /const canReadCatalogFieldPolicy = .*catalog\.configuration\.read.*catalog\.reference_cost\.read/u);
  assert.match(settings, /const canManageCatalogFieldPolicy = .*catalog\.configuration\.manage.*catalog\.reference_cost\.manage/u);
});

test('field-policy settings keep stale conflict, discard and authoritative restore distinct', async () => {
  const page = await readFile(pagePath, 'utf8');
  assert.match(page, /cause\.status === 409/u);
  assert.match(page, /Recarga los valores actuales antes de guardar/u);
  assert.match(page, /Descartar cambios/u);
  assert.match(page, /restoreCatalogFieldPolicyDefaults\(policy\.policyVersion/u);
  assert.match(page, /El historial se conserva/u);
  assert.match(page, /data-restore-catalog-policy-trigger/u);
});
