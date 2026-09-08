import assert from 'node:assert/strict';
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
const { createKyselyUserRepository } = enabled
  ? await import('../dist/modules/users/infrastructure/persistence/kysely-user.repository.js')
  : {};
const { UserPersistenceError } = enabled
  ? await import('../dist/modules/users/application/ports/user-repository.port.js')
  : {};

const migrationRoot = fileURLToPath(
  new URL('../dist/infrastructure/database/migrations/', import.meta.url),
);
const tables = [
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

const tenantA = '10000000-0000-4000-8000-000000000032';
const tenantB = '20000000-0000-4000-8000-000000000032';
const tenantC = '30000000-0000-4000-8000-000000000032';
const tenantD = '31000000-0000-4000-8000-000000000032';
const tenantE = '32000000-0000-4000-8000-000000000032';
const sharedUserId = '40000000-0000-4000-8000-000000000032';
const userB1 = '41000000-0000-4000-8000-000000000032';
const userB2 = '42000000-0000-4000-8000-000000000032';
const userC1 = '50000000-0000-4000-8000-000000000032';
const userC2 = '60000000-0000-4000-8000-000000000032';
const requestA = '70000000-0000-4000-8000-000000000032';
const requestAConflict = '71000000-0000-4000-8000-000000000032';
const requestC1 = '90000000-0000-4000-8000-000000000032';
const requestC2 = '91000000-0000-4000-8000-000000000032';
const deactivateRequestA = 'a0000000-0000-4000-8000-000000000032';
const reactivateRequestA = 'c0000000-0000-4000-8000-000000000032';
const revokeRequestA = 'd0000000-0000-4000-8000-000000000032';
const afterRevokeRequestA = 'e0000000-0000-4000-8000-000000000032';
const staleRequestA = 'f0000000-0000-4000-8000-000000000032';
const crossTenantRequest = 'aa000000-0000-4000-8000-000000000032';
const competingInactiveRequest = 'ab000000-0000-4000-8000-000000000032';
const competingRevokedRequest = 'ac000000-0000-4000-8000-000000000032';
const rollbackRequest = 'ad000000-0000-4000-8000-000000000032';
const existingUserRequest = 'ae000000-0000-4000-8000-000000000032';
const userD = 'af000000-0000-4000-8000-000000000032';
const requestE = 'b0000000-0000-4000-8000-000000000032';
const revokeRequestB = 'b1000000-0000-4000-8000-000000000032';
const afterRevokeRequestB = 'b2000000-0000-4000-8000-000000000032';
const contradictoryJournalRequest = 'b3000000-0000-4000-8000-000000000032';

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
      applicationName: 'srtaller-users-postgresql-review',
      labels: Object.freeze({
        component: 'users',
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

function authorization(item) {
  return Object.freeze({
    migrationName: item.name,
    expectedHash: item.hash,
    reason: 'verify user directory migration reversal',
    environment: 'development',
    confirmation: 'REVERT_ONE_MIGRATION',
  });
}

function bootstrapInput(overrides = {}) {
  return Object.freeze({
    userId: sharedUserId,
    displayName: 'Primera persona A',
    operationalIdentifier: 'persona-a',
    clientRequestId: requestA,
    occurredAt: '2026-09-06T17:30:00.000Z',
    ...overrides,
  });
}

function transitionInput(overrides = {}) {
  return Object.freeze({
    userId: sharedUserId,
    status: 'inactive',
    expectedVersion: 0,
    clientRequestId: deactivateRequestA,
    occurredAt: '2026-09-06T18:00:00.000Z',
    ...overrides,
  });
}

async function resetDatabase(admin) {
  await admin.query('drop function if exists repairs_reject_business_audit_event_mutation() cascade');
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

async function assertUserTables(admin, expected) {
  const result = await admin.query(
    `select tablename from pg_catalog.pg_tables
     where schemaname = 'public'
       and tablename = any(
         array[
           'users',
           'user_provisioning_bootstraps',
           'user_lifecycle_commands'
         ]::text[]
       )
     order by tablename`,
  );
  assert.deepEqual(
    result.rows.map(({ tablename }) => tablename),
    [...expected].sort(),
  );
}

async function assertAccessTables(admin, expected) {
  const result = await admin.query(
    `select tablename from pg_catalog.pg_tables
     where schemaname = 'public'
       and tablename = any(
         array[
           'access_capabilities',
           'access_roles',
           'access_role_capabilities',
           'access_role_assignments',
           'access_role_assignment_commands'
         ]::text[]
       )
     order by tablename`,
  );
  assert.deepEqual(
    result.rows.map(({ tablename }) => tablename),
    [...expected].sort(),
  );
}

async function rejectsWithCode(promise, code) {
  await assert.rejects(
    promise,
    (error) => error instanceof UserPersistenceError && error.code === code,
  );
}

test(
  'PostgreSQL 18.4 enforces the tenant-scoped user bootstrap and lifecycle contract',
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
    const repository = createKyselyUserRepository(connection);

    try {
      await resetDatabase(admin);
      await assertNoObjects(admin);

      const applied = await runner.migrateToLatest();
      assert.equal(
        applied.status.migrations.length,
        inspection.manifest.migrations.length,
      );
      assert.ok(
        applied.status.migrations.every(({ state }) => state === 'applied'),
      );
      await assertUserTables(admin, [
        'users',
        'user_provisioning_bootstraps',
        'user_lifecycle_commands',
      ]);

      const idempotentApply = await runner.migrateToLatest();
      assert.deepEqual(idempotentApply.results, []);
      assert.ok(
        idempotentApply.status.migrations.every(
          ({ state }) => state === 'applied',
        ),
      );

      await admin.query(
        `insert into tenants (tenant_id, created_at)
         values ($1, now()), ($2, now()), ($3, now()), ($4, now()), ($5, now())`,
        [tenantA, tenantB, tenantC, tenantD, tenantE],
      );

      await admin.query(
        `alter table users add constraint users_synthetic_rollback_ck
         check (tenant_id <> '31000000-0000-4000-8000-000000000032'::uuid)
         not valid`,
      );
      await rejectsWithCode(
        repository.bootstrap(
          { tenantId: tenantD },
          bootstrapInput({
            userId: userD,
            clientRequestId: rollbackRequest,
            displayName: 'Rollback sintético',
            operationalIdentifier: null,
          }),
        ),
        'USER_INPUT_INVALID',
      );
      assert.deepEqual(
        (
          await admin.query(
            `select
               (select count(*)::integer from users where tenant_id = $1) as users,
               (select count(*)::integer from user_provisioning_bootstraps where tenant_id = $1) as gates`,
            [tenantD],
          )
        ).rows,
        [{ users: 0, gates: 0 }],
      );
      await admin.query(
        'alter table users drop constraint users_synthetic_rollback_ck',
      );

      const firstA = await repository.bootstrap(
        { tenantId: tenantA },
        bootstrapInput(),
      );
      const replayA = await repository.bootstrap(
        { tenantId: tenantA },
        bootstrapInput(),
      );
      assert.deepEqual(replayA, firstA);
      await rejectsWithCode(
        repository.bootstrap(
          { tenantId: tenantA },
          bootstrapInput({ displayName: 'Payload distinto' }),
        ),
        'USER_IDEMPOTENCY_CONFLICT',
      );
      await rejectsWithCode(
        repository.bootstrap(
          { tenantId: tenantA },
          bootstrapInput({ clientRequestId: requestAConflict }),
        ),
        'FIRST_USER_ALREADY_PROVISIONED',
      );

      const sameRequestB1 = bootstrapInput({
        userId: userB1,
        displayName: 'Primera persona B',
        operationalIdentifier: 'persona-a',
      });
      const sameRequestB2 = bootstrapInput({
        userId: userB2,
        displayName: 'Primera persona B',
        operationalIdentifier: 'persona-a',
      });
      const concurrentReplayB = await Promise.all([
        repository.bootstrap({ tenantId: tenantB }, sameRequestB1),
        repository.bootstrap({ tenantId: tenantB }, sameRequestB2),
      ]);
      assert.deepEqual(concurrentReplayB[0], concurrentReplayB[1]);

      const firstE = await repository.bootstrap(
        { tenantId: tenantE },
        bootstrapInput({ clientRequestId: requestE }),
      );

      const competingC = await Promise.allSettled([
        repository.bootstrap(
          { tenantId: tenantC },
          bootstrapInput({
            userId: userC1,
            displayName: 'Persona C uno',
            operationalIdentifier: 'persona-c-uno',
            clientRequestId: requestC1,
          }),
        ),
        repository.bootstrap(
          { tenantId: tenantC },
          bootstrapInput({
            userId: userC2,
            displayName: 'Persona C dos',
            operationalIdentifier: 'persona-c-dos',
            clientRequestId: requestC2,
          }),
        ),
      ]);
      assert.equal(
        competingC.filter(({ status }) => status === 'fulfilled').length,
        1,
      );
      const fulfilledC = competingC.find(
        ({ status }) => status === 'fulfilled',
      );
      assert.ok(fulfilledC);
      const rejectedC = competingC.find(
        ({ status }) => status === 'rejected',
      );
      assert.ok(rejectedC);
      assert.ok(rejectedC.reason instanceof UserPersistenceError);
      assert.equal(rejectedC.reason.code, 'FIRST_USER_ALREADY_PROVISIONED');

      const counts = await admin.query(
        `select tenant_id, count(*)::integer as count
         from users
         group by tenant_id
         order by tenant_id`,
      );
      assert.deepEqual(counts.rows, [
        { tenant_id: tenantA, count: 1 },
        { tenant_id: tenantB, count: 1 },
        { tenant_id: tenantC, count: 1 },
        { tenant_id: tenantE, count: 1 },
      ]);
      const gates = await admin.query(
        `select tenant_id, count(*)::integer as count
         from user_provisioning_bootstraps
         group by tenant_id
         order by tenant_id`,
      );
      assert.deepEqual(gates.rows, counts.rows);

      await assert.rejects(
        admin.query(
          `insert into users (
             user_id, tenant_id, display_name, operational_identifier,
             status, version, created_at, updated_at
           ) values ($1, $2, 'Duplicado', 'persona-a', 'active', 0, now(), now())`,
          [userD, tenantA],
        ),
        (error) => error?.code === '23505',
      );

      await admin.query(
        `insert into users (
           user_id, tenant_id, display_name, operational_identifier,
           status, version, created_at, updated_at
         ) values ($1, $2, 'Existente sin bootstrap', null, 'active', 0, now(), now())`,
        [userD, tenantD],
      );
      await rejectsWithCode(
        repository.bootstrap(
          { tenantId: tenantD },
          bootstrapInput({
            userId: 'bf000000-0000-4000-8000-000000000032',
            clientRequestId: existingUserRequest,
            displayName: 'Segundo bootstrap',
            operationalIdentifier: null,
          }),
        ),
        'FIRST_USER_ALREADY_PROVISIONED',
      );
      assert.equal(
        (
          await admin.query(
            'select count(*)::integer as count from user_provisioning_bootstraps where tenant_id = $1',
            [tenantD],
          )
        ).rows[0].count,
        0,
      );

      const listedA = await repository.list({ tenantId: tenantA });
      const listedB = await repository.list({ tenantId: tenantB });
      assert.deepEqual(
        listedA.map(({ tenantId, displayName, status }) => ({
          tenantId,
          displayName,
          status,
        })),
        [
          {
            tenantId: tenantA,
            displayName: 'Primera persona A',
            status: 'active',
          },
        ],
      );
      assert.deepEqual(
        listedB.map(({ tenantId, displayName, status }) => ({
          tenantId,
          displayName,
          status,
        })),
        [
          {
            tenantId: tenantB,
            displayName: 'Primera persona B',
            status: 'active',
          },
        ],
      );
      assert.deepEqual(
        await repository.findById({ tenantId: tenantA }, sharedUserId),
        firstA,
      );
      assert.deepEqual(
        await repository.findById(
          { tenantId: tenantB },
          concurrentReplayB[0].userId,
        ),
        concurrentReplayB[0],
      );
      assert.deepEqual(
        await repository.findById({ tenantId: tenantE }, sharedUserId),
        firstE,
      );
      const provisionedC = fulfilledC.value;
      assert.deepEqual(
        await repository.findById(
          { tenantId: tenantC },
          provisionedC.userId,
        ),
        provisionedC,
      );
      assert.equal(
        await repository.findById(
          { tenantId: tenantA },
          provisionedC.userId,
        ),
        null,
      );

      await rejectsWithCode(
        repository.list({ tenantId: 'tenant-a' }),
        'USER_TENANT_SCOPE_REQUIRED',
      );
      await rejectsWithCode(
        repository.findById({ tenantId: tenantA }, 'user-a'),
        'USER_INPUT_INVALID',
      );
      await rejectsWithCode(
        repository.bootstrap(
          { tenantId: tenantA },
          bootstrapInput({ clientRequestId: 'request-a' }),
        ),
        'USER_INPUT_INVALID',
      );

      await rejectsWithCode(
        repository.transition(
          { tenantId: tenantC },
          transitionInput({ clientRequestId: crossTenantRequest }),
        ),
        'USER_NOT_FOUND',
      );

      const deactivateA = transitionInput({
        occurredAt: '2026-09-06T18:01:00.000Z',
      });
      const concurrentInactiveA = await Promise.all([
        repository.transition({ tenantId: tenantA }, deactivateA),
        repository.transition({ tenantId: tenantA }, deactivateA),
      ]);
      assert.deepEqual(concurrentInactiveA[0], concurrentInactiveA[1]);
      const inactiveA = concurrentInactiveA[0];
      assert.equal(inactiveA.status, 'inactive');
      assert.equal(inactiveA.version, 1);
      assert.equal(
        inactiveA.updatedAt,
        '2026-09-06T18:01:00.000Z',
      );

      const replayAfterTransitionA = await repository.transition(
        { tenantId: tenantA },
        deactivateA,
      );
      assert.deepEqual(replayAfterTransitionA, inactiveA);

      await rejectsWithCode(
        repository.transition(
          { tenantId: tenantA },
          transitionInput({
            status: 'active',
            clientRequestId: deactivateRequestA,
            occurredAt: '2026-09-06T18:01:30.000Z',
          }),
        ),
        'USER_IDEMPOTENCY_CONFLICT',
      );

      await rejectsWithCode(
        repository.transition(
          { tenantId: tenantA },
          transitionInput({
            status: 'active',
            expectedVersion: 0,
            clientRequestId: staleRequestA,
            occurredAt: '2026-09-06T18:02:00.000Z',
          }),
        ),
        'USER_STALE_WRITE',
      );

      const activeA = await repository.transition(
        { tenantId: tenantA },
        transitionInput({
          status: 'active',
          expectedVersion: 1,
          clientRequestId: reactivateRequestA,
          occurredAt: '2026-09-06T18:03:00.000Z',
        }),
      );
      assert.equal(activeA.status, 'active');
      assert.equal(activeA.version, 2);
      const revokedA = await repository.transition(
        { tenantId: tenantA },
        transitionInput({
          status: 'revoked',
          expectedVersion: 2,
          clientRequestId: revokeRequestA,
          occurredAt: '2026-09-06T18:04:00.000Z',
        }),
      );
      assert.equal(revokedA.status, 'revoked');
      assert.equal(revokedA.version, 3);
      await rejectsWithCode(
        repository.transition(
          { tenantId: tenantA },
          transitionInput({
            status: 'active',
            expectedVersion: 3,
            clientRequestId: afterRevokeRequestA,
            occurredAt: '2026-09-06T18:05:00.000Z',
          }),
        ),
        'USER_LIFECYCLE_CONFLICT',
      );

      const inactiveB = await repository.transition(
        { tenantId: tenantB },
        transitionInput({
          userId: concurrentReplayB[0].userId,
          occurredAt: '2026-09-06T18:06:00.000Z',
        }),
      );
      assert.equal(inactiveB.status, 'inactive');
      assert.equal(inactiveB.version, 1);
      const revokedB = await repository.transition(
        { tenantId: tenantB },
        transitionInput({
          userId: concurrentReplayB[0].userId,
          status: 'revoked',
          expectedVersion: 1,
          clientRequestId: revokeRequestB,
          occurredAt: '2026-09-06T18:06:30.000Z',
        }),
      );
      assert.equal(revokedB.status, 'revoked');
      assert.equal(revokedB.version, 2);
      await rejectsWithCode(
        repository.transition(
          { tenantId: tenantB },
          transitionInput({
            userId: concurrentReplayB[0].userId,
            status: 'active',
            expectedVersion: 2,
            clientRequestId: afterRevokeRequestB,
            occurredAt: '2026-09-06T18:06:45.000Z',
          }),
        ),
        'USER_LIFECYCLE_CONFLICT',
      );
      assert.equal(
        (await repository.list({ tenantId: tenantA }))[0]?.status,
        'revoked',
      );
      assert.equal(
        (await repository.list({ tenantId: tenantB }))[0]?.status,
        'revoked',
      );

      const competingLifecycleC = await Promise.allSettled([
        repository.transition(
          { tenantId: tenantC },
          transitionInput({
            userId: provisionedC.userId,
            status: 'inactive',
            clientRequestId: competingInactiveRequest,
            occurredAt: '2026-09-06T18:07:00.000Z',
          }),
        ),
        repository.transition(
          { tenantId: tenantC },
          transitionInput({
            userId: provisionedC.userId,
            status: 'revoked',
            clientRequestId: competingRevokedRequest,
            occurredAt: '2026-09-06T18:07:01.000Z',
          }),
        ),
      ]);
      assert.equal(
        competingLifecycleC.filter(
          ({ status: state }) => state === 'fulfilled',
        ).length,
        1,
      );

      await assert.rejects(
        admin.query(
          `insert into user_lifecycle_commands (
             tenant_id, client_request_id, user_id, requested_status,
             expected_version, result_display_name,
             result_operational_identifier, result_status, result_version,
             result_created_at, result_updated_at, applied_at
           ) values ($1, $2, $3, 'revoked', 2, 'Snapshot contradictorio',
             null, 'active', 3, now(), now(), now())`,
          [tenantB, contradictoryJournalRequest, concurrentReplayB[0].userId],
        ),
        (error) => error?.code === '23514',
      );
      const lifecycleLoser = competingLifecycleC.find(
        ({ status: state }) => state === 'rejected',
      );
      assert.ok(lifecycleLoser);
      assert.ok(lifecycleLoser.reason instanceof UserPersistenceError);
      assert.equal(lifecycleLoser.reason.code, 'USER_STALE_WRITE');
      assert.equal(
        (
          await admin.query(
            'select count(*)::integer as count from user_lifecycle_commands where tenant_id = $1',
            [tenantC],
          )
        ).rows[0].count,
        1,
      );

      const commands = await admin.query(
        `select tenant_id, client_request_id, requested_status, result_version
         from user_lifecycle_commands
         order by tenant_id, result_version`,
      );
      const tenantCCommands = commands.rows.filter(
        ({ tenant_id: commandTenantId }) => commandTenantId === tenantC,
      );
      assert.equal(tenantCCommands.length, 1);
      assert.equal(tenantCCommands[0].result_version, 1);
      assert.ok(
        [competingInactiveRequest, competingRevokedRequest].includes(
          tenantCCommands[0].client_request_id,
        ),
      );
      assert.deepEqual(
        commands.rows.filter(
          ({ tenant_id: commandTenantId }) => commandTenantId !== tenantC,
        ),
        [
          {
            tenant_id: tenantA,
            client_request_id: deactivateRequestA,
            requested_status: 'inactive',
            result_version: 1,
          },
          {
            tenant_id: tenantA,
            client_request_id: reactivateRequestA,
            requested_status: 'active',
            result_version: 2,
          },
          {
            tenant_id: tenantA,
            client_request_id: revokeRequestA,
            requested_status: 'revoked',
            result_version: 3,
          },
          {
            tenant_id: tenantB,
            client_request_id: deactivateRequestA,
            requested_status: 'inactive',
            result_version: 1,
          },
          {
            tenant_id: tenantB,
            client_request_id: revokeRequestB,
            requested_status: 'revoked',
            result_version: 2,
          },
        ],
      );

      let status = await runner.getMigrationStatus();
      let latest = [...status.migrations]
        .reverse()
        .find(({ state }) => state === 'applied');
      while (
        latest?.name !==
        '20260907220000_repairs_create_business_audit_events'
      ) {
        assert.ok(latest);
        await runner.migrateDown(authorization(latest));
        status = await runner.getMigrationStatus();
        latest = [...status.migrations]
          .reverse()
          .find(({ state }) => state === 'applied');
      }
      assert.equal(
        latest?.name,
        '20260907220000_repairs_create_business_audit_events',
      );
      await runner.migrateDown(authorization(latest));
      status = await runner.getMigrationStatus();
      latest = [...status.migrations]
        .reverse()
        .find(({ state }) => state === 'applied');
      assert.equal(latest?.name, '20260907120000_access_create_operational_sessions');
      await runner.migrateDown(authorization(latest));
      status = await runner.getMigrationStatus();
      latest = [...status.migrations].reverse().find(({ state }) => state === 'applied');
      assert.equal(latest?.name, '20260907111000_users_add_admission_revision');
      await runner.migrateDown(authorization(latest));
      status = await runner.getMigrationStatus();
      latest = [...status.migrations].reverse().find(({ state }) => state === 'applied');
      assert.equal(latest?.name, '20260907110000_stations_add_admission_revisions');
      await runner.migrateDown(authorization(latest));
      status = await runner.getMigrationStatus();
      latest = [...status.migrations].reverse().find(({ state }) => state === 'applied');
      assert.equal(
        latest?.name,
        '20260907010000_access_create_pin_credentials',
      );
      await runner.migrateDown(authorization(latest));

      status = await runner.getMigrationStatus();
      latest = [...status.migrations]
        .reverse()
        .find(({ state }) => state === 'applied');
      assert.equal(
        latest?.name,
        '20260906182000_access_create_role_assignments',
      );
      await runner.migrateDown(authorization(latest));
      await assertAccessTables(admin, [
        'access_capabilities',
        'access_roles',
        'access_role_capabilities',
      ]);

      status = await runner.getMigrationStatus();
      latest = [...status.migrations]
        .reverse()
        .find(({ state }) => state === 'applied');
      assert.equal(latest?.name, '20260906181000_access_create_roles');
      await runner.migrateDown(authorization(latest));
      await assertAccessTables(admin, ['access_capabilities']);

      status = await runner.getMigrationStatus();
      latest = [...status.migrations]
        .reverse()
        .find(({ state }) => state === 'applied');
      assert.equal(
        latest?.name,
        '20260906180000_access_create_capability_catalog',
      );
      await runner.migrateDown(authorization(latest));
      await assertAccessTables(admin, []);

      status = await runner.getMigrationStatus();
      latest = [...status.migrations]
        .reverse()
        .find(({ state }) => state === 'applied');
      assert.equal(
        latest?.name,
        '20260906172000_users_create_lifecycle_commands',
      );
      await runner.migrateDown(authorization(latest));
      await assertUserTables(admin, [
        'users',
        'user_provisioning_bootstraps',
      ]);

      status = await runner.getMigrationStatus();
      latest = [...status.migrations]
        .reverse()
        .find(({ state }) => state === 'applied');
      assert.equal(
        latest?.name,
        '20260906171000_users_create_provisioning_bootstraps',
      );
      await runner.migrateDown(authorization(latest));
      await assertUserTables(admin, ['users']);

      status = await runner.getMigrationStatus();
      latest = [...status.migrations]
        .reverse()
        .find(({ state }) => state === 'applied');
      assert.equal(latest?.name, '20260906170000_users_create_directory');
      await runner.migrateDown(authorization(latest));
      await assertUserTables(admin, []);

      const reapplied = await runner.migrateToLatest();
      assert.ok(
        reapplied.status.migrations.every(({ state }) => state === 'applied'),
      );
      await assertUserTables(admin, [
        'users',
        'user_provisioning_bootstraps',
        'user_lifecycle_commands',
      ]);
      await assertAccessTables(admin, [
        'access_capabilities',
        'access_roles',
        'access_role_capabilities',
        'access_role_assignments',
        'access_role_assignment_commands',
      ]);

      status = await runner.getMigrationStatus();
      while (status.migrations.some(({ state }) => state === 'applied')) {
        latest = [...status.migrations]
          .reverse()
          .find(({ state }) => state === 'applied');
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
