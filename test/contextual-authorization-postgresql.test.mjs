import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { Pool } from 'pg';

const enabled = process.env.SR_OWNER_SCOPED_PG_TEST === '1';

const { createDatabaseConnection } = enabled
  ? await import('../dist/infrastructure/database/database-connection.js')
  : {};
const { useTransactionalDatabasePersistenceExecutor } = enabled
  ? await import('../dist/infrastructure/database/database-persistence-capability.js')
  : {};
const {
  databaseMigrationSourceOverride,
  inspectMigrationSource,
} = enabled
  ? await import('../dist/infrastructure/database/database-migration-provider.js')
  : {};
const { createMigrationRunner } = enabled
  ? await import('../dist/infrastructure/database/migration-runner.js')
  : {};
const { ContextualAuthorizationError } = enabled
  ? await import('../dist/modules/access/index.js')
  : {};
const { KyselyOperationalSessionRepository } = enabled
  ? await import('../dist/modules/access/infrastructure/persistence/kysely-operational-session.repository.js')
  : {};
const { createKyselyAccessRepository } = enabled
  ? await import('../dist/modules/access/infrastructure/persistence/kysely-access.repository.js')
  : {};
const { NodeSessionToken } = enabled
  ? await import('../dist/modules/access/infrastructure/security/node-session-token.js')
  : {};
const { ListApplicableUsersUseCase } = enabled
  ? await import('../dist/modules/access/application/use-cases/list-applicable-users.use-case.js')
  : {};
const { ResolveEffectiveCapabilitiesUseCase } = enabled
  ? await import('../dist/modules/access/application/use-cases/resolve-effective-capabilities.use-case.js')
  : {};
const { ResolveOperationalSessionUseCase } = enabled
  ? await import('../dist/modules/access/application/use-cases/operational-session.use-cases.js')
  : {};
const { ContextualAuthorizationExecutorService } = enabled
  ? await import('../dist/modules/access/presentation/contextual-authorization.executor.js')
  : {};
const { KyselyAuthenticationUserReader } = enabled
  ? await import('../dist/modules/users/infrastructure/persistence/kysely-authentication-user.reader.js')
  : {};
const { KyselyStationCredentialVerifier } = enabled
  ? await import('../dist/modules/stations/infrastructure/persistence/kysely-station-credential.verifier.js')
  : {};
const { ResolveTrustedStationContextUseCase } = enabled
  ? await import('../dist/modules/stations/application/use-cases/resolve-trusted-station-context.js')
  : {};
const { TrustedStationRequestContextResolver } = enabled
  ? await import('../dist/modules/stations/infrastructure/http/trusted-station-request-context.resolver.js')
  : {};
const {
  RepairOperationAccessDeniedError,
  RepairProtectedOperations,
} = enabled
  ? await import('../dist/modules/repairs/application/repair-protected-operations.js')
  : {};
const { RepairDetailNotFoundError } = enabled
  ? await import('../dist/modules/repairs/application/use-cases/get-repair-detail.use-case.js')
  : {};
const {
  AddRepairOperationalNoteAuthorizationError,
  RepairOperationalNoteRepairNotFoundError,
} = enabled
  ? await import('../dist/modules/repairs/application/use-cases/add-repair-operational-note.use-case.js')
  : {};
const { createKyselyRepairRepository } = enabled
  ? await import('../dist/modules/repairs/infrastructure/persistence/kysely-repair.repository.js')
  : {};
const { RepairOperationalNoteAuthorizationChangedError } = enabled
  ? await import('../dist/modules/repairs/application/ports/repair-repository.port.js')
  : {};

const migrationRoot = fileURLToPath(
  new URL('../dist/infrastructure/database/migrations/', import.meta.url),
);

const tables = [
  'user_preferences',
  'repair_problem_category_deletion_events',
  'repair_problem_classification_events',
  'repair_problem_classifications',
  'repair_problem_pending_values',
  'repair_problem_category_catalog_events',
  'repair_problem_categories',
  'repair_equipment_corrections',
  'repair_device_type_catalog_events',
  'repair_device_type_pending_values',
  'repair_device_types',
  'repair_model_catalog_events',
  'repair_model_pending_values',
  'repair_models',
  'repair_brand_catalog_events',
  'repair_brand_pending_values',
  'repair_brands',
  'repair_risk_catalog_events',
  'repair_intervention_risks',
  'repair_risks',
  'repair_new_repair_policy_heads',
  'repair_new_repair_policy_versions',
  'repair_create_commands',
  'repair_folio_sequences',
  'customer_contact_phones',
  'customers',
  'repair_operational_note_request_guards',
  'repair_business_audit_events',
  'access_operational_sessions',
  'access_operational_session_station_guards',
  'access_pin_attempt_limits',
  'access_pin_attempt_station_guards',
  'access_pin_credential_commands',
  'access_pin_eligibility_tenant_guards',
  'access_pin_credentials',
  'access_role_assignment_commands',
  'access_role_commands',
  'access_role_assignments',
  'access_role_capabilities',
  'access_roles',
  'access_capabilities',
  'user_lifecycle_commands',
  'user_profile_update_commands',
  'user_create_commands',
  'user_provisioning_bootstraps',
  'users',
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
  'station_credentials',
  'station_bindings',
  'stations',
  'branches',
  'tenants',
  'kysely_migration',
  'kysely_migration_lock',
];

