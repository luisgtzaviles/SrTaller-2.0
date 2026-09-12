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
  ? await import(
      '../dist/infrastructure/database/database-migration-provider.js'
    )
  : {};
const { createMigrationRunner } = enabled
  ? await import('../dist/infrastructure/database/migration-runner.js')
  : {};
const { createKyselyPinCredentialRepository } = enabled
  ? await import(
      '../dist/modules/access/infrastructure/persistence/kysely-pin-credential.repository.js'
    )
  : {};
const { NodeArgon2PinHasher } = enabled
  ? await import(
      '../dist/modules/access/infrastructure/security/node-argon2-pin-hasher.js'
    )
  : {};
const {
  AuthenticatePinUseCase,
  PinAuthenticationError,
} = enabled
  ? await import(
      '../dist/modules/access/application/use-cases/authenticate-pin.use-case.js'
    )
  : {};
const { ProvisionPinCredentialUseCase } = enabled
  ? await import(
      '../dist/modules/access/application/use-cases/provision-pin-credential.use-case.js'
    )
  : {};
const { ReplacePinCredentialUseCase } = enabled
  ? await import(
      '../dist/modules/access/application/use-cases/replace-pin-credential.use-case.js'
    )
  : {};
const { AuthenticatePinOnlyUseCase } = enabled
  ? await import(
      '../dist/modules/access/application/use-cases/authenticate-pin-only.use-case.js'
    )
  : {};
const { ListApplicableUsersUseCase } = enabled
  ? await import(
      '../dist/modules/access/application/use-cases/list-applicable-users.use-case.js'
    )
  : {};
const { createKyselyAccessRepository } = enabled
  ? await import(
      '../dist/modules/access/infrastructure/persistence/kysely-access.repository.js'
    )
  : {};
const { PinCredentialPersistenceError } = enabled
  ? await import(
      '../dist/modules/access/application/ports/pin-credential-repository.port.js'
    )
  : {};
const { createKyselyAuthenticationUserReader } = enabled
  ? await import(
      '../dist/modules/users/infrastructure/persistence/kysely-authentication-user.reader.js'
    )
  : {};
const { KyselyStationCredentialVerifier } = enabled
  ? await import(
      '../dist/modules/stations/infrastructure/persistence/kysely-station-credential.verifier.js'
    )
  : {};
const { ResolveTrustedStationContextUseCase } = enabled
  ? await import(
      '../dist/modules/stations/application/use-cases/resolve-trusted-station-context.js'
    )
  : {};

const migrationRoot = fileURLToPath(
  new URL('../dist/infrastructure/database/migrations/', import.meta.url),
);

