import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { Pool } from 'pg';

const enabled = process.env.SR_OWNER_SCOPED_PG_TEST === '1';

const { createDatabaseConnection } = enabled
  ? await import('../dist/infrastructure/database/database-connection.js')
  : {};
const { databaseMigrationSourceOverride, inspectMigrationSource } = enabled
  ? await import('../dist/infrastructure/database/database-migration-provider.js')
  : {};
const { createMigrationRunner } = enabled
  ? await import('../dist/infrastructure/database/migration-runner.js')
  : {};
const { RepairLocationConcurrencyConflictError, RepairLocationConfigurationError, RepairLocationCustodyConflictError, RepairLocationIdempotencyConflictError, RepairLocationStateConflictError, RepairOperationalNoteIdempotencyConflictError, RepairWorkflowConcurrencyConflictError, RepairWorkflowCustodyConflictError, RepairWorkflowIdempotencyConflictError, RepairWorkflowStateConflictError } = enabled
  ? await import('../dist/modules/repairs/application/ports/repair-repository.port.js')
  : {};
const { createKyselyRepairRepository } = enabled
  ? await import('../dist/modules/repairs/infrastructure/persistence/kysely-repair.repository.js')
  : {};
const { MoveRepairToWorkshopInputError, MoveRepairToWorkshopNotFoundError, MoveRepairToWorkshopUseCase } = enabled
  ? await import('../dist/modules/repairs/application/use-cases/move-repair-to-workshop.use-case.js')
  : {};

const migrationRoot = fileURLToPath(
  new URL('../dist/infrastructure/database/migrations/', import.meta.url),
);
const tables = [
  'repair_location_movements',
  'repair_locations',
  'repair_attachments',
  'repair_timeline_entries',
  'repair_intakes',
  'repair_technician_assignments',
  'repair_workflow_transitions',
  'repair_technician_branches',
  'repair_technicians',
  'repairs',
  'branches',
  'tenants',
  'kysely_migration',
  'kysely_migration_lock',
];

const tenantA = '10000000-0000-4000-8000-000000000001';
const tenantB = '20000000-0000-4000-8000-000000000002';
const branchA = 'a0000000-0000-4000-8000-000000000001';
const branchA2 = 'a0000000-0000-4000-8000-000000000002';
const branchB = 'b0000000-0000-4000-8000-000000000002';
const repairA = '30000000-0000-4000-8000-000000000001';
const repairPercent = '30000000-0000-4000-8000-000000000002';
const repairB = '30000000-0000-4000-8000-000000000003';
const repairA2 = '30000000-0000-4000-8000-000000000004';
const actorId = '40000000-0000-4000-8000-000000000001';
const pendingLocationA = '91000000-0000-4000-8000-000000000001';
const workshopLocationA = '91000000-0000-4000-8000-000000000002';
const pendingLocationB = '92000000-0000-4000-8000-000000000001';
const workshopLocationB = '92000000-0000-4000-8000-000000000002';
const pendingLocationA2 = '93000000-0000-4000-8000-000000000001';
const workshopLocationA2 = '93000000-0000-4000-8000-000000000002';

function databaseConfig() {
  return Object.freeze({
    identity: Object.freeze({
      host: process.env.SR_OWNER_SCOPED_PG_HOST,
      port: Number(process.env.SR_OWNER_SCOPED_PG_PORT),
      database: process.env.SR_OWNER_SCOPED_PG_NAME,
      user: process.env.SR_OWNER_SCOPED_PG_USER,
      password: process.env.SR_OWNER_SCOPED_PG_PASSWORD,
    }),
    transport: Object.freeze({ sslMode: 'disable' }),
    pool: Object.freeze({
      min: 0,
      max: 8,
      idleTimeoutMs: 1_000,
      connectionTimeoutMs: 2_000,
      statementTimeoutMs: 10_000,
      queryTimeoutMs: 10_000,
    }),
    runtime: Object.freeze({
      environment: 'development',
      role: 'migration',
      accessMode: 'read-write',
      migrationsEnabled: true,
      testRunId: null,
    }),
    observability: Object.freeze({
      applicationName: 'srtaller-repairs-postgresql-review',
      labels: Object.freeze({
        component: 'repairs',
        environment: 'development',
        role: 'migration',
      }),
    }),
  });
}

function adminPool() {
  return new Pool({
    database: process.env.SR_OWNER_SCOPED_PG_NAME,
    host: process.env.SR_OWNER_SCOPED_PG_HOST,
    max: 2,
    password: process.env.SR_OWNER_SCOPED_PG_PASSWORD,
    port: Number(process.env.SR_OWNER_SCOPED_PG_PORT),
    ssl: false,
    user: process.env.SR_OWNER_SCOPED_PG_USER,
  });
}

function source() {
  return Object.freeze({
    root: migrationRoot,
    authorizedRoot: migrationRoot,
    normalizedRoot: 'src/infrastructure/database/migrations',
    mode: 'compiled',
  });
}

