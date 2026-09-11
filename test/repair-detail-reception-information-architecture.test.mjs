import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const page = await readFile('apps/dev-preview-web/src/pages/RepairDetailPage.tsx', 'utf8');
const styles = await readFile('apps/dev-preview-web/src/pages/pages.module.css', 'utf8');
const app = await readFile('apps/dev-preview-web/src/App.tsx', 'utf8');
const newRepair = await readFile('apps/dev-preview-web/src/pages/NewRepairPage.tsx', 'utf8');
const reception = page.slice(
  page.indexOf('<article className={styles.intakeCard}'),
  page.indexOf('<section className={styles.repairTimeline}'),
);

test('Reception removes facts already promoted to the operational header', () => {
  for (const duplicate of [
    'repair.intake.receivedAt',
    'repair.intake.estimatedDeliveryAt',
    'repair.intake.initialBudgetAmountMinor',
    'repair.currentSituation.repairStatus',
    'repair.currentSituation.technician',
    'repair.currentSituation.custody',
    'repair.currentSituation.location',
  ]) assert.doesNotMatch(reception, new RegExp(duplicate.replaceAll('.', '\\.'), 'u'));
  assert.doesNotMatch(reception, /Estimación de entrega|Presupuesto inicial|Situación actual/u);
});

test('reported problems and Customer context lead the Reception record', () => {
  assert.match(reception, />Problema y contexto</u);
  assert.match(reception, />Problemas reportados</u);
  assert.match(reception, /reportedProblems\.map/u);
  assert.match(reception, /problem\.label/u);
  assert.match(reception, /Por revisar/u);
  assert.match(reception, /customerNarrative\?\.trim\(\) \?[\s\S]*?>Relato del cliente/u);
  assert.match(reception, /Sin problema reportado/u);
  assert.doesNotMatch(reception, /Sin relato registrado/u);
});

test('post-intake classification remains available as secondary metadata and action', () => {
  assert.match(reception, /receptionClassification/u);
  assert.match(reception, />Clasificación</u);
  assert.match(reception, /problemClassifications\.map/u);
  assert.match(reception, /removeClassification\(category\)/u);
  assert.match(reception, /onClick=\{openClassification\}>\+ Agregar categoría/u);
  assert.match(reception, /Sin clasificación/u);
  assert.match(styles, /\.receptionClassification[^{]*\{[\s\S]*?border-top: 1px solid/u);
});

test('physical state and received equipment use compact semantic groups', () => {
  assert.match(reception, />Estado físico recibido</u);
  for (const field of ['Condición física', 'Color', 'Estado al recibir']) assert.match(reception, new RegExp(field, 'u'));
  assert.match(reception, />Equipo recibido</u);
  for (const field of ['Tipo', 'IMEI / Serie', 'SIM', 'Memoria', 'Accesorios']) assert.match(reception, new RegExp(field, 'u'));
  assert.match(reception, /repair\.receivedDevice\.type/u);
  assert.match(reception, /identifierUnavailable \? 'No disponible'/u);
  assert.match(reception, /simIncluded !== null/u);
  assert.match(reception, /memoryCardIncluded !== null/u);
  assert.match(reception, /includedAccessory/u);
  assert.match(page, /return value \? 'Trae' : 'No trae'/u);
});

test('special conditions, risks and empty optional values use progressive density', () => {
  assert.match(page, /const hasSpecialConditions = Boolean/u);
  assert.match(reception, /hasSpecialConditions \? <section/u);
  assert.match(reception, />Condiciones especiales</u);
  assert.match(reception, /warrantyReviewRequested \? <div><dt>Garantía/u);
  assert.match(reception, /previousRepairId \? <div><dt>Reparación anterior/u);
  assert.match(reception, /deliveredByName\?\.trim\(\) \? <div><dt>Entrega/u);
  assert.match(reception, /acceptedInterventionRisks\.length > 0 \? <div/u);
  assert.match(reception, /acceptedInterventionRisks\.map/u);
  assert.match(reception, />Riesgos aceptados</u);
  assert.match(reception, /documentedRiskSummary\?\.trim\(\) \?[\s\S]*?>Detalle comunicado/u);
  assert.doesNotMatch(reception, /No solicitada|Sin riesgos aceptados registrados|Otros accesorios|No registrado/u);
});

test('access and reception attribution stay secure and concise', () => {
  assert.match(reception, /deviceAccessType \? <section/u);
  assert.match(reception, />Acceso</u);
  assert.match(reception, /accessType\(repair\.intake\.deviceAccessType\)/u);
  for (const state of ['Sin bloqueo', 'PIN — secreto no almacenado', 'Contraseña — secreto no almacenado', 'Patrón — secreto no almacenado']) assert.match(page, new RegExp(state, 'u'));
  assert.match(reception, /receivedBy \? <p[\s\S]*?>Recibió:/u);
  assert.doesNotMatch(reception, /deviceAccessSecret|patternSequence|codigo_seguridad/u);
});

test('responsive grouping preserves modal, direct-route and post-create boundaries', () => {
  assert.match(styles, /\.receptionTwinGroups \{ display: grid; border-top/u);
  assert.match(styles, /@media \(min-width: 768px\) \{[\s\S]*?\.receptionTwinGroups \{ grid-template-columns: repeat\(2/u);
  assert.match(styles, /\.receptionFactGrid \{ display: grid; grid-template-columns: repeat\(2/u);
  assert.match(styles, /grid-template-areas: "intake timeline concepts"/u);
  assert.match(page, /<section className=\{styles\.repairTimeline\}/u);
  assert.match(page, /<section className=\{styles\.repairEvidence\}/u);
  assert.match(app, /host="overlay"/u);
  assert.match(app, /location=\{backgroundLocation \?\? location\}/u);
  assert.match(newRepair, /backgroundLocation,[\s\S]*?restoreFocusSelector/u);
});
