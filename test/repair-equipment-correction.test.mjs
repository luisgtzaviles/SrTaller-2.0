import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  CorrectRepairEquipmentInputError,
  CorrectRepairEquipmentUseCase,
} from '../dist/modules/repairs/application/use-cases/correct-repair-equipment.use-case.js';

const context = Object.freeze({
  tenantId: '10000000-0000-4000-8000-000000000001',
  branchId: '20000000-0000-4000-8000-000000000001',
  stationId: '30000000-0000-4000-8000-000000000001',
  sessionId: '40000000-0000-4000-8000-000000000001',
  actorUserId: '50000000-0000-4000-8000-000000000001',
  actorDisplayName: 'Luis',
  capability: 'repairs.correct_intake',
  commitGuard: Object.freeze({ async confirmCurrent() { return true; }, async confirmTemporalCurrent() { return true; } }),
});
const repairId = '60000000-0000-4000-8000-000000000001';
const appleId = '70000000-0000-4000-8000-000000000001';
const iphoneId = '80000000-0000-4000-8000-000000000001';
const ids = Array.from({ length: 6 }, (_, index) => `90000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`);

function request(overrides = {}) {
  return {
    clientRequestId: 'a0000000-0000-4000-8000-000000000001',
    expectedVersion: 0,
    deviceBrand: 'Apple',
    canonicalBrandId: appleId,
    deviceModel: 'iPhone 14',
    canonicalModelId: iphoneId,
    reason: 'Error de captura',
    ...overrides,
  };
}

test('equipment correction command is narrow, versioned, attributed and Brand-bound', async () => {
  const calls = [];
  const repository = {
    async correctRepairEquipment(receivedContext, correction) {
      calls.push([receivedContext, correction]);
      return {
        repairId: correction.repairId,
        equipmentVersion: correction.expectedVersion + 1,
        deviceBrand: correction.deviceBrand,
        canonicalBrandId: correction.canonicalBrandId,
        deviceModel: correction.deviceModel,
        canonicalModelId: correction.canonicalModelId,
        timelineItem: { id: correction.timelineEntryId, occurredAt: correction.occurredAt.toISOString(), type: 'system_event', actorId: receivedContext.actorUserId, actorDisplayName: receivedContext.actorDisplayName, title: 'Equipo corregido', body: 'Samsung · iphone 14 → Apple · iPhone 14. Motivo: Error de captura', source: 'repairs.equipment_correction', attribution: null },
        correlationId: correction.correlationId,
      };
    },
  };
  const useCase = new CorrectRepairEquipmentUseCase(repository, () => context, () => new Date('2026-09-09T10:00:00.000Z'), () => ids.shift());
  const result = await useCase.execute({ repairId, request: request() });
  assert.equal(result.equipmentVersion, 1);
  assert.equal(calls[0][0].capability, 'repairs.correct_intake');
  assert.deepEqual({ brand: calls[0][1].deviceBrand, brandId: calls[0][1].canonicalBrandId, model: calls[0][1].deviceModel, modelId: calls[0][1].canonicalModelId, reason: calls[0][1].reason }, { brand: 'Apple', brandId: appleId, model: 'iPhone 14', modelId: iphoneId, reason: 'Error de captura' });
  assert.equal(calls[0][1].action, 'repair.equipment.corrected');
  assert.doesNotMatch(result.timelineItem.body, /[0-9a-f]{8}-[0-9a-f]{4}/u);
});

test('equipment correction requires reason and never accepts a canonical Model without canonical Brand', async () => {
  const useCase = new CorrectRepairEquipmentUseCase({ async correctRepairEquipment() { throw new Error('must not be called'); } }, () => context);
  await assert.rejects(() => useCase.execute({ repairId, request: request({ reason: ' ' }) }), (error) => error instanceof CorrectRepairEquipmentInputError && error.parameter === 'reason');
  await assert.rejects(() => useCase.execute({ repairId, request: request({ canonicalBrandId: null }) }), (error) => error instanceof CorrectRepairEquipmentInputError && error.parameter === 'canonicalModelId');
  await assert.rejects(() => useCase.execute({ repairId, request: { ...request(), reportedIssue: 'scope leak' } }), (error) => error instanceof CorrectRepairEquipmentInputError && error.parameter === 'payload');
});

test('equipment correction persistence and UX preserve history and clear incompatible canonical Model selection', async () => {
  const [migration, repository, operations, controller, detail, api, panel, controls] = await Promise.all([
    readFile('src/infrastructure/database/migrations/20260908125200_repairs_create_equipment_corrections.ts', 'utf8'),
    readFile('src/modules/repairs/infrastructure/persistence/kysely-repair.repository.ts', 'utf8'),
    readFile('src/modules/repairs/application/repair-protected-operations.ts', 'utf8'),
    readFile('src/modules/repairs/presentation/repairs.controller.ts', 'utf8'),
    readFile('apps/dev-preview-web/src/pages/RepairDetailPage.tsx', 'utf8'),
    readFile('apps/dev-preview-web/src/api.ts', 'utf8'),
    readFile('apps/dev-preview-web/src/components/RepairModelCatalogPanel.tsx', 'utf8'),
    readFile('apps/dev-preview-web/src/components/ui/controls.tsx', 'utf8'),
  ]);
  assert.match(migration, /repair_equipment_corrections/u);
  assert.match(migration, /append-only/u);
  assert.match(migration, /old_brand_label/u);
  assert.match(migration, /old_model_label/u);
  assert.match(migration, /station_id/u);
  assert.match(migration, /session_id/u);
  assert.match(repository, /selected correction Model is unavailable|model\.canonical_brand_id !== canonicalBrandId/u);
  assert.match(repository, /title: 'Equipo corregido'/u);
  assert.match(repository, /repair\.equipment\.corrected/u);
  assert.match(operations, /repairs\.correct_intake/u);
  assert.match(controller, /equipment-correction/u);
  assert.match(api, /correctRepairEquipment/u);
  assert.match(detail, />Corregir equipo</u);
  assert.match(detail, /setCanonicalModelId\(null\)/u);
  assert.match(detail, /getOperationalRepairModels\(canonicalBrandId, modelValue/u);
  assert.match(detail, /Error de captura/u);
  assert.match(panel, /className=\{styles\.contextualSelect\}/u);
  assert.match(panel, /<Select id="model-brand-filter"/u);
  assert.match(controls, /export const Select/u);
});