function authorization(item) {
  return Object.freeze({
    migrationName: item.name,
    expectedHash: item.hash,
    reason: 'independent review of repairs migration reversal',
    environment: 'development',
    confirmation: 'REVERT_ONE_MIGRATION',
  });
}

async function resetDatabase(admin) {
  await admin.query(
    `drop table if exists ${tables.map((name) => `"${name}"`).join(', ')} cascade`,
  );
}

async function assertNoObjects(admin) {
  const result = await admin.query(
    `select tablename from pg_catalog.pg_tables
     where schemaname = 'public' and tablename = any($1::text[])
     order by tablename`,
    [tables],
  );
  assert.deepEqual(result.rows, []);
}

async function seed(admin) {
  const createdAt = '2026-08-21T12:00:00.000Z';
  await admin.query(
    `insert into tenants (tenant_id, created_at) values ($1, $3), ($2, $3)`,
    [tenantA, tenantB, createdAt],
  );
  await admin.query(
    `insert into branches (tenant_id, branch_id, created_at)
     values ($1, $2, $5), ($3, $4, $5)`,
    [tenantA, branchA, tenantB, branchB, createdAt],
  );
  await admin.query(
    `insert into branches (tenant_id, branch_id, created_at) values ($1, $2, $3)`,
    [tenantA, branchA2, createdAt],
  );
  await admin.query(
    `insert into repairs (
       repair_id, tenant_id, branch_id, folio, received_at, customer_name,
       customer_phone, device_brand, device_model, reported_issue,
       technician_id, technician_display_name, repair_status, custody_status, created_at
     ) values
       ($1, $2, $3, 'SR-A', '2026-08-21T10:00:00Z', 'Cliente A', '6621000001',
        'Motorola', 'Edge 40', 'Pantalla sin imagen', null, null, 'pending', 'active', $7),
       ($4, $2, $3, 'SR-PERCENT', '2026-08-20T10:00:00Z', 'Cliente porcentaje', '6621000002',
        'Marca', 'Equipo 100% listo', 'Prueba literal', $8, 'Ana Técnica', 'diagnosing', 'active', $7),
       ($5, $6, $9, 'SR-B', '2026-08-21T09:00:00Z', 'Cliente B', '6621000003',
        'Samsung', 'S22', 'No enciende', null, null, 'pending', 'ended', $7)`,
    [repairA, tenantA, branchA, repairPercent, repairB, tenantB, createdAt, actorId, branchB],
  );
  await admin.query(
    `insert into repairs (
       repair_id, tenant_id, branch_id, folio, received_at, customer_name,
       customer_phone, device_brand, device_model, reported_issue,
       technician_id, technician_display_name, repair_status, custody_status, created_at
     ) values ($1, $2, $3, 'SR-A2', '2026-08-21T08:00:00Z', 'Cliente A2', '6621000004',
       'Apple', 'iPhone 13', 'Scope branch', null, null, 'pending', 'active', $4)`,
    [repairA2, tenantA, branchA2, createdAt],
  );
  await admin.query(
    `insert into repair_technicians (technician_id, tenant_id, display_name, active, created_at)
     values ('00000000-0000-4000-8000-000000000201', $1, 'Ana Técnica', true, $3),
            ('00000000-0000-4000-8000-000000000202', $1, 'Bruno Técnico', true, $3),
            ('00000000-0000-4000-8000-000000000211', $2, 'Técnico B', true, $3)`,
    [tenantA, tenantB, createdAt],
  );
  await admin.query(
    `insert into repair_locations (location_id, tenant_id, branch_id, code, semantic_category, display_label, active, created_at)
     values ($1, $2, $3, 'pending_area', 'pending_area', 'Área de pendientes', true, $9),
            ($4, $2, $3, 'workshop', 'workshop', 'Taller', true, $9),
            ($5, $6, $7, 'pending_area', 'pending_area', 'Área de pendientes B', true, $9),
            ($8, $6, $7, 'workshop', 'workshop', 'Taller B', true, $9)`,
    [pendingLocationA, tenantA, branchA, workshopLocationA, pendingLocationB, tenantB, branchB, workshopLocationB, createdAt],
  );
  await admin.query(
    `insert into repair_locations (location_id, tenant_id, branch_id, code, semantic_category, display_label, active, created_at)
     values ($1, $2, $3, 'pending_area', 'pending_area', 'Área de pendientes A2', true, $5),
            ($4, $2, $3, 'workshop', 'workshop', 'Taller A2', true, $5)`,
    [pendingLocationA2, tenantA, branchA2, workshopLocationA2, createdAt],
  );
  await admin.query(
    `insert into repair_technician_branches (tenant_id, branch_id, technician_id, created_at)
     values ($1, $2, '00000000-0000-4000-8000-000000000201', $3),
            ($1, $2, '00000000-0000-4000-8000-000000000202', $3),
            ($4, $5, '00000000-0000-4000-8000-000000000211', $3)`,
    [tenantA, branchA, createdAt, tenantB, branchB],
  );
  await admin.query(
    `insert into repair_technician_assignments (
       assignment_id, tenant_id, branch_id, repair_id, technician_id,
       assigned_by_actor_id, assigned_by_actor_display_name, assigned_at,
       client_request_id, assignment_sequence
     ) values ('a0000000-0000-4000-8000-000000000001', $1, $2, $3,
       '00000000-0000-4000-8000-000000000201', $4, 'Operador sintético', $5,
       'b0000000-0000-4000-8000-000000000001', 1)`,
    [tenantA, branchA, repairPercent, actorId, createdAt],
  );
  await admin.query(
    `insert into repair_intakes (
       repair_id, tenant_id, branch_id, device_color, received_by_id,
       received_by_display_name, customer_narrative, physical_condition_summary,
       documented_risk_summary, created_at
     ) values ($1, $2, $3, 'Azul', $4, 'Operador sintético',
       'Relato minimizado', 'Condición registrada', null, $5)`,
    [repairA, tenantA, branchA, actorId, createdAt],
  );
  await admin.query(
    `insert into repair_timeline_entries (
       entry_id, tenant_id, branch_id, repair_id, entry_type, actor_id,
       actor_display_name, title, body, source, client_request_id, occurred_at, created_at
     ) values
       ('50000000-0000-4000-8000-000000000001', $1, $2, $3, 'system_event', null,
        'Sistema local', 'Recepción', null, 'local.reception', null, $4, $4),
       ('50000000-0000-4000-8000-000000000002', $1, $2, $3, 'note', $5,
        'Operador sintético', 'Nota', 'Nota inicial', 'local.operator_note', null, $4, $4)`,
    [tenantA, branchA, repairA, createdAt, actorId],
  );
  await admin.query(
    `insert into repair_attachments (
       attachment_id, tenant_id, branch_id, repair_id, kind, category,
       storage_key, mime_type, size_bytes, width, height, caption,
       captured_at, uploaded_at, uploaded_by_id, uploaded_by_display_name
     ) values (
       '60000000-0000-4000-8000-000000000001', $1, $2, $3, 'photo', 'intake',
       '70000000-0000-4000-8000-000000000001.png', 'image/png', 128, 16, 16,
       'Recepción', $4, $4, $5, 'Operador sintético'
     )`,
    [tenantA, branchA, repairA, createdAt, actorId],
  );
}

