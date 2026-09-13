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
const { RepairCreateIdempotencyConflictError, RepairLocationConcurrencyConflictError, RepairLocationConfigurationError, RepairLocationCustodyConflictError, RepairLocationIdempotencyConflictError, RepairLocationStateConflictError, RepairOperationalNoteIdempotencyConflictError, RepairWorkflowConcurrencyConflictError, RepairWorkflowCustodyConflictError, RepairWorkflowIdempotencyConflictError, RepairWorkflowStateConflictError } = enabled
  ? await import('../dist/modules/repairs/application/ports/repair-repository.port.js')
  : {};
const { createKyselyRepairRepository } = enabled
  ? await import('../dist/modules/repairs/infrastructure/persistence/kysely-repair.repository.js')
  : {};
const { systemNewRepairFieldStates } = enabled
  ? await import('../dist/modules/repairs/domain/new-repair-field-policy.js')
  : {};
const { createKyselyBranchRepository } = enabled
  ? await import('../dist/modules/stations/infrastructure/persistence/kysely-branch.repository.js')
  : {};
const { MoveRepairToWorkshopInputError, MoveRepairToWorkshopNotFoundError, MoveRepairToWorkshopUseCase } = enabled
  ? await import('../dist/modules/repairs/application/use-cases/move-repair-to-workshop.use-case.js')
  : {};

