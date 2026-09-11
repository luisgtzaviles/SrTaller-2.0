import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  normalizeRepairRiskKey,
  RepairRiskCatalogService,
  RepairRiskInputError,
} from '../dist/modules/repairs/application/repair-risk-catalog.service.js';

const scope = Object.freeze({
  tenantId: '10000000-0000-4000-8000-000000000001',
  branchId: '20000000-0000-4000-8000-000000000001',
});
const context = Object.freeze({
  ...scope,
  stationId: '30000000-0000-4000-8000-000000000001',
  sessionId: '40000000-0000-4000-8000-000000000001',
  actorUserId: '50000000-0000-4000-8000-000000000001',
  actorDisplayName: 'Luis',
  capability: 'repairs.catalogs.manage',
  commitGuard: Object.freeze({
    async confirmCurrent() { return true; },
    async confirmTemporalCurrent() { return true; },
  }),
});

test('risk lookup normalization rejects obvious casing, spacing, accent and punctuation variants', () => {
  assert.equal(normalizeRepairRiskKey(' BATERÍA   inflada '), 'bateria inflada');
  assert.equal(normalizeRepairRiskKey('bateria-inflada'), 'bateria inflada');
  assert.equal(normalizeRepairRiskKey('Batería inflada'), 'bateria inflada');
});

test('risk service creates Tenant-owned stable records and uses expectedVersion for rename and lifecycle', async () => {
  const calls = [];
  const repository = {
    async createRisk(receivedContext, input) {
      calls.push(['create', receivedContext, input]);
      return { riskId: input.riskId, code: null, canonicalLabel: input.canonicalLabel, normalizedKey: input.normalizedKey, scope: 'tenant', status: 'active', version: 1, usageCount: 0, createdAt: input.occurredAt.toISOString(), updatedAt: input.occurredAt.toISOString() };
    },
    async changeRisk(receivedContext, input) {
      calls.push(['change', receivedContext, input]);
      return { riskId: input.riskId, code: null, canonicalLabel: input.canonicalLabel ?? 'Daño de cámara', normalizedKey: input.normalizedKey ?? 'dano de camara', scope: 'tenant', status: input.status ?? 'active', version: input.expectedVersion + 1, usageCount: 3, createdAt: '2026-09-08T20:00:00.000Z', updatedAt: input.occurredAt.toISOString() };
    },
  };
  const ids = [
    '60000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000002', '60000000-0000-4000-8000-000000000003',
    '60000000-0000-4000-8000-000000000004', '60000000-0000-4000-8000-000000000005', '60000000-0000-4000-8000-000000000006',
    '60000000-0000-4000-8000-000000000007', '60000000-0000-4000-8000-000000000008', '60000000-0000-4000-8000-000000000009',
    '60000000-0000-4000-8000-000000000010', '60000000-0000-4000-8000-000000000011', '60000000-0000-4000-8000-000000000012',
  ];
  const service = new RepairRiskCatalogService(repository, () => new Date('2026-09-08T20:00:00.000Z'), () => ids.shift());
  const created = await service.create(context, { canonicalLabel: ' DAÑO DE CÁMARA ' });
  assert.equal(created.scope, 'tenant');
  assert.equal(calls[0][2].canonicalLabel, 'Daño de cámara');
  assert.equal(calls[0][2].normalizedKey, 'dano de camara');
  const renamed = await service.rename(context, { riskId: created.riskId, canonicalLabel: 'Cámara desprendida', expectedVersion: 1 });
  assert.equal(renamed.riskId, created.riskId);
  assert.equal(renamed.version, 2);
  assert.equal(calls[1][2].action, 'repair_risk.renamed');
  assert.equal((await service.deactivate(context, { riskId: created.riskId, expectedVersion: 2 })).status, 'inactive');
  assert.equal((await service.reactivate(context, { riskId: created.riskId, expectedVersion: 3 })).status, 'active');
  assert.deepEqual(calls.slice(2).map((call) => call[2].action), ['repair_risk.deactivated', 'repair_risk.reactivated']);
});

test('risk service rejects unknown fields, invalid identities and destructive label normalization', () => {
  const service = new RepairRiskCatalogService({});
  assert.throws(() => service.create(context, { canonicalLabel: 'Riesgo', tenantId: scope.tenantId }), (error) => error instanceof RepairRiskInputError && error.parameter === 'payload');
  assert.throws(() => service.create(context, { canonicalLabel: '!' }), (error) => error instanceof RepairRiskInputError && error.parameter === 'canonicalLabel');
  assert.throws(() => service.rename(context, { riskId: 'not-a-uuid', canonicalLabel: 'Riesgo válido', expectedVersion: 1 }), (error) => error instanceof RepairRiskInputError && error.parameter === 'riskId');
});

