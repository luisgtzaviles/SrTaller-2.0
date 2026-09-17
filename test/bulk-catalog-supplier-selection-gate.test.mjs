import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  filterSupplierSources,
  hasMeaningfulComposerWork,
} from '../apps/dev-preview-web/src/pages/bulk-catalog-composer-model.mjs';

const blankRow = () => ({ kind: '', supplierObservedTitle: '', title: '', description: '', category: '', brand: '', supplierItemCode: '', sku: '', barcode: '', price: '', cost: '' });

test('supplier search is local, case-insensitive, and does not select a supplier', () => {
  const sources = Object.freeze([
    Object.freeze({ sourceId: 'ag', name: 'AG' }),
    Object.freeze({ sourceId: 'b', name: 'Proveedor B' }),
  ]);
  assert.deepEqual(filterSupplierSources(sources, ''), sources);
  assert.deepEqual(filterSupplierSources(sources, 'proveedor b').map((source) => source.sourceId), ['b']);
  assert.deepEqual(filterSupplierSources(sources, 'AG').map((source) => source.sourceId), ['ag']);
});

test('unsaved-work guard is quiet for an empty workspace and reacts only to material local work', () => {
  assert.equal(hasMeaningfulComposerWork({ dirty: false, description: '', mode: 'FULL', completeness: 'PARTIAL', rows: [blankRow()] }), false);
  assert.equal(hasMeaningfulComposerWork({ dirty: true, description: '', mode: 'FULL', completeness: 'PARTIAL', rows: [blankRow()] }), false);
  assert.equal(hasMeaningfulComposerWork({ dirty: true, description: '', mode: 'FULL', completeness: 'PARTIAL', rows: [{ ...blankRow(), title: 'Pantalla' }] }), true);
  assert.equal(hasMeaningfulComposerWork({ dirty: true, description: '', mode: 'COMPACT', completeness: 'PARTIAL', rows: [blankRow()] }), true);
  assert.equal(hasMeaningfulComposerWork({ dirty: true, description: 'Lista septiembre', mode: 'FULL', completeness: 'PARTIAL', rows: [blankRow()] }), true);
});

test('Composer keeps browsing separate from pending new-load supplier ownership', async () => {
  const source = await readFile('apps/dev-preview-web/src/pages/BulkCatalogComposerPage.tsx', 'utf8');
  assert.match(source, /const \[browseSourceId, setBrowseSourceId\] = useState\(''\)/u);
  assert.match(source, /const \[pendingNewLoadSupplierId, setPendingNewLoadSupplierId\] = useState<string \| null>\(null\)/u);
  assert.match(source, /const openSupplierGate = \(restoreTarget: string\): void/u);
  assert.match(source, /const startNewLoad = \(sourceId: string\): boolean/u);
  assert.match(source, /setPendingNewLoadSupplierId\(sourceId\); setCurrent\(null\)/u);
  assert.match(source, /setBrowseSourceId\(value\.sourceId\); setPendingNewLoadSupplierId\(null\)/u);
  assert.doesNotMatch(source, /beginNewVersion/u);
});

test('gate has no silent supplier confirmation, permits one-click choice, and restores focus on cancel', async () => {
  const source = await readFile('apps/dev-preview-web/src/pages/BulkCatalogComposerPage.tsx', 'utf8');
  assert.match(source, /<Dialog open=\{supplierGateOpen\} title="Nueva carga" description="¿De qué proveedor es esta lista\?" restoreFocusSelector=\{`#\$\{supplierGateRestoreTarget\}`\}/u);
  assert.match(source, /placeholder="Buscar proveedor\.\.\."/u);
  assert.match(source, /onClick=\{\(\) => startNewLoad\(source\.sourceId\)\}/u);
  assert.match(source, /Nueva carga; seleccionar proveedor/u);
  assert.match(source, /onClick=\{\(\) => openSupplierGate\(`supplier-gate-source-\$\{source\.sourceId\}`\)\}/u);
  assert.match(source, /pendingSupplier\?\.name \?\? 'Sin seleccionar'/u);
  assert.match(source, /Proveedor de esta carga · El número se asignará al guardar/u);
  assert.match(source, />Cambiar<\/Button>/u);
});

test('workspace entry has one primary new-load CTA and a recoverable sources panel', async () => {
  const [ui, css] = await Promise.all([
    readFile('apps/dev-preview-web/src/pages/BulkCatalogComposerPage.tsx', 'utf8'),
    readFile('apps/dev-preview-web/src/pages/bulk-catalog-composer-page.module.css', 'utf8'),
  ]);
  assert.match(ui, /id="supplier-gate-new-load"[\s\S]*?>[\s\S]*?Nueva carga/u);
  assert.doesNotMatch(ui, /supplier-gate-main-new-load/u);
  assert.match(ui, /className=\{styles\.emptyWorkspace\}[\s\S]*?Selecciona una versión para revisarla/u);
  const emptyWorkspace = ui.slice(ui.indexOf('className={styles.emptyWorkspace}'), ui.indexOf('</section>}', ui.indexOf('className={styles.emptyWorkspace}')));
  assert.doesNotMatch(emptyWorkspace, /Nueva carga/u);
  assert.match(ui, /id="composer-sources-panel-toggle"[\s\S]*?aria-expanded=\{sourcesOpen\}[\s\S]*?aria-controls="composer-sources-panel"/u);
  assert.match(ui, /aria-label=\{sourcesOpen \? 'Ocultar fuentes y versiones' : 'Mostrar fuentes y versiones'\}/u);
  assert.match(ui, /onClick=\{\(\) => setSourcesOpen\(\(value\) => !value\)\}/u);
  assert.match(ui, /\{sourcesOpen \? <aside id="composer-sources-panel"/u);
  assert.match(css, /\.layoutCollapsed \{ grid-template-columns: 32px minmax\(0, 1fr\); \}/u);
  assert.match(css, /\.sourcePanelControl \{ position: sticky;/u);
});

test('contextual supplier creation returns to the pending new-load flow while persisted versions remain immutable', async () => {
  const [ui, service, repository] = await Promise.all([
    readFile('apps/dev-preview-web/src/pages/BulkCatalogComposerPage.tsx', 'utf8'),
    readFile('src/modules/catalog/application/bulk-catalog.service.ts', 'utf8'),
    readFile('src/modules/catalog/infrastructure/persistence/kysely-bulk-catalog.repository.ts', 'utf8'),
  ]);
  assert.match(ui, /openNewSource\('GATE'\)/u);
  assert.match(ui, /newSourceOrigin === 'GATE'/u);
  assert.match(ui, /if \(!startNewLoad\(created\.sourceId\)\) setSupplierGateOpen\(true\)/u);
  assert.match(ui, /showToast\('Proveedor creado\. El trabajo actual se conserva\.'\)/u);
  assert.doesNotMatch(ui, /setBrowseSourceId\(created\.sourceId\); clearNewLoad\(\)/u);
  assert.match(service, /createDraft[\s\S]*?const sourceId = requiredUuid\(body\.sourceId, 'sourceId'\)/u);
  assert.doesNotMatch(service, /replaceDraft[\s\S]*?sourceId: requiredUuid/u);
  assert.match(repository, /updateTable\('catalog_supplier_catalog_versions'\)\.set\(\{ description: input\.description, completeness: input\.completeness/u);
  assert.doesNotMatch(repository, /updateTable\('catalog_supplier_catalog_versions'\)\.set\(\{[^}]*source_id/u);
});