function listQuery(overrides = {}) {
  return Object.freeze({
    period: 'all',
    page: 1,
    pageSize: 25,
    ...overrides,
  });
}

function note(overrides = {}) {
  return Object.freeze({
    repairId: repairA,
    entryId: '80000000-0000-4000-8000-000000000001',
    clientRequestId: '90000000-0000-4000-8000-000000000001',
    actorId,
    actorDisplayName: 'Operador sintético',
    body: 'Nota idempotente',
    source: 'local.operational_note',
    occurredAt: new Date('2026-08-21T13:00:00.000Z'),
    ...overrides,
  });
}

function workflowCommand(repairId, suffix, overrides = {}) {
  return Object.freeze({
    repairId,
    transitionId: `81000000-0000-4000-8000-${suffix.padStart(12, '0')}`,
    timelineEntryId: `82000000-0000-4000-8000-${suffix.padStart(12, '0')}`,
    clientRequestId: `83000000-0000-4000-8000-${suffix.padStart(12, '0')}`,
    actorId,
    actorDisplayName: 'Operador sintético',
    occurredAt: new Date('2026-08-21T18:30:00.000Z'),
    expectedVersion: 0,
    workflowVersion: 1,
    fromState: 'pending',
    toState: 'diagnosing',
    ...overrides,
  });
}

function locationCommand(repairId, suffix, overrides = {}) {
  return Object.freeze({
    repairId,
    movementId: `93000000-0000-4000-8000-${suffix.padStart(12, '0')}`,
    timelineEntryId: `94000000-0000-4000-8000-${suffix.padStart(12, '0')}`,
    clientRequestId: `95000000-0000-4000-8000-${suffix.padStart(12, '0')}`,
    actorId,
    actorDisplayName: 'Operador sintético',
    occurredAt: new Date('2026-08-21T19:00:00.000Z'),
    expectedVersion: 1,
    locationVersion: 2,
    reason: null,
    fromLocation: { id: pendingLocationA, code: 'pending_area', label: 'Área de pendientes' },
    toLocation: { id: workshopLocationA, code: 'workshop', label: 'Taller' },
    ...overrides,
  });
}

