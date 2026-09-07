import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { Pool } from 'pg';

const enabled = process.env.SR_OWNER_SCOPED_PG_TEST === '1';

const { createDatabaseConnection } = enabled
  ? await import('../dist/infrastructure/database/database-connection.js')
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
const { RepairOperationalNoteRepairNotFoundError } = enabled
  ? await import('../dist/modules/repairs/application/use-cases/add-repair-operational-note.use-case.js')
  : {};
const { createKyselyRepairRepository } = enabled
  ? await import('../dist/modules/repairs/infrastructure/persistence/kysely-repair.repository.js')
  : {};

const migrationRoot = fileURLToPath(
  new URL('../dist/infrastructure/database/migrations/', import.meta.url),
);

const tables = [
  'access_operational_sessions',
  'access_operational_session_station_guards',
  'access_pin_attempt_limits',
  'access_pin_attempt_station_guards',
  'access_pin_credential_commands',
  'access_pin_credentials',
  'access_role_assignment_commands',
  'access_role_assignments',
  'access_role_capabilities',
  'access_roles',
  'access_capabilities',
  'user_lifecycle_commands',
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
const stationSecretA = 'A'.repeat(43);
const stationSecretB = 'B'.repeat(43);
const authorizationNow = new Date('2026-09-07T20:00:01.000Z');

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
       (select count(*)::integer from repair_technician_assignments) as assignments,
       (select count(*)::integer from repair_workflow_transitions) as workflow,
       (select count(*)::integer from repair_location_movements) as locations`,
  );
  return result.rows[0];
}

test(
  'PostgreSQL 18.4 materially enforces contextual authorization and scoped Repair effects',
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
      await sessionRepository.createReplacingActive(stationContextA, {
        sessionId: sessionA,
        userId: userA,
        userVersion: 0,
        userAdmissionRevision: 0,
        credentialVersion: 1,
        bearerVerifier: tokenMaterial.bearerVerifier,
        csrfVerifier: tokenMaterial.csrfVerifier,
        expectedSessionId: null,
        occurredAt: '2026-09-07T20:00:00.000Z',
        expiresAt: '2026-09-08T08:00:00.000Z',
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
      const repairs = new RepairProtectedOperations(
        authorization,
        createKyselyRepairRepository(connection, () => new Date(authorizationNow)),
        Object.freeze({ read: async () => null }),
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
          source: 'local.operational_note',
        },
      ]);

      const afterAuthorizedNote = await effectCounts(admin);
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
    } finally {
      await runner.destroy().catch(() => undefined);
      await connection.close().catch(() => undefined);
      await resetDatabase(admin).catch(() => undefined);
      await assertNoObjects(admin);
      await admin.end();
    }
  },
);