test('Repairs owns risk operations, normalized associations, operational reads, and checkbox-list UI', async () => {
  const [operations, repository, form, checkboxList, checkboxStyles, detail, page, administration, route, api, migration] = await Promise.all([
    readFile('src/modules/repairs/application/repair-protected-operations.ts', 'utf8'),
    readFile('src/modules/repairs/infrastructure/persistence/kysely-repair.repository.ts', 'utf8'),
    readFile('apps/dev-preview-web/src/pages/NewRepairPage.tsx', 'utf8'),
    readFile('apps/dev-preview-web/src/components/InterventionRiskCheckboxList.tsx', 'utf8'),
    readFile('apps/dev-preview-web/src/components/intervention-risk-checkbox-list.module.css', 'utf8'),
    readFile('apps/dev-preview-web/src/pages/RepairDetailPage.tsx', 'utf8'),
    readFile('apps/dev-preview-web/src/components/RepairRiskCatalogPanel.tsx', 'utf8'),
    readFile('apps/dev-preview-web/src/components/catalogs/CatalogAdministration.tsx', 'utf8'),
    readFile('apps/dev-preview-web/src/App.tsx', 'utf8'),
    readFile('apps/dev-preview-web/src/api.ts', 'utf8'),
    readFile('src/infrastructure/database/migrations/20260908122000_repairs_create_risk_catalog.ts', 'utf8'),
  ]);
  assert.match(operations, /capability: 'repairs\.catalogs\.read'/u);
  assert.match(operations, /capability: 'repairs\.catalogs\.manage'/u);
  assert.match(operations, /listOperationalRepairRisks[\s\S]*repairsCreateLookupRequirement/u);
  assert.doesNotMatch(operations, /GenericCatalog/u);
  assert.match(repository, /fn\.count\('repairs\.repair_id'\)/u);
  assert.match(repository, /repair\.acceptedRiskIds[\s\S]*status', '=', 'active'/u);
  assert.match(repository, /insertInto\('repair_intervention_risks'\)/u);
  assert.match(form, /getOperationalRepairRisks/u);
  assert.match(form, /acceptedRiskIds: requiresRiskAcceptance === true/u);
  assert.doesNotMatch(form, /localNewRepairCatalogFixture|documentedRiskCode:/u);
  assert.match(form, /no constituye firma ni evidencia legal/u);
  assert.match(checkboxList, /<fieldset/u);
  assert.match(checkboxList, /<legend>Riesgos aceptados/u);
  assert.match(checkboxList, /type="checkbox"/u);
  assert.match(checkboxList, /htmlFor=\{optionId\}/u);
  assert.match(checkboxList, /checked=\{checked\}/u);
  assert.match(checkboxList, /aria-required="true"/u);
  assert.match(checkboxList, /aria-invalid=\{selectionError/u);
  assert.match(checkboxList, /Cargando riesgos…/u);
  assert.match(checkboxList, /No hay riesgos disponibles\./u);
  assert.match(checkboxList, /Reintentar/u);
  assert.match(checkboxList, /selectedRiskIds\.includes/u);
  assert.match(checkboxList, /selectedRiskIds\.filter/u);
  assert.doesNotMatch(checkboxList, /role="combobox"|chip|Buscar riesgos/iu);
  assert.match(checkboxStyles, /display: flex;[\s\S]*flex-wrap: wrap/u);
  assert.match(checkboxStyles, /max-height: 184px/u);
  assert.match(checkboxStyles, /@media \(max-width: 640px\)/u);
  assert.match(checkboxStyles, /\.option:focus-within/u);
  assert.match(form, /setAcceptedRiskIds\(\[\]\)/u);
  assert.match(form, /document\.getElementById\(`\$\{prefix\}-\$\{firstIssue\?\.focusTarget\}`\)/u);
  assert.match(checkboxList, /tabIndex=\{selectionError \? -1 : undefined\}/u);
  assert.match(detail, /acceptedInterventionRisks/u);
  assert.match(administration, /Plataforma/u);
  assert.match(administration, /Organización/u);
  assert.match(page, /Desactivar/u);
  assert.match(page, /Reactivar/u);
  assert.match(page, /Filtrar riesgos por estado/u);
  assert.match(page, /useState<CatalogLifecycle>\('active'\)/u);
  assert.match(page, /Riesgo creado\./u);
  assert.match(page, /Riesgo actualizado\./u);
  assert.match(page, /REPAIR_RISK_VERSION_CONFLICT/u);
  assert.match(page, /Sin permisos de edición/u);
  assert.match(api, /readonly code: string \| null/u);
  assert.match(api, /payload\.code/u);
  assert.match(route, /path="\/configuracion\/catalogos"/u);
  assert.match(migration, /repair_risk_catalog_events/u);
  assert.match(migration, /createTable\('repair_intervention_risks'\)/u);
  assert.doesNotMatch(migration, /Batería inflada|Cristal o pantalla quebrada|Otro riesgo/u);
  assert.match(migration, /append-only/u);
  assert.doesNotMatch(migration, /No aplica/u);
});