const pinTables = [
  'access_pin_eligibility_tenant_guards',
  'access_pin_attempt_limits',
  'access_pin_attempt_station_guards',
  'access_pin_credential_commands',
  'access_pin_credentials',
];
const tables = [
  'catalog_audit_events', 'catalog_commands', 'catalog_reference_cost_revisions',
  'catalog_branch_price_revisions', 'catalog_base_price_revisions',
  'catalog_sku_sequences', 'catalog_item_identifiers', 'catalog_items',
  'catalog_brands', 'catalog_categories',
  'repair_operational_note_request_guards',
  'repair_business_audit_events',
  'access_operational_sessions',
  'access_operational_session_station_guards',
  ...pinTables,
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

const tenantA = '10000000-0000-4000-8000-000000000025';
const tenantB = '20000000-0000-4000-8000-000000000025';
const branchA = '30000000-0000-4000-8000-000000000025';
const branchA2 = '31000000-0000-4000-8000-000000000025';
const branchB = '40000000-0000-4000-8000-000000000025';
const stationA = '50000000-0000-4000-8000-000000000025';
const stationA2 = '51000000-0000-4000-8000-000000000025';
const stationB = '60000000-0000-4000-8000-000000000025';
const sharedUser = '70000000-0000-4000-8000-000000000025';
const concurrentUser = '71000000-0000-4000-8000-000000000025';
const lockUser = '72000000-0000-4000-8000-000000000025';
const unknownUser = '73000000-0000-4000-8000-000000000025';
const missingCredentialUser = '74000000-0000-4000-8000-000000000025';
const invalidRatePrincipalA = 'd0000000-0000-4000-8000-000000000001';
const invalidRatePrincipalB = 'd0000000-0000-4000-8000-000000000002';
const credentialA = '80000000-0000-4000-8000-000000000025';
const replayCredentialA = '81000000-0000-4000-8000-000000000025';
const concurrentCredentialA = '82000000-0000-4000-8000-000000000025';
const concurrentCredentialB = '83000000-0000-4000-8000-000000000025';
const lockCredential = '84000000-0000-4000-8000-000000000025';
const credentialB = '85000000-0000-4000-8000-000000000025';
const requestA = '90000000-0000-4000-8000-000000000025';
const concurrentRequest = '91000000-0000-4000-8000-000000000025';
const lockRequest = '92000000-0000-4000-8000-000000000025';
const requestB = '93000000-0000-4000-8000-000000000025';
const replacementRequest = '94000000-0000-4000-8000-000000000025';
const legacyReplacementRequest = '94100000-0000-4000-8000-000000000025';
const roleId = '95000000-0000-4000-8000-000000000025';
const assignmentA = '96000000-0000-4000-8000-000000000025';
const assignmentA2 = '97000000-0000-4000-8000-000000000025';
const stationCredentialIdA = 'a0000000-0000-4000-8000-000000000025';
const stationCredentialIdA2 = 'a1000000-0000-4000-8000-000000000025';
const stationCredentialIdB = 'a2000000-0000-4000-8000-000000000025';
const stationSecretA = 'A'.repeat(43);
const stationSecretA2 = 'B'.repeat(43);
const stationSecretB = 'C'.repeat(43);
const pinA = '0625';
const pinB = '0626';
const concurrentPin = '2233';
const lockPin = '4321';
const wrongPin = '0000';
const pepper = Buffer.alloc(32, 0x25).toString('base64url');
const provisionedAt = new Date('2026-09-07T01:00:00.000Z');

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
      max: 12,
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
      applicationName: 'srtaller-access-pin-postgresql-review',
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

function authorization(item) {
  return Object.freeze({
    migrationName: item.name,
    expectedHash: item.hash,
    reason: 'verify Access PIN credential migration reversal',
    environment: 'development',
    confirmation: 'REVERT_ONE_MIGRATION',
  });
}

async function resetDatabase(admin) {
  await admin.query('drop function if exists catalog_reject_append_only_mutation() cascade');
  await admin.query('drop function if exists access_assert_unambiguous_pin_eligibility() cascade');
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

async function assertPinTables(admin, expected) {
  const result = await admin.query(
    `select tablename from pg_catalog.pg_tables
     where schemaname = 'public' and tablename = any($1::text[])
     order by tablename`,
    [pinTables],
  );
  assert.deepEqual(
    result.rows.map(({ tablename }) => tablename),
    [...expected].sort(),
  );
}

async function seedAuthorities(admin) {
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
    `insert into stations (
       tenant_id, station_id, status, created_at, updated_at, revoked_at
     ) values
       ($1, $2, 'active', now(), now(), null),
       ($1, $3, 'active', now(), now(), null),
       ($4, $5, 'active', now(), now(), null)`,
    [tenantA, stationA, stationA2, tenantB, stationB],
  );
  await admin.query(
    `insert into station_bindings (
       tenant_id, station_id, branch_id, revoked_at, created_at
     ) values
       ($1, $2, $3, null, now()),
       ($1, $4, $5, null, now()),
       ($6, $7, $8, null, now())`,
    [
      tenantA,
      stationA,
      branchA,
      stationA2,
      branchA2,
      tenantB,
      stationB,
      branchB,
    ],
  );
  await admin.query(
    `insert into station_credentials (
       credential_id, credential_hash, tenant_id, station_id,
       revoked_at, created_at
     ) values
       ($1, $2, $3, $4, null, now()),
       ($5, $6, $3, $7, null, now()),
       ($8, $9, $10, $11, null, now())`,
    [
      stationCredentialIdA,
      createHash('sha256').update(stationSecretA).digest('hex'),
      tenantA,
      stationA,
      stationCredentialIdA2,
      createHash('sha256').update(stationSecretA2).digest('hex'),
      stationA2,
      stationCredentialIdB,
      createHash('sha256').update(stationSecretB).digest('hex'),
      tenantB,
      stationB,
    ],
  );
  await admin.query(
    `insert into users (
       tenant_id, user_id, display_name, operational_identifier,
       status, version, created_at, updated_at
     ) values
       ($1, $2, 'Administración A', 'admin-a', 'active', 0, now(), now()),
       ($1, $3, 'Concurrente A', 'concurrente-a', 'active', 0, now(), now()),
       ($1, $4, 'Bloqueo A', 'bloqueo-a', 'active', 0, now(), now()),
       ($1, $5, 'Sin credencial A', 'sin-credencial-a', 'active', 0, now(), now()),
       ($6, $2, 'Administración B', 'admin-b', 'active', 0, now(), now())`,
    [
      tenantA,
      sharedUser,
      concurrentUser,
      lockUser,
      missingCredentialUser,
      tenantB,
    ],
  );
}

function pinUseCases(connection, now) {
  const repository = createKyselyPinCredentialRepository(connection);
  const accessRepository = createKyselyAccessRepository(connection);
  const users = createKyselyAuthenticationUserReader(connection);
  const hasher = new NodeArgon2PinHasher(pepper, {
    maxActive: 2,
    maxQueued: 16,
  });
  return Object.freeze({
    authenticate: new AuthenticatePinUseCase(
      repository,
      users,
      hasher,
      () => now.value,
    ),
    authenticatePinOnly: new AuthenticatePinOnlyUseCase(
      repository,
      users,
      new ListApplicableUsersUseCase(accessRepository),
      hasher,
      () => now.value,
    ),
    accessRepository,
    hasher,
    repository,
  });
}

function provision(useCases, tenantId, input, credentialId) {
  return new ProvisionPinCredentialUseCase(
    useCases.repository,
    useCases.hasher,
    () => credentialId,
    () => provisionedAt,
  ).execute({ tenantId }, input);
}

async function rejectsAuthentication(promise, code) {
  await assert.rejects(
    promise,
    (error) =>
      error instanceof PinAuthenticationError &&
      error.code === code &&
      !JSON.stringify(error).includes(pinA) &&
      !JSON.stringify(error).includes(pinB) &&
      !JSON.stringify(error).includes(lockPin),
  );
}

test(
  'PostgreSQL 18.4 enforces tenant-scoped PIN protection, lockout, and Station rate limits',
  { skip: !enabled, timeout: 180_000 },
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

      const fresh = await runner.migrateToLatest();
      assert.equal(
        fresh.status.migrations.length,
        inspection.manifest.migrations.length,
      );
      assert.ok(
        fresh.status.migrations.every(({ state }) => state === 'applied'),
      );
      await assertPinTables(admin, pinTables);

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
      await assertPinTables(admin, []);

      await seedAuthorities(admin);
      status = await runner.getMigrationStatus();
      const expectedUpgradeCount = status.migrations.filter(
        ({ state }) => state === 'pending',
      ).length;
      const upgraded = await runner.migrateToLatest();
      assert.equal(upgraded.results.length, expectedUpgradeCount);
      assert.equal(
        upgraded.results[0]?.name,
        '20260907010000_access_create_pin_credentials',
      );
      await assertPinTables(admin, pinTables);
      assert.equal(
        (
          await admin.query(
            'select count(*)::integer as count from users',
          )
        ).rows[0].count,
        5,
      );

      const stationResolver = new ResolveTrustedStationContextUseCase(
        new KyselyStationCredentialVerifier(connection),
      );
      const [contextA, contextA2, contextB] = await Promise.all([
        stationResolver.execute(stationSecretA),
        stationResolver.execute(stationSecretA2),
        stationResolver.execute(stationSecretB),
      ]);
      assert.deepEqual(
        [contextA, contextA2, contextB].map(
          ({ tenantId, branchId, stationId }) => ({
            tenantId,
            branchId,
            stationId,
          }),
        ),
        [
          { tenantId: tenantA, branchId: branchA, stationId: stationA },
          { tenantId: tenantA, branchId: branchA2, stationId: stationA2 },
          { tenantId: tenantB, branchId: branchB, stationId: stationB },
        ],
      );

      const now = { value: new Date('2026-09-07T02:00:00.000Z') };
      const useCases = pinUseCases(connection, now);
      const first = await provision(
        useCases,
        tenantA,
        { userId: sharedUser, pin: pinA, clientRequestId: requestA },
        credentialA,
      );
      const replay = await provision(
        useCases,
        tenantA,
        { userId: sharedUser, pin: pinA, clientRequestId: requestA },
        replayCredentialA,
      );
      assert.deepEqual(replay, first);
      assert.equal(first.credentialId, credentialA);
      await assert.rejects(
        provision(
          useCases,
          tenantA,
          {
            userId: sharedUser,
            pin: wrongPin,
            clientRequestId: requestA,
          },
          replayCredentialA,
        ),
        (error) =>
          error instanceof PinCredentialPersistenceError &&
          error.code === 'PIN_CREDENTIAL_IDEMPOTENCY_CONFLICT',
      );

      const [concurrentA, concurrentB] = await Promise.all([
        provision(
          useCases,
          tenantA,
          {
            userId: concurrentUser,
            pin: concurrentPin,
            clientRequestId: concurrentRequest,
          },
          concurrentCredentialA,
        ),
        provision(
          useCases,
          tenantA,
          {
            userId: concurrentUser,
            pin: concurrentPin,
            clientRequestId: concurrentRequest,
          },
          concurrentCredentialB,
        ),
      ]);
      assert.deepEqual(concurrentB, concurrentA);
      assert.ok(
        [concurrentCredentialA, concurrentCredentialB].includes(
          concurrentA.credentialId,
        ),
      );

      await provision(
        useCases,
        tenantA,
        { userId: lockUser, pin: lockPin, clientRequestId: lockRequest },
        lockCredential,
      );
      await provision(
        useCases,
        tenantB,
        { userId: sharedUser, pin: pinB, clientRequestId: requestB },
        credentialB,
      );

      assert.equal(
        (
          await admin.query(
            `select count(*)::integer as count
             from access_pin_credentials`,
          )
        ).rows[0].count,
        4,
      );

      await admin.query(
        `update access_pin_credentials
         set lookup_digest = null
         where tenant_id = $1 and user_id = $2`,
        [tenantA, sharedUser],
      );
      assert.equal(
        (await useCases.repository.listConfiguredUserIds({ tenantId: tenantA }))
          .includes(sharedUser),
        false,
        'a legacy credential without PIN-only lookup material must not be presented as configured',
      );
      const upgradedLegacy = await new ReplacePinCredentialUseCase(
        useCases.repository,
        useCases.hasher,
        () => provisionedAt,
      ).execute(
        { tenantId: tenantA },
        {
          userId: sharedUser,
          pin: pinA,
          clientRequestId: legacyReplacementRequest,
        },
      );
      assert.equal(upgradedLegacy.credentialVersion, 1);
      assert.equal(
        (await useCases.repository.listConfiguredUserIds({ tenantId: tenantA }))
          .includes(sharedUser),
        true,
      );
      await admin.query(
        `update access_pin_credentials
         set pepper_version = 2
         where tenant_id = $1 and user_id = $2`,
        [tenantA, sharedUser],
      );
      assert.equal(
        (await useCases.repository.listConfiguredUserIds({ tenantId: tenantA }))
          .includes(sharedUser),
        false,
        'a credential from an unsupported pepper version must not be presented as configured',
      );
      await admin.query(
        `update access_pin_credentials
         set pepper_version = 1
         where tenant_id = $1 and user_id = $2`,
        [tenantA, sharedUser],
      );
      assert.equal(
        (
          await admin.query(
            `select count(*)::integer as count
             from access_pin_credential_commands`,
          )
        ).rows[0].count,
        5,
      );

      await admin.query(
        `insert into access_roles (
           tenant_id, role_id, role_key, display_name, status, version,
           created_at, updated_at
         ) values ($1, $2, 'pin_proof', 'PIN proof', 'active', 0, now(), now())`,
        [tenantA, roleId],
      );
      await admin.query(
        `insert into access_role_assignments (
           tenant_id, assignment_id, user_id, role_id, assignment_scope,
           branch_id, status, version, assigned_at, revoked_at
         ) values
           ($1, $2, $3, $4, 'BRANCH_RESTRICTED', $5, 'active', 0, now(), null),
           ($1, $6, $7, $4, 'BRANCH_RESTRICTED', $8, 'active', 0, now(), null)`,
        [
          tenantA,
          assignmentA,
          sharedUser,
          roleId,
          branchA,
          assignmentA2,
          concurrentUser,
          branchA2,
        ],
      );
      const replacement = new ReplacePinCredentialUseCase(
        useCases.repository,
        useCases.hasher,
        () => provisionedAt,
      );
      const replaced = await replacement.execute(
        { tenantId: tenantA },
        {
          userId: concurrentUser,
          pin: pinA,
          clientRequestId: replacementRequest,
        },
      );
      assert.equal(replaced.credentialVersion, 1);
      assert.deepEqual(
        await replacement.execute(
          { tenantId: tenantA },
          {
            userId: concurrentUser,
            pin: pinA,
            clientRequestId: replacementRequest,
          },
        ),
        replaced,
      );
      assert.equal(
        (await useCases.authenticatePinOnly.execute(contextA, { pin: pinA })).userId,
        sharedUser,
      );
      now.value = new Date(now.value.getTime() + 61_000);
      assert.equal(
        (await useCases.authenticatePinOnly.execute(contextA2, { pin: pinA })).userId,
        concurrentUser,
      );
      const pinOnlyFailureStart = new Date('2026-09-07T02:02:00.000Z');
      for (let index = 0; index < 5; index += 1) {
        now.value = new Date(pinOnlyFailureStart.getTime() + index * 1_000);
        await rejectsAuthentication(
          useCases.authenticatePinOnly.execute(contextA, { pin: wrongPin }),
          'PIN_AUTHENTICATION_DENIED',
        );
      }
      let blockedPinOnlyVerifyCalls = 0;
      assert.deepEqual(
        await useCases.repository.authenticatePinOnlyAttempt(
          contextA,
          {
            eligibleUserIds: [sharedUser],
            lookupDigest: useCases.hasher.lookupDigest({ tenantId: tenantA, pin: wrongPin }),
            rateLimitPrincipalId: useCases.hasher.rateLimitPinPrincipalId({ tenantId: tenantA }),
            occurredAt: new Date(pinOnlyFailureStart.getTime() + 5_000).toISOString(),
          },
          async () => {
            blockedPinOnlyVerifyCalls += 1;
            return false;
          },
        ),
        { status: 'temporarily-unavailable' },
      );
      assert.equal(blockedPinOnlyVerifyCalls, 0);
      now.value = new Date(pinOnlyFailureStart.getTime() + 61_000);
      assert.equal(
        (await useCases.authenticatePinOnly.execute(contextA, { pin: pinA })).userId,
        sharedUser,
      );
      const mixedAttemptStart = new Date('2026-09-07T02:03:10.000Z');
      for (let index = 0; index < 4; index += 1) {
        now.value = new Date(mixedAttemptStart.getTime() + index * 1_000);
        await rejectsAuthentication(
          useCases.authenticatePinOnly.execute(contextA, { pin: wrongPin }),
          'PIN_AUTHENTICATION_DENIED',
        );
      }
      now.value = new Date(mixedAttemptStart.getTime() + 4_000);
      assert.equal(
        (await useCases.authenticatePinOnly.execute(contextA, { pin: pinA })).userId,
        sharedUser,
        'a valid low-privilege PIN must not clear prior Station failures',
      );
      now.value = new Date(mixedAttemptStart.getTime() + 5_000);
      await rejectsAuthentication(
        useCases.authenticatePinOnly.execute(contextA, { pin: wrongPin }),
        'PIN_AUTHENTICATION_DENIED',
      );
      let mixedBlockedVerifierCalls = 0;
      assert.deepEqual(
        await useCases.repository.authenticatePinOnlyAttempt(
          contextA,
          {
            eligibleUserIds: [sharedUser],
            lookupDigest: useCases.hasher.lookupDigest({ tenantId: tenantA, pin: wrongPin }),
            rateLimitPrincipalId: useCases.hasher.rateLimitPinPrincipalId({ tenantId: tenantA }),
            occurredAt: new Date(mixedAttemptStart.getTime() + 6_000).toISOString(),
          },
          async () => {
            mixedBlockedVerifierCalls += 1;
            return false;
          },
        ),
        { status: 'temporarily-unavailable' },
      );
      assert.equal(mixedBlockedVerifierCalls, 0);
      now.value = new Date(mixedAttemptStart.getTime() + 61_000);
      await assert.rejects(
        admin.query(
          `update access_role_assignments
           set branch_id = $3
           where tenant_id = $1 and assignment_id = $2`,
          [tenantA, assignmentA2, branchA],
        ),
        (error) => error?.code === '23505' &&
          error.constraint === 'access_pin_branch_eligibility_uq',
      );

      const revokedAt = new Date('2026-09-07T02:00:30.000Z');
      const revokedCredential = await admin.query(
        `update access_pin_credentials
         set status = 'revoked',
             credential_version = credential_version + 1,
             updated_at = $3,
             revoked_at = $3
         where tenant_id = $1 and user_id = $2
         returning status, credential_version, revoked_at`,
        [tenantA, concurrentUser, revokedAt],
      );
      assert.deepEqual(
        {
          rowCount: revokedCredential.rowCount,
          status: revokedCredential.rows[0].status,
          credentialVersion: revokedCredential.rows[0].credential_version,
          revokedAt: revokedCredential.rows[0].revoked_at.toISOString(),
        },
        {
          rowCount: 1,
          status: 'revoked',
          credentialVersion: 2,
          revokedAt: revokedAt.toISOString(),
        },
      );
      let revokedVerifierCalls = 0;
      const revokedAuthentication = new AuthenticatePinUseCase(
        useCases.repository,
        createKyselyAuthenticationUserReader(connection),
        {
          rateLimitPrincipalId(input) {
            return useCases.hasher.rateLimitPrincipalId(input);
          },
          async verify(input) {
            revokedVerifierCalls += 1;
            assert.equal(input.stored, null);
            return useCases.hasher.verify(input);
          },
        },
        () => revokedAt,
      );
      await rejectsAuthentication(
        revokedAuthentication.execute(contextA, {
          userId: concurrentUser,
          pin: concurrentPin,
        }),
        'PIN_AUTHENTICATION_DENIED',
      );
      assert.equal(revokedVerifierCalls, 1);
      assert.deepEqual(
        (
          await admin.query(
            `select status, credential_version, consecutive_failures,
                    locked_until, revoked_at
             from access_pin_credentials
             where tenant_id = $1 and user_id = $2`,
            [tenantA, concurrentUser],
          )
        ).rows[0],
        {
          status: 'revoked',
          credential_version: 2,
          consecutive_failures: 0,
          locked_until: null,
          revoked_at: revokedAt,
        },
      );

      const schemaColumns = await admin.query(
        `select table_name, column_name, data_type
         from information_schema.columns
         where table_schema = 'public'
           and table_name = any($1::text[])
         order by table_name, ordinal_position`,
        [pinTables],
      );
      assert.equal(
        schemaColumns.rows.some(({ column_name }) => column_name === 'pin'),
        false,
      );
      const protectedMaterial = await admin.query(
        `select
           tenant_id,
           user_id,
           algorithm,
           octet_length(salt)::integer as salt_length,
           octet_length(verifier)::integer as verifier_length,
           encode(salt, 'hex') as salt_hex,
           encode(verifier, 'hex') as verifier_hex
         from access_pin_credentials
         order by tenant_id, user_id`,
      );
      assert.ok(
        protectedMaterial.rows.every(
          ({ algorithm, salt_length, verifier_length, salt_hex, verifier_hex }) =>
            algorithm === 'argon2id' &&
            salt_length === 16 &&
            verifier_length === 32 &&
            ![pinA, pinB, concurrentPin, lockPin].some(
              (pin) => salt_hex === Buffer.from(pin).toString('hex') ||
                verifier_hex === Buffer.from(pin).toString('hex'),
            ),
        ),
      );
      assert.notEqual(
        protectedMaterial.rows[0].salt_hex,
        protectedMaterial.rows[1].salt_hex,
      );
      for (const plaintextPin of [pinA, pinB, concurrentPin, lockPin]) {
        const plaintext = await admin.query(
          `select
             exists (
               select 1
               from access_pin_credentials
               where salt = convert_to($1, 'UTF8')
                  or verifier = convert_to($1, 'UTF8')
             ) or exists (
               select 1
               from access_pin_credential_commands
               where request_fingerprint = convert_to($1, 'UTF8')
             ) as found`,
          [plaintextPin],
        );
        assert.equal(plaintext.rows[0].found, false);
      }

      const rejectedConstraintMutations = [
        `update access_pin_credentials
         set status = 'revoked'
         where tenant_id = $1 and user_id = $2`,
        `update access_pin_credentials
         set memory_kib = 8192
         where tenant_id = $1 and user_id = $2`,
        `update access_pin_credentials
         set salt = decode('00', 'hex')
         where tenant_id = $1 and user_id = $2`,
        `update access_pin_credentials
         set credential_version = -1
         where tenant_id = $1 and user_id = $2`,
        `update access_pin_credentials
         set consecutive_failures = 6
         where tenant_id = $1 and user_id = $2`,
        `update access_pin_credentials
         set updated_at = created_at - interval '1 second'
         where tenant_id = $1 and user_id = $2`,
        `update access_pin_credential_commands
         set request_fingerprint = decode('00', 'hex')
         where tenant_id = $1 and user_id = $2`,
      ];
      for (const statement of rejectedConstraintMutations) {
        await assert.rejects(
          admin.query(statement, [tenantA, sharedUser]),
          (error) => error?.code === '23514',
        );
      }
      const rejectedAbuseControlWrites = [
        {
          code: '23514',
          statement: `insert into access_pin_attempt_limits (
             tenant_id, station_id, rate_principal_id, attempt_count,
             window_started_at, blocked_until, updated_at
           ) values ($1, $2, $3, 6, $4, null, $4)`,
          values: [tenantA, stationA, invalidRatePrincipalA, provisionedAt],
        },
        {
          code: '23514',
          statement: `insert into access_pin_attempt_limits (
             tenant_id, station_id, rate_principal_id, attempt_count,
             window_started_at, blocked_until, updated_at
           ) values ($1, $2, $3, 0, $4, null,
                     $4::timestamptz - interval '1 second')`,
          values: [tenantA, stationA, invalidRatePrincipalB, provisionedAt],
        },
        {
          code: '23514',
          statement: `insert into access_pin_attempt_station_guards (
             tenant_id, station_id, created_at, updated_at
           ) values ($1, $2, $3,
                     $3::timestamptz - interval '1 second')`,
          values: [tenantA, stationA2, provisionedAt],
        },
        {
          code: '23503',
          statement: `insert into access_pin_attempt_station_guards (
             tenant_id, station_id, created_at, updated_at
           ) values ($1, $2, $3, $3)`,
          values: [tenantA, stationB, provisionedAt],
        },
        {
          code: '23503',
          statement: `insert into access_pin_attempt_limits (
             tenant_id, station_id, rate_principal_id, attempt_count,
             window_started_at, blocked_until, updated_at
           ) values ($1, $2, $3, 0, $4, null, $4)`,
          values: [tenantB, stationA, invalidRatePrincipalA, provisionedAt],
        },
      ];
      for (const { code, statement, values } of rejectedAbuseControlWrites) {
        await assert.rejects(
          admin.query(statement, values),
          (error) => error?.code === code,
        );
      }
      assert.equal(
        (
          await admin.query(
            `select count(*)::integer as count
             from access_pin_attempt_limits
             where rate_principal_id = any($1::uuid[])`,
            [[invalidRatePrincipalA, invalidRatePrincipalB]],
          )
        ).rows[0].count,
        0,
      );

      const proofA = await useCases.authenticate.execute(contextA, {
        userId: sharedUser,
        pin: pinA,
      });
      assert.deepEqual(
        {
          tenantId: proofA.tenantId,
          branchId: proofA.branchId,
          stationId: proofA.stationId,
          userId: proofA.userId,
        },
        {
          tenantId: tenantA,
          branchId: branchA,
          stationId: stationA,
          userId: sharedUser,
        },
      );
      assert.equal('pin' in proofA, false);
      assert.equal('sessionId' in proofA, false);

      now.value = new Date('2026-09-07T02:01:01.000Z');
      const proofA2 = await useCases.authenticate.execute(contextA2, {
        userId: sharedUser,
        pin: pinA,
      });
      assert.equal(proofA2.branchId, branchA2);
      assert.equal(proofA2.stationId, stationA2);

      now.value = new Date('2026-09-07T02:02:02.000Z');
      await rejectsAuthentication(
        useCases.authenticate.execute(contextA, {
          userId: sharedUser,
          pin: pinB,
        }),
        'PIN_AUTHENTICATION_DENIED',
      );
      now.value = new Date('2026-09-07T02:03:03.000Z');
      await rejectsAuthentication(
        useCases.authenticate.execute(contextB, {
          userId: sharedUser,
          pin: pinA,
        }),
        'PIN_AUTHENTICATION_DENIED',
      );
      now.value = new Date('2026-09-07T02:04:04.000Z');
      const proofB = await useCases.authenticate.execute(contextB, {
        userId: sharedUser,
        pin: pinB,
      });
      assert.equal(proofB.tenantId, tenantB);
      assert.equal(proofB.branchId, branchB);

      now.value = new Date('2026-09-07T03:00:00.000Z');
      const lockResults = await Promise.allSettled(
        Array.from({ length: 5 }, () =>
          useCases.authenticate.execute(contextA, {
            userId: lockUser,
            pin: wrongPin,
          }),
        ),
      );
      assert.ok(
        lockResults.every(
          (result) =>
            result.status === 'rejected' &&
            result.reason instanceof PinAuthenticationError &&
            result.reason.code === 'PIN_AUTHENTICATION_DENIED',
        ),
      );
      const locked = await admin.query(
        `select consecutive_failures, locked_until
         from access_pin_credentials
         where tenant_id = $1 and user_id = $2`,
        [tenantA, lockUser],
      );
      assert.equal(locked.rows[0].consecutive_failures, 5);
      assert.equal(
        locked.rows[0].locked_until.toISOString(),
        '2026-09-07T03:05:00.000Z',
      );

      now.value = new Date('2026-09-07T03:01:01.000Z');
      let lockedVerifyCalls = 0;
      assert.deepEqual(
        await useCases.repository.authenticateAttempt(
          contextA2,
          {
            userId: lockUser,
            userEligible: true,
            rateLimitPrincipalId: useCases.hasher.rateLimitPrincipalId({
              tenantId: tenantA,
              userId: lockUser,
            }),
            occurredAt: now.value.toISOString(),
          },
          async (stored) => {
            lockedVerifyCalls += 1;
            assert.equal(
              stored,
              null,
              'a locked credential must use the same dummy-verifier seam as an unknown principal',
            );
            return false;
          },
        ),
        { status: 'denied' },
      );
      assert.equal(lockedVerifyCalls, 1);
      now.value = new Date('2026-09-07T03:05:01.000Z');
      const unlocked = await useCases.authenticate.execute(contextA, {
        userId: lockUser,
        pin: lockPin,
      });
      assert.equal(unlocked.userId, lockUser);
      assert.deepEqual(
        (
          await admin.query(
            `select consecutive_failures, locked_until
             from access_pin_credentials
             where tenant_id = $1 and user_id = $2`,
            [tenantA, lockUser],
          )
        ).rows[0],
        { consecutive_failures: 0, locked_until: null },
      );

      const unknownStart = new Date('2026-09-07T04:00:00.000Z');
      for (let index = 0; index < 5; index += 1) {
        const result = await useCases.repository.authenticateAttempt(
          contextA,
          {
            userId: unknownUser,
            userEligible: false,
            rateLimitPrincipalId: useCases.hasher.rateLimitPrincipalId({
              tenantId: tenantA,
              userId: unknownUser,
            }),
            occurredAt: new Date(
              unknownStart.getTime() + index * 1_000,
            ).toISOString(),
          },
          async () => false,
        );
        assert.deepEqual(result, { status: 'denied' });
      }
      assert.deepEqual(
        await useCases.repository.authenticateAttempt(
          contextA,
          {
            userId: unknownUser,
            userEligible: false,
            rateLimitPrincipalId: useCases.hasher.rateLimitPrincipalId({
              tenantId: tenantA,
              userId: unknownUser,
            }),
            occurredAt: new Date(
              unknownStart.getTime() + 5_000,
            ).toISOString(),
          },
          async () => false,
        ),
        { status: 'temporarily-unavailable' },
      );
      assert.deepEqual(
        await useCases.repository.authenticateAttempt(
          contextA2,
          {
            userId: unknownUser,
            userEligible: false,
            rateLimitPrincipalId: useCases.hasher.rateLimitPrincipalId({
              tenantId: tenantA,
              userId: unknownUser,
            }),
            occurredAt: new Date(
              unknownStart.getTime() + 5_000,
            ).toISOString(),
          },
          async () => false,
        ),
        { status: 'denied' },
      );
      const unknownLimits = await admin.query(
        `select tenant_id, station_id, rate_principal_id, attempt_count, blocked_until
         from access_pin_attempt_limits
         where tenant_id = $1 and rate_principal_id = $2
         order by tenant_id, station_id`,
        [
          tenantA,
          useCases.hasher.rateLimitPrincipalId({
            tenantId: tenantA,
            userId: unknownUser,
          }),
        ],
      );
      assert.deepEqual(
        unknownLimits.rows.map(
          ({ tenant_id, station_id, rate_principal_id, attempt_count, blocked_until }) => ({
            tenantId: tenant_id,
            stationId: station_id,
            opaquePrincipal:
              /^[0-9a-f-]{36}$/u.test(rate_principal_id) &&
              rate_principal_id !== unknownUser,
            attemptCount: attempt_count,
            blocked: blocked_until !== null,
          }),
        ),
        [
          {
            tenantId: tenantA,
            stationId: stationA,
            opaquePrincipal: true,
            attemptCount: 5,
            blocked: true,
          },
          {
            tenantId: tenantA,
            stationId: stationA2,
            opaquePrincipal: true,
            attemptCount: 1,
            blocked: false,
          },
        ],
      );
      assert.equal(
        (
          await admin.query(
            `select count(*)::integer as count
             from access_pin_attempt_limits
             where rate_principal_id = $1`,
            [unknownUser],
          )
        ).rows[0].count,
        0,
      );

      const missingStart = new Date('2026-09-07T04:02:00.000Z');
      for (let index = 0; index < 5; index += 1) {
        now.value = new Date(missingStart.getTime() + index * 1_000);
        await rejectsAuthentication(
          useCases.authenticate.execute(contextA, {
            userId: missingCredentialUser,
            pin: wrongPin,
          }),
          'PIN_AUTHENTICATION_DENIED',
        );
      }
      now.value = new Date(missingStart.getTime() + 5_000);
      await rejectsAuthentication(
        useCases.authenticate.execute(contextA, {
          userId: missingCredentialUser,
          pin: wrongPin,
        }),
        'PIN_AUTHENTICATION_DENIED',
      );
      await rejectsAuthentication(
        useCases.authenticate.execute(contextA2, {
          userId: missingCredentialUser,
          pin: wrongPin,
        }),
        'PIN_AUTHENTICATION_DENIED',
      );
      const missingCredentialLimits = await admin.query(
        `select station_id, attempt_count, blocked_until
         from access_pin_attempt_limits
         where tenant_id = $1 and rate_principal_id = $2
         order by station_id`,
        [
          tenantA,
          useCases.hasher.rateLimitPrincipalId({
            tenantId: tenantA,
            userId: missingCredentialUser,
          }),
        ],
      );
      assert.deepEqual(
        missingCredentialLimits.rows.map(
          ({ station_id, attempt_count, blocked_until }) => ({
            stationId: station_id,
            attemptCount: attempt_count,
            blocked: blocked_until !== null,
          }),
        ),
        [
          { stationId: stationA, attemptCount: 5, blocked: true },
          { stationId: stationA2, attemptCount: 1, blocked: false },
        ],
      );
      assert.equal(
        (
          await admin.query(
            `select count(*)::integer as count
             from access_pin_credentials
             where tenant_id = $1 and user_id = $2`,
            [tenantA, missingCredentialUser],
          )
        ).rows[0].count,
        0,
      );

      const eligibilityStart = new Date('2026-09-07T04:04:00.000Z');
      let ineligibleVerifierCalls = 0;
      for (let index = 0; index < 5; index += 1) {
        assert.deepEqual(
          await useCases.repository.authenticateAttempt(
            contextA,
            {
              userId: concurrentUser,
              userEligible: false,
              rateLimitPrincipalId: useCases.hasher.rateLimitPrincipalId({
                tenantId: tenantA,
                userId: concurrentUser,
              }),
              occurredAt: new Date(
                eligibilityStart.getTime() + index * 1_000,
              ).toISOString(),
            },
            async () => {
              ineligibleVerifierCalls += 1;
              return false;
            },
          ),
          { status: 'denied' },
        );
      }
      assert.equal(ineligibleVerifierCalls, 5);
      let eligibilityProbeVerifierCalls = 0;
      assert.deepEqual(
        await useCases.repository.authenticateAttempt(
          contextA,
          {
            userId: concurrentUser,
            userEligible: true,
            rateLimitPrincipalId: useCases.hasher.rateLimitPrincipalId({
              tenantId: tenantA,
              userId: concurrentUser,
            }),
            occurredAt: new Date(
              eligibilityStart.getTime() + 5_000,
            ).toISOString(),
          },
          async () => {
            eligibilityProbeVerifierCalls += 1;
            return false;
          },
        ),
        { status: 'temporarily-unavailable' },
      );
      assert.equal(
        eligibilityProbeVerifierCalls,
        0,
        'eligibility must not select a fresh rate bucket or reveal User state',
      );

      const successRateStart = new Date('2026-09-07T05:00:00.000Z');
      for (let index = 0; index < 5; index += 1) {
        now.value = new Date(successRateStart.getTime() + index * 1_000);
        const proof = await useCases.authenticate.execute(contextA, {
          userId: sharedUser,
          pin: pinA,
        });
        assert.equal(proof.userId, sharedUser);
      }
      let sixthSuccessVerifyCalls = 0;
      const sixthSuccess = await useCases.repository.authenticateAttempt(
          contextA,
          {
            userId: sharedUser,
            userEligible: true,
            rateLimitPrincipalId: useCases.hasher.rateLimitPrincipalId({
              tenantId: tenantA,
              userId: sharedUser,
            }),
            occurredAt: new Date(
              successRateStart.getTime() + 5_000,
            ).toISOString(),
          },
          async () => {
            sixthSuccessVerifyCalls += 1;
            return true;
          },
        );
      assert.equal(sixthSuccess.status, 'authenticated');
      assert.equal(sixthSuccessVerifyCalls, 1);
      now.value = new Date(successRateStart.getTime() + 5_000);
      const stationIsolatedProof = await useCases.authenticate.execute(
        contextA2,
        { userId: sharedUser, pin: pinA },
      );
      assert.equal(stationIsolatedProof.stationId, stationA2);

      const ceilingStart = new Date('2026-09-07T07:00:00.000Z');
      const existingRatePrincipal = useCases.hasher.rateLimitPrincipalId({
        tenantId: tenantB,
        userId: sharedUser,
      });
      await admin.query(
        `delete from access_pin_attempt_limits
         where tenant_id = $1 and station_id = $2`,
        [tenantB, stationB],
      );
      await admin.query(
        `insert into access_pin_attempt_limits (
           tenant_id, station_id, rate_principal_id, attempt_count,
           window_started_at, blocked_until, updated_at
         ) values ($1, $2, $3, 0, $4, null, $4)`,
        [tenantB, stationB, existingRatePrincipal, ceilingStart],
      );
      await admin.query(
        `insert into access_pin_attempt_limits (
           tenant_id, station_id, rate_principal_id, attempt_count,
           window_started_at, blocked_until, updated_at
         )
         select $1, $2,
                ('f0000000-0000-4000-8000-' || lpad(to_hex(value), 12, '0'))::uuid,
                0, $3, null, $3
         from generate_series(1, 1022) as value`,
        [tenantB, stationB, ceilingStart],
      );
      assert.equal(
        (
          await admin.query(
            `select count(*)::integer as count
             from access_pin_attempt_limits
             where tenant_id = $1 and station_id = $2`,
            [tenantB, stationB],
          )
        ).rows[0].count,
        1023,
      );
      const ceilingRaceUsers = Array.from(
        { length: 8 },
        (_, index) =>
          `e0000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
      );
      let ceilingRaceVerifierCalls = 0;
      const ceilingRaceResults = await Promise.all(
        ceilingRaceUsers.map((candidate) =>
          useCases.repository.authenticateAttempt(
            contextB,
            {
              userId: candidate,
              userEligible: false,
              rateLimitPrincipalId: useCases.hasher.rateLimitPrincipalId({
                tenantId: tenantB,
                userId: candidate,
              }),
              occurredAt: new Date(
                ceilingStart.getTime() + 1_000,
              ).toISOString(),
            },
            async () => {
              ceilingRaceVerifierCalls += 1;
              return false;
            },
          ),
        ),
      );
      assert.equal(
        ceilingRaceResults.filter(({ status }) => status === 'denied').length,
        1,
      );
      assert.equal(
        ceilingRaceResults.filter(
          ({ status }) => status === 'temporarily-unavailable',
        ).length,
        7,
      );
      assert.equal(ceilingRaceVerifierCalls, 1);
      assert.equal(
        (
          await admin.query(
            `select count(*)::integer as count
             from access_pin_attempt_limits
             where tenant_id = $1 and station_id = $2`,
            [tenantB, stationB],
          )
        ).rows[0].count,
        1024,
      );
      for (const candidate of [sharedUser, unknownUser]) {
        let ceilingVerifierCalls = 0;
        assert.deepEqual(
          await useCases.repository.authenticateAttempt(
            contextB,
            {
              userId: candidate,
              userEligible: candidate === sharedUser,
              rateLimitPrincipalId: useCases.hasher.rateLimitPrincipalId({
                tenantId: tenantB,
                userId: candidate,
              }),
              occurredAt: new Date(
                ceilingStart.getTime() + 1_000,
              ).toISOString(),
            },
            async () => {
              ceilingVerifierCalls += 1;
              return true;
            },
          ),
          { status: 'temporarily-unavailable' },
        );
        assert.equal(ceilingVerifierCalls, 0);
      }
      let stationIsolationVerifierCalls = 0;
      assert.deepEqual(
        await useCases.repository.authenticateAttempt(
          contextA,
          {
            userId: unknownUser,
            userEligible: false,
            rateLimitPrincipalId: useCases.hasher.rateLimitPrincipalId({
              tenantId: tenantA,
              userId: unknownUser,
            }),
            occurredAt: new Date(
              ceilingStart.getTime() + 1_000,
            ).toISOString(),
          },
          async () => {
            stationIsolationVerifierCalls += 1;
            return false;
          },
        ),
        { status: 'denied' },
      );
      assert.equal(stationIsolationVerifierCalls, 1);
      assert.deepEqual(
        await useCases.repository.authenticateAttempt(
          contextB,
          {
            userId: sharedUser,
            userEligible: true,
            rateLimitPrincipalId: existingRatePrincipal,
            occurredAt: new Date(
              ceilingStart.getTime() + 61_000,
            ).toISOString(),
          },
          async () => true,
        ),
        { status: 'authenticated', credentialVersion: 0 },
      );
      assert.equal(
        (
          await admin.query(
            `select count(*)::integer as count
             from access_pin_attempt_limits
             where tenant_id = $1 and station_id = $2`,
            [tenantB, stationB],
          )
        ).rows[0].count,
        1,
      );

      await assert.rejects(
        provision(
          useCases,
          tenantA,
          { userId: unknownUser, pin: pinA, clientRequestId: requestB },
          credentialB,
        ),
        (error) =>
          error instanceof PinCredentialPersistenceError &&
          error.code === 'PIN_CREDENTIAL_USER_INVALID',
      );
      assert.equal(
        (
          await admin.query(
            `select count(*)::integer as count
             from access_pin_credentials
             where tenant_id = $1`,
            [tenantB],
          )
        ).rows[0].count,
        1,
      );

      status = await runner.getMigrationStatus();
      latest = [...status.migrations]
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
      await assertPinTables(admin, []);
      assert.equal(
        (
          await admin.query(
            'select count(*)::integer as count from users',
          )
        ).rows[0].count,
        5,
      );

      status = await runner.getMigrationStatus();
      const expectedReapplyCount = status.migrations.filter(
        ({ state }) => state === 'pending',
      ).length;
      const reapplied = await runner.migrateToLatest();
      assert.equal(reapplied.results.length, expectedReapplyCount);
      await assertPinTables(admin, pinTables);

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