async function placeInPendingArea(admin, repairId, suffix, scope = { tenantId: tenantA, branchId: branchA, locationId: pendingLocationA, label: 'Área de pendientes' }) {
  await admin.query(
    `insert into repair_location_movements (
       movement_id, tenant_id, branch_id, repair_id, command, from_location_id,
       to_location_id, from_code, from_label, to_code, to_label, actor_id,
       actor_display_name, occurred_at, reason, client_request_id,
       expected_location_version, location_version
     ) values ($1, $2, $3, $4, 'initial_placement', null, $5, null, null,
       'pending_area', $6, $7, 'Operador sintético', now(), null, $8, 0, 1)`,
    [`96000000-0000-4000-8000-${suffix.padStart(12, '0')}`, scope.tenantId, scope.branchId, repairId, scope.locationId, scope.label, actorId, `97000000-0000-4000-8000-${suffix.padStart(12, '0')}`],
  );
}

async function insertPendingRepair(admin, repairId, folio) {
  await admin.query(
    `insert into repairs (
       repair_id, tenant_id, branch_id, folio, received_at, customer_name,
       customer_phone, device_brand, device_model, reported_issue,
       technician_id, technician_display_name, repair_status, custody_status, created_at
     ) values ($1, $2, $3, $4, now(), 'Cliente workflow', '6621000099',
       'Marca', 'Modelo', 'Prueba workflow', null, null, 'pending', 'active', now())`,
    [repairId, tenantA, branchA, folio],
  );
}

