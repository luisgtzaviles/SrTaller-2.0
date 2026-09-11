import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const page = await readFile('apps/dev-preview-web/src/pages/RepairDetailPage.tsx', 'utf8');
const styles = await readFile('apps/dev-preview-web/src/pages/pages.module.css', 'utf8');
const app = await readFile('apps/dev-preview-web/src/App.tsx', 'utf8');
const newRepair = await readFile('apps/dev-preview-web/src/pages/NewRepairPage.tsx', 'utf8');
const conceptsStart = page.indexOf('<section className={styles.repairConcepts}');
const conceptsEnd = page.indexOf('</section>', conceptsStart);
const concepts = page.slice(conceptsStart, conceptsEnd);

test('Conceptos exists as a concise future-facing sibling surface', () => {
  assert.notEqual(conceptsStart, -1);
  assert.match(concepts, /aria-labelledby="repair-concepts-title"/u);
  assert.match(concepts, /<h2 id="repair-concepts-title">Conceptos<\/h2>/u);
  assert.match(concepts, />Próximamente</u);
  assert.match(concepts, /refacciones, servicios y conceptos personalizados/u);
  assert.match(concepts, /Lista de precios y Caja/u);
});

test('placeholder exposes no fake commercial or payment functionality', () => {
  assert.doesNotMatch(concepts, /<button|<Button|onClick=|Agregar concepto|Abonar|Pagar/u);
  assert.doesNotMatch(concepts, /\$|Total|Pagado|Saldo|amountPaid|advanceTotal|paymentHistory/u);
  assert.doesNotMatch(concepts, /disabled=/u);
});

test('desktop body reserves a restrained 32 43 25 three-column layout', () => {
  assert.match(styles, /grid-template-areas: "intake timeline concepts"/u);
  assert.match(styles, /grid-template-columns: minmax\(0, 0\.32fr\) minmax\(0, 0\.43fr\) minmax\(0, 0\.25fr\)/u);
  assert.match(styles, /\.repairConcepts \{ grid-area: concepts; \}/u);
  assert.doesNotMatch(page, />Situación actual</u);
});

test('Conceptos keeps whole words while its badge wraps without changing the grid', () => {
  assert.match(styles, /\.repairConcepts > header \{ flex-wrap: wrap; \}/u);
  assert.match(styles, /\.repairConcepts > header h2,[\s\S]*\.repairConcepts > header > span \{ overflow-wrap: normal; word-break: keep-all; white-space: nowrap; \}/u);
  assert.match(styles, /grid-template-columns: minmax\(0, 0\.32fr\) minmax\(0, 0\.43fr\) minmax\(0, 0\.25fr\)/u);
});

test('tablet and mobile keep functional information ahead of the placeholder', () => {
  assert.match(styles, /@media \(min-width: 768px\) \{[\s\S]*?"intake timeline"[\s\S]*?"concepts concepts"/u);
  assert.match(styles, /\.repairConcepts \{ order: 4; align-self: start; \}/u);
  assert.match(styles, /\.repairEvidence \{ order: 5; \}/u);
  const intake = page.indexOf('<article className={styles.intakeCard}');
  const timeline = page.indexOf('<section className={styles.repairTimeline}');
  const evidence = page.indexOf('<section className={styles.repairEvidence}');
  assert.ok(intake < timeline && timeline < conceptsStart && conceptsStart < evidence);
});

test('Reception Historial Evidence and operational header remain intact', () => {
  for (const section of ['Problema y contexto', 'Estado físico recibido', 'Equipo recibido', 'Condiciones especiales', 'Historial', 'Evidencias']) assert.match(page, new RegExp(section, 'u'));
  for (const summary of ['Recepción', 'Promesa de entrega', 'Presupuesto inicial', 'Estado', 'Técnico', 'Custodia', 'Ubicación']) assert.match(page, new RegExp(summary, 'u'));
  assert.match(page, /className=\{styles\.noteComposer\}/u);
  assert.match(page, /className=\{styles\.evidenceGrid\}/u);
});

test('modal direct route and post-create routing boundaries are unchanged', () => {
  assert.match(app, /host="overlay"/u);
  assert.match(app, /location=\{backgroundLocation \?\? location\}/u);
  assert.match(newRepair, /backgroundLocation,[\s\S]*?restoreFocusSelector/u);
  assert.match(page, /size="workspace"/u);
  assert.doesNotMatch(styles, /workspaceOverlay \.repairTimeline \{[^}]*max-height|workspaceOverlay \.timelineContent \{[^}]*overflow-y/u);
});

test('Conceptos is readable but adds no focus target', () => {
  assert.match(styles, /\.conceptsPlaceholder p \{[^}]*color: var\(--color-text-muted\)/u);
  assert.match(styles, /\.repairConcepts > header > span \{[^}]*text-transform: uppercase/u);
  assert.doesNotMatch(concepts, /tabIndex|role="button"|aria-disabled/u);
});
