import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const portSource = await readFile('src/modules/repairs/application/ports/repair-repository.port.ts', 'utf8');
const useCaseSource = await readFile('src/modules/repairs/application/use-cases/get-repair-detail.use-case.ts', 'utf8');
const repositorySource = await readFile('src/modules/repairs/infrastructure/persistence/kysely-repair.repository.ts', 'utf8');
const controllerSource = await readFile('src/modules/repairs/presentation/repairs.controller.ts', 'utf8');
const detailPageSource = await readFile('apps/dev-preview-web/src/pages/RepairDetailPage.tsx', 'utf8');
const appSource = await readFile('apps/dev-preview-web/src/App.tsx', 'utf8');
const repairsPageSource = await readFile('apps/dev-preview-web/src/pages/RepairsPage.tsx', 'utf8');
const overlaysSource = await readFile('apps/dev-preview-web/src/components/ui/overlays.tsx', 'utf8');
const apiSource = await readFile('apps/dev-preview-web/src/api.ts', 'utf8');
const databaseTypesSource = await readFile('src/infrastructure/database/database-types.ts', 'utf8');
const intakeMigrationSource = await readFile('src/infrastructure/database/migrations/20260819130000_repairs_create_intakes.ts', 'utf8');

test('repair detail repository contract is scoped by tenant, branch, and repair id', () => {
  assert.match(portSource, /getRepairById\([\s\S]*?scope: RepairPersistenceScope,[\s\S]*?repairId: string,[\s\S]*?\)/u);
  assert.match(repositorySource, /where\('repairs\.tenant_id', '=', validatedScope\.tenantId\)[\s\S]*?where\('repairs\.branch_id', '=', validatedScope\.branchId\)[\s\S]*?where\('repairs\.repair_id', '=', repairId\)/u);
  assert.match(repositorySource, /const validatedScope = validateScope\(scope\);[\s\S]*?getRepairById/u);
});

