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
  assert.match(source, /const openSupplierGate = \(restoreTarget: string, preservePreparation = false\): void/u);
  assert.match(source, /const continueNewLoad = \(\): boolean/u);
  assert.match(source, /setPendingNewLoadSupplierId\(sourceId\); setCurrent\(null\)/u);
  assert.match(source, /setBrowseSourceId\(value\.sourceId\); setPendingNewLoadSupplierId\(null\)/u);
  assert.doesNotMatch(source, /beginNewVersion/u);
});

test('gate has no silent supplier confirmation, permits one-click choice, and restores focus on cancel', async () => {
  const source = await readFile('apps/dev-preview-web/src/pages/BulkCatalogComposerPage.tsx', 'utf8');
  assert.match(source, /<Dialog open=\{supplierGateOpen\} size="wide" title="Nueva carga" description="Elige el proveedor y qué contiene esta carga antes de pegar datos\." restoreFocusSelector=\{`#\$\{supplierGateRestoreTarget\}`\}/u);
  assert.match(source, /placeholder="Buscar proveedor\.\.\."/u);
  assert.match(source, /onClick=\{\(\) => setSupplierGateSupplierId\(source\.sourceId\)\}/u);
  assert.match(source, /onClick=\{continueNewLoad\}/u);
  assert.match(source, /Nueva carga; seleccionar proveedor/u);
  assert.match(source, /onClick=\{\(\) => openSupplierGate\(`supplier-gate-source-\$\{source\.sourceId\}`\)\}/u);
  assert.match(source, /pendingSupplier\?\.name \?\? 'Sin seleccionar'/u);
  assert.match(source, /Proveedor e intención de esta carga · El número se asignará al guardar/u);
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
  const sourcesPanel = ui.slice(ui.indexOf('<aside id="composer-sources-panel"'), ui.indexOf('</aside>'));
  assert.match(sourcesPanel, /className=\{styles\.sidebarHeading\}[\s\S]*?Fuentes y versiones[\s\S]*?aria-label="Ocultar fuentes y versiones"/u);
  assert.match(ui, /\{sourcesOpen \? <aside id="composer-sources-panel"[\s\S]*?aria-label="Ocultar fuentes y versiones"/u);
  assert.match(ui, /<main className=\{styles\.composer\} aria-busy=\{busy\}>[\s\S]*?\{!sourcesOpen \? <button[\s\S]*?aria-label="Mostrar fuentes y versiones"/u);
  assert.match(ui, /aria-controls="composer-sources-panel"/u);
  assert.match(ui, /const sourcesToggleRef = useRef<HTMLButtonElement \| null>\(null\); const pendingSourcesToggleFocus = useRef\(false\);/u);
  assert.match(ui, /sourcesToggleRef\.current\?\.focus\(\);[\s\S]*?\}, \[sourcesOpen\]\);/u);
  assert.match(ui, /onClick=\{\(\) => changeSourcesVisibility\(false\)\}/u);
  assert.match(ui, /onClick=\{\(\) => changeSourcesVisibility\(true\)\}/u);
  assert.match(css, /\.layoutCollapsed \{ grid-template-columns: minmax\(0, 1fr\); gap: 0; \}/u);
  assert.match(css, /\.composer \{ position: relative;/u);
  assert.match(css, /\.sourceRestoreControl \{ position: absolute;[\s\S]*?left: 0;[\s\S]*?border-left: 0;/u);
  assert.doesNotMatch(css, /\.sourceRestoreRail/u);
  assert.doesNotMatch(css, /\.sourcePanelControl/u);
});

test('contextual supplier creation returns to the pending new-load flow while persisted versions remain immutable', async () => {
  const [ui, service, repository] = await Promise.all([
    readFile('apps/dev-preview-web/src/pages/BulkCatalogComposerPage.tsx', 'utf8'),
    readFile('src/modules/catalog/application/bulk-catalog.service.ts', 'utf8'),
    readFile('src/modules/catalog/infrastructure/persistence/kysely-bulk-catalog.repository.ts', 'utf8'),
  ]);
  assert.match(ui, /openNewSource\('GATE'\)/u);
  assert.match(ui, /newSourceOrigin === 'GATE'/u);
  assert.match(ui, /setSupplierGateSupplierId\(created\.sourceId\); setSupplierGateCompleteness\(null\); setSupplierGateOpen\(true\)/u);
  assert.match(ui, /showToast\('Proveedor creado\. El trabajo actual se conserva\.'\)/u);
  assert.doesNotMatch(ui, /setBrowseSourceId\(created\.sourceId\); clearNewLoad\(\)/u);
  assert.match(service, /createDraft[\s\S]*?const sourceId = requiredUuid\(body\.sourceId, 'sourceId'\)/u);
  assert.doesNotMatch(service, /replaceDraft[\s\S]*?sourceId: requiredUuid/u);
  assert.match(repository, /updateTable\('catalog_supplier_catalog_versions'\)\.set\(\{ composer_mode: input\.mode, description: input\.description, completeness: input\.completeness/u);
  assert.doesNotMatch(repository, /updateTable\('catalog_supplier_catalog_versions'\)\.set\(\{[^}]*source_id/u);
});

test('Review list keeps draft recovery secondary and preserves result-first/reanalyze behavior', async () => {
  const source = await readFile('apps/dev-preview-web/src/pages/BulkCatalogComposerPage.tsx', 'utf8');
  assert.match(source, /const reviewInFlight = useRef\(false\)/u);
  assert.match(source, /if \(busy \|\| reviewInFlight\.current\) return;/u);
  assert.match(source, /orchestrateReviewList\(\{[\s\S]*?persist: persistDraft,[\s\S]*?analyze: async \(snapshot\)/u);
  assert.match(source, /La lista quedó guardada, pero no pudo analizarse\./u);
  assert.match(source, /tone="primary" onClick=\{\(\) => void reviewList\(\)\}[\s\S]*?Revisar lista/u);
  assert.match(source, /captureActionState\(\{ lifecycle: current\?\.lifecycle \?\? null, dirty, hasMeaningfulWork \}\)/u);
  assert.match(source, /className=\{styles\.viewControls\}[\s\S]*?className=\{styles\.workflowControls\}/u);
  assert.match(source, /tone="quiet" onClick=\{\(\) => void save\(\)\}[\s\S]*?Guardar para después/u);
  assert.doesNotMatch(source, /Guardar borrador/u);
  assert.match(source, /captureActionsVisible \? <>[\s\S]*?Revisar lista[\s\S]*?canSaveForLater \? <Button/u);
  assert.match(source, /current\?\.lifecycle === 'INGESTED'[\s\S]*?Reanalizar versión/u);
  assert.match(source, /setGridExpanded\(false\); resetCoverageDetails\(\); setReconciliationView\('ATTENTION'\)/u);
  assert.match(source, /aria-busy=\{busy\}/u);
});

test('capture mode is an advanced restricted-update option, not a primary radio choice', async () => {
  const source = await readFile('apps/dev-preview-web/src/pages/BulkCatalogComposerPage.tsx', 'utf8');
  assert.match(source, /setMode\('FULL'\)/u);
  assert.match(source, /Opciones avanzadas/u);
  assert.match(source, /Solo actualizar artículos identificados/u);
  assert.match(source, /No permite crear artículos nuevos\./u);
  assert.match(source, /aria-expanded=\{advancedOptionsOpen\} aria-controls="capture-mode-advanced-options"/u);
  assert.match(source, /aria-describedby="capture-mode-advanced-description"/u);
  assert.match(source, /event\.target\.checked \? 'COMPACT' : 'FULL'/u);
  assert.doesNotMatch(source, /<legend>Modo de captura<\/legend>/u);
});