const migrationRoot = fileURLToPath(
  new URL('../dist/infrastructure/database/migrations/', import.meta.url),
);
const tables = [
  'catalog_reference_deletion_events', 'repair_catalog_reference_deletion_events',
  'catalog_audit_events', 'catalog_commands', 'catalog_reference_cost_revisions',
  'catalog_branch_price_revisions', 'catalog_base_price_revisions',
  'catalog_barcode_sequences', 'catalog_sku_sequences', 'catalog_item_identifiers', 'catalog_items',
  'catalog_brand_pending_kind_applicability', 'catalog_brand_pending_values', 'catalog_category_pending_values',
  'catalog_brand_kind_applicability', 'catalog_category_kind_applicability', 'catalog_brands', 'catalog_categories', 'catalog_reference_identity_locks',
  'repair_problem_category_deletion_events',
  'repair_problem_classification_events',
  'repair_problem_classifications',
  'repair_problem_category_catalog_events',
  'repair_problem_pending_values',
  'repair_problem_categories',
  'repair_brand_catalog_events',
  'repair_brand_pending_values',
  'repair_brands',
  'repair_device_type_catalog_events',
  'repair_device_type_pending_values',
  'repair_device_types',
  'repair_model_catalog_events',
  'repair_model_pending_values',
  'repair_models',
  'repair_risk_catalog_events',
  'repair_intervention_risks',
  'repair_risks',
  'repair_new_repair_policy_versions',
  'repair_new_repair_policy_heads',
  'repair_operational_note_request_guards',
  'repair_business_audit_events',
  'repair_create_commands',
  'repair_folio_sequences',
  'access_operational_sessions',
  'access_operational_session_station_guards',
  'access_role_assignment_commands',
  'access_role_commands',
  'access_pin_eligibility_tenant_guards',
  'access_pin_attempt_station_guards',
  'access_pin_attempt_limits',
  'access_pin_credential_commands',
  'access_pin_credentials',
  'access_role_assignments',
  'access_role_capabilities',
  'access_roles',
  'access_capabilities',
  'user_lifecycle_commands',
  'user_profile_update_commands',
  'user_create_commands',
  'user_provisioning_bootstraps',
  'users',
  'customer_contact_phones',
  'customers',
  'station_bindings',
  'station_credentials',
  'stations',
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
const repairDateBoundary = '30000000-0000-4000-8000-000000000005';
const repairWeekBoundary = '30000000-0000-4000-8000-000000000006';
const repairMonthBoundary = '30000000-0000-4000-8000-000000000007';
const repairExactBoundary = '30000000-0000-4000-8000-000000000008';
const actorId = '40000000-0000-4000-8000-000000000001';
const customerA = '43000000-0000-4000-8000-000000000001';
const auditStationId = '41000000-0000-4000-8000-000000000001';
const auditSessionId = '42000000-0000-4000-8000-000000000001';
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
  await admin.query('drop function if exists catalog_reject_append_only_mutation() cascade');
  await admin.query('drop function if exists access_assert_unambiguous_pin_eligibility() cascade');
  await admin.query('drop function if exists repairs_reject_business_audit_event_mutation() cascade');
  await admin.query('drop function if exists repairs_reject_brand_catalog_event_mutation() cascade');
  await admin.query('drop function if exists repairs_reject_device_type_catalog_event_mutation() cascade');
  await admin.query('drop function if exists repairs_reject_model_catalog_event_mutation() cascade');
  await admin.query('drop function if exists repairs_reject_risk_catalog_event_mutation() cascade');
  await admin.query('drop function if exists repairs_reject_problem_category_catalog_event_mutation() cascade');
  await admin.query('drop function if exists repairs_reject_problem_classification_event_mutation() cascade');
  await admin.query('drop function if exists stations_advance_admission_revision() cascade');
  await admin.query('drop function if exists users_advance_admission_revision() cascade');
  await admin.query('drop function if exists access_validate_operational_session_admission() cascade');
  await admin.query('drop function if exists access_invalidate_operational_sessions_for_context_change() cascade');
  await admin.query('drop function if exists access_advance_pin_credential_version() cascade');
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
    `insert into tenants (tenant_id, operating_currency, created_at) values ($1, 'MXN', $3), ($2, 'MXN', $3)`,
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
    `insert into customers (customer_id, tenant_id, branch_id, given_name, family_name, created_at)
     values ($1, $2, $3, 'Cliente', 'Riesgo', $4)`,
    [customerA, tenantA, branchA, createdAt],
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
    auditEventId: '86000000-0000-4000-8000-000000000001',
    correlationId: '87000000-0000-4000-8000-000000000001',
    clientRequestId: '90000000-0000-4000-8000-000000000001',
    body: 'Nota idempotente',
    action: 'repair.operational_note.added',
    resourceType: 'repair',
    result: 'succeeded',
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

function repairCreateRecord(acceptedRiskIds, suffix, overrides = {}) {
  const { reportedIssue = 'Validación de riesgo', reportedProblems, ...recordOverrides } = overrides;
  const problemItems = reportedProblems ?? [{ problemCaptureId: `67000000-0000-4000-8000-${suffix.padStart(12, '0')}`, pendingProblemValueId: `68000000-0000-4000-8000-${suffix.padStart(12, '0')}`, rawLabel: reportedIssue, normalizedKey: reportedIssue.toLocaleLowerCase('es-MX'), canonicalCategoryId: null }];
  return Object.freeze({
    repairId: `61000000-0000-4000-8000-${suffix.padStart(12, '0')}`,
    timelineEntryId: `62000000-0000-4000-8000-${suffix.padStart(12, '0')}`,
    auditEventId: `63000000-0000-4000-8000-${suffix.padStart(12, '0')}`,
    correlationId: `64000000-0000-4000-8000-${suffix.padStart(12, '0')}`,
    clientRequestId: `65000000-0000-4000-8000-${suffix.padStart(12, '0')}`,
    customerId: null,
    customerGivenName: 'Cliente riesgo',
    customerFamilyName: null,
    customerPhone: null,
    deviceType: null,
    canonicalDeviceTypeId: null,
    pendingDeviceTypeValueId: null,
    deviceBrand: 'Marca',
    canonicalBrandId: null,
    pendingBrandValueId: `66000000-0000-4000-8000-${suffix.padStart(12, '0')}`,
    deviceModel: 'Modelo',
    canonicalModelId: null,
    pendingModelValueId: `69000000-0000-4000-8000-${suffix.padStart(12, '0')}`,
    deviceIdentifier: null,
    deviceIdentifierUnavailable: false,
    deviceColor: null,
    distinctiveSigns: null,
    simIncluded: null,
    memoryCardIncluded: null,
    otherAccessories: null,
    reportedIssueCompatibilitySummary: reportedIssue,
    reportedProblems: problemItems,
    customerNarrative: null,
    physicalConditionSummary: null,
    documentedRiskSummary: null,
    acceptedRiskIds,
    receivedPowerState: null,
    deviceAccessType: null,
    initialBudgetAmountMinor: null,
    newRepairPolicyVersion: 0,
    warrantyReviewRequested: false,
    previousRepairId: null,
    deliveredByName: null,
    estimatedDeliveryAt: null,
    action: 'repair.received',
    occurredAt: new Date('2026-08-21T18:10:00.000Z'),
    folioYear: 2026,
    ...recordOverrides,
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
    const concurrentConnection = createDatabaseConnection(databaseConfig());
    const migrationSource = source();
    const inspection = await inspectMigrationSource(migrationSource);
    const runner = createMigrationRunner(connection, {
      expectedManifestHash: inspection.manifest.aggregateSha256,
      [databaseMigrationSourceOverride]: migrationSource,
    });
    try {
      await resetDatabase(admin);
      const applied = await runner.migrateToLatest();
      assert.equal(applied.status.migrations.length, inspection.manifest.migrations.length);
      assert.ok(applied.status.migrations.every(({ state }) => state === 'applied'));
      await seed(admin);

      const seededBranchZones = await admin.query(
        `select branch_id, time_zone from branches
         where tenant_id = $1 order by branch_id`,
        [tenantA],
      );
      assert.deepEqual(seededBranchZones.rows, [
        { branch_id: branchA, time_zone: 'America/Hermosillo' },
        { branch_id: branchA2, time_zone: 'America/Hermosillo' },
      ]);

      const branchRepository = createKyselyBranchRepository(connection);
      const changedBranch = await branchRepository.updateBranchTimeZone(
        { tenantId: tenantA, branchId: branchA },
        'America/Tijuana',
      );
      assert.equal(changedBranch.timeZone, 'America/Tijuana');
      await assert.rejects(
        branchRepository.updateBranchTimeZone(
          { tenantId: tenantB, branchId: branchA },
          'America/Hermosillo',
        ),
      );
      await assert.rejects(
        branchRepository.updateBranchTimeZone(
          { tenantId: tenantA, branchId: branchA },
          '-07:00',
        ),
      );

      const repository = createKyselyRepairRepository(
        connection,
        () => new Date('2026-08-21T18:00:00.000Z'),
      );
      await concurrentConnection.verify();
      const concurrentRepository = createKyselyRepairRepository(
        concurrentConnection,
        () => new Date('2026-08-21T18:00:00.000Z'),
      );
      const scopeA = Object.freeze({ tenantId: tenantA, branchId: branchA });
      const scopeA2 = Object.freeze({ tenantId: tenantA, branchId: branchA2 });
      const scopeB = Object.freeze({ tenantId: tenantB, branchId: branchB });
      const defaultFieldStates = systemNewRepairFieldStates();
      assert.equal(await repository.readNewRepairPolicy(scopeA), null);
      const policyContext = Object.freeze({
        ...scopeA,
        stationId: auditStationId,
        sessionId: auditSessionId,
        actorUserId: actorId,
        actorDisplayName: 'Owner sintético',
        capability: 'repairs.configuration.manage',
        commitGuard: Object.freeze({ async confirmCurrent() { return true; }, async confirmTemporalCurrent() { return true; } }),
      });
      const policyV1 = await repository.changeNewRepairPolicy(policyContext, {
        expectedVersion: 0,
        schemaVersion: 1,
        previousFieldStates: defaultFieldStates,
        fieldStates: Object.freeze({ ...defaultFieldStates, customerFamilyName: 'required', deviceColor: 'hidden' }),
        action: 'new_repair_policy.updated',
        correlationId: '43000000-0000-4000-8000-000000000001',
        occurredAt: new Date('2026-08-21T18:00:00.000Z'),
      });
      assert.equal(policyV1.policyVersion, 1);
      assert.equal(policyV1.fieldStates.customerFamilyName, 'required');
      assert.equal(policyV1.fieldStates.deviceColor, 'hidden');
      assert.equal(await repository.readNewRepairPolicy(scopeA2), null);
      assert.equal(await repository.readNewRepairPolicy(scopeB), null);
      await assert.rejects(repository.changeNewRepairPolicy(policyContext, {
        expectedVersion: 0,
        schemaVersion: 1,
        previousFieldStates: defaultFieldStates,
        fieldStates: defaultFieldStates,
        action: 'new_repair_policy.updated',
        correlationId: '43000000-0000-4000-8000-000000000002',
        occurredAt: new Date('2026-08-21T18:01:00.000Z'),
      }), (error) => error?.name === 'NewRepairPolicyConcurrencyConflictError');
      const policyV2 = await repository.changeNewRepairPolicy(policyContext, {
        expectedVersion: 1,
        schemaVersion: 1,
        previousFieldStates: policyV1.fieldStates,
        fieldStates: defaultFieldStates,
        action: 'new_repair_policy.reset',
        correlationId: '43000000-0000-4000-8000-000000000003',
        occurredAt: new Date('2026-08-21T18:02:00.000Z'),
      });
      assert.equal(policyV2.policyVersion, 2);
      assert.deepEqual(policyV2.fieldStates, defaultFieldStates);
      const policyHistory = await admin.query(`select policy_version, previous_version, capability, action, result from repair_new_repair_policy_versions where tenant_id = $1 and branch_id = $2 order by policy_version`, [tenantA, branchA]);
      assert.deepEqual(policyHistory.rows, [
        { policy_version: 1, previous_version: 0, capability: 'repairs.configuration.manage', action: 'new_repair_policy.updated', result: 'succeeded' },
        { policy_version: 2, previous_version: 1, capability: 'repairs.configuration.manage', action: 'new_repair_policy.reset', result: 'succeeded' },
      ]);

      const riskContext = Object.freeze({
        ...scopeA,
        stationId: auditStationId,
        sessionId: auditSessionId,
        actorUserId: actorId,
        actorDisplayName: 'Owner sintético',
        capability: 'repairs.catalogs.manage',
        commitGuard: Object.freeze({ async confirmCurrent() { return true; }, async confirmTemporalCurrent() { return true; } }),
      });
      assert.equal((await repository.listEffectiveActiveRisks(scopeA)).length, 0);
      const tenantRisk = await repository.createRisk(riskContext, {
        riskId: '44000000-0000-4000-8000-000000000001',
        eventId: '45000000-0000-4000-8000-000000000001',
        correlationId: '46000000-0000-4000-8000-000000000001',
        canonicalLabel: 'Daño en cámara especial',
        normalizedKey: 'dano en camara especial',
        occurredAt: new Date('2026-08-21T18:04:00.000Z'),
      });
      const secondTenantRisk = await repository.createRisk(riskContext, {
        riskId: '44000000-0000-4000-8000-000000000006',
        eventId: '45000000-0000-4000-8000-000000000006',
        correlationId: '46000000-0000-4000-8000-000000000006',
        canonicalLabel: 'Pérdida de información',
        normalizedKey: 'perdida de informacion',
        occurredAt: new Date('2026-08-21T18:04:30.000Z'),
      });
      assert.equal(tenantRisk.scope, 'tenant');
      assert.equal((await repository.listEffectiveActiveRisks(scopeA2)).some(({ riskId }) => riskId === tenantRisk.riskId), true);
      assert.equal((await repository.listEffectiveActiveRisks(scopeB)).some(({ riskId }) => riskId === tenantRisk.riskId), false);
      await admin.query(`insert into repair_intervention_risks (repair_id, risk_id, risk_label_snapshot, selection_order, recorded_by_actor_id, recorded_at) values ($1, $2, $3, 1, $4, $5), ($1, $6, $7, 2, $4, $5)`, [repairA, tenantRisk.riskId, tenantRisk.canonicalLabel, actorId, '2026-08-21T18:04:45.000Z', secondTenantRisk.riskId, secondTenantRisk.canonicalLabel]);
      assert.equal((await repository.listAdminRisks(scopeA)).find(({ riskId }) => riskId === tenantRisk.riskId)?.usageCount, 1);
      const renamedRisk = await repository.changeRisk(riskContext, {
        riskId: tenantRisk.riskId,
        eventId: '45000000-0000-4000-8000-000000000002',
        correlationId: '46000000-0000-4000-8000-000000000002',
        expectedVersion: 1,
        canonicalLabel: 'Daño especial en cámara',
        normalizedKey: 'dano especial en camara',
        action: 'repair_risk.renamed',
        occurredAt: new Date('2026-08-21T18:05:00.000Z'),
      });
      assert.equal(renamedRisk.riskId, tenantRisk.riskId);
      assert.equal(renamedRisk.version, 2);
      await assert.rejects(repository.changeRisk(riskContext, {
        riskId: tenantRisk.riskId,
        eventId: '45000000-0000-4000-8000-000000000098',
        correlationId: '46000000-0000-4000-8000-000000000098',
        expectedVersion: 1,
        status: 'inactive',
        action: 'repair_risk.deactivated',
        occurredAt: new Date('2026-08-21T18:06:00.000Z'),
      }), (error) => error?.name === 'RepairRiskConcurrencyConflictError');
      const inactiveRisk = await repository.changeRisk(riskContext, {
        riskId: tenantRisk.riskId,
        eventId: '45000000-0000-4000-8000-000000000003',
        correlationId: '46000000-0000-4000-8000-000000000003',
        expectedVersion: 2,
        status: 'inactive',
        action: 'repair_risk.deactivated',
        occurredAt: new Date('2026-08-21T18:07:00.000Z'),
      });
      assert.equal(inactiveRisk.version, 3);
      assert.equal((await repository.listEffectiveActiveRisks(scopeA)).some(({ riskId }) => riskId === tenantRisk.riskId), false);
      assert.deepEqual((await repository.getRepairById(scopeA, repairA)).acceptedInterventionRisks, [
        { riskId: tenantRisk.riskId, label: tenantRisk.canonicalLabel },
        { riskId: secondTenantRisk.riskId, label: secondTenantRisk.canonicalLabel },
      ]);
      const createContext = Object.freeze({
        ...scopeA,
        stationId: auditStationId,
        sessionId: auditSessionId,
        actorUserId: actorId,
        actorDisplayName: 'Owner sintético',
        capability: 'repairs.create',
        commitGuard: Object.freeze({ async confirmCurrent() { return true; }, async confirmTemporalCurrent() { return true; } }),
      });
      const unusedCustomerResolver = async () => { throw new Error('Invalid risk must fail before resolving Customer.'); };
      await assert.rejects(repository.createRepair(createContext, repairCreateRecord([tenantRisk.riskId], '1'), unusedCustomerResolver), (error) => error?.name === 'RepairCreateRiskUnavailableError');
      await assert.rejects(repository.createRepair(createContext, repairCreateRecord(['44000000-0000-4000-8000-000000000098'], '2'), unusedCustomerResolver), (error) => error?.name === 'RepairCreateRiskUnavailableError');
      const tenantBRisk = await repository.createRisk(Object.freeze({ ...riskContext, tenantId: tenantB, branchId: branchB }), {
        riskId: '44000000-0000-4000-8000-000000000002',
        eventId: '45000000-0000-4000-8000-000000000005',
        correlationId: '46000000-0000-4000-8000-000000000005',
        canonicalLabel: 'Riesgo exclusivo B',
        normalizedKey: 'riesgo exclusivo b',
        occurredAt: new Date('2026-08-21T18:07:00.000Z'),
      });
      await assert.rejects(repository.createRepair(createContext, repairCreateRecord([tenantBRisk.riskId], '3'), unusedCustomerResolver), (error) => error?.name === 'RepairCreateRiskUnavailableError');
      const reactivatedRisk = await repository.changeRisk(riskContext, {
        riskId: tenantRisk.riskId,
        eventId: '45000000-0000-4000-8000-000000000004',
        correlationId: '46000000-0000-4000-8000-000000000004',
        expectedVersion: 3,
        status: 'active',
        action: 'repair_risk.reactivated',
        occurredAt: new Date('2026-08-21T18:08:00.000Z'),
      });
      assert.equal(reactivatedRisk.version, 4);
      const riskAudit = await admin.query(`select action, old_version, new_version from repair_risk_catalog_events where risk_id = $1 order by new_version`, [tenantRisk.riskId]);
      assert.deepEqual(riskAudit.rows, [
        { action: 'repair_risk.created', old_version: null, new_version: 1 },
        { action: 'repair_risk.renamed', old_version: 1, new_version: 2 },
        { action: 'repair_risk.deactivated', old_version: 2, new_version: 3 },
        { action: 'repair_risk.reactivated', old_version: 3, new_version: 4 },
      ]);
      await assert.rejects(
        admin.query('update repair_risk_catalog_events set actor_display_name = $1 where risk_id = $2', ['Alterado', tenantRisk.riskId]),
        (error) => error?.code === '23514',
      );

      const brandContext = Object.freeze({ ...riskContext });
      const appleBrand = await repository.createBrand(brandContext, {
        brandId: '47000000-0000-4000-8000-000000000001',
        eventId: '47100000-0000-4000-8000-000000000001',
        correlationId: '47200000-0000-4000-8000-000000000001',
        canonicalLabel: 'Apple',
        normalizedKey: 'apple',
        occurredAt: new Date('2026-08-21T18:09:00.000Z'),
      });
      assert.equal(appleBrand.scope, 'tenant');
      assert.equal((await repository.listEffectiveActiveBrands(scopeA2, 'app')).some(({ brandId }) => brandId === appleBrand.brandId), true);
      assert.equal((await repository.listEffectiveActiveBrands(scopeB, 'app')).some(({ brandId }) => brandId === appleBrand.brandId), false);

      await admin.query(
        `insert into repair_brands (
           brand_id, scope, tenant_id, code, canonical_label, normalized_key,
           status, version, created_by_actor_id, updated_by_actor_id,
           created_at, updated_at
         ) values ($1, 'platform', null, 'brand.motorola', 'Motorola', 'motorola',
           'active', 1, null, null, $2, $2)`,
        ['47000000-0000-4000-8000-000000000002', '2026-08-21T18:09:10.000Z'],
      );
      assert.equal((await repository.listEffectiveActiveBrands(scopeA, 'motor')).some(({ scope }) => scope === 'platform'), true);
      assert.equal((await repository.listEffectiveActiveBrands(scopeB, 'motor')).some(({ scope }) => scope === 'platform'), true);

      const tenantBBrand = await repository.createBrand(Object.freeze({ ...brandContext, tenantId: tenantB, branchId: branchB }), {
        brandId: '47000000-0000-4000-8000-000000000003',
        eventId: '47100000-0000-4000-8000-000000000003',
        correlationId: '47200000-0000-4000-8000-000000000003',
        canonicalLabel: 'Marca exclusiva B',
        normalizedKey: 'marca exclusiva b',
        occurredAt: new Date('2026-08-21T18:09:20.000Z'),
      });
      assert.equal((await repository.listAdminBrands(scopeA)).some(({ brandId }) => brandId === tenantBBrand.brandId), false);
      assert.equal((await repository.listAdminBrands(scopeB)).some(({ brandId }) => brandId === appleBrand.brandId), false);

      const customerResolverA = async () => ({ customerId: customerA, tenantId: tenantA, branchId: branchA, givenName: 'Cliente', familyName: 'Riesgo', displayName: 'Cliente Riesgo' });
      const selectedAppleRepair = await repository.createRepair(
        createContext,
        repairCreateRecord([], '101', { deviceBrand: 'Apple', canonicalBrandId: appleBrand.brandId, pendingBrandValueId: null, reportedIssue: 'Marca canónica seleccionada' }),
        customerResolverA,
      );
      const firstApppleRepair = await repository.createRepair(
        createContext,
        repairCreateRecord([], '102', { deviceBrand: 'appple', reportedIssue: 'Marca libre uno' }),
        customerResolverA,
      );
      const secondApppleRepair = await repository.createRepair(
        createContext,
        repairCreateRecord([], '103', { deviceBrand: 'APPPLE', reportedIssue: 'Marca libre dos' }),
        customerResolverA,
      );
      const thirdApppleRepair = await repository.createRepair(
        createContext,
        repairCreateRecord([], '109', { deviceBrand: 'Appple', reportedIssue: 'Marca libre tres' }),
        customerResolverA,
      );
      const apleRepair = await repository.createRepair(
        createContext,
        repairCreateRecord([], '110', { deviceBrand: 'Aple', reportedIssue: 'Variante no exacta uno' }),
        customerResolverA,
      );
      const applRepair = await repository.createRepair(
        createContext,
        repairCreateRecord([], '111', { deviceBrand: 'Appl', reportedIssue: 'Variante no exacta dos' }),
        customerResolverA,
      );
      const pendingBeforeResolution = (await repository.listPendingBrands(scopeA)).find(({ normalizedKey }) => normalizedKey === 'appple');
      assert.ok(pendingBeforeResolution);
      assert.equal(pendingBeforeResolution.usageCount, 3);
      assert.equal((await repository.listPendingBrands(scopeA2)).find(({ pendingBrandValueId }) => pendingBrandValueId === pendingBeforeResolution.pendingBrandValueId)?.usageCount, 3);
      assert.equal((await repository.listPendingBrands(scopeA)).some(({ normalizedKey }) => normalizedKey === 'aple'), true);
      assert.equal((await repository.listPendingBrands(scopeA)).some(({ normalizedKey }) => normalizedKey === 'appl'), true);
      assert.equal((await repository.listPendingBrands(scopeB)).some(({ normalizedKey }) => normalizedKey === 'appple'), false);

      const unresolvedDetail = await repository.getRepairById(scopeA, firstApppleRepair.repairId);
      assert.deepEqual(unresolvedDetail?.deviceBrand, {
        rawLabel: 'appple', canonicalId: null, canonicalLabel: null, effectiveLabel: 'appple',
      });
      assert.equal(
        (await repository.listWorklist(scopeA, listQuery(), 'America/Tijuana')).items
          .find(({ id }) => id === firstApppleRepair.repairId)?.deviceBrand.effectiveLabel,
        'appple',
      );

      const resolvedAppple = await repository.resolvePendingBrand(brandContext, {
        pendingBrandValueId: pendingBeforeResolution.pendingBrandValueId,
        canonicalBrandId: appleBrand.brandId,
        newBrandId: null,
        newCanonicalLabel: null,
        newNormalizedKey: null,
        eventId: '47100000-0000-4000-8000-000000000004',
        correlationId: '47200000-0000-4000-8000-000000000004',
        expectedVersion: pendingBeforeResolution.version,
        occurredAt: new Date('2026-08-21T18:10:00.000Z'),
      });
      assert.equal(resolvedAppple.canonicalBrandId, appleBrand.brandId);
      const apppleRows = await admin.query(
        `select repairs.device_brand, repair_intakes.canonical_brand_id, repair_intakes.pending_brand_value_id
         from repairs join repair_intakes using (repair_id)
         where repairs.repair_id = any($1::uuid[]) order by repairs.repair_id`,
        [[firstApppleRepair.repairId, secondApppleRepair.repairId, thirdApppleRepair.repairId]],
      );
      assert.deepEqual(apppleRows.rows.map(({ device_brand }) => device_brand), ['appple', 'APPPLE', 'Appple']);
      assert.ok(apppleRows.rows.every(({ canonical_brand_id, pending_brand_value_id }) => canonical_brand_id === appleBrand.brandId && pending_brand_value_id === pendingBeforeResolution.pendingBrandValueId));
      assert.deepEqual((await repository.getRepairById(scopeA, firstApppleRepair.repairId))?.deviceBrand, {
        rawLabel: 'appple', canonicalId: appleBrand.brandId, canonicalLabel: 'Apple', effectiveLabel: 'Apple',
      });
      assert.equal(
        (await repository.listWorklist(scopeA, listQuery({ q: 'Apple' }), 'America/Tijuana')).items
          .find(({ id }) => id === firstApppleRepair.repairId)?.deviceBrand.effectiveLabel,
        'Apple',
      );

      const resolvedAliasRepair = await repository.createRepair(
        createContext,
        repairCreateRecord([], '104', { deviceBrand: 'Appple', reportedIssue: 'Alias ya resuelto' }),
        customerResolverA,
      );
      const normalizedAppleRepair = await repository.createRepair(
        createContext,
        repairCreateRecord([], '105', { deviceBrand: 'APPLE', reportedIssue: 'Normalización exacta' }),
        customerResolverA,
      );
      const normalizedAppleLowerRepair = await repository.createRepair(
        createContext,
        repairCreateRecord([], '112', { deviceBrand: 'apple', reportedIssue: 'Normalización exacta minúscula' }),
        customerResolverA,
      );
      const newBrandRepair = await repository.createRepair(
        createContext,
        repairCreateRecord([], '106', { deviceBrand: 'Tecno nueva', reportedIssue: 'Marca realmente nueva' }),
        customerResolverA,
      );
      const platformBrandRepair = await repository.createRepair(
        createContext,
        repairCreateRecord([], '107', { deviceBrand: 'MOTOROLA', reportedIssue: 'Marca Platform normalizada' }),
        customerResolverA,
      );
      const createdBrandLinks = await admin.query(
        `select repairs.repair_id, repairs.device_brand, repair_intakes.canonical_brand_id, repair_intakes.pending_brand_value_id
         from repairs join repair_intakes using (repair_id)
         where repairs.repair_id = any($1::uuid[])`,
        [[selectedAppleRepair.repairId, resolvedAliasRepair.repairId, normalizedAppleRepair.repairId, normalizedAppleLowerRepair.repairId, newBrandRepair.repairId, platformBrandRepair.repairId]],
      );
      const byRepairId = new Map(createdBrandLinks.rows.map((row) => [row.repair_id, row]));
      assert.equal(byRepairId.get(selectedAppleRepair.repairId).device_brand, 'Apple');
      assert.equal(byRepairId.get(selectedAppleRepair.repairId).canonical_brand_id, appleBrand.brandId);
      assert.equal(byRepairId.get(resolvedAliasRepair.repairId).device_brand, 'Appple');
      assert.equal(byRepairId.get(resolvedAliasRepair.repairId).canonical_brand_id, appleBrand.brandId);
      assert.equal(byRepairId.get(normalizedAppleRepair.repairId).device_brand, 'APPLE');
      assert.equal(byRepairId.get(normalizedAppleRepair.repairId).canonical_brand_id, appleBrand.brandId);
      assert.equal(byRepairId.get(normalizedAppleRepair.repairId).pending_brand_value_id, null);
      assert.equal(byRepairId.get(normalizedAppleLowerRepair.repairId).device_brand, 'apple');
      assert.equal(byRepairId.get(normalizedAppleLowerRepair.repairId).canonical_brand_id, appleBrand.brandId);
      assert.equal(byRepairId.get(normalizedAppleLowerRepair.repairId).pending_brand_value_id, null);
      assert.equal(byRepairId.get(newBrandRepair.repairId).device_brand, 'Tecno nueva');
      assert.equal(byRepairId.get(newBrandRepair.repairId).canonical_brand_id, null);
      assert.ok(byRepairId.get(newBrandRepair.repairId).pending_brand_value_id);
      assert.equal(byRepairId.get(platformBrandRepair.repairId).canonical_brand_id, '47000000-0000-4000-8000-000000000002');
      assert.equal((await repository.listAdminBrands(scopeA)).find(({ brandId }) => brandId === appleBrand.brandId)?.usageCount, 7);
      assert.equal((await repository.listPendingBrands(scopeA)).find(({ normalizedKey }) => normalizedKey === 'tecno nueva')?.usageCount, 1);

      await assert.rejects(
        repository.createRepair(
          createContext,
          repairCreateRecord([], '108', { deviceBrand: 'Marca exclusiva B', canonicalBrandId: tenantBBrand.brandId, pendingBrandValueId: null }),
          async () => { throw new Error('Cross-Tenant brand must fail before resolving Customer.'); },
        ),
        (error) => error?.name === 'RepairCreateBrandUnavailableError',
      );
      const renamedApple = await repository.changeBrand(brandContext, {
        brandId: appleBrand.brandId,
        eventId: '47100000-0000-4000-8000-000000000008',
        correlationId: '47200000-0000-4000-8000-000000000008',
        expectedVersion: 1,
        canonicalLabel: 'Apple Test',
        normalizedKey: 'apple test',
        action: 'repair_brand.renamed',
        occurredAt: new Date('2026-08-21T18:10:10.000Z'),
      });
      assert.equal(renamedApple.version, 2);
      assert.equal((await repository.getRepairById(scopeA, firstApppleRepair.repairId))?.deviceBrand.effectiveLabel, 'Apple Test');
      const renamedWorklist = await repository.listWorklist(scopeA, listQuery({ q: 'Apple Test' }), 'America/Tijuana');
      assert.equal(renamedWorklist.items.find(({ id }) => id === selectedAppleRepair.repairId)?.deviceBrand.effectiveLabel, 'Apple Test');
      assert.equal(renamedWorklist.items.find(({ id }) => id === firstApppleRepair.repairId)?.deviceBrand.effectiveLabel, 'Apple Test');
      assert.equal(renamedWorklist.items.find(({ id }) => id === secondApppleRepair.repairId)?.deviceBrand.effectiveLabel, 'Apple Test');
      assert.equal(renamedWorklist.items.find(({ id }) => id === thirdApppleRepair.repairId)?.deviceBrand.effectiveLabel, 'Apple Test');
      const restoredApple = await repository.changeBrand(brandContext, {
        brandId: appleBrand.brandId,
        eventId: '47100000-0000-4000-8000-000000000009',
        correlationId: '47200000-0000-4000-8000-000000000009',
        expectedVersion: 2,
        canonicalLabel: 'Apple',
        normalizedKey: 'apple',
        action: 'repair_brand.renamed',
        occurredAt: new Date('2026-08-21T18:10:20.000Z'),
      });
      assert.equal(restoredApple.version, 3);
      assert.equal((await repository.getRepairById(scopeA, firstApppleRepair.repairId))?.deviceBrand.effectiveLabel, 'Apple');
      assert.deepEqual((await admin.query(
        'select device_brand from repairs where repair_id = $1',
        [firstApppleRepair.repairId],
      )).rows, [{ device_brand: 'appple' }]);
      assert.deepEqual((await repository.getRepairById(scopeA, newBrandRepair.repairId))?.deviceBrand, {
        rawLabel: 'Tecno nueva', canonicalId: null, canonicalLabel: null, effectiveLabel: 'Tecno nueva',
      });
      const inactiveApple = await repository.changeBrand(brandContext, {
        brandId: appleBrand.brandId,
        eventId: '47100000-0000-4000-8000-000000000005',
        correlationId: '47200000-0000-4000-8000-000000000005',
        expectedVersion: 3,
        status: 'inactive',
        action: 'repair_brand.deactivated',
        occurredAt: new Date('2026-08-21T18:11:00.000Z'),
      });
      assert.equal(inactiveApple.version, 4);
      await assert.rejects(repository.changeBrand(brandContext, {
        brandId: appleBrand.brandId,
        eventId: '47100000-0000-4000-8000-000000000006',
        correlationId: '47200000-0000-4000-8000-000000000006',
        expectedVersion: 3,
        canonicalLabel: 'Apple stale',
        normalizedKey: 'apple stale',
        action: 'repair_brand.renamed',
        occurredAt: new Date('2026-08-21T18:11:10.000Z'),
      }), (error) => error?.name === 'RepairBrandConcurrencyConflictError');
      const reactivatedApple = await repository.changeBrand(brandContext, {
        brandId: appleBrand.brandId,
        eventId: '47100000-0000-4000-8000-000000000007',
        correlationId: '47200000-0000-4000-8000-000000000007',
        expectedVersion: 4,
        status: 'active',
        action: 'repair_brand.reactivated',
        occurredAt: new Date('2026-08-21T18:12:00.000Z'),
      });
      assert.equal(reactivatedApple.version, 5);
      await admin.query(
        'update repair_intakes set canonical_brand_id = null where repair_id = $1',
        [firstApppleRepair.repairId],
      );
      assert.deepEqual((await repository.getRepairById(scopeA, firstApppleRepair.repairId))?.deviceBrand, {
        rawLabel: 'appple', canonicalId: null, canonicalLabel: null, effectiveLabel: 'appple',
      });
      assert.deepEqual((await admin.query(
        'select device_brand from repairs where repair_id = $1',
        [firstApppleRepair.repairId],
      )).rows, [{ device_brand: 'appple' }]);
      const brandAudit = await admin.query(`select action, old_version, new_version from repair_brand_catalog_events where brand_id = $1 order by occurred_at`, [appleBrand.brandId]);
      assert.deepEqual(brandAudit.rows, [
        { action: 'repair_brand.created', old_version: null, new_version: 1 },
        { action: 'repair_brand_pending.resolved', old_version: 1, new_version: 2 },
        { action: 'repair_brand.renamed', old_version: 1, new_version: 2 },
        { action: 'repair_brand.renamed', old_version: 2, new_version: 3 },
        { action: 'repair_brand.deactivated', old_version: 3, new_version: 4 },
        { action: 'repair_brand.reactivated', old_version: 4, new_version: 5 },
      ]);
      await assert.rejects(
        admin.query('update repair_brand_catalog_events set actor_display_name = $1 where brand_id = $2', ['Alterado', appleBrand.brandId]),
        (error) => error?.code === '23514',
      );

      const deviceTypeContext = Object.freeze({ ...brandContext });
      const tabletType = await repository.createDeviceType(deviceTypeContext, {
        deviceTypeId: '47300000-0000-4000-8000-000000000001',
        eventId: '47400000-0000-4000-8000-000000000001',
        correlationId: '47500000-0000-4000-8000-000000000001',
        canonicalLabel: 'Tablet QA', normalizedKey: 'tablet qa',
        occurredAt: new Date('2026-08-21T18:13:00.000Z'),
      });
      assert.equal(tabletType.scope, 'tenant');
      assert.equal((await repository.listEffectiveActiveDeviceTypes(scopeA2, 'tablet')).some(({ deviceTypeId }) => deviceTypeId === tabletType.deviceTypeId), true);
      assert.equal((await repository.listEffectiveActiveDeviceTypes(scopeB, 'tablet')).some(({ deviceTypeId }) => deviceTypeId === tabletType.deviceTypeId), false);
      await admin.query(
        `insert into repair_device_types (device_type_id, scope, tenant_id, code, canonical_label, normalized_key, status, version, created_by_actor_id, updated_by_actor_id, created_at, updated_at)
         values ($1, 'platform', null, 'device-type.phone', 'Teléfono', 'telefono', 'active', 1, null, null, $2, $2)`,
        ['47300000-0000-4000-8000-000000000002', '2026-08-21T18:13:10.000Z'],
      );
      assert.equal((await repository.listEffectiveActiveDeviceTypes(scopeA, 'telefono')).some(({ scope }) => scope === 'platform'), true);
      assert.equal((await repository.listEffectiveActiveDeviceTypes(scopeB, 'telefono')).some(({ scope }) => scope === 'platform'), true);
      const tenantBType = await repository.createDeviceType(Object.freeze({ ...deviceTypeContext, tenantId: tenantB, branchId: branchB }), {
        deviceTypeId: '47300000-0000-4000-8000-000000000003', eventId: '47400000-0000-4000-8000-000000000003', correlationId: '47500000-0000-4000-8000-000000000003',
        canonicalLabel: 'Tipo exclusivo B', normalizedKey: 'tipo exclusivo b', occurredAt: new Date('2026-08-21T18:13:20.000Z'),
      });
      assert.equal((await repository.listAdminDeviceTypes(scopeA)).some(({ deviceTypeId }) => deviceTypeId === tenantBType.deviceTypeId), false);

      const canonicalTypeRepair = await repository.createRepair(createContext, repairCreateRecord([], '130', {
        deviceType: 'Tablet QA', canonicalDeviceTypeId: tabletType.deviceTypeId, pendingDeviceTypeValueId: null, reportedIssue: 'Tipo canónico',
      }), customerResolverA);
      const freeTypeRepairs = [];
      for (const [suffix, raw] of [['131', 'Consola retro QA'], ['132', 'CONSOLA RETRO QA'], ['133', '  consola retro qa  ']]) {
        freeTypeRepairs.push(await repository.createRepair(createContext, repairCreateRecord([], suffix, {
          deviceType: raw, canonicalDeviceTypeId: null, pendingDeviceTypeValueId: `47600000-0000-4000-8000-${suffix.padStart(12, '0')}`, reportedIssue: `Tipo libre ${suffix}`,
        }), customerResolverA));
      }
      const pendingType = (await repository.listPendingDeviceTypes(scopeA)).find(({ normalizedKey }) => normalizedKey === 'consola retro qa');
      assert.ok(pendingType);
      assert.equal(pendingType.usageCount, 3);
      assert.equal((await repository.listPendingDeviceTypes(scopeA2)).find(({ pendingDeviceTypeValueId }) => pendingDeviceTypeValueId === pendingType.pendingDeviceTypeValueId)?.usageCount, 3);
      assert.equal((await repository.listPendingDeviceTypes(scopeB)).some(({ normalizedKey }) => normalizedKey === 'consola retro qa'), false);
      assert.deepEqual((await repository.getRepairById(scopeA, freeTypeRepairs[0].repairId))?.deviceTypeIdentity, {
        rawLabel: 'Consola retro QA', canonicalId: null, canonicalLabel: null, effectiveLabel: 'Consola retro QA',
      });
      const resolvedType = await repository.resolvePendingDeviceType(deviceTypeContext, {
        pendingDeviceTypeValueId: pendingType.pendingDeviceTypeValueId, canonicalDeviceTypeId: null,
        newDeviceTypeId: '47300000-0000-4000-8000-000000000004', newCanonicalLabel: 'Consola retro QA', newNormalizedKey: 'consola retro qa',
        eventId: '47400000-0000-4000-8000-000000000004', correlationId: '47500000-0000-4000-8000-000000000004', expectedVersion: pendingType.version,
        occurredAt: new Date('2026-08-21T18:14:00.000Z'),
      });
      assert.equal(resolvedType.usageCount, 3);
      assert.deepEqual((await repository.getRepairById(scopeA, freeTypeRepairs[0].repairId))?.deviceTypeIdentity, {
        rawLabel: 'Consola retro QA', canonicalId: '47300000-0000-4000-8000-000000000004', canonicalLabel: 'Consola retro QA', effectiveLabel: 'Consola retro QA',
      });
      const renamedType = await repository.changeDeviceType(deviceTypeContext, {
        deviceTypeId: '47300000-0000-4000-8000-000000000004', eventId: '47400000-0000-4000-8000-000000000005', correlationId: '47500000-0000-4000-8000-000000000005', expectedVersion: 1,
        canonicalLabel: 'Consola retro Owner', normalizedKey: 'consola retro owner', action: 'repair_device_type.renamed', occurredAt: new Date('2026-08-21T18:14:10.000Z'),
      });
      assert.equal(renamedType.version, 2);
      assert.equal((await repository.getRepairById(scopeA, freeTypeRepairs[0].repairId))?.deviceTypeIdentity.effectiveLabel, 'Consola retro Owner');
      assert.equal((await admin.query('select device_type from repair_intakes where repair_id = $1', [freeTypeRepairs[0].repairId])).rows[0].device_type, 'Consola retro QA');
      const inactiveType = await repository.changeDeviceType(deviceTypeContext, {
        deviceTypeId: renamedType.deviceTypeId, eventId: '47400000-0000-4000-8000-000000000006', correlationId: '47500000-0000-4000-8000-000000000006', expectedVersion: 2,
        status: 'inactive', action: 'repair_device_type.deactivated', occurredAt: new Date('2026-08-21T18:14:20.000Z'),
      });
      assert.equal((await repository.listEffectiveActiveDeviceTypes(scopeA, 'consola')).some(({ deviceTypeId }) => deviceTypeId === renamedType.deviceTypeId), false);
      await assert.rejects(repository.changeDeviceType(deviceTypeContext, {
        deviceTypeId: renamedType.deviceTypeId, eventId: '47400000-0000-4000-8000-000000000007', correlationId: '47500000-0000-4000-8000-000000000007', expectedVersion: 2,
        status: 'active', action: 'repair_device_type.reactivated', occurredAt: new Date('2026-08-21T18:14:30.000Z'),
      }), (error) => error?.name === 'RepairDeviceTypeConcurrencyConflictError');
      await repository.changeDeviceType(deviceTypeContext, {
        deviceTypeId: renamedType.deviceTypeId, eventId: '47400000-0000-4000-8000-000000000008', correlationId: '47500000-0000-4000-8000-000000000008', expectedVersion: inactiveType.version,
        status: 'active', action: 'repair_device_type.reactivated', occurredAt: new Date('2026-08-21T18:14:40.000Z'),
      });
      await assert.rejects(repository.createRepair(createContext, repairCreateRecord([], '134', {
        deviceType: 'Tipo exclusivo B', canonicalDeviceTypeId: tenantBType.deviceTypeId, pendingDeviceTypeValueId: null,
      }), async () => { throw new Error('Cross-Tenant Device Type must fail before resolving Customer.'); }), (error) => error?.name === 'RepairCreateDeviceTypeUnavailableError');
      await assert.rejects(admin.query("update repair_device_type_catalog_events set actor_display_name = 'Alterado' where device_type_id = $1", [renamedType.deviceTypeId]), (error) => error?.code === '23514');

      const idempotentDeviceTypeRequest = repairCreateRecord([], '135', {
        deviceType: 'Tablet QA',
        canonicalDeviceTypeId: tabletType.deviceTypeId,
        pendingDeviceTypeValueId: null,
        reportedIssue: 'Idempotencia de tipo canónico',
      });
      const idempotentDeviceTypeRepair = await repository.createRepair(
        createContext,
        idempotentDeviceTypeRequest,
        customerResolverA,
      );
      const exactDeviceTypeReplay = await repository.createRepair(
        createContext,
        repairCreateRecord([], '136', {
          clientRequestId: idempotentDeviceTypeRequest.clientRequestId,
          deviceType: 'Tablet QA',
          canonicalDeviceTypeId: tabletType.deviceTypeId,
          pendingDeviceTypeValueId: null,
          reportedIssue: 'Idempotencia de tipo canónico',
        }),
        async () => { throw new Error('An exact Create Repair replay must not resolve Customer again.'); },
      );
      assert.deepEqual(exactDeviceTypeReplay, idempotentDeviceTypeRepair);
      await assert.rejects(
        repository.createRepair(
          createContext,
          repairCreateRecord([], '137', {
            clientRequestId: idempotentDeviceTypeRequest.clientRequestId,
            deviceType: 'Tablet QA',
            canonicalDeviceTypeId: '47300000-0000-4000-8000-000000000002',
            pendingDeviceTypeValueId: null,
            reportedIssue: 'Idempotencia de tipo canónico',
          }),
          async () => { throw new Error('An incompatible Create Repair replay must fail before resolving Customer.'); },
        ),
        RepairCreateIdempotencyConflictError,
      );

      const concurrentDeviceTypeRequest = repairCreateRecord([], '138', {
        deviceType: 'Tablet QA',
        canonicalDeviceTypeId: tabletType.deviceTypeId,
        pendingDeviceTypeValueId: null,
        reportedIssue: 'Concurrencia de tipo canónico',
      });
      const concurrentDeviceTypeRepairs = await Promise.all([
        repository.createRepair(createContext, concurrentDeviceTypeRequest, customerResolverA),
        concurrentRepository.createRepair(
          createContext,
          repairCreateRecord([], '139', {
            clientRequestId: concurrentDeviceTypeRequest.clientRequestId,
            deviceType: 'Tablet QA',
            canonicalDeviceTypeId: tabletType.deviceTypeId,
            pendingDeviceTypeValueId: null,
            reportedIssue: 'Concurrencia de tipo canónico',
          }),
          customerResolverA,
        ),
      ]);
      assert.deepEqual(concurrentDeviceTypeRepairs[1], concurrentDeviceTypeRepairs[0]);
      const createIdempotencyCounts = (await admin.query(
        `select
           (select count(*)::integer from repairs
              where tenant_id = $1 and branch_id = $2 and repair_id = $3) as repairs,
           (select count(*)::integer from repair_create_commands
              where tenant_id = $1 and branch_id = $2 and client_request_id = $4) as commands,
           (select count(*)::integer from repair_timeline_entries
              where tenant_id = $1 and branch_id = $2 and client_request_id = $4) as timeline_entries,
           (select count(*)::integer from repair_business_audit_events
              where tenant_id = $1 and branch_id = $2 and client_request_id = $4) as audit_events`,
        [tenantA, branchA, concurrentDeviceTypeRepairs[0].repairId, concurrentDeviceTypeRequest.clientRequestId],
      )).rows[0];
      assert.deepEqual(createIdempotencyCounts, {
        repairs: 1,
        commands: 1,
        timeline_entries: 1,
        audit_events: 1,
      });
      assert.equal(
        (await admin.query(
          'select canonical_device_type_id from repair_intakes where repair_id = $1',
          [idempotentDeviceTypeRepair.repairId],
        )).rows[0].canonical_device_type_id,
        tabletType.deviceTypeId,
      );

      const brandProofRepairIds = [
        selectedAppleRepair.repairId,
        firstApppleRepair.repairId,
        secondApppleRepair.repairId,
        thirdApppleRepair.repairId,
        apleRepair.repairId,
        applRepair.repairId,
        resolvedAliasRepair.repairId,
        normalizedAppleRepair.repairId,
        normalizedAppleLowerRepair.repairId,
        newBrandRepair.repairId,
        platformBrandRepair.repairId,
        canonicalTypeRepair.repairId,
        idempotentDeviceTypeRepair.repairId,
        concurrentDeviceTypeRepairs[0].repairId,
        ...freeTypeRepairs.map(({ repairId }) => repairId),
      ];
      await admin.query('delete from repair_problem_classifications where repair_id = any($1::uuid[])', [brandProofRepairIds]);
      await admin.query('delete from repair_create_commands where repair_id = any($1::uuid[])', [brandProofRepairIds]);
      await admin.query('alter table repair_business_audit_events disable trigger repair_business_audit_events_reject_delete');
      await admin.query('delete from repair_business_audit_events where resource_id = any($1::uuid[])', [brandProofRepairIds]);
      await admin.query('alter table repair_business_audit_events enable trigger repair_business_audit_events_reject_delete');
      await admin.query('delete from repair_timeline_entries where repair_id = any($1::uuid[])', [brandProofRepairIds]);
      await admin.query('delete from repair_intakes where repair_id = any($1::uuid[])', [brandProofRepairIds]);
      await admin.query('delete from repairs where repair_id = any($1::uuid[])', [brandProofRepairIds]);
      const branchATimeZone = 'America/Tijuana';
      const branchBTimeZone = 'America/Hermosillo';
      const noteContextA = Object.freeze({
        ...scopeA,
        stationId: auditStationId,
        sessionId: auditSessionId,
        actorUserId: actorId,
        actorDisplayName: 'Operador sintético',
        capability: 'repairs.add_note',
        commitGuard: Object.freeze({
          async confirmCurrent() { return true; },
          async confirmTemporalCurrent() { return true; },
        }),
      });
      const noteContextB = Object.freeze({
        ...scopeB,
        stationId: '41000000-0000-4000-8000-000000000002',
        sessionId: '42000000-0000-4000-8000-000000000002',
        actorUserId: '40000000-0000-4000-8000-000000000002',
        actorDisplayName: 'Operador B',
        capability: 'repairs.add_note',
        commitGuard: Object.freeze({
          async confirmCurrent() { return true; },
          async confirmTemporalCurrent() { return true; },
        }),
      });

      const allA = await repository.listWorklist(scopeA, listQuery(), branchATimeZone);
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
      assert.equal((await repository.listWorklist(scopeB, listQuery(), branchBTimeZone)).totalCount, 1);
      assert.equal((await repository.listWorklist(scopeA, listQuery({ period: 'today' }), branchATimeZone)).totalCount, 1);
      assert.equal((await repository.listWorklist(scopeA, listQuery({ q: '%' }), branchATimeZone)).items[0]?.id, repairPercent);
      assert.equal((await repository.listWorklist(scopeA, listQuery({ q: '_' }), branchATimeZone)).totalCount, 0);
      assert.equal((await repository.listWorklist(scopeA, listQuery({ pageSize: 1 }), branchATimeZone)).hasNextPage, true);

      await admin.query(
        `insert into repairs (
           repair_id, tenant_id, branch_id, folio, received_at, customer_name,
           customer_phone, device_brand, device_model, reported_issue,
           technician_id, technician_display_name, repair_status, custody_status, created_at
         ) values
           ($1, $4, $5, 'SR-DATE-BOUNDARY', '2026-08-21T06:30:00Z', 'Fecha límite', '6621000011',
            'Marca', 'Fecha', 'Prueba día local', null, null, 'pending', 'active', $6),
           ($2, $4, $5, 'SR-WEEK-BOUNDARY', '2026-08-17T06:30:00Z', 'Semana límite', '6621000012',
            'Marca', 'Semana', 'Prueba semana local', null, null, 'pending', 'active', $6),
           ($3, $4, $5, 'SR-MONTH-BOUNDARY', '2026-08-01T06:30:00Z', 'Mes límite', '6621000013',
            'Marca', 'Mes', 'Prueba mes local', null, null, 'pending', 'active', $6),
           ($7, $4, $5, 'SR-EXACT-BOUNDARY', '2026-08-21T07:00:00Z', 'Límite exacto', '6621000014',
            'Marca', 'Límite', 'Prueba inicio inclusivo', null, null, 'pending', 'active', $6)`,
        [
          repairDateBoundary,
          repairWeekBoundary,
          repairMonthBoundary,
          tenantA,
          branchA,
          '2026-08-21T12:00:00.000Z',
          repairExactBoundary,
        ],
      );
      const storedBeforeTimeZoneChange = await admin.query(
        `select repair_id, received_at from repairs
         where repair_id = any($1::uuid[]) order by repair_id`,
        [[repairDateBoundary, repairWeekBoundary, repairMonthBoundary, repairExactBoundary]],
      );

      await branchRepository.updateBranchTimeZone(scopeA, 'America/Hermosillo');
      const hermosillo = 'America/Hermosillo';
      assert.equal(
        (await repository.listWorklist(scopeA, listQuery({ period: 'today' }), hermosillo))
          .items.some(({ id }) => id === repairDateBoundary),
        false,
      );
      assert.equal(
        (await repository.listWorklist(scopeA, listQuery({ period: 'week' }), hermosillo))
          .items.some(({ id }) => id === repairWeekBoundary),
        false,
      );
      assert.equal(
        (await repository.listWorklist(scopeA, listQuery({ period: 'month' }), hermosillo))
          .items.some(({ id }) => id === repairMonthBoundary),
        false,
      );
      assert.equal(
        (await repository.listWorklist(scopeA, listQuery({ from: '2026-08-21' }), hermosillo))
          .items.some(({ id }) => id === repairDateBoundary),
        false,
      );
      assert.equal(
        (await repository.listWorklist(scopeA, listQuery({ to: '2026-08-20' }), hermosillo))
          .items.some(({ id }) => id === repairDateBoundary),
        true,
      );
      assert.equal(
        (await repository.listWorklist(scopeA, listQuery({ from: '2026-08-21', to: '2026-08-21' }), hermosillo))
          .items.some(({ id }) => id === repairExactBoundary),
        true,
      );
      assert.equal(
        (await repository.listWorklist(scopeA, listQuery({ to: '2026-08-20' }), hermosillo))
          .items.some(({ id }) => id === repairExactBoundary),
        false,
      );

      await branchRepository.updateBranchTimeZone(scopeA, 'America/Cancun');
      const cancun = 'America/Cancun';
      assert.equal(
        (await repository.listWorklist(scopeA, listQuery({ period: 'today' }), cancun))
          .items.some(({ id }) => id === repairDateBoundary),
        true,
      );
      assert.equal(
        (await repository.listWorklist(scopeA, listQuery({ period: 'week' }), cancun))
          .items.some(({ id }) => id === repairWeekBoundary),
        true,
      );
      assert.equal(
        (await repository.listWorklist(scopeA, listQuery({ period: 'month' }), cancun))
          .items.some(({ id }) => id === repairMonthBoundary),
        true,
      );
      assert.equal(
        (await repository.listWorklist(scopeA, listQuery({ from: '2026-08-21' }), cancun))
          .items.some(({ id }) => id === repairDateBoundary),
        true,
      );
      assert.equal(
        (await repository.listWorklist(scopeA, listQuery({ to: '2026-08-20' }), cancun))
          .items.some(({ id }) => id === repairDateBoundary),
        false,
      );
      const storedAfterTimeZoneChange = await admin.query(
        `select repair_id, received_at from repairs
         where repair_id = any($1::uuid[]) order by repair_id`,
        [[repairDateBoundary, repairWeekBoundary, repairMonthBoundary, repairExactBoundary]],
      );
      assert.deepEqual(storedAfterTimeZoneChange.rows, storedBeforeTimeZoneChange.rows);
      await branchRepository.updateBranchTimeZone(scopeA, 'America/Hermosillo');

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

      const first = await repository.addOperationalNote(noteContextA, note());
      const retry = await repository.addOperationalNote(noteContextA, note({
        entryId: '80000000-0000-4000-8000-000000000002',
        auditEventId: '86000000-0000-4000-8000-000000000002',
        correlationId: '87000000-0000-4000-8000-000000000002',
      }));
      assert.equal(first?.id, retry?.id);
      assert.deepEqual(first?.attribution, {
        tenantId: tenantA,
        branchId: branchA,
        stationId: auditStationId,
        sessionId: auditSessionId,
        actorUserId: actorId,
        actorDisplayNameSnapshot: 'Operador sintético',
        capability: 'repairs.add_note',
        action: 'repair.operational_note.added',
        resourceType: 'repair',
        resourceId: repairA,
        result: 'succeeded',
        correlationId: '87000000-0000-4000-8000-000000000001',
        occurredAt: '2026-08-21T13:00:00.000Z',
      });
      assert.deepEqual(retry?.attribution, first?.attribution);
      await assert.rejects(
        repository.addOperationalNote(noteContextA, note({
          entryId: '80000000-0000-4000-8000-000000000003',
          auditEventId: '86000000-0000-4000-8000-000000000003',
          correlationId: '87000000-0000-4000-8000-000000000003',
          body: 'Contenido incompatible',
        })),
        RepairOperationalNoteIdempotencyConflictError,
      );
      const changedSessionContext = Object.freeze({
        ...noteContextA,
        sessionId: '42000000-0000-4000-8000-000000000099',
      });
      await assert.rejects(
        repository.addOperationalNote(changedSessionContext, note({
          entryId: '80000000-0000-4000-8000-000000000008',
          auditEventId: '86000000-0000-4000-8000-000000000008',
          correlationId: '87000000-0000-4000-8000-000000000008',
        })),
        RepairOperationalNoteIdempotencyConflictError,
      );
      const secondKey = await repository.addOperationalNote(noteContextA, note({
        entryId: '80000000-0000-4000-8000-000000000004',
        auditEventId: '86000000-0000-4000-8000-000000000004',
        correlationId: '87000000-0000-4000-8000-000000000004',
        clientRequestId: '90000000-0000-4000-8000-000000000002',
      }));
      assert.notEqual(first?.id, secondKey?.id);

      const concurrentRequest = note({
        entryId: '80000000-0000-4000-8000-000000000005',
        auditEventId: '86000000-0000-4000-8000-000000000005',
        correlationId: '87000000-0000-4000-8000-000000000005',
        clientRequestId: '90000000-0000-4000-8000-000000000003',
      });
      const concurrent = await Promise.all([
        repository.addOperationalNote(noteContextA, concurrentRequest),
        concurrentRepository.addOperationalNote(noteContextA, note({
          ...concurrentRequest,
          entryId: '80000000-0000-4000-8000-000000000006',
          auditEventId: '86000000-0000-4000-8000-000000000006',
          correlationId: '87000000-0000-4000-8000-000000000006',
        })),
      ]);
      assert.equal(concurrent[0]?.id, concurrent[1]?.id);
      const noteAuditCounts = (
        await admin.query(
          `select client_request_id, count(*)::integer as count
           from repair_business_audit_events
           where tenant_id = $1 and branch_id = $2 and resource_id = $3
           group by client_request_id
           order by client_request_id`,
          [tenantA, branchA, repairA],
        )
      ).rows;
      assert.deepEqual(noteAuditCounts, [
        { client_request_id: '90000000-0000-4000-8000-000000000001', count: 1 },
        { client_request_id: '90000000-0000-4000-8000-000000000002', count: 1 },
        { client_request_id: '90000000-0000-4000-8000-000000000003', count: 1 },
      ]);

      const crossResourceRequestId = '90000000-0000-4000-8000-000000000010';
      const crossResource = await Promise.allSettled([
        repository.addOperationalNote(noteContextA, note({
          entryId: '80000000-0000-4000-8000-000000000010',
          auditEventId: '86000000-0000-4000-8000-000000000010',
          correlationId: '87000000-0000-4000-8000-000000000010',
          clientRequestId: crossResourceRequestId,
        })),
        concurrentRepository.addOperationalNote(noteContextA, note({
          repairId: repairPercent,
          entryId: '80000000-0000-4000-8000-000000000011',
          auditEventId: '86000000-0000-4000-8000-000000000011',
          correlationId: '87000000-0000-4000-8000-000000000011',
          clientRequestId: crossResourceRequestId,
        })),
      ]);
      assert.equal(crossResource.filter(({ status }) => status === 'fulfilled').length, 1);
      const rejectedCrossResource = crossResource.find(({ status }) => status === 'rejected');
      assert.ok(rejectedCrossResource);
      assert.ok(rejectedCrossResource.reason instanceof RepairOperationalNoteIdempotencyConflictError);
      const crossResourceCounts = (await admin.query(
        `select
           (select count(*)::integer from repair_timeline_entries
              where tenant_id = $1 and branch_id = $2 and client_request_id = $3) as notes,
           (select count(*)::integer from repair_business_audit_events
              where tenant_id = $1 and branch_id = $2 and client_request_id = $3) as audits`,
        [tenantA, branchA, crossResourceRequestId],
      )).rows[0];
      assert.deepEqual(crossResourceCounts, { notes: 1, audits: 1 });

      assert.equal(await repository.addOperationalNote(noteContextB, note()), null);
      assert.equal(await repository.addOperationalNote(noteContextA, note({
        repairId: '30000000-0000-4000-8000-000000000099',
        entryId: '80000000-0000-4000-8000-000000000099',
        auditEventId: '86000000-0000-4000-8000-000000000099',
        correlationId: '87000000-0000-4000-8000-000000000099',
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
      assert.equal((await repository.listWorklist(scopeA, listQuery({ status: 'diagnosing' }), branchATimeZone)).items.some(({ id }) => id === repairA), true);

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
      const locationSemanticMismatchRepair = '30000000-0000-4000-8000-000000000023';
      await insertPendingRepair(admin, locationSemanticMismatchRepair, 'SR-LOCATION-SEMANTIC-MISMATCH');
      await assert.rejects(
        admin.query(
          `insert into repair_location_movements (
             movement_id, tenant_id, branch_id, repair_id, command, from_location_id,
             to_location_id, from_code, from_label, to_code, to_label, actor_id,
             actor_display_name, occurred_at, client_request_id,
             expected_location_version, location_version
           ) values ('99000000-0000-4000-8000-000000000005', $1, $2, $3,
             'initial_placement', null, $4, null, null, 'pending_area', 'Área de pendientes', $5,
             'Operador sintético', now(), '99000000-0000-4000-8000-000000000006', 0, 1)`,
          [tenantA, branchA, locationSemanticMismatchRepair, workshopLocationA, actorId],
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
           ) values ('99000000-0000-4000-8000-000000000007', $1, $2, $3,
             'move_to_workshop', $4, $5, 'pending_area', 'Área de pendientes', 'workshop', 'Taller', $6,
             'Operador sintético', now(), '99000000-0000-4000-8000-000000000008', 1, 2)`,
          [tenantA, branchA, locationRollbackRepair, workshopLocationA, workshopLocationA, actorId],
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

      const longActorContext = Object.freeze({
        ...noteContextA,
        actorDisplayName: 'A'.repeat(160),
      });
      await repository.addOperationalNote(longActorContext, note({
        entryId: '80000000-0000-4000-8000-000000000007',
        auditEventId: '86000000-0000-4000-8000-000000000007',
        correlationId: '87000000-0000-4000-8000-000000000007',
        clientRequestId: '90000000-0000-4000-8000-000000000004',
        body: 'x'.repeat(4000),
      }));

      const unusedRisk = await repository.createRisk(riskContext, { riskId: '4a000000-0000-4000-8000-000000000001', eventId: '4a100000-0000-4000-8000-000000000001', correlationId: '4a200000-0000-4000-8000-000000000001', canonicalLabel: 'Riesgo descartable', normalizedKey: 'riesgo descartable', occurredAt: new Date('2026-08-21T19:50:00.000Z') });
      const unusedDeviceType = await repository.createDeviceType(deviceTypeContext, { deviceTypeId: '4a000000-0000-4000-8000-000000000002', eventId: '4a100000-0000-4000-8000-000000000002', correlationId: '4a200000-0000-4000-8000-000000000002', canonicalLabel: 'Tipo descartable', normalizedKey: 'tipo descartable', occurredAt: new Date('2026-08-21T19:50:01.000Z') });
      const unusedBrand = await repository.createBrand(brandContext, { brandId: '4a000000-0000-4000-8000-000000000003', eventId: '4a100000-0000-4000-8000-000000000003', correlationId: '4a200000-0000-4000-8000-000000000003', canonicalLabel: 'Marca descartable', normalizedKey: 'marca descartable', occurredAt: new Date('2026-08-21T19:50:02.000Z') });
      const unusedModel = await repository.createModel(brandContext, { modelId: '4a000000-0000-4000-8000-000000000004', canonicalBrandId: appleBrand.brandId, eventId: '4a100000-0000-4000-8000-000000000004', correlationId: '4a200000-0000-4000-8000-000000000004', canonicalLabel: 'Modelo descartable', normalizedKey: 'modelo descartable', occurredAt: new Date('2026-08-21T19:50:03.000Z') });
      assert.equal((await repository.listAdminRisks(scopeA)).find(({ riskId }) => riskId === unusedRisk.riskId)?.deletable, true);
      assert.equal((await repository.listAdminDeviceTypes(scopeA)).find(({ deviceTypeId }) => deviceTypeId === unusedDeviceType.deviceTypeId)?.deletable, true);
      assert.equal((await repository.listAdminBrands(scopeA)).find(({ brandId }) => brandId === unusedBrand.brandId)?.deletable, true);
      assert.equal((await repository.listAdminModels(scopeA, appleBrand.brandId)).find(({ modelId }) => modelId === unusedModel.modelId)?.deletable, true);
      const deletionInputs = [
        ['RISK', unusedRisk.riskId, '4a100000-0000-4000-8000-000000000011', '4a200000-0000-4000-8000-000000000011'],
        ['DEVICE_TYPE', unusedDeviceType.deviceTypeId, '4a100000-0000-4000-8000-000000000012', '4a200000-0000-4000-8000-000000000012'],
        ['BRAND', unusedBrand.brandId, '4a100000-0000-4000-8000-000000000013', '4a200000-0000-4000-8000-000000000013'],
        ['MODEL', unusedModel.modelId, '4a100000-0000-4000-8000-000000000014', '4a200000-0000-4000-8000-000000000014'],
      ];
      for (const [kind, referenceId, eventId, correlationId] of deletionInputs) {
        const result = kind === 'RISK'
          ? await repository.deleteRisk(riskContext, { kind, referenceId, eventId, correlationId, expectedVersion: 1, occurredAt: new Date('2026-08-21T19:51:00.000Z') })
          : kind === 'DEVICE_TYPE'
            ? await repository.deleteDeviceType(deviceTypeContext, { kind, referenceId, eventId, correlationId, expectedVersion: 1, occurredAt: new Date('2026-08-21T19:51:01.000Z') })
            : kind === 'BRAND'
              ? await repository.deleteBrand(brandContext, { kind, referenceId, eventId, correlationId, expectedVersion: 1, occurredAt: new Date('2026-08-21T19:51:02.000Z') })
              : await repository.deleteModel(brandContext, { kind, referenceId, eventId, correlationId, expectedVersion: 1, occurredAt: new Date('2026-08-21T19:51:03.000Z') });
        assert.equal(result.referenceId, referenceId);
      }
      assert.equal((await repository.listAdminRisks(scopeA)).some(({ riskId }) => riskId === unusedRisk.riskId), false);
      assert.equal((await repository.listAdminDeviceTypes(scopeA)).some(({ deviceTypeId }) => deviceTypeId === unusedDeviceType.deviceTypeId), false);
      assert.equal((await repository.listAdminBrands(scopeA)).some(({ brandId }) => brandId === unusedBrand.brandId), false);
      assert.equal((await repository.listAdminModels(scopeA, appleBrand.brandId)).some(({ modelId }) => modelId === unusedModel.modelId), false);
      assert.deepEqual((await admin.query(`select reference_kind, result from repair_catalog_reference_deletion_events where reference_id = any($1::uuid[]) order by reference_kind`, [deletionInputs.map(([, referenceId]) => referenceId)])).rows, [
        { reference_kind: 'BRAND', result: 'succeeded' }, { reference_kind: 'DEVICE_TYPE', result: 'succeeded' }, { reference_kind: 'MODEL', result: 'succeeded' }, { reference_kind: 'RISK', result: 'succeeded' },
      ]);
      assert.equal((await admin.query(`select count(*)::int as count from repair_risk_catalog_events where risk_id = $1`, [unusedRisk.riskId])).rows[0].count, 1);
      assert.equal((await admin.query(`select count(*)::int as count from repair_device_type_catalog_events where device_type_id = $1`, [unusedDeviceType.deviceTypeId])).rows[0].count, 1);
      assert.equal((await admin.query(`select count(*)::int as count from repair_brand_catalog_events where brand_id = $1`, [unusedBrand.brandId])).rows[0].count, 1);
      assert.equal((await admin.query(`select count(*)::int as count from repair_model_catalog_events where model_id = $1`, [unusedModel.modelId])).rows[0].count, 1);
      await assert.rejects(admin.query(`delete from repair_catalog_reference_deletion_events where reference_id = $1`, [unusedRisk.riskId]), (error) => error?.code === '23514');

      const usedDeviceType = await repository.createDeviceType(deviceTypeContext, { deviceTypeId: '4b000000-0000-4000-8000-000000000002', eventId: '4b100000-0000-4000-8000-000000000002', correlationId: '4b200000-0000-4000-8000-000000000002', canonicalLabel: 'Tipo con reparación', normalizedKey: 'tipo con reparacion', occurredAt: new Date('2026-08-21T19:51:59.000Z') });
      const usedModel = await repository.createModel(brandContext, { modelId: '4b000000-0000-4000-8000-000000000001', canonicalBrandId: appleBrand.brandId, eventId: '4b100000-0000-4000-8000-000000000001', correlationId: '4b200000-0000-4000-8000-000000000001', canonicalLabel: 'Modelo con reparación', normalizedKey: 'modelo con reparacion', occurredAt: new Date('2026-08-21T19:52:00.000Z') });
      const usedReferenceRepair = await repository.createRepair(createContext, repairCreateRecord([], '141', { deviceType: usedDeviceType.canonicalLabel, canonicalDeviceTypeId: usedDeviceType.deviceTypeId, pendingDeviceTypeValueId: null, deviceBrand: 'Apple', canonicalBrandId: appleBrand.brandId, pendingBrandValueId: null, deviceModel: usedModel.canonicalLabel, canonicalModelId: usedModel.modelId, pendingModelValueId: null, reportedIssue: 'Modelo gobernado' }), customerResolverA);
      assert.equal((await repository.listAdminModels(scopeA, appleBrand.brandId)).find(({ modelId }) => modelId === usedModel.modelId)?.deletable, false);
      const blockedDeletions = [
        ['risk', () => repository.deleteRisk(riskContext, { kind: 'RISK', referenceId: tenantRisk.riskId, eventId: '4b100000-0000-4000-8000-000000000011', correlationId: '4b200000-0000-4000-8000-000000000011', expectedVersion: reactivatedRisk.version, occurredAt: new Date('2026-08-21T19:53:00.000Z') })],
        ['device type', () => repository.deleteDeviceType(deviceTypeContext, { kind: 'DEVICE_TYPE', referenceId: usedDeviceType.deviceTypeId, eventId: '4b100000-0000-4000-8000-000000000012', correlationId: '4b200000-0000-4000-8000-000000000012', expectedVersion: usedDeviceType.version, occurredAt: new Date('2026-08-21T19:53:01.000Z') })],
        ['brand', () => repository.deleteBrand(brandContext, { kind: 'BRAND', referenceId: appleBrand.brandId, eventId: '4b100000-0000-4000-8000-000000000013', correlationId: '4b200000-0000-4000-8000-000000000013', expectedVersion: reactivatedApple.version, occurredAt: new Date('2026-08-21T19:53:02.000Z') })],
        ['model', () => repository.deleteModel(brandContext, { kind: 'MODEL', referenceId: usedModel.modelId, eventId: '4b100000-0000-4000-8000-000000000014', correlationId: '4b200000-0000-4000-8000-000000000014', expectedVersion: usedModel.version, occurredAt: new Date('2026-08-21T19:53:03.000Z') })],
      ];
      for (const [label, deletion] of blockedDeletions) await assert.rejects(deletion(), (error) => error?.name === 'RepairCatalogReferenceDeleteNotAllowedError' && error.reason === 'reference_in_use', `${label} with references must not be hard-deleted`);
      await assert.rejects(repository.deleteDeviceType(deviceTypeContext, { kind: 'DEVICE_TYPE', referenceId: '47300000-0000-4000-8000-000000000002', eventId: '4b100000-0000-4000-8000-000000000015', correlationId: '4b200000-0000-4000-8000-000000000015', expectedVersion: 1, occurredAt: new Date('2026-08-21T19:53:04.000Z') }), (error) => error?.name === 'RepairCatalogReferenceDeleteNotAllowedError' && error.reason === 'platform_owned');
      await assert.rejects(repository.deleteRisk(riskContext, { kind: 'RISK', referenceId: tenantBRisk.riskId, eventId: '4b100000-0000-4000-8000-000000000016', correlationId: '4b200000-0000-4000-8000-000000000016', expectedVersion: tenantBRisk.version, occurredAt: new Date('2026-08-21T19:53:05.000Z') }), (error) => error?.name === 'RepairRiskNotFoundError');
      assert.equal((await admin.query(`select count(*)::int as count from repair_catalog_reference_deletion_events where result = 'rejected' and rejection_reason = 'reference_in_use' and tenant_id = $1`, [tenantA])).rows[0].count, 4);

      const neverUsedCategory = await repository.createProblemCategory(riskContext, { categoryId: '4c000000-0000-4000-8000-000000000001', eventId: '4c100000-0000-4000-8000-000000000001', correlationId: '4c200000-0000-4000-8000-000000000001', canonicalLabel: 'QA nunca usada', normalizedKey: 'qa nunca usada', occurredAt: new Date('2026-08-21T19:55:00.000Z') });
      assert.equal(neverUsedCategory.usageCount, 0);
      assert.equal(neverUsedCategory.deletable, true);
      assert.equal((await repository.listAdminProblemCategories(scopeA)).find(({ categoryId }) => categoryId === neverUsedCategory.categoryId)?.deletable, true);
      const deletedCategory = await repository.deleteProblemCategory(riskContext, { categoryId: neverUsedCategory.categoryId, eventId: '4c100000-0000-4000-8000-000000000002', correlationId: '4c200000-0000-4000-8000-000000000002', expectedVersion: neverUsedCategory.version, occurredAt: new Date('2026-08-21T19:55:01.000Z') });
      assert.deepEqual(deletedCategory, { categoryId: neverUsedCategory.categoryId, previousLabel: 'QA nunca usada', scope: 'tenant', version: 1, deletedAt: '2026-08-21T19:55:01.000Z' });
      assert.equal((await repository.listAdminProblemCategories(scopeA)).some(({ categoryId }) => categoryId === neverUsedCategory.categoryId), false);
      assert.equal((await repository.listEffectiveActiveProblemCategories(scopeA)).some(({ categoryId }) => categoryId === neverUsedCategory.categoryId), false);
      const successfulDeleteAudit = await admin.query(`select action, previous_label, catalog_scope, category_version, expected_version, actor_user_id, tenant_id, station_id, session_id, correlation_id, result, rejection_reason from repair_problem_category_deletion_events where category_id = $1`, [neverUsedCategory.categoryId]);
      assert.deepEqual(successfulDeleteAudit.rows, [{ action: 'catalog_entry.deleted', previous_label: 'QA nunca usada', catalog_scope: 'tenant', category_version: 1, expected_version: 1, actor_user_id: actorId, tenant_id: tenantA, station_id: auditStationId, session_id: auditSessionId, correlation_id: '4c200000-0000-4000-8000-000000000002', result: 'succeeded', rejection_reason: null }]);
      await assert.rejects(
        admin.query('update repair_problem_category_deletion_events set actor_display_name = $1 where category_id = $2', ['Alterado', neverUsedCategory.categoryId]),
        (error) => error?.code === '23514',
      );
      await assert.rejects(
        admin.query('delete from repair_problem_category_deletion_events where category_id = $1', [neverUsedCategory.categoryId]),
        (error) => error?.code === '23514',
      );

      const staleCategory = await repository.createProblemCategory(riskContext, { categoryId: '4c000000-0000-4000-8000-000000000002', eventId: '4c100000-0000-4000-8000-000000000003', correlationId: '4c200000-0000-4000-8000-000000000003', canonicalLabel: 'QA versión', normalizedKey: 'qa version', occurredAt: new Date('2026-08-21T19:56:00.000Z') });
      await assert.rejects(repository.deleteProblemCategory(riskContext, { categoryId: staleCategory.categoryId, eventId: '4c100000-0000-4000-8000-000000000004', correlationId: '4c200000-0000-4000-8000-000000000004', expectedVersion: 2, occurredAt: new Date('2026-08-21T19:56:01.000Z') }), (error) => error?.name === 'RepairProblemCategoryConcurrencyConflictError');
      assert.equal((await admin.query(`select result, rejection_reason, category_version, expected_version from repair_problem_category_deletion_events where category_id = $1`, [staleCategory.categoryId])).rows[0].rejection_reason, 'version_conflict');

      await admin.query(`insert into repair_problem_categories (category_id, scope, tenant_id, code, canonical_label, normalized_key, status, version, created_by_actor_id, updated_by_actor_id, created_at, updated_at) values ('4c000000-0000-4000-8000-000000000003', 'platform', null, 'PLATFORM_QA', 'Plataforma QA', 'plataforma qa', 'active', 1, null, null, now(), now())`);
      const platformCategory = (await repository.listAdminProblemCategories(scopeA)).find(({ categoryId }) => categoryId === '4c000000-0000-4000-8000-000000000003');
      assert.equal(platformCategory?.deletable, false);
      await assert.rejects(repository.deleteProblemCategory(riskContext, { categoryId: platformCategory.categoryId, eventId: '4c100000-0000-4000-8000-000000000005', correlationId: '4c200000-0000-4000-8000-000000000005', expectedVersion: 1, occurredAt: new Date('2026-08-21T19:57:00.000Z') }), (error) => error?.name === 'RepairProblemCategoryDeleteNotAllowedError' && error.reason === 'platform_owned');
      assert.equal((await admin.query(`select result, rejection_reason from repair_problem_category_deletion_events where category_id = $1`, [platformCategory.categoryId])).rows[0].rejection_reason, 'platform_owned');

      const historicallyUsedCategory = await repository.createProblemCategory(riskContext, { categoryId: '4c000000-0000-4000-8000-000000000004', eventId: '4c100000-0000-4000-8000-000000000006', correlationId: '4c200000-0000-4000-8000-000000000006', canonicalLabel: 'QA uso histórico', normalizedKey: 'qa uso historico', occurredAt: new Date('2026-08-21T19:58:00.000Z') });
      const classificationContext = Object.freeze({ ...riskContext, capability: 'repairs.classify' });
      await repository.changeProblemClassification(classificationContext, { repairId: repairA, categoryId: historicallyUsedCategory.categoryId, problemCaptureId: '4c300000-0000-4000-8000-000000000001', eventId: '4c400000-0000-4000-8000-000000000001', timelineEntryId: '4c500000-0000-4000-8000-000000000001', correlationId: '4c600000-0000-4000-8000-000000000001', action: 'repair.problem_category.assigned', occurredAt: new Date('2026-08-21T19:58:01.000Z') });
      await repository.changeProblemClassification(classificationContext, { repairId: repairA, categoryId: historicallyUsedCategory.categoryId, problemCaptureId: '4c300000-0000-4000-8000-000000000002', eventId: '4c400000-0000-4000-8000-000000000002', timelineEntryId: '4c500000-0000-4000-8000-000000000002', correlationId: '4c600000-0000-4000-8000-000000000002', action: 'repair.problem_category.removed', occurredAt: new Date('2026-08-21T19:58:02.000Z') });
      const historicallyUsedAfterRemoval = (await repository.listAdminProblemCategories(scopeA)).find(({ categoryId }) => categoryId === historicallyUsedCategory.categoryId);
      assert.equal(historicallyUsedAfterRemoval?.usageCount, 0);
      assert.equal(historicallyUsedAfterRemoval?.deletable, false);
      await assert.rejects(repository.deleteProblemCategory(riskContext, { categoryId: historicallyUsedCategory.categoryId, eventId: '4c100000-0000-4000-8000-000000000007', correlationId: '4c200000-0000-4000-8000-000000000007', expectedVersion: 1, occurredAt: new Date('2026-08-21T19:58:03.000Z') }), (error) => error?.name === 'RepairProblemCategoryDeleteNotAllowedError' && error.reason === 'historical_references');
      assert.equal((await admin.query(`select result, rejection_reason from repair_problem_category_deletion_events where category_id = $1`, [historicallyUsedCategory.categoryId])).rows[0].rejection_reason, 'historical_references');
      const historicallyUsedInactive = await repository.changeProblemCategory(riskContext, { categoryId: historicallyUsedCategory.categoryId, eventId: '4c100000-0000-4000-8000-000000000008', correlationId: '4c200000-0000-4000-8000-000000000008', expectedVersion: 1, status: 'inactive', action: 'repair_problem_category.deactivated', occurredAt: new Date('2026-08-21T19:58:04.000Z') });
      assert.equal(historicallyUsedInactive.deletable, false);
      const pantallaCategory = await repository.createProblemCategory(riskContext, { categoryId: '4d000000-0000-4000-8000-000000000001', eventId: '4d100000-0000-4000-8000-000000000001', correlationId: '4d200000-0000-4000-8000-000000000001', canonicalLabel: 'Pantalla', normalizedKey: 'pantalla', occurredAt: new Date('2026-08-21T20:00:00.000Z') });
      const microfonoCategory = await repository.createProblemCategory(riskContext, { categoryId: '4d000000-0000-4000-8000-000000000002', eventId: '4d100000-0000-4000-8000-000000000002', correlationId: '4d200000-0000-4000-8000-000000000002', canonicalLabel: 'Micrófono', normalizedKey: 'microfono', occurredAt: new Date('2026-08-21T20:00:01.000Z') });
      const cargaCategory = await repository.createProblemCategory(riskContext, { categoryId: '4d000000-0000-4000-8000-000000000003', eventId: '4d100000-0000-4000-8000-000000000003', correlationId: '4d200000-0000-4000-8000-000000000003', canonicalLabel: 'Carga', normalizedKey: 'carga', occurredAt: new Date('2026-08-21T20:00:02.000Z') });
      const multiProblemRepair = await repository.createRepair(createContext, repairCreateRecord([], '120', { reportedIssue: 'Pantalla · Micrófono', reportedProblems: [
        { problemCaptureId: '4e000000-0000-4000-8000-000000000001', pendingProblemValueId: '4e100000-0000-4000-8000-000000000001', rawLabel: 'Pantalla', normalizedKey: 'pantalla', canonicalCategoryId: pantallaCategory.categoryId },
        { problemCaptureId: '4e000000-0000-4000-8000-000000000002', pendingProblemValueId: '4e100000-0000-4000-8000-000000000002', rawLabel: 'Micrófono', normalizedKey: 'microfono', canonicalCategoryId: microfonoCategory.categoryId },
      ] }), async () => ({ customerId: customerA, tenantId: tenantA, branchId: branchA, givenName: 'Cliente', familyName: 'Problemas', displayName: 'Cliente Problemas' }));
      assert.deepEqual((await repository.getRepairById(scopeA, multiProblemRepair.repairId))?.problemClassifications.map(({ label }) => label), ['Pantalla', 'Micrófono']);
      const pendingProblemRepair = await repository.createRepair(createContext, repairCreateRecord([], '121', { reportedIssue: 'pantala · Carga', reportedProblems: [
        { problemCaptureId: '4e000000-0000-4000-8000-000000000003', pendingProblemValueId: '4e100000-0000-4000-8000-000000000003', rawLabel: 'pantala', normalizedKey: 'pantala', canonicalCategoryId: null },
        { problemCaptureId: '4e000000-0000-4000-8000-000000000004', pendingProblemValueId: '4e100000-0000-4000-8000-000000000004', rawLabel: 'Carga', normalizedKey: 'carga', canonicalCategoryId: cargaCategory.categoryId },
      ] }), async () => ({ customerId: customerA, tenantId: tenantA, branchId: branchA, givenName: 'Cliente', familyName: 'Pendiente', displayName: 'Cliente Pendiente' }));
      const pantala = (await repository.listPendingProblems(scopeA)).find(({ normalizedKey }) => normalizedKey === 'pantala');
      assert.ok(pantala); assert.equal(pantala.usageCount, 1);
      assert.equal((await repository.listPendingProblems(scopeA2)).some(({ pendingProblemValueId }) => pendingProblemValueId === pantala.pendingProblemValueId), true);
      assert.equal((await repository.listPendingProblems(scopeB)).some(({ normalizedKey }) => normalizedKey === 'pantala'), false);
      await repository.resolvePendingProblem(riskContext, { pendingProblemValueId: pantala.pendingProblemValueId, canonicalCategoryId: pantallaCategory.categoryId, newCategoryId: null, newCanonicalLabel: null, newNormalizedKey: null, eventId: '4d100000-0000-4000-8000-000000000004', correlationId: '4d200000-0000-4000-8000-000000000004', expectedVersion: pantala.version, occurredAt: new Date('2026-08-21T20:01:00.000Z') });
      const reconciledDetail = await repository.getRepairById(scopeA, pendingProblemRepair.repairId);
      assert.equal(reconciledDetail?.problemClassifications[0].rawLabel, 'pantala'); assert.equal(reconciledDetail?.problemClassifications[0].label, 'Pantalla');
      const aliasRepair = await repository.createRepair(createContext, repairCreateRecord([], '122', { reportedIssue: 'pantala', reportedProblems: [{ problemCaptureId: '4e000000-0000-4000-8000-000000000005', pendingProblemValueId: '4e100000-0000-4000-8000-000000000005', rawLabel: 'pantala', normalizedKey: 'pantala', canonicalCategoryId: null }] }), async () => ({ customerId: customerA, tenantId: tenantA, branchId: branchA, givenName: 'Cliente', familyName: 'Alias', displayName: 'Cliente Alias' }));
      assert.equal((await repository.getRepairById(scopeA, aliasRepair.repairId))?.problemClassifications[0].label, 'Pantalla');
      const nonFuzzyRepair = await repository.createRepair(createContext, repairCreateRecord([], '123', { reportedIssue: 'pantalla rota', reportedProblems: [{ problemCaptureId: '4e000000-0000-4000-8000-000000000006', pendingProblemValueId: '4e100000-0000-4000-8000-000000000006', rawLabel: 'pantalla rota', normalizedKey: 'pantalla rota', canonicalCategoryId: null }] }), async () => ({ customerId: customerA, tenantId: tenantA, branchId: branchA, givenName: 'Cliente', familyName: 'No fuzzy', displayName: 'Cliente No fuzzy' }));
      assert.equal((await repository.listPendingProblems(scopeA)).some(({ normalizedKey, resolutionStatus }) => normalizedKey === 'pantalla rota' && resolutionStatus === 'pending'), true);
      assert.equal((await repository.listAdminProblemCategories(scopeA)).find(({ categoryId }) => categoryId === pantallaCategory.categoryId)?.usageCount, 3);
      const createdWithRisks = await repository.createRepair(
        createContext,
        repairCreateRecord([tenantRisk.riskId, secondTenantRisk.riskId], '4', { documentedRiskSummary: 'Cliente informado antes de intervenir.' }),
        async () => ({ customerId: customerA, tenantId: tenantA, branchId: branchA, givenName: 'Cliente', familyName: 'Riesgo', displayName: 'Cliente Riesgo' }),
      );
      const createdRiskDetail = await repository.getRepairById(scopeA, createdWithRisks.repairId);
      assert.deepEqual(createdRiskDetail.acceptedInterventionRisks, [
        { riskId: tenantRisk.riskId, label: renamedRisk.canonicalLabel },
        { riskId: secondTenantRisk.riskId, label: secondTenantRisk.canonicalLabel },
      ]);
      assert.equal(createdRiskDetail.documentedRiskSummary, 'Cliente informado antes de intervenir.');
      assert.equal((await repository.listAdminRisks(scopeA)).find(({ riskId }) => riskId === tenantRisk.riskId)?.usageCount, 2);
      const problemProofRepairIds = [usedReferenceRepair.repairId, multiProblemRepair.repairId, pendingProblemRepair.repairId, aliasRepair.repairId, nonFuzzyRepair.repairId];
      await admin.query('delete from repair_problem_classifications where repair_id = any($1::uuid[])', [problemProofRepairIds]);
      await admin.query('delete from repair_create_commands where repair_id = any($1::uuid[])', [problemProofRepairIds]);
      await admin.query('alter table repair_business_audit_events disable trigger repair_business_audit_events_reject_delete');
      await admin.query('delete from repair_business_audit_events where resource_id = any($1::uuid[])', [problemProofRepairIds]);
      await admin.query('alter table repair_business_audit_events enable trigger repair_business_audit_events_reject_delete');
      await admin.query('delete from repair_timeline_entries where repair_id = any($1::uuid[])', [problemProofRepairIds]);
      await admin.query('delete from repair_intakes where repair_id = any($1::uuid[])', [problemProofRepairIds]);
      await admin.query('delete from repairs where repair_id = any($1::uuid[])', [problemProofRepairIds]);
      await admin.query('delete from repair_intervention_risks where repair_id = $1', [createdWithRisks.repairId]);
      await admin.query('delete from repair_problem_classifications where repair_id = $1', [createdWithRisks.repairId]);
      await admin.query('delete from repair_create_commands where repair_id = $1', [createdWithRisks.repairId]);
      await admin.query('alter table repair_business_audit_events disable trigger repair_business_audit_events_reject_delete');
      await admin.query('delete from repair_business_audit_events where resource_id = $1', [createdWithRisks.repairId]);
      await admin.query('alter table repair_business_audit_events enable trigger repair_business_audit_events_reject_delete');
      await admin.query('delete from repair_timeline_entries where repair_id = $1', [createdWithRisks.repairId]);
      await admin.query('delete from repair_intakes where repair_id = $1', [createdWithRisks.repairId]);
      await admin.query('delete from repairs where repair_id = $1', [createdWithRisks.repairId]);
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
      await concurrentConnection.close().catch(() => undefined);
      await resetDatabase(admin).catch(() => undefined);
      await assertNoObjects(admin);
      await admin.end();
    }
  },
);
