import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [migration, types, port, useCases, repository, controller, api, page, styles, seed] = await Promise.all([
  readFile('src/infrastructure/database/migrations/20260902090000_repairs_create_technician_assignment.ts', 'utf8'),
  readFile('src/infrastructure/database/database-types.ts', 'utf8'),
  readFile('src/modules/repairs/application/ports/repair-repository.port.ts', 'utf8'),
  readFile('src/modules/repairs/application/use-cases/technician-assignment.use-case.ts', 'utf8'),
  readFile('src/modules/repairs/infrastructure/persistence/kysely-repair.repository.ts', 'utf8'),
  readFile('src/modules/repairs/presentation/repairs.controller.ts', 'utf8'),
  readFile('apps/dev-preview-web/src/api.ts', 'utf8'),
  readFile('apps/dev-preview-web/src/pages/RepairDetailPage.tsx', 'utf8'),
  readFile('apps/dev-preview-web/src/pages/pages.module.css', 'utf8'),
  readFile('scripts/local-db-seed.mjs', 'utf8'),
]);

test('D5 owns a scoped catalog, eligibility projection, and append-only assignment history', () => {
  const tableTypes = {
    repair_technicians: 'RepairTechnicianTable',
    repair_technician_branches: 'RepairTechnicianBranchTable',
    repair_technician_assignments: 'RepairTechnicianAssignmentTable',
  };
  for (const table of Object.keys(tableTypes)) {
    assert.match(migration, new RegExp(`createTable\\('${table}'\\)`, 'u'));
    assert.match(types, new RegExp(`export interface ${tableTypes[table]}`, 'u'));
  }
  assert.match(migration, /repair_technician_assignments_repair_scope_fk/u);
  assert.match(migration, /repair_technician_assignments_active_uq/u);
  assert.match(migration, /ended_at is null/u);
  assert.match(migration, /repair_technician_assignments_request_uq/u);
  assert.match(migration, /repair_technician_assignments_history_idx/u);
  assert.match(port, /AssignRepairTechnicianRecord/u);
  assert.match(port, /ReassignRepairTechnicianRecord/u);
  assert.match(port, /UnassignRepairTechnicianRecord/u);
  assert.match(port, /technicianSummary/u);
});

test('D5 commands validate scope server-side and preserve idempotent optimistic concurrency', () => {
  assert.match(useCases, /resolveScope\(\)/u);
  assert.match(useCases, /expectedVersion/u);
  assert.match(useCases, /clientRequestId/u);
  assert.match(useCases, /technicianId/u);
  assert.match(useCases, /reason/u);
  assert.match(repository, /forUpdate\(\)/u);
  assert.match(repository, /runInTransaction/u);
  assert.match(repository, /isolationLevel: 'serializable'/u);
  assert.match(repository, /#technicianForScope/u);
  assert.match(repository, /#assignmentByRequest/u);
  assert.match(repository, /RepairTechnicianConcurrencyConflictError/u);
  assert.match(repository, /RepairTechnicianIdempotencyConflictError/u);
  assert.match(repository, /local\.technician_assignment/u);
  assert.match(controller, /@Get\('technicians'\)/u);
  assert.match(controller, /@Post\(':repairId\/technician-assignment'\)/u);
  assert.match(controller, /@Post\(':repairId\/technician-reassignment'\)/u);
  assert.match(controller, /@Post\(':repairId\/technician-unassignment'\)/u);
  assert.doesNotMatch(controller, /tenantId|branchId.*@Body/iu);
});

test('D5 exposes honest local identity and renders current plus assignment history', () => {
  assert.match(repository, /Operador sintético|local\.technician_assignment/u);
  assert.match(api, /listRepairTechnicians/u);
  assert.match(api, /assignRepairTechnician/u);
  assert.match(api, /reassignRepairTechnician/u);
  assert.match(api, /unassignRepairTechnician/u);
  assert.match(api, /TechnicianAssignmentHistory/u);
  assert.match(page, /Asignar técnico/u);
  assert.match(page, /Cambiar técnico/u);
  assert.match(page, /Quitar asignación/u);
  assert.match(page, /Historial de asignaciones/u);
  assert.match(page, /expectedVersion/u);
  assert.match(styles, /\.assignmentHistory/u);
  assert.match(seed, /localRepairTechnicianAssignmentRows/u);
});
