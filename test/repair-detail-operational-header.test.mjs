import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const repository = await readFile('src/modules/repairs/infrastructure/persistence/kysely-repair.repository.ts', 'utf8');
const controller = await readFile('src/modules/repairs/presentation/repairs.controller.ts', 'utf8');
const page = await readFile('apps/dev-preview-web/src/pages/RepairDetailPage.tsx', 'utf8');
const styles = await readFile('apps/dev-preview-web/src/pages/pages.module.css', 'utf8');
const app = await readFile('apps/dev-preview-web/src/App.tsx', 'utf8');
const newRepair = await readFile('apps/dev-preview-web/src/pages/NewRepairPage.tsx', 'utf8');
const dataDisplayStyles = await readFile('apps/dev-preview-web/src/components/ui/ui.module.css', 'utf8');

const longIndicatorFixtures = Object.freeze({
  Estado: 'Esperando autorización del cliente',
  Técnico: 'Luis Antonio Gutierrez Aviles',
  Custodia: 'En resguardo de técnico',
  Ubicación: 'Área de diagnóstico principal',
});

test('operational header consumes the existing authoritative Detail projection', () => {
  const detailRead = repository.slice(repository.indexOf('async getRepairById'), repository.indexOf('async createRepair'));
  for (const source of [
    'repairs.received_at',
    'repair_intakes.estimated_delivery_at',
    'repair_intakes.initial_budget_amount_minor',
    'repairs.repair_status',
    'repairs.custody_status',
    'repair_technician_assignments',
    'repair_location_movements',
  ]) assert.match(detailRead, new RegExp(source.replaceAll('.', '\\.'), 'u'));
  assert.match(detailRead, /projected_repair_status: workflowTransition\?\.to_state \?\? row\.repair_status/u);
  assert.match(detailRead, /technician_id: activeAssignment\?\.technician_id \?\? null/u);
  assert.match(controller, /estimatedDeliveryAt: item\.estimatedDeliveryAt/u);
  assert.match(controller, /initialBudgetAmountMinor: item\.initialBudgetAmountMinor/u);
});

test('identity, three summaries and four labelled operational dimensions share one header', () => {
  const hero = page.slice(page.indexOf('<section className={styles.workspaceHero}'), page.indexOf('<div className={styles.workspaceMain}>'));
  assert.match(hero, /repair\.receivedDevice\.label/u);
  assert.match(hero, /repair\.customer\.name/u);
  assert.match(hero, /repair\.customer\.phone/u);
  assert.match(hero, /repair\.folio/u);
  assert.match(hero, />Corregir equipo</u);
  assert.match(hero, />Metadata técnica</u);
  assert.doesNotMatch(hero, /<code>\{repair\.id\}<\/code>/u);
  assert.equal((hero.match(/className=\{styles\.workspaceSummaryCards\}/gu) ?? []).length, 1);
  for (const label of ['Recepción', 'Promesa de entrega', 'Presupuesto inicial']) assert.match(hero, new RegExp(label, 'u'));
  for (const label of ['Estado', 'Técnico', 'Custodia', 'Ubicación']) assert.match(hero, new RegExp(`<dt>${label}</dt>`, 'u'));
});

test('optional commercial absences are low-noise while operational absences stay explicit', () => {
  assert.match(page, /data-empty=\{repair\.intake\.estimatedDeliveryAt === null\}/u);
  assert.match(page, /'Sin promesa'/u);
  assert.match(page, /data-empty=\{repair\.intake\.initialBudgetAmountMinor === null\}/u);
  assert.match(page, /'Sin presupuesto inicial'/u);
  assert.match(page, /currentTechnician\?\.displayName \?\? 'Sin asignar'/u);
  assert.match(page, /currentSituation\.location\?\.label \?\? 'Sin registrar'/u);
  assert.match(page, /timeZone,/u);
  assert.match(page, /MXN/u);
});

test('body and responsive hosts preserve the approved modal and direct-route contracts', () => {
  assert.doesNotMatch(page, /Situación actual|operationalRail/u);
  assert.match(page, /<article className=\{styles\.intakeCard\}/u);
  assert.match(page, /<section className=\{styles\.repairTimeline\}/u);
  assert.match(page, /<section className=\{styles\.repairConcepts\}/u);
  assert.match(styles, /grid-template-areas: "intake timeline concepts"/u);
  assert.match(styles, /workspaceSummaryCards \{ grid-template-columns: repeat\(2/u);
  assert.match(styles, /container: operational-header \/ inline-size/u);
  assert.match(styles, /@container operational-header \(min-width: 640px\)[\s\S]*workspaceOperationalIndicators \{ grid-template-columns: repeat\(4/u);
  assert.match(styles, /workspaceOverlay \.repairEvidence \{ grid-column: 1 \/ -1; \}/u);
  assert.match(app, /host="overlay"/u);
  assert.match(app, /location=\{backgroundLocation \?\? location\}/u);
  assert.match(newRepair, /backgroundLocation,[\s\S]*restoreFocusSelector/u);
});

test('long operational values wrap inside their own indicator without changing the shared StatusBadge', () => {
  assert.deepEqual(Object.keys(longIndicatorFixtures), ['Estado', 'Técnico', 'Custodia', 'Ubicación']);
  for (const value of Object.values(longIndicatorFixtures)) assert.ok(value.length >= 20);
  assert.match(page, /<dd className=\{styles\.workspaceOperationalStatus\}><StatusBadge/u);
  assert.match(styles, /\.workspaceOperationalIndicators dd \{[^}]*min-width: 0;[^}]*overflow-wrap: anywhere;/u);
  assert.match(styles, /\.workspaceOperationalStatus > span \{[^}]*max-width: 100%;[^}]*white-space: normal;[^}]*overflow-wrap: anywhere;/u);
  const operationalStyles = styles.slice(styles.indexOf('.workspaceOperationalIndicators'), styles.indexOf('.workspaceMain'));
  assert.doesNotMatch(operationalStyles, /text-overflow:\s*ellipsis|overflow:\s*hidden/u);
  assert.match(dataDisplayStyles, /\.statusBadge \{[^}]*white-space: nowrap;/u);
});

test('indicator order and responsive columns remain compatible with modal and direct Detail', () => {
  const indicators = page.slice(page.indexOf('className={styles.workspaceOperationalIndicators}'), page.indexOf('</dl>', page.indexOf('className={styles.workspaceOperationalIndicators}')));
  assert.ok(['Estado', 'Técnico', 'Custodia', 'Ubicación'].every((label, index, labels) => index === 0 || indicators.indexOf(label) > indicators.indexOf(labels[index - 1])));
  assert.match(styles, /\.workspaceOperationalIndicators \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); \}/u);
  assert.match(styles, /@media \(min-width: 1024px\)[\s\S]*@container operational-header \(min-width: 640px\)[\s\S]*\.workspaceOperationalIndicators \{ grid-template-columns: repeat\(4, minmax\(0, 1fr\)\); \}/u);
  assert.doesNotMatch(styles, /workspaceOverlay \.workspaceOperationalStatus/u);
});
