import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [migration, types, port, useCase, repository, controller, moduleSource, api, detail, worklist, seed, runtime, policy] = await Promise.all([
  readFile('src/infrastructure/database/migrations/20260903130000_repairs_create_location_movements.ts', 'utf8'),
  readFile('src/infrastructure/database/database-types.ts', 'utf8'),
  readFile('src/modules/repairs/application/ports/repair-repository.port.ts', 'utf8'),
  readFile('src/modules/repairs/application/use-cases/move-repair-to-workshop.use-case.ts', 'utf8'),
  readFile('src/modules/repairs/infrastructure/persistence/kysely-repair.repository.ts', 'utf8'),
  readFile('src/modules/repairs/presentation/repairs.controller.ts', 'utf8'),
  readFile('src/modules/repairs/repairs.module.ts', 'utf8'),
  readFile('apps/dev-preview-web/src/api.ts', 'utf8'),
  readFile('apps/dev-preview-web/src/pages/RepairDetailPage.tsx', 'utf8'),
  readFile('apps/dev-preview-web/src/pages/RepairsPage.tsx', 'utf8'),
  readFile('scripts/local-db-seed.mjs', 'utf8'),
  readFile('src/infrastructure/database/database-runtime.ts', 'utf8'),
  readFile('architecture/dec-005-policy.json', 'utf8'),
]);

test('D6.2 persists a scoped append-only location history with an independent version', () => {
  assert.match(migration, /createTable\('repair_locations'\)/u);
  assert.match(migration, /createTable\('repair_location_movements'\)/u);
  assert.match(migration, /repair_location_movements_repair_scope_fk/u);
  assert.match(migration, /repair_location_movements_from_scope_fk/u);
  assert.match(migration, /repair_location_movements_to_scope_fk/u);
  assert.match(migration, /location_version = expected_location_version \+ 1/u);
  assert.match(migration, /repair_location_movements_version_uq/u);
  assert.match(migration, /repair_location_movements_request_uq/u);
  assert.match(types, /RepairLocationMovementTable/u);
  assert.match(port, /locationSource: 'history' \| 'unrecorded'/u);
  assert.match(port, /moveRepairToWorkshop/u);
});

test('D6.2 exposes only the approved focused command and trusted server fields', () => {
  assert.match(useCase, /allowedKeys = Object\.freeze\(\['clientRequestId', 'expectedVersion', 'reason'\]\)/u);
  assert.match(useCase, /localRepairLocationActor/u);
  assert.match(controller, /@Post\(':repairId\/location\/move-to-workshop'\)/u);
  assert.doesNotMatch(controller, /@(?:Post|Patch)\(':repairId\/location'\)/u);
  assert.doesNotMatch(useCase, /toLocation.*request|actor.*request|tenantId.*request|branchId.*request/u);
  assert.match(moduleSource, /provide: MoveRepairToWorkshopUseCase/u);
});

test('D6.2 applies lock, idempotency, version, custody, origin, destination and timeline atomically', () => {
  assert.match(repository, /#runLocationTransaction/u);
  assert.match(repository, /forUpdate\(\)/u);
  assert.match(repository, /existing\.reason !== input\.reason/u);
  assert.match(repository, /currentVersion !== input\.expectedVersion/u);
  assert.match(repository, /repair\.custody_status !== 'active'/u);
  assert.match(repository, /current\.to_code !== 'pending_area'/u);
  assert.match(repository, /where\('code', '=', 'workshop'\)/u);
  assert.match(repository, /where\('active', '=', true\)/u);
  assert.match(repository, /insertInto\('repair_location_movements'\)/u);
  assert.match(repository, /title: 'Equipo movido'/u);
  assert.match(repository, /source: 'local\.location'/u);
  assert.match(runtime, /selectFrom\('repair_locations'\)/u);
  assert.match(runtime, /selectFrom\('repair_location_movements'\)/u);
});

test('D6.2 Detail projection and UI expose location without widening Worklist', () => {
  assert.match(api, /locationVersion: number/u);
  assert.match(api, /locationSource: 'history' \| 'unrecorded'/u);
  assert.match(api, /moveRepairToWorkshop/u);
  assert.match(detail, /Mover a Taller/u);
  assert.match(detail, /'Mover equipo a Taller'/u);
  assert.match(detail, /location\?\.code === 'pending_area'/u);
  assert.match(detail, /La ubicación cambió mientras trabajabas\. Actualiza y vuelve a intentarlo\./u);
  assert.match(detail, /locationMessageRef\.current\?\.focus\(\)/u);
  assert.match(detail, /'local\.location': 'Ubicación interna'/u);
  assert.doesNotMatch(worklist, /locationVersion|moveRepairToWorkshop|Ubicación/u);
});

test('D6.2 seed and architecture policy register only the two approved locations', () => {
  assert.match(seed, /localRepairLocationRows/u);
  assert.match(seed, /localRepairLocationMovementRows/u);
  assert.match(seed, /ON CONFLICT \(movement_id\) DO NOTHING/u);
  assert.match(policy, /"repair_locations"/u);
  assert.match(policy, /"repair_location_movements"/u);
  assert.doesNotMatch(migration, /warehouse|counter|delivery|shelf/u);
});

test('MoveRepairToWorkshopUseCase normalizes reason and rejects extra fields', async () => {
  const { MoveRepairToWorkshopInputError, MoveRepairToWorkshopUseCase, localRepairLocationActor } = await import('../dist/modules/repairs/application/use-cases/move-repair-to-workshop.use-case.js');
  let captured;
  const repository = { async moveRepairToWorkshop(scope, input) { captured = { scope, input }; return { ...input, fromLocation: { id: 'a', code: 'pending_area', label: 'Área de pendientes' }, toLocation: { id: 'b', code: 'workshop', label: 'Taller' } }; } };
  const ids = ['90000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000002'];
  const subject = new MoveRepairToWorkshopUseCase(repository, () => ({ tenantId: '10000000-0000-4000-8000-000000000001', branchId: 'a0000000-0000-4000-8000-000000000001' }), () => new Date('2026-09-03T13:00:00.000Z'), () => ids.shift());
  const result = await subject.execute({ repairId: '30000000-0000-4000-8000-000000000001', request: { clientRequestId: '80000000-0000-4000-8000-000000000001', expectedVersion: 1, reason: '  mesa  ' } });
  assert.equal(result.actorId, localRepairLocationActor.id);
  assert.equal(captured.input.reason, 'mesa');
  assert.equal(result.locationVersion, 2);
  await assert.rejects(subject.execute({ repairId: '30000000-0000-4000-8000-000000000001', request: { clientRequestId: '80000000-0000-4000-8000-000000000001', expectedVersion: 1, locationId: 'forged' } }), MoveRepairToWorkshopInputError);
});