test(
  'PostgreSQL 18.4 materially verifies repairs migrations, scope, projections, filters, and idempotency',
  { skip: !enabled, timeout: 120_000 },
  async () => {
    assert.equal(process.version, 'v24.18.0');
    const admin = adminPool();
    const connection = createDatabaseConnection(databaseConfig());
    const migrationSource = source();
    const inspection = await inspectMigrationSource(migrationSource);
    const runner = createMigrationRunner(connection, {
      expectedManifestHash: inspection.manifest.aggregateSha256,
      [databaseMigrationSourceOverride]: migrationSource,
    });
    try {
      await resetDatabase(admin);
      const applied = await runner.migrateToLatest();
      assert.equal(applied.status.migrations.length, 11);
      assert.ok(applied.status.migrations.every(({ state }) => state === 'applied'));
      await seed(admin);

      const repository = createKyselyRepairRepository(
        connection,
        () => new Date('2026-08-21T18:00:00.000Z'),
      );
      const scopeA = Object.freeze({ tenantId: tenantA, branchId: branchA });
      const scopeA2 = Object.freeze({ tenantId: tenantA, branchId: branchA2 });
      const scopeB = Object.freeze({ tenantId: tenantB, branchId: branchB });

      const allA = await repository.listWorklist(scopeA, listQuery());
      assert.equal(allA.totalCount, 2);
      assert.deepEqual(allA.items.map(({ id }) => id), [repairA, repairPercent]);
      assert.equal(allA.technicians.length, 2);
      await assert.rejects(
        admin.query(
          `insert into repair_technician_branches (tenant_id, branch_id, technician_id, created_at)
           values ($1, $2, '00000000-0000-4000-8000-000000000211', $3)`,
          [tenantA, branchA, '2026-08-21T12:00:00.000Z'],
        ),
        (error) => error?.code === '23503',
      );
      assert.equal((await repository.listWorklist(scopeB, listQuery())).totalCount, 1);
      assert.equal((await repository.listWorklist(scopeA, listQuery({ period: 'today' }))).totalCount, 1);
      assert.equal((await repository.listWorklist(scopeA, listQuery({ q: '%' }))).items[0]?.id, repairPercent);
      assert.equal((await repository.listWorklist(scopeA, listQuery({ q: '_' }))).totalCount, 0);
      assert.equal((await repository.listWorklist(scopeA, listQuery({ pageSize: 1 }))).hasNextPage, true);

      const detail = await repository.getRepairById(scopeA, repairA);
      assert.equal(detail?.customerName, 'Cliente A');
      assert.equal(detail?.currentLocation, null);
      assert.deepEqual(detail?.timeline.items.map(({ id }) => id), [
        '50000000-0000-4000-8000-000000000002',
        '50000000-0000-4000-8000-000000000001',
      ]);
      assert.equal(detail?.timeline.totalCount, 2);
      assert.equal(detail?.evidence.totalCount, 1);
      assert.equal(detail?.repairStatus, 'pending');
      assert.equal(detail?.workflowSummary.version, 0);
      assert.equal(detail?.workflowSummary.source, 'synthetic_projection');
      assert.equal(await repository.getRepairById(scopeB, repairA), null);
      assert.equal(await repository.getRepairEvidenceById(scopeB, repairA, '60000000-0000-4000-8000-000000000001'), null);
      assert.equal((await repository.getRepairEvidenceById(scopeA, repairA, '60000000-0000-4000-8000-000000000001'))?.storageKey, '70000000-0000-4000-8000-000000000001.png');

      const first = await repository.addOperationalNote(scopeA, note());
      const retry = await repository.addOperationalNote(scopeA, note({
        entryId: '80000000-0000-4000-8000-000000000002',
      }));
      assert.equal(first?.id, retry?.id);
      await assert.rejects(
        repository.addOperationalNote(scopeA, note({
          entryId: '80000000-0000-4000-8000-000000000003',
          body: 'Contenido incompatible',
        })),
        RepairOperationalNoteIdempotencyConflictError,
      );
      const secondKey = await repository.addOperationalNote(scopeA, note({
        entryId: '80000000-0000-4000-8000-000000000004',
        clientRequestId: '90000000-0000-4000-8000-000000000002',
      }));
      assert.notEqual(first?.id, secondKey?.id);

      const concurrentRequest = note({
        entryId: '80000000-0000-4000-8000-000000000005',
        clientRequestId: '90000000-0000-4000-8000-000000000003',
      });
      const concurrent = await Promise.all([
        repository.addOperationalNote(scopeA, concurrentRequest),
        repository.addOperationalNote(scopeA, note({
          ...concurrentRequest,
          entryId: '80000000-0000-4000-8000-000000000006',
        })),
      ]);
      assert.equal(concurrent[0]?.id, concurrent[1]?.id);
      assert.equal(await repository.addOperationalNote(scopeB, note()), null);
      assert.equal(await repository.addOperationalNote(scopeA, note({
        repairId: '30000000-0000-4000-8000-000000000099',
        entryId: '80000000-0000-4000-8000-000000000099',
        clientRequestId: '90000000-0000-4000-8000-000000000099',
      })), null);

      await assert.rejects(
        admin.query(
          `insert into repair_timeline_entries (
             entry_id, tenant_id, branch_id, repair_id, entry_type, actor_id,
             actor_display_name, body, source, occurred_at, created_at
           ) values ('50000000-0000-4000-8000-000000000099', $1, $2, $3,
             'note', null, 'Sin actor', 'Inválida', 'local.invalid', now(), now())`,
          [tenantA, branchA, repairA],
        ),
        (error) => error?.code === '23514',
      );

      const technicianBeforeWorkflow = detail?.technicianId;
      const start = workflowCommand(repairA, '1');
      const started = await repository.startRepairDiagnosis(scopeA, start);
      assert.equal(started?.fromState, 'pending');
      assert.equal(started?.toState, 'diagnosing');
      assert.equal(started?.workflowVersion, 1);
      const startedRetry = await repository.startRepairDiagnosis(scopeA, workflowCommand(repairA, '2', {
        clientRequestId: start.clientRequestId,
      }));
      assert.equal(startedRetry?.transitionId, started?.transitionId);
      assert.equal(startedRetry?.timelineEntryId, started?.timelineEntryId);
      await assert.rejects(
        repository.startRepairDiagnosis(scopeA, workflowCommand(repairA, '3', {
          clientRequestId: start.clientRequestId,
          expectedVersion: 1,
          workflowVersion: 2,
        })),
        RepairWorkflowIdempotencyConflictError,
      );
      await assert.rejects(
        repository.startRepairDiagnosis(scopeA, workflowCommand(repairA, '4')),
        RepairWorkflowConcurrencyConflictError,
      );
      await assert.rejects(
        repository.startRepairDiagnosis(scopeA, workflowCommand(repairA, '5', { expectedVersion: 1, workflowVersion: 2 })),
        RepairWorkflowStateConflictError,
      );
      assert.equal(await repository.startRepairDiagnosis(scopeB, workflowCommand(repairA, '6')), null);
      assert.equal(await repository.startRepairDiagnosis(scopeA, workflowCommand('30000000-0000-4000-8000-000000000099', '7')), null);
      await assert.rejects(
        repository.startRepairDiagnosis(scopeB, workflowCommand(repairB, '8')),
        RepairWorkflowCustodyConflictError,
      );

      const afterWorkflow = await repository.getRepairById(scopeA, repairA);
      assert.equal(afterWorkflow?.repairStatus, 'diagnosing');
      assert.equal(afterWorkflow?.workflowSummary.version, 1);
      assert.equal(afterWorkflow?.workflowSummary.source, 'history');
      assert.equal(afterWorkflow?.technicianId, technicianBeforeWorkflow);
      assert.equal(afterWorkflow?.currentLocation, null);
      assert.equal(afterWorkflow?.custodyStatus, 'active');
      assert.equal(afterWorkflow?.timeline.items[0]?.title, 'Diagnóstico iniciado');
      assert.equal(afterWorkflow?.timeline.items[0]?.source, 'local.workflow');
      assert.equal((await repository.listWorklist(scopeA, listQuery({ status: 'diagnosing' }))).items.some(({ id }) => id === repairA), true);

      await placeInPendingArea(admin, repairA, '1');
      const beforeLocation = await repository.getRepairById(scopeA, repairA);
      assert.equal(beforeLocation?.currentLocation?.code, 'pending_area');
      assert.equal(beforeLocation?.currentLocation?.category, 'pending_area');
      assert.equal(beforeLocation?.currentLocation?.label, 'Área de pendientes');
      assert.equal(beforeLocation?.locationVersion, 1);
      assert.equal(beforeLocation?.locationSource, 'history');
      const locationInput = locationCommand(repairA, '1', { reason: '  Diagnóstico en mesa  ' });
      const moved = await repository.moveRepairToWorkshop(scopeA, { ...locationInput, reason: 'Diagnóstico en mesa' });
      assert.equal(moved?.fromLocation.code, 'pending_area');
      assert.equal(moved?.toLocation.code, 'workshop');
      assert.equal(moved?.locationVersion, 2);
      const movedRetry = await repository.moveRepairToWorkshop(scopeA, locationCommand(repairA, '2', {
        clientRequestId: locationInput.clientRequestId,
        reason: 'Diagnóstico en mesa',
      }));
      assert.equal(movedRetry?.movementId, moved?.movementId);
      assert.equal(movedRetry?.timelineEntryId, moved?.timelineEntryId);
      await assert.rejects(
        repository.moveRepairToWorkshop(scopeA, locationCommand(repairA, '3', {
          clientRequestId: locationInput.clientRequestId,
          reason: 'Motivo distinto',
        })),
        RepairLocationIdempotencyConflictError,
      );
      await assert.rejects(repository.moveRepairToWorkshop(scopeA, locationCommand(repairA, '4')), RepairLocationConcurrencyConflictError);
      await assert.rejects(
        repository.moveRepairToWorkshop(scopeA, locationCommand(repairA, '5', { expectedVersion: 2, locationVersion: 3 })),
        RepairLocationStateConflictError,
      );
      const afterLocation = await repository.getRepairById(scopeA, repairA);
      assert.equal(afterLocation?.currentLocation?.code, 'workshop');
      assert.equal(afterLocation?.currentLocation?.label, 'Taller');
      assert.equal(afterLocation?.locationVersion, 2);
      assert.equal(afterLocation?.repairStatus, 'diagnosing');
      assert.equal(afterLocation?.workflowSummary.version, 1);
      assert.equal(afterLocation?.technicianId, technicianBeforeWorkflow);
      assert.equal(afterLocation?.custodyStatus, 'active');
      assert.equal(afterLocation?.timeline.items[0]?.title, 'Equipo movido');
      assert.equal(afterLocation?.timeline.items[0]?.body, 'Área de pendientes → Taller · Diagnóstico en mesa');
      assert.equal(afterLocation?.timeline.items[0]?.source, 'local.location');
      assert.equal((await admin.query('select count(*)::int as count from repair_location_movements where repair_id = $1', [repairA])).rows[0].count, 2);
      assert.equal((await admin.query("select count(*)::int as count from repair_timeline_entries where repair_id = $1 and source = 'local.location'", [repairA])).rows[0].count, 1);

      await placeInPendingArea(admin, repairB, '2', { tenantId: tenantB, branchId: branchB, locationId: pendingLocationB, label: 'Área de pendientes B' });
      assert.equal(await repository.moveRepairToWorkshop(scopeA, locationCommand(repairB, '6')), null);
      await assert.rejects(
        repository.moveRepairToWorkshop(scopeB, locationCommand(repairB, '7', {
          fromLocation: { id: pendingLocationB, code: 'pending_area', label: 'Área de pendientes B' },
          toLocation: { id: workshopLocationB, code: 'workshop', label: 'Taller B' },
        })),
        RepairLocationCustodyConflictError,
      );
      await placeInPendingArea(admin, repairA2, '3', { tenantId: tenantA, branchId: branchA2, locationId: pendingLocationA2, label: 'Área de pendientes A2' });
      assert.equal(await repository.moveRepairToWorkshop(scopeA, locationCommand(repairA2, '8')), null);
      assert.equal((await repository.getRepairById(scopeA2, repairA2))?.currentLocation?.code, 'pending_area');

      const useCaseIds = ['93000000-0000-4000-8000-000000000090', '94000000-0000-4000-8000-000000000090'];
      const moveUseCase = new MoveRepairToWorkshopUseCase(repository, () => scopeA, () => new Date('2026-08-21T19:00:00.000Z'), () => useCaseIds.shift());
      const useCaseRequest = { clientRequestId: '95000000-0000-4000-8000-000000000090', expectedVersion: 1, reason: null };
      await assert.rejects(moveUseCase.execute({ repairId: 'not-a-uuid', request: useCaseRequest }), MoveRepairToWorkshopInputError);
      await assert.rejects(moveUseCase.execute({ repairId: '30000000-0000-4000-8000-000000000099', request: useCaseRequest }), MoveRepairToWorkshopNotFoundError);

      const locationConcurrentRepair = '30000000-0000-4000-8000-000000000020';
      await insertPendingRepair(admin, locationConcurrentRepair, 'SR-LOCATION-CONCURRENT');
      await placeInPendingArea(admin, locationConcurrentRepair, '20');
      const locationConcurrent = await Promise.allSettled([
        repository.moveRepairToWorkshop(scopeA, locationCommand(locationConcurrentRepair, '20')),
        repository.moveRepairToWorkshop(scopeA, locationCommand(locationConcurrentRepair, '21')),
      ]);
      assert.equal(locationConcurrent.filter(({ status: resultStatus }) => resultStatus === 'fulfilled').length, 1);
      assert.equal(locationConcurrent.filter(({ status: resultStatus }) => resultStatus === 'rejected').length, 1);
      assert.equal((await admin.query('select count(*)::int as count from repair_location_movements where repair_id = $1 and command = $2', [locationConcurrentRepair, 'move_to_workshop'])).rows[0].count, 1);

      const locationRollbackRepair = '30000000-0000-4000-8000-000000000021';
      await insertPendingRepair(admin, locationRollbackRepair, 'SR-LOCATION-ROLLBACK');
      await placeInPendingArea(admin, locationRollbackRepair, '21');
      const locationRollback = locationCommand(locationRollbackRepair, '22');
      await admin.query(
        `insert into repair_timeline_entries (
           entry_id, tenant_id, branch_id, repair_id, entry_type, actor_id,
           actor_display_name, title, source, client_request_id, occurred_at, created_at
         ) values ('98000000-0000-4000-8000-000000000001', $1, $2, $3, 'system_event',
           $4, 'Operador sintético', 'Conflicto preparado', 'local.test', $5, now(), now())`,
        [tenantA, branchA, locationRollbackRepair, actorId, locationRollback.clientRequestId],
      );
      await assert.rejects(repository.moveRepairToWorkshop(scopeA, locationRollback));
      assert.equal((await admin.query('select count(*)::int as count from repair_location_movements where repair_id = $1 and command = $2', [locationRollbackRepair, 'move_to_workshop'])).rows[0].count, 0);

      const inactiveWorkshopRepair = '30000000-0000-4000-8000-000000000022';
      await insertPendingRepair(admin, inactiveWorkshopRepair, 'SR-LOCATION-INACTIVE');
      await placeInPendingArea(admin, inactiveWorkshopRepair, '22');
      await admin.query('update repair_locations set active = false where location_id = $1', [workshopLocationA]);
      await assert.rejects(
        repository.moveRepairToWorkshop(scopeA, locationCommand(inactiveWorkshopRepair, '23')),
        RepairLocationConfigurationError,
      );
      assert.equal((await admin.query('select count(*)::int as count from repair_location_movements where repair_id = $1 and command = $2', [inactiveWorkshopRepair, 'move_to_workshop'])).rows[0].count, 0);
      await admin.query('update repair_locations set active = true where location_id = $1', [workshopLocationA]);

      await assert.rejects(
        admin.query(
          `insert into repair_location_movements (
             movement_id, tenant_id, branch_id, repair_id, command, from_location_id,
             to_location_id, from_code, from_label, to_code, to_label, actor_id,
             actor_display_name, occurred_at, client_request_id,
             expected_location_version, location_version
           ) values ('99000000-0000-4000-8000-000000000001', $1, $2, $3,
             'move_to_workshop', $4, $5, 'pending_area', 'Área de pendientes', 'workshop', 'Taller B', $6,
             'Operador sintético', now(), '99000000-0000-4000-8000-000000000002', 1, 2)`,
          [tenantA, branchA, locationRollbackRepair, pendingLocationA, workshopLocationB, actorId],
        ),
        (error) => error?.code === '23503',
      );
      await assert.rejects(
        admin.query(
          `insert into repair_location_movements (
             movement_id, tenant_id, branch_id, repair_id, command, from_location_id,
             to_location_id, from_code, from_label, to_code, to_label, actor_id,
             actor_display_name, occurred_at, client_request_id,
             expected_location_version, location_version
           ) values ('99000000-0000-4000-8000-000000000003', $1, $2, $3,
             'move_to_workshop', $4, $5, 'pending_area', 'Área de pendientes', 'workshop', 'Taller A2', $6,
             'Operador sintético', now(), '99000000-0000-4000-8000-000000000004', 1, 2)`,
          [tenantA, branchA, locationRollbackRepair, pendingLocationA, workshopLocationA2, actorId],
        ),
        (error) => error?.code === '23503',
      );
      const workflowRows = await admin.query(
        `select from_state, to_state, workflow_version, actor_display_name
         from repair_workflow_transitions where repair_id = $1 order by workflow_version`,
        [repairA],
      );
      assert.deepEqual(workflowRows.rows, [{ from_state: 'pending', to_state: 'diagnosing', workflow_version: 1, actor_display_name: 'Operador sintético' }]);

      await assert.rejects(
        admin.query(
          `insert into repair_workflow_transitions (
             transition_id, tenant_id, branch_id, repair_id, command, from_state, to_state,
             actor_id, actor_display_name, occurred_at, client_request_id,
             expected_workflow_version, workflow_version
           ) values ('84000000-0000-4000-8000-000000000001', $1, $2, $3,
             'start_diagnosis', 'pending', 'diagnosing', $4, 'Operador sintético', now(),
             '85000000-0000-4000-8000-000000000001', 0, 1)`,
          [tenantB, branchB, repairA, actorId],
        ),
        (error) => error?.code === '23503',
      );
      await assert.rejects(
        admin.query(
          `insert into repair_workflow_transitions (
             transition_id, tenant_id, branch_id, repair_id, command, from_state, to_state,
             actor_id, actor_display_name, occurred_at, client_request_id,
             expected_workflow_version, workflow_version
           ) values ('84000000-0000-4000-8000-000000000002', $1, $2, $3,
             'start_diagnosis', 'pending', 'diagnosing', $4, 'Operador sintético', now(),
             '85000000-0000-4000-8000-000000000002', 0, 1)`,
          [tenantA, branchB, repairA, actorId],
        ),
        (error) => error?.code === '23503',
      );

      const concurrentRepair = '30000000-0000-4000-8000-000000000010';
      await insertPendingRepair(admin, concurrentRepair, 'SR-CONCURRENT');
      const concurrentResults = await Promise.allSettled([
        repository.startRepairDiagnosis(scopeA, workflowCommand(concurrentRepair, '10')),
        repository.startRepairDiagnosis(scopeA, workflowCommand(concurrentRepair, '11')),
      ]);
      assert.equal(concurrentResults.filter(({ status: resultStatus }) => resultStatus === 'fulfilled').length, 1);
      assert.equal(concurrentResults.filter(({ status: resultStatus }) => resultStatus === 'rejected').length, 1);
      assert.equal((await admin.query('select count(*)::int as count from repair_workflow_transitions where repair_id = $1', [concurrentRepair])).rows[0].count, 1);

      const rollbackRepair = '30000000-0000-4000-8000-000000000011';
      await insertPendingRepair(admin, rollbackRepair, 'SR-ROLLBACK');
      const rollbackCommand = workflowCommand(rollbackRepair, '12');
      await admin.query(
        `insert into repair_timeline_entries (
           entry_id, tenant_id, branch_id, repair_id, entry_type, actor_id,
           actor_display_name, title, source, client_request_id, occurred_at, created_at
         ) values ('86000000-0000-4000-8000-000000000001', $1, $2, $3, 'system_event',
           $4, 'Operador sintético', 'Conflicto preparado', 'local.test', $5, now(), now())`,
        [tenantA, branchA, rollbackRepair, actorId, rollbackCommand.clientRequestId],
      );
      await assert.rejects(repository.startRepairDiagnosis(scopeA, rollbackCommand));
      assert.equal((await admin.query('select count(*)::int as count from repair_workflow_transitions where repair_id = $1', [rollbackRepair])).rows[0].count, 0);
      assert.equal((await admin.query('select repair_status from repairs where repair_id = $1', [rollbackRepair])).rows[0].repair_status, 'pending');
      await assert.rejects(
        admin.query(
          `insert into repair_timeline_entries (
             entry_id, tenant_id, branch_id, repair_id, entry_type, actor_id,
             actor_display_name, body, source, occurred_at, created_at
           ) values ('50000000-0000-4000-8000-000000000098', $1, $2, $3,
             'note', $4, 'Actor', 'Cross scope', 'local.invalid', now(), now())`,
          [tenantB, branchB, repairA, actorId],
        ),
        (error) => error?.code === '23503',
      );
      await assert.rejects(
        admin.query(
          `insert into repair_attachments (
             attachment_id, tenant_id, branch_id, repair_id, kind, category,
             storage_key, mime_type, size_bytes, uploaded_at
           ) values ('60000000-0000-4000-8000-000000000099', $1, $2, $3,
             'photo', 'intake', '../escape.png', 'image/jpeg', 0, now())`,
          [tenantA, branchA, repairA],
        ),
        (error) => error?.code === '23514',
      );

      await repository.addOperationalNote(scopeA, note({
        entryId: '80000000-0000-4000-8000-000000000007',
        clientRequestId: '90000000-0000-4000-8000-000000000004',
        body: 'x'.repeat(4000),
      }));
      let status = await runner.getMigrationStatus();
      while (status.migrations.some(({ state }) => state === 'applied')) {
        const latest = [...status.migrations].reverse().find(({ state }) => state === 'applied');
        assert.ok(latest);
        await runner.migrateDown(authorization(latest));
        status = await runner.getMigrationStatus();
      }
      await resetDatabase(admin);
      await assertNoObjects(admin);
    } finally {
      await runner.destroy().catch(() => undefined);
      await connection.close().catch(() => undefined);
      await resetDatabase(admin).catch(() => undefined);
      await assertNoObjects(admin);
      await admin.end();
    }
  },
);