test('repair detail owns a distinct read model and uses an explicit minimized projection', () => {
  assert.match(portSource, /export interface RepairDetailRecord \{/u);
  assert.doesNotMatch(portSource, /RepairDetailRecord extends RepairWorklistRecord/u);
  const detailMethod = repositorySource.slice(
    repositorySource.indexOf('async getRepairById'),
    repositorySource.indexOf('async addOperationalNote'),
  );
  assert.match(detailMethod, /leftJoin\('repair_intakes'/u);
  assert.match(detailMethod, /\.select\(\[/u);
  assert.doesNotMatch(detailMethod, /selectAll/u);
  for (const field of [
    'device_color',
    'received_by_display_name',
    'customer_narrative',
    'physical_condition_summary',
    'documented_risk_summary',
  ]) {
    assert.match(detailMethod, new RegExp(`\\b${field}\\b`, 'u'));
  }
});

test('repair intake schema is a scoped repairs-owned extension instead of detail columns on repairs', () => {
  assert.match(databaseTypesSource, /export interface RepairIntakeTable/u);
  assert.match(intakeMigrationSource, /createTable\('repair_intakes'\)/u);
  assert.match(intakeMigrationSource, /repair_intakes_repair_scope_fk/u);
  assert.match(intakeMigrationSource, /\['tenant_id', 'branch_id', 'repair_id'\]/u);
  assert.doesNotMatch(intakeMigrationSource, /pin|password|pattern|unlock|imei|secret/iu);
});

test('repair detail use case validates the id and derives server scope', () => {
  assert.match(useCaseSource, /canonicalUuid/u);
  assert.match(useCaseSource, /GetRepairDetailInputError/u);
  assert.match(useCaseSource, /this\.repository\.getRepairById\(this\.resolveScope\(\), repairId\)/u);
  assert.match(useCaseSource, /RepairDetailNotFoundError/u);
});

test('repair detail read endpoint derives scope and projects the approved fields', () => {
  assert.match(controllerSource, /@Get\(':id'\)/u);
  assert.match(controllerSource, /@Param\('id'\) id: string/u);
  assert.match(controllerSource, /REPAIR_ID_INVALID/u);
  assert.match(controllerSource, /REPAIR_NOT_FOUND/u);
  const detailReadEndpoint = controllerSource.slice(controllerSource.indexOf("@Get(':id')"));
  assert.doesNotMatch(detailReadEndpoint, /@Body|tenantId|branchId/iu);
  for (const field of ['id', 'folio', 'customer', 'receivedDevice', 'intake', 'receivedAt', 'receivedBy', 'reportedIssue', 'customerNarrative', 'physicalConditionSummary', 'documentedRiskSummary', 'currentSituation', 'technician', 'repairStatus', 'location', 'custody']) {
    assert.match(controllerSource, new RegExp(`\\b${field}\\b`, 'u'));
  }
  for (const excluded of ['createdAt', 'financial', 'price', 'history', 'photos', 'whatsapp', 'pin', 'password', 'pattern', 'unlock', 'imei', 'warranty']) {
    assert.doesNotMatch(controllerSource, new RegExp(excluded, 'iu'));
  }
});

test('frontend detail contract is independent from the worklist item', () => {
  assert.match(apiSource, /export interface RepairDetail \{/u);
  assert.doesNotMatch(apiSource, /type RepairDetail = RepairWorklistItem/u);
  assert.match(apiSource, /receivedDevice/u);
  assert.match(apiSource, /currentSituation/u);
});

test('repair detail page preserves the worklist return query and keeps D3 as its only write', () => {
  assert.match(detailPageSource, /useParams\(\)/u);
  assert.match(detailPageSource, /location\.search/u);
  assert.match(detailPageSource, /`\/reparaciones\$\{location\.search\}`/u);
  assert.match(detailPageSource, /getRepairDetail\(id, signal\)/u);
  assert.match(detailPageSource, /Volver a reparaciones/u);
  assert.match(detailPageSource, /export function RepairDetailWorkspace/u);
  for (const section of ['Equipo recibido', 'Recepción', 'Situación actual', 'Historial', 'Evidencias']) {
    assert.match(detailPageSource, new RegExp(section, 'u'));
  }
  assert.match(detailPageSource, /Relato del cliente/u);
  assert.match(detailPageSource, /Riesgo documentado\/informado/u);
  assert.match(detailPageSource, /Sin técnico asignado/u);
  assert.match(detailPageSource, /Ubicación no registrada/u);
  assert.match(detailPageSource, /Sin riesgo documentado/u);
  const heroSource = detailPageSource.slice(
    detailPageSource.indexOf('<section className={styles.workspaceHero}'),
    detailPageSource.indexOf('<div className={styles.workspaceMain}>'),
  );
  assert.doesNotMatch(heroSource, />Técnico<|>Custodia<|>Ubicación</u);
  assert.doesNotMatch(detailPageSource, />D[124]\s*·|Proyección sintética|Lectura|Trazabilidad|Documentación visual/u);
  assert.doesNotMatch(detailPageSource, /Cambiar estado|Guardar cambios|Precio estimado|Imprimir|WhatsApp/iu);
  assert.match(detailPageSource, /Nota operativa/u);
  assert.match(detailPageSource, /'Agregar'/u);
});

test('worklist contract remains present and separate from detail D1', () => {
  assert.match(controllerSource, /function response\(page: ListRepairsResult\)/u);
  assert.match(apiSource, /export interface RepairWorklistItem/u);
  assert.match(apiSource, /export interface RepairWorklistResponse/u);
});

test('worklist overlay reuses the canonical detail workspace without breaking direct routes', () => {
  assert.match(appSource, /location=\{backgroundLocation \?\? location\}/u);
  assert.match(appSource, /<RepairDetailPage host="overlay" \/>/u);
  assert.match(repairsPageSource, /backgroundLocation: location/u);
  assert.match(repairsPageSource, /restoreFocusSelector/u);
  assert.match(detailPageSource, /<RepairDetailWorkspace[\s\S]*?repair=\{repair\}[\s\S]*?host=\{host\}[\s\S]*?\/>/u);
  assert.match(detailPageSource, /size="workspace"/u);
  assert.match(overlaysSource, /createPortal/u);
  assert.match(overlaysSource, /root\.inert = true/u);
  assert.match(overlaysSource, /document\.body\.classList\.add\('srt-dialog-open'\)/u);
});