const tenantA = '10000000-0000-4000-8000-000000000026';
const tenantB = '20000000-0000-4000-8000-000000000026';
const branchA = '30000000-0000-4000-8000-000000000026';
const branchA2 = '31000000-0000-4000-8000-000000000026';
const branchB = '40000000-0000-4000-8000-000000000026';
const stationA = '50000000-0000-4000-8000-000000000026';
const stationB = '60000000-0000-4000-8000-000000000026';
const stationCredentialA = '70000000-0000-4000-8000-000000000026';
const stationCredentialB = '71000000-0000-4000-8000-000000000026';
const userA = '80000000-0000-4000-8000-000000000026';
const userB = '81000000-0000-4000-8000-000000000026';
const roleA = '90000000-0000-4000-8000-000000000026';
const roleB = '91000000-0000-4000-8000-000000000026';
const assignmentA = 'a0000000-0000-4000-8000-000000000026';
const assignmentB = 'a1000000-0000-4000-8000-000000000026';
const sessionA = 'b0000000-0000-4000-8000-000000000026';
const repairA = 'c0000000-0000-4000-8000-000000000026';
const repairA2 = 'c1000000-0000-4000-8000-000000000026';
const repairB = 'c2000000-0000-4000-8000-000000000026';
const noteRequestA = 'd0000000-0000-4000-8000-000000000026';
const deniedNoteRequest = 'd1000000-0000-4000-8000-000000000026';
const foreignBranchRequest = 'd2000000-0000-4000-8000-000000000026';
const foreignTenantRequest = 'd3000000-0000-4000-8000-000000000026';
const concurrentNoteRequest = 'd4000000-0000-4000-8000-000000000026';
const auditFailureRequest = 'd5000000-0000-4000-8000-000000000026';
const toctouRequest = 'd6000000-0000-4000-8000-000000000026';
const expiredCommitRequest = 'd7000000-0000-4000-8000-000000000026';
const lockExpiredCommitRequest = 'd8000000-0000-4000-8000-000000000026';
const authorityLinearizationRequest = 'd9000000-0000-4000-8000-000000000026';
const snapshotRevocationRequest = 'da000000-0000-4000-8000-000000000026';
const stationSecretA = 'A'.repeat(43);
const stationSecretB = 'B'.repeat(43);
const authorizationNow = new Date();

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
      statementTimeoutMs: 20_000,
      queryTimeoutMs: 20_000,
    }),
    runtime: Object.freeze({
      environment: 'development',
      role: 'migration',
      accessMode: 'read-write',
      migrationsEnabled: true,
      testRunId: null,
    }),
    observability: Object.freeze({
      applicationName: 'srtaller-contextual-authorization-postgresql',
      labels: Object.freeze({
        component: 'access',
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
    max: 4,
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

async function resetDatabase(admin) {
  await admin.query(
    'drop function if exists test_reject_pbi028_audit_insert() cascade',
  );
  await admin.query(
    'drop function if exists repairs_reject_business_audit_event_mutation() cascade',
  );
  await admin.query(
    'drop function if exists stations_advance_admission_revision() cascade',
  );
  await admin.query(
    'drop function if exists users_advance_admission_revision() cascade',
  );
  await admin.query(
    'drop function if exists access_validate_operational_session_admission() cascade',
  );
  await admin.query(
    'drop function if exists access_invalidate_operational_sessions_for_context_change() cascade',
  );
  await admin.query(
    'drop function if exists access_advance_pin_credential_version() cascade',
  );
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

async function seedMaterialContext(admin) {
  await admin.query(
    `insert into tenants (tenant_id, created_at)
     values ($1, now()), ($2, now())`,
    [tenantA, tenantB],
  );
  await admin.query(
    `insert into branches (tenant_id, branch_id, active, created_at)
     values
       ($1, $2, true, now()),
       ($1, $3, true, now()),
       ($4, $5, true, now())`,
    [tenantA, branchA, branchA2, tenantB, branchB],
  );
  await admin.query(
    `insert into stations (tenant_id, station_id, status, created_at, updated_at)
     values
       ($1, $2, 'active', now(), now()),
       ($3, $4, 'active', now(), now())`,
    [tenantA, stationA, tenantB, stationB],
  );
  await admin.query(
    `insert into station_bindings (tenant_id, station_id, branch_id, created_at)
     values ($1, $2, $3, now()), ($4, $5, $6, now())`,
    [tenantA, stationA, branchA, tenantB, stationB, branchB],
  );
  await admin.query(
    `insert into station_credentials (
       credential_id, credential_hash, tenant_id, station_id, created_at
     ) values
       ($1, $2, $3, $4, now()),
       ($5, $6, $7, $8, now())`,
    [
      stationCredentialA,
      createHash('sha256').update(stationSecretA).digest('hex'),
      tenantA,
      stationA,
      stationCredentialB,
      createHash('sha256').update(stationSecretB).digest('hex'),
      tenantB,
      stationB,
    ],
  );
  await admin.query(
    `insert into users (
       tenant_id, user_id, display_name, operational_identifier, status,
       version, created_at, updated_at
     ) values
       ($1, $2, 'Operadora A', 'operadora-a', 'active', 0, now(), now()),
       ($3, $4, 'Operador B', 'operador-b', 'active', 0, now(), now())`,
    [tenantA, userA, tenantB, userB],
  );
  await admin.query(
    `insert into access_roles (
       tenant_id, role_id, role_key, display_name, status, version,
       created_at, updated_at
     ) values
       ($1, $2, 'operator_a', 'Operación A', 'active', 0, now(), now()),
       ($3, $4, 'operator_b', 'Operación B', 'active', 0, now(), now())`,
    [tenantA, roleA, tenantB, roleB],
  );
  await admin.query(
    `insert into access_role_capabilities (
       tenant_id, role_id, capability_code, created_at
     ) values
       ($1, $2, 'repairs.read', now()),
       ($1, $2, 'repairs.add_note', now()),
       ($3, $4, 'repairs.read', now()),
       ($3, $4, 'repairs.add_note', now())`,
    [tenantA, roleA, tenantB, roleB],
  );
  await admin.query(
    `insert into access_role_assignments (
       tenant_id, assignment_id, user_id, role_id, assignment_scope,
       branch_id, status, version, assigned_at
     ) values
       ($1, $2, $3, $4, 'BRANCH_RESTRICTED', $5, 'active', 0, now()),
       ($6, $7, $8, $9, 'BRANCH_RESTRICTED', $10, 'active', 0, now())`,
    [
      tenantA,
      assignmentA,
      userA,
      roleA,
      branchA,
      tenantB,
      assignmentB,
      userB,
      roleB,
      branchB,
    ],
  );
  await admin.query(
    `insert into access_pin_credentials (
       tenant_id, user_id, credential_id, status, algorithm,
       profile_version, pepper_version, memory_kib, passes, parallelism,
       salt, verifier, credential_version, consecutive_failures,
       created_at, updated_at
     ) values
       ($1, $2, gen_random_uuid(), 'active', 'argon2id', 1, 1,
        65536, 3, 4, $5, $6, 1, 0, now(), now()),
       ($3, $4, gen_random_uuid(), 'active', 'argon2id', 1, 1,
        65536, 3, 4, $5, $6, 1, 0, now(), now())`,
    [tenantA, userA, tenantB, userB, Buffer.alloc(16, 1), Buffer.alloc(32, 2)],
  );
  await admin.query(
    `insert into repairs (
       repair_id, tenant_id, branch_id, folio, received_at, customer_name,
       customer_phone, device_brand, device_model, reported_issue,
       technician_id, technician_display_name, repair_status, custody_status,
       created_at
     ) values
       ($1, $2, $3, 'SR-AUTH-A', now(), 'Cliente A', '6621000026',
        'Motorola', 'Edge 40', 'Pantalla sin imagen', null, null,
        'pending', 'active', now()),
       ($4, $2, $5, 'SR-AUTH-A2', now(), 'Cliente A2', '6621000126',
        'Apple', 'iPhone 13', 'Sucursal distinta', null, null,
        'pending', 'active', now()),
       ($6, $7, $8, 'SR-AUTH-B', now(), 'Cliente B', '6621000226',
        'Samsung', 'S22', 'Tenant distinto', null, null,
        'pending', 'active', now())`,
    [repairA, tenantA, branchA, repairA2, branchA2, repairB, tenantB, branchB],
  );
}

function requestEvidence(cookieHeader, csrfToken) {
  return Object.freeze({
    cookieHeader,
    origin: 'http://127.0.0.1:4173',
    host: '127.0.0.1:4173',
    forwardedProto: undefined,
    fetchSite: 'same-origin',
    contentType: 'application/json',
    csrfToken,
  });
}

function noteInput(repairId, clientRequestId, body) {
  return Object.freeze({
    repairId,
    request: Object.freeze({ clientRequestId, body }),
  });
}

async function assertAuthorizationCode(promise, code) {
  await assert.rejects(
    promise,
    (error) =>
      error instanceof ContextualAuthorizationError && error.code === code,
  );
}

async function effectCounts(admin) {
  const result = await admin.query(
    `select
       (select count(*)::integer from repair_timeline_entries) as timeline,
       (select count(*)::integer from repair_business_audit_events) as audit,
       (select count(*)::integer from repair_technician_assignments) as assignments,
       (select count(*)::integer from repair_workflow_transitions) as workflow,
       (select count(*)::integer from repair_location_movements) as locations`,
  );
  return result.rows[0];
}

async function waitForRepairLockWait(admin) {
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    const result = await admin.query(
      `select exists (
         select 1
         from pg_stat_activity
         where application_name = 'srtaller-contextual-authorization-postgresql'
           and state = 'active'
           and wait_event_type = 'Lock'
           and query ilike '%from "repairs"%for update%'
       ) as waiting`,
    );
    if (result.rows[0].waiting) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  assert.fail('Operational Note transaction did not reach the Repair row lock');
}

async function waitForCapabilityRevocationLockWait(admin) {
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    const result = await admin.query(
      `select exists (
         select 1
         from pg_stat_activity
         where state = 'active'
           and wait_event_type = 'Lock'
           and query ilike '%delete from access_role_capabilities%'
       ) as waiting`,
    );
    if (result.rows[0].waiting) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  assert.fail('Capability revocation did not wait on the commit guard lock');
}

test(
  'PostgreSQL 18.4 materially enforces contextual authorization and scoped Repair effects',
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
      await assertNoObjects(admin);
      const applied = await runner.migrateToLatest();
      assert.equal(
        applied.status.migrations.length,
        inspection.manifest.migrations.length,
      );
      assert.ok(applied.status.migrations.every(({ state }) => state === 'applied'));
      await seedMaterialContext(admin);
      await connection.verify();

      const stationVerifier = new KyselyStationCredentialVerifier(connection);
      const trustedStations = new TrustedStationRequestContextResolver(
        new ResolveTrustedStationContextUseCase(stationVerifier),
      );
      const stationCookieA = `sr_station=${stationSecretA}`;
      const stationCookieB = `sr_station=${stationSecretB}`;
      const stationContextA = await trustedStations.resolve(stationCookieA);
      assert.deepEqual(
        {
          tenantId: stationContextA.tenantId,
          branchId: stationContextA.branchId,
          stationId: stationContextA.stationId,
        },
        { tenantId: tenantA, branchId: branchA, stationId: stationA },
      );

      const accessRepository = createKyselyAccessRepository(connection);
      const userReader = new KyselyAuthenticationUserReader(connection);
      const sessionRepository = new KyselyOperationalSessionRepository(
        connection,
        stationVerifier,
        userReader,
      );
      const tokens = new NodeSessionToken();
      const tokenMaterial = tokens.issue();
      await sessionRepository.createForProfile(stationContextA, {
        sessionId: sessionA,
        userId: userA,
        userVersion: 0,
        userAdmissionRevision: 0,
        credentialVersion: 1,
        bearerVerifier: tokenMaterial.bearerVerifier,
        csrfVerifier: tokenMaterial.csrfVerifier,
        expectedSessionId: null,
        occurredAt: new Date(authorizationNow.getTime() - 1_000).toISOString(),
        expiresAt: new Date(authorizationNow.getTime() + 12 * 60 * 60 * 1_000 - 1_000).toISOString(),
      });

      const applicableUsers = new ListApplicableUsersUseCase(accessRepository);
      const resolveSession = new ResolveOperationalSessionUseCase(
        sessionRepository,
        userReader,
        applicableUsers,
        tokens,
        () => new Date(authorizationNow),
      );
      const resolveCapabilities = new ResolveEffectiveCapabilitiesUseCase(
        accessRepository,
      );
      const authorization = new ContextualAuthorizationExecutorService(
        Object.freeze({
          trustedStations,
          resolveSession,
          resolveCapabilities,
        }),
      );
      const repairRepository = createKyselyRepairRepository(
        connection,
        () => new Date(authorizationNow),
      );
      const repairs = new RepairProtectedOperations(
        authorization,
        repairRepository,
        Object.freeze({ read: async () => null }),
        Object.freeze({ readTimeZone: async () => ({ timeZone: 'America/Hermosillo' }) }),
      );
      await concurrentConnection.verify();
      const concurrentStationVerifier = new KyselyStationCredentialVerifier(
        concurrentConnection,
      );
      const concurrentTrustedStations = new TrustedStationRequestContextResolver(
        new ResolveTrustedStationContextUseCase(concurrentStationVerifier),
      );
      const concurrentAccessRepository = createKyselyAccessRepository(
        concurrentConnection,
      );
      const concurrentUserReader = new KyselyAuthenticationUserReader(
        concurrentConnection,
      );
      const concurrentSessionRepository = new KyselyOperationalSessionRepository(
        concurrentConnection,
        concurrentStationVerifier,
        concurrentUserReader,
      );
      const concurrentAuthorization = new ContextualAuthorizationExecutorService(
        Object.freeze({
          trustedStations: concurrentTrustedStations,
          resolveSession: new ResolveOperationalSessionUseCase(
            concurrentSessionRepository,
            concurrentUserReader,
            new ListApplicableUsersUseCase(concurrentAccessRepository),
            new NodeSessionToken(),
            () => new Date(authorizationNow),
          ),
          resolveCapabilities: new ResolveEffectiveCapabilitiesUseCase(
            concurrentAccessRepository,
          ),
        }),
      );
      const concurrentRepairs = new RepairProtectedOperations(
        concurrentAuthorization,
        createKyselyRepairRepository(
          concurrentConnection,
          () => new Date(authorizationNow),
        ),
        Object.freeze({ read: async () => null }),
        Object.freeze({ readTimeZone: async () => ({ timeZone: 'America/Hermosillo' }) }),
      );
      const cookieHeader = [
        stationCookieA,
        `sr_session=${tokenMaterial.bearer}`,
        `sr_session_csrf=${tokenMaterial.csrf}`,
      ].join('; ');
      const evidence = requestEvidence(cookieHeader, tokenMaterial.csrf);

      const worklist = await repairs.listRepairs(evidence, {
        period: 'all',
        page: '1',
        pageSize: '25',
      });
      assert.deepEqual(worklist.items.map(({ id }) => id), [repairA]);
      assert.equal((await repairs.getRepairDetail(evidence, { repairId: repairA })).id, repairA);
      await assert.rejects(
        repairs.getRepairDetail(evidence, { repairId: repairA2 }),
        RepairDetailNotFoundError,
      );
      await assert.rejects(
        repairs.getRepairDetail(evidence, { repairId: repairB }),
        RepairDetailNotFoundError,
      );

      const note = await repairs.addRepairOperationalNote(
        evidence,
        noteInput(repairA, noteRequestA, 'Nota autorizada por contexto material.'),
      );
      assert.equal(note.body, 'Nota autorizada por contexto material.');
      const persistedNote = (
        await admin.query(
          `select tenant_id, branch_id, repair_id, client_request_id, body, source
           from repair_timeline_entries
           where client_request_id = $1`,
          [noteRequestA],
        )
      ).rows;
      assert.deepEqual(persistedNote, [
        {
          tenant_id: tenantA,
          branch_id: branchA,
          repair_id: repairA,
          client_request_id: noteRequestA,
          body: 'Nota autorizada por contexto material.',
          source: 'repairs.operational_note',
        },
      ]);

      assert.equal(note.actorId, userA);
      assert.equal(note.actorDisplayName, 'Operadora A');
      const persistedAudit = (
        await admin.query(
          `select audit_id, tenant_id, branch_id, station_id, session_id,
                  actor_user_id, actor_display_name, capability, action,
                  resource_type, resource_id, result, correlation_id,
                  client_request_id
           from repair_business_audit_events
           where tenant_id = $1 and branch_id = $2 and resource_id = $3
             and client_request_id = $4`,
          [tenantA, branchA, repairA, noteRequestA],
        )
      ).rows;
      assert.equal(persistedAudit.length, 1);
      assert.deepEqual(
        {
          tenant_id: persistedAudit[0].tenant_id,
          branch_id: persistedAudit[0].branch_id,
          station_id: persistedAudit[0].station_id,
          session_id: persistedAudit[0].session_id,
          actor_user_id: persistedAudit[0].actor_user_id,
          actor_display_name: persistedAudit[0].actor_display_name,
          capability: persistedAudit[0].capability,
          action: persistedAudit[0].action,
          resource_type: persistedAudit[0].resource_type,
          resource_id: persistedAudit[0].resource_id,
          result: persistedAudit[0].result,
          client_request_id: persistedAudit[0].client_request_id,
        },
        {
          tenant_id: tenantA,
          branch_id: branchA,
          station_id: stationA,
          session_id: sessionA,
          actor_user_id: userA,
          actor_display_name: 'Operadora A',
          capability: 'repairs.add_note',
          action: 'repair.operational_note.added',
          resource_type: 'repair',
          resource_id: repairA,
          result: 'succeeded',
          client_request_id: noteRequestA,
        },
      );
      assert.match(
        persistedAudit[0].audit_id,
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u,
      );
      assert.match(
        persistedAudit[0].correlation_id,
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u,
      );
      assert.ok(![
        noteRequestA,
        sessionA,
        repairA,
        persistedAudit[0].audit_id,
      ].includes(persistedAudit[0].correlation_id));

      const auditColumns = (
        await admin.query(
          `select column_name
           from information_schema.columns
           where table_schema = 'public'
             and table_name = 'repair_business_audit_events'
           order by ordinal_position`,
        )
      ).rows.map(({ column_name: columnName }) => columnName);
      for (const prohibitedColumn of [
        'authorization',
        'body',
        'content',
        'cookie',
        'headers',
        'payload',
        'pin',
        'secret',
        'sql',
        'token',
      ]) {
        assert.ok(!auditColumns.includes(prohibitedColumn));
      }
      const serializedAudit = JSON.stringify(persistedAudit[0]);
      for (const sensitiveValue of [
        'Nota autorizada por contexto material.',
        stationSecretA,
        tokenMaterial.bearer,
        tokenMaterial.csrf,
      ]) {
        assert.ok(!serializedAudit.includes(sensitiveValue));
      }

      const noteRetry = await repairs.addRepairOperationalNote(
        evidence,
        noteInput(repairA, noteRequestA, 'Nota autorizada por contexto material.'),
      );
      assert.equal(noteRetry.id, note.id);
      const retryCounts = (
        await admin.query(
          `select
             (select count(*)::integer from repair_timeline_entries
              where tenant_id = $1 and branch_id = $2 and repair_id = $3
                and client_request_id = $4) as notes,
             (select count(*)::integer from repair_business_audit_events
              where tenant_id = $1 and branch_id = $2 and resource_id = $3
                and client_request_id = $4) as audits`,
          [tenantA, branchA, repairA, noteRequestA],
        )
      ).rows[0];
      assert.deepEqual(retryCounts, { notes: 1, audits: 1 });

      const concurrentNotes = await Promise.all([
        repairs.addRepairOperationalNote(
          evidence,
          noteInput(repairA, concurrentNoteRequest, 'Nota concurrente auditada.'),
        ),
        concurrentRepairs.addRepairOperationalNote(
          evidence,
          noteInput(repairA, concurrentNoteRequest, 'Nota concurrente auditada.'),
        ),
      ]);
      assert.equal(concurrentNotes[0].id, concurrentNotes[1].id);
      const concurrentCounts = (
        await admin.query(
          `select
             (select count(*)::integer from repair_timeline_entries
              where tenant_id = $1 and branch_id = $2 and repair_id = $3
                and client_request_id = $4) as notes,
             (select count(*)::integer from repair_business_audit_events
              where tenant_id = $1 and branch_id = $2 and resource_id = $3
                and client_request_id = $4) as audits`,
          [tenantA, branchA, repairA, concurrentNoteRequest],
        )
      ).rows[0];
      assert.deepEqual(concurrentCounts, { notes: 1, audits: 1 });

      await admin.query(
        `create function test_reject_pbi028_audit_insert()
         returns trigger
         language plpgsql
         as $function$
         begin
           if new.client_request_id = '${auditFailureRequest}'::uuid then
             raise check_violation using message = 'forced PBI-028 audit failure';
           end if;
           return new;
         end;
         $function$`,
      );
      await admin.query(
        `create trigger test_reject_pbi028_audit_insert
         before insert on repair_business_audit_events
         for each row execute function test_reject_pbi028_audit_insert()`,
      );
      await assert.rejects(
        repairs.addRepairOperationalNote(
          evidence,
          noteInput(repairA, auditFailureRequest, 'Esta nota debe revertirse.'),
        ),
        (error) => error?.code === 'DATABASE_TRANSACTION_CALLBACK_FAILED',
      );
      await admin.query(
        'drop trigger test_reject_pbi028_audit_insert on repair_business_audit_events',
      );
      await admin.query('drop function test_reject_pbi028_audit_insert()');
      const rollbackCounts = (
        await admin.query(
          `select
             (select count(*)::integer from repair_timeline_entries
              where client_request_id = $1) as notes,
             (select count(*)::integer from repair_business_audit_events
              where client_request_id = $1) as audits`,
          [auditFailureRequest],
        )
      ).rows[0];
      assert.deepEqual(rollbackCounts, { notes: 0, audits: 0 });

      await assert.rejects(
        admin.query(
          `insert into repair_business_audit_events (
             audit_id, tenant_id, branch_id, station_id, session_id,
             actor_user_id, actor_display_name, capability, action,
             resource_type, resource_id, result, correlation_id,
             client_request_id, occurred_at, created_at
           ) values (
             'e0000000-0000-4000-8000-000000000026', $1, $2, $3, $4,
             $5, 'Operadora A', 'repairs.add_note',
             'repair.operational_note.added', 'repair', $6, 'succeeded',
             'e1000000-0000-4000-8000-000000000026',
             'e2000000-0000-4000-8000-000000000026', now(), now()
           )`,
          [tenantA, branchA2, stationA, sessionA, userA, repairA],
        ),
        (error) => error?.code === '23503',
      );
      await assert.rejects(
        admin.query(
          `insert into repair_business_audit_events (
             audit_id, tenant_id, branch_id, station_id, session_id,
             actor_user_id, actor_display_name, capability, action,
             resource_type, resource_id, result, correlation_id,
             client_request_id, occurred_at, created_at
           ) values (
             'e3000000-0000-4000-8000-000000000026', $1, $2, $3, $4,
             $5, 'Operador B', 'repairs.add_note',
             'repair.operational_note.added', 'repair', $6, 'succeeded',
             'e4000000-0000-4000-8000-000000000026',
             'e5000000-0000-4000-8000-000000000026', now(), now()
           )`,
          [tenantB, branchB, stationB, sessionA, userB, repairA],
        ),
        (error) => error?.code === '23503',
      );
      await assert.rejects(
        admin.query(
          `insert into repair_business_audit_events (
             audit_id, tenant_id, branch_id, station_id, session_id,
             actor_user_id, actor_display_name, capability, action,
             resource_type, resource_id, result, correlation_id,
             client_request_id, occurred_at, created_at
           ) values (
             'e6000000-0000-4000-8000-000000000026', $1, $2, $3, $4,
             $5, 'Operadora A', 'repairs.add_note',
             'repair.operational_note.added', 'repair', $6, 'succeeded',
             $7, 'e7000000-0000-4000-8000-000000000026', now(), now()
           )`,
          [
            tenantA,
            branchA,
            stationA,
            sessionA,
            userA,
            repairA,
            persistedAudit[0].correlation_id,
          ],
        ),
        (error) => error?.code === '23505',
      );
      await assert.rejects(
        admin.query(
          `update repair_business_audit_events
           set actor_display_name = 'Sobrescrita'
           where tenant_id = $1 and branch_id = $2 and resource_id = $3
             and client_request_id = $4`,
          [tenantA, branchA, repairA, noteRequestA],
        ),
        (error) => error?.code === '23514',
      );
      await assert.rejects(
        admin.query(
          `delete from repair_business_audit_events
           where tenant_id = $1 and branch_id = $2 and resource_id = $3
             and client_request_id = $4`,
          [tenantA, branchA, repairA, noteRequestA],
        ),
        (error) => error?.code === '23514',
      );

      let afterAuthorizedNote = await effectCounts(admin);
      await assert.rejects(
        repairs.addRepairOperationalNote(
          evidence,
          noteInput(repairA2, foreignBranchRequest, 'No debe cruzar sucursal.'),
        ),
        RepairOperationalNoteRepairNotFoundError,
      );
      await assert.rejects(
        repairs.addRepairOperationalNote(
          evidence,
          noteInput(repairB, foreignTenantRequest, 'No debe cruzar tenant.'),
        ),
        RepairOperationalNoteRepairNotFoundError,
      );
      assert.deepEqual(await effectCounts(admin), afterAuthorizedNote);

      assert.throws(
        () => repairs.rejectUncataloguedWrite(),
        RepairOperationAccessDeniedError,
      );
      assert.deepEqual(await effectCounts(admin), afterAuthorizedNote);

      await assertAuthorizationCode(
        repairs.addRepairOperationalNote(
          { ...evidence, origin: 'https://untrusted.example', fetchSite: 'cross-site' },
          noteInput(repairA, deniedNoteRequest, 'Origen no autorizado.'),
        ),
        'ACCESS_DENIED',
      );
      assert.deepEqual(await effectCounts(admin), afterAuthorizedNote);

      let releaseCommitGuard;
      let authorizationResolved;
      const commitGuardRelease = new Promise((resolve) => { releaseCommitGuard = resolve; });
      const authorizationBarrier = new Promise((resolve) => { authorizationResolved = resolve; });
      const delayedRepairs = new RepairProtectedOperations(
        authorization,
        {
          async addOperationalNote(scope, command) {
            authorizationResolved();
            await commitGuardRelease;
            return repairRepository.addOperationalNote(scope, command);
          },
        },
        Object.freeze({ read: async () => null }),
        Object.freeze({ readTimeZone: async () => ({ timeZone: 'America/Hermosillo' }) }),
      );
      const pendingEffect = delayedRepairs.addRepairOperationalNote(
        evidence,
        noteInput(repairA, toctouRequest, 'No debe confirmarse tras revocación.'),
      );
      await authorizationBarrier;
      await admin.query(
        `delete from access_role_capabilities
         where tenant_id = $1 and role_id = $2 and capability_code = 'repairs.add_note'`,
        [tenantA, roleA],
      );
      releaseCommitGuard();
      await assert.rejects(
        pendingEffect,
        AddRepairOperationalNoteAuthorizationError,
      );
      assert.deepEqual(await effectCounts(admin), afterAuthorizedNote);
      await admin.query(
        `insert into access_role_capabilities (
           tenant_id, role_id, capability_code, created_at
         ) values ($1, $2, 'repairs.add_note', now())`,
        [tenantA, roleA],
      );

      await admin.query(
        `delete from access_role_capabilities
         where tenant_id = $1 and role_id = $2 and capability_code = 'repairs.add_note'`,
        [tenantA, roleA],
      );
      await assertAuthorizationCode(
        repairs.addRepairOperationalNote(
          evidence,
          noteInput(
            repairA,
            noteRequestA,
            'Nota autorizada por contexto material.',
          ),
        ),
        'ACCESS_DENIED',
      );
      await assertAuthorizationCode(
        repairs.addRepairOperationalNote(
          evidence,
          noteInput(repairA, deniedNoteRequest, 'Capability revocada.'),
        ),
        'ACCESS_DENIED',
      );
      assert.deepEqual(await effectCounts(admin), afterAuthorizedNote);
      assert.equal(
        (
          await admin.query(
            `select status from access_operational_sessions
             where tenant_id = $1 and session_id = $2`,
            [tenantA, sessionA],
          )
        ).rows[0].status,
        'active',
      );

      await admin.query(
        `insert into access_role_capabilities (
           tenant_id, role_id, capability_code, created_at
         ) values ($1, $2, 'repairs.add_note', now())`,
        [tenantA, roleA],
      );

      const contextBeforeExpiry = await authorization.execute(
        evidence,
        { capability: 'repairs.add_note', kind: 'state-change' },
        async (context) => context,
      );
      const originalSessionTimes = (
        await admin.query(
          `select issued_at, last_activity_at, expires_at
           from access_operational_sessions
           where tenant_id = $1 and session_id = $2`,
          [tenantA, sessionA],
        )
      ).rows[0];
      const pendingExpiredCommit = repairRepository.addOperationalNote({
        ...contextBeforeExpiry,
        commitGuard: Object.freeze({
          async confirmCurrent(transactionContext) {
            await useTransactionalDatabasePersistenceExecutor(
              transactionContext,
              'access',
              async (database) => await database
                .updateTable('access_operational_sessions')
                .set({
                  issued_at: new Date(Date.now() - 2 * 60 * 60 * 1_000),
                  last_activity_at: new Date(Date.now() - 61 * 60 * 1_000),
                  expires_at: new Date(Date.now() + 10 * 60 * 60 * 1_000),
                })
                .where('tenant_id', '=', tenantA)
                .where('session_id', '=', sessionA)
                .executeTakeFirst(),
            );
            return contextBeforeExpiry.commitGuard.confirmCurrent(transactionContext);
          },
          async confirmTemporalCurrent(transactionContext) {
            return contextBeforeExpiry.commitGuard.confirmTemporalCurrent(transactionContext);
          },
        }),
      }, {
        repairId: repairA,
        entryId: 'e7000000-0000-4000-8000-000000000026',
        auditEventId: 'e7100000-0000-4000-8000-000000000026',
        correlationId: 'e7200000-0000-4000-8000-000000000026',
        clientRequestId: expiredCommitRequest,
        body: 'La sesión vencida no debe confirmar esta nota.',
        action: 'repair.operational_note.added',
        resourceType: 'repair',
        result: 'succeeded',
        occurredAt: new Date(),
      });
      await assert.rejects(
        pendingExpiredCommit,
        RepairOperationalNoteAuthorizationChangedError,
      );
      assert.deepEqual(await effectCounts(admin), afterAuthorizedNote);
      await admin.query(
        `update access_operational_sessions
         set issued_at = $3, last_activity_at = $4, expires_at = $5
         where tenant_id = $1 and session_id = $2`,
        [
          tenantA,
          sessionA,
          originalSessionTimes.issued_at,
          originalSessionTimes.last_activity_at,
          originalSessionTimes.expires_at,
        ],
      );

      const repairLocker = await admin.connect();
      try {
        await repairLocker.query('begin');
        await repairLocker.query(
          `select repair_id from repairs
           where tenant_id = $1 and branch_id = $2 and repair_id = $3
           for update`,
          [tenantA, branchA, repairA],
        );
        await admin.query(
          `update access_operational_sessions
           set issued_at = now() - interval '2 hours',
               last_activity_at = now() - interval '59 minutes 58 seconds',
               expires_at = now() + interval '10 hours'
           where tenant_id = $1 and session_id = $2`,
          [tenantA, sessionA],
        );
        const pendingAcrossDeadline = repairRepository.addOperationalNote(
          contextBeforeExpiry,
          {
            repairId: repairA,
            entryId: 'e8000000-0000-4000-8000-000000000026',
            auditEventId: 'e8100000-0000-4000-8000-000000000026',
            correlationId: 'e8200000-0000-4000-8000-000000000026',
            clientRequestId: lockExpiredCommitRequest,
            body: 'La sesión no debe confirmar después de esperar el lock.',
            action: 'repair.operational_note.added',
            resourceType: 'repair',
            result: 'succeeded',
            occurredAt: new Date(),
          },
        );
        const observedAcrossDeadline = pendingAcrossDeadline.then(
          (value) => ({ value }),
          (error) => ({ error }),
        );
        await waitForRepairLockWait(admin);
        await admin.query('select pg_sleep(2.25)');
        await repairLocker.query('commit');
        const result = await observedAcrossDeadline;
        assert.ok(
          result.error instanceof RepairOperationalNoteAuthorizationChangedError,
        );
        assert.deepEqual(await effectCounts(admin), afterAuthorizedNote);
      } finally {
        await repairLocker.query('rollback');
        repairLocker.release();
      }
      await admin.query(
        `update access_operational_sessions
         set issued_at = $3, last_activity_at = $4, expires_at = $5
         where tenant_id = $1 and session_id = $2`,
        [
          tenantA,
          sessionA,
          originalSessionTimes.issued_at,
          originalSessionTimes.last_activity_at,
          originalSessionTimes.expires_at,
        ],
      );
      await admin.query(
        `delete from access_role_capabilities
         where tenant_id = $1 and role_id = $2 and capability_code = 'repairs.read'`,
        [tenantA, roleA],
      );
      await assertAuthorizationCode(
        repairs.listRepairs(evidence, { period: 'all', page: '1', pageSize: '25' }),
        'ACCESS_DENIED',
      );
      await admin.query(
        `insert into access_role_capabilities (
           tenant_id, role_id, capability_code, created_at
         ) values ($1, $2, 'repairs.read', now())`,
        [tenantA, roleA],
      );

      const wrongStationCookieHeader = [
        stationCookieB,
        `sr_session=${tokenMaterial.bearer}`,
        `sr_session_csrf=${tokenMaterial.csrf}`,
      ].join('; ');
      await assertAuthorizationCode(
        repairs.listRepairs(
          requestEvidence(wrongStationCookieHeader, tokenMaterial.csrf),
          { period: 'all', page: '1', pageSize: '25' },
        ),
        'AUTHENTICATION_REQUIRED',
      );
      await assertAuthorizationCode(
        repairs.listRepairs(
          requestEvidence(
            `sr_session=${tokenMaterial.bearer}; sr_session_csrf=${tokenMaterial.csrf}`,
            tokenMaterial.csrf,
          ),
          { period: 'all', page: '1', pageSize: '25' },
        ),
        'AUTHENTICATION_REQUIRED',
      );
      assert.deepEqual(await effectCounts(admin), afterAuthorizedNote);

      const authorityLocker = await admin.connect();
      try {
        await authorityLocker.query('begin');
        await authorityLocker.query(
          `select repair_id from repairs
           where tenant_id = $1 and branch_id = $2 and repair_id = $3
           for update`,
          [tenantA, branchA, repairA],
        );
        const linearizedNote = repairRepository.addOperationalNote(
          {
            ...contextBeforeExpiry,
            actorUserId: contextBeforeExpiry.userId,
            actorDisplayName: contextBeforeExpiry.userDisplayName,
          },
          {
            repairId: repairA,
            entryId: 'e9000000-0000-4000-8000-000000000026',
            auditEventId: 'e9100000-0000-4000-8000-000000000026',
            correlationId: 'e9200000-0000-4000-8000-000000000026',
            clientRequestId: authorityLinearizationRequest,
            body: 'La revocación concurrente respeta el orden de locks.',
            action: 'repair.operational_note.added',
            resourceType: 'repair',
            result: 'succeeded',
            occurredAt: new Date(),
          },
        );
        await waitForRepairLockWait(admin);
        const revocation = admin.query(
          `delete from access_role_capabilities
           where tenant_id = $1 and role_id = $2
             and capability_code = 'repairs.add_note'`,
          [tenantA, roleA],
        );
        const observedRevocation = revocation.then(
          (value) => ({ value }),
          (error) => ({ error }),
        );
        await waitForCapabilityRevocationLockWait(admin);
        await authorityLocker.query('commit');
        assert.equal((await linearizedNote)?.actorId, userA);
        const revocationResult = await observedRevocation;
        assert.equal(revocationResult.error, undefined);
        assert.equal(revocationResult.value?.rowCount, 1);
      } finally {
        await authorityLocker.query('rollback');
        authorityLocker.release();
      }
      await assert.rejects(
        repairRepository.addOperationalNote(contextBeforeExpiry, {
          repairId: repairA,
          entryId: 'ea000000-0000-4000-8000-000000000026',
          auditEventId: 'ea100000-0000-4000-8000-000000000026',
          correlationId: 'ea200000-0000-4000-8000-000000000026',
          clientRequestId: 'da000000-0000-4000-8000-000000000026',
          body: 'La siguiente transacción debe observar la revocación.',
          action: 'repair.operational_note.added',
          resourceType: 'repair',
          result: 'succeeded',
          occurredAt: new Date(),
        }),
        RepairOperationalNoteAuthorizationChangedError,
      );
      await admin.query(
        `insert into access_role_capabilities (
           tenant_id, role_id, capability_code, created_at
         ) values ($1, $2, 'repairs.add_note', now())`,
        [tenantA, roleA],
      );
      afterAuthorizedNote = await effectCounts(admin);

      let releaseAuthorityCheck;
      let markAuthorityCheckReached;
      const authorityCheckReached = new Promise((resolve) => {
        markAuthorityCheckReached = resolve;
      });
      const authorityCheckReleased = new Promise((resolve) => {
        releaseAuthorityCheck = resolve;
      });
      const snapshotRaceNote = repairRepository.addOperationalNote({
        ...contextBeforeExpiry,
        actorUserId: contextBeforeExpiry.userId,
        actorDisplayName: contextBeforeExpiry.userDisplayName,
        commitGuard: Object.freeze({
          async confirmCurrent(transactionContext) {
            markAuthorityCheckReached();
            await authorityCheckReleased;
            return contextBeforeExpiry.commitGuard.confirmCurrent(transactionContext);
          },
          async confirmTemporalCurrent(transactionContext) {
            return contextBeforeExpiry.commitGuard.confirmTemporalCurrent(transactionContext);
          },
        }),
      }, {
        repairId: repairA,
        entryId: 'eb000000-0000-4000-8000-000000000026',
        auditEventId: 'eb100000-0000-4000-8000-000000000026',
        correlationId: 'eb200000-0000-4000-8000-000000000026',
        clientRequestId: snapshotRevocationRequest,
        body: 'La revocación posterior al snapshot debe forzar denegación.',
        action: 'repair.operational_note.added',
        resourceType: 'repair',
        result: 'succeeded',
        occurredAt: new Date(),
      });
      await authorityCheckReached;
      try {
        const revocation = await admin.query(
          `delete from access_role_capabilities
           where tenant_id = $1 and role_id = $2
             and capability_code = 'repairs.add_note'`,
          [tenantA, roleA],
        );
        assert.equal(revocation.rowCount, 1);
      } finally {
        releaseAuthorityCheck();
      }
      await assert.rejects(
        snapshotRaceNote,
        RepairOperationalNoteAuthorizationChangedError,
      );
      assert.deepEqual(await effectCounts(admin), afterAuthorizedNote);
      await admin.query(
        `insert into access_role_capabilities (
           tenant_id, role_id, capability_code, created_at
         ) values ($1, $2, 'repairs.add_note', now())`,
        [tenantA, roleA],
      );

      await admin.query(
        `update access_role_assignments
         set status = 'revoked', version = version + 1, revoked_at = now()
         where tenant_id = $1 and assignment_id = $2`,
        [tenantA, assignmentA],
      );
      assert.equal(
        (
          await admin.query(
            `select status from access_operational_sessions
             where tenant_id = $1 and session_id = $2`,
            [tenantA, sessionA],
          )
        ).rows[0].status,
        'invalidated',
      );
      await assertAuthorizationCode(
        repairs.addRepairOperationalNote(
          evidence,
          noteInput(repairA, deniedNoteRequest, 'Assignment revocado.'),
        ),
        'AUTHENTICATION_REQUIRED',
      );
      assert.deepEqual(await effectCounts(admin), afterAuthorizedNote);

      await admin.query(
        `update users set display_name = 'Operadora A renombrada', updated_at = now()
         where tenant_id = $1 and user_id = $2`,
        [tenantA, userA],
      );
      const historicalActor = (
        await admin.query(
          `select actor_user_id, actor_display_name
           from repair_business_audit_events
           where tenant_id = $1 and branch_id = $2 and resource_id = $3
             and client_request_id = $4`,
          [tenantA, branchA, repairA, noteRequestA],
        )
      ).rows[0];
      assert.deepEqual(historicalActor, {
        actor_user_id: userA,
        actor_display_name: 'Operadora A',
      });
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
