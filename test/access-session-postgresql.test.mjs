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
const { KyselyOperationalSessionRepository } = enabled
  ? await import('../dist/modules/access/infrastructure/persistence/kysely-operational-session.repository.js')
  : {};
const { ApplicationDatabaseRuntimeProvider } = enabled
  ? await import('../dist/infrastructure/runtime/application-database-runtime.provider.js')
  : {};
const { OperationalSessionAdmissionError } = enabled
  ? await import('../dist/modules/access/application/ports/operational-session-repository.port.js')
  : {};
const { createKyselyAccessRepository } = enabled
  ? await import('../dist/modules/access/infrastructure/persistence/kysely-access.repository.js')
  : {};
const { KyselyAuthenticationUserReader } = enabled
  ? await import('../dist/modules/users/infrastructure/persistence/kysely-authentication-user.reader.js')
  : {};
const { KyselyStationCredentialVerifier } = enabled
  ? await import('../dist/modules/stations/infrastructure/persistence/kysely-station-credential.verifier.js')
  : {};
const { ListApplicableUsersUseCase } = enabled
  ? await import('../dist/modules/access/application/use-cases/list-applicable-users.use-case.js')
  : {};
const { OperationalSessionError, ResolveOperationalSessionUseCase } = enabled
  ? await import('../dist/modules/access/application/use-cases/operational-session.use-cases.js')
  : {};
const { NodeSessionToken } = enabled
  ? await import('../dist/modules/access/infrastructure/security/node-session-token.js')
  : {};
const { createTrustedStationContext } = enabled
  ? await import('../dist/modules/stations/application/contracts/trusted-station-context.js')
  : {};

const migrationRoot = fileURLToPath(new URL('../dist/infrastructure/database/migrations/', import.meta.url));
const sessionTables = ['access_operational_sessions', 'access_operational_session_station_guards'];
const allTables = [
  'catalog_reference_deletion_events', 'repair_catalog_reference_deletion_events',
  'catalog_audit_events',
  'catalog_commands',
  'catalog_reference_cost_revisions',
  'catalog_branch_price_revisions',
  'catalog_base_price_revisions',
  'catalog_barcode_sequences',
  'catalog_sku_sequences',
  'catalog_item_identifiers',
  'catalog_items',
  'catalog_brand_pending_kind_applicability',
  'catalog_brand_pending_values',
  'catalog_category_pending_values',
  'catalog_brand_kind_applicability',
  'catalog_category_kind_applicability',
  'catalog_brands',
  'catalog_categories',
  'catalog_reference_identity_locks',
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
  ...sessionTables,
  'access_pin_attempt_limits', 'access_pin_attempt_station_guards',
  'access_pin_credential_commands', 'access_pin_credentials',
  'access_pin_eligibility_tenant_guards',
  'access_role_assignment_commands', 'access_role_commands', 'access_role_assignments',
  'access_role_capabilities', 'access_roles', 'access_capabilities',
  'user_lifecycle_commands', 'user_profile_update_commands', 'user_create_commands',
  'user_provisioning_bootstraps', 'users',
  'repair_business_audit_events', 'repair_location_movements', 'repair_locations', 'repair_attachments',
  'repair_timeline_entries', 'repair_intakes', 'repair_technician_assignments',
  'repair_workflow_transitions', 'repair_technician_branches', 'repair_technicians',
  'repairs', 'station_credentials', 'station_bindings', 'stations', 'branches',
  'tenants', 'kysely_migration', 'kysely_migration_lock',
];

const tenantA = '10000000-0000-4000-8000-000000000034';
const tenantB = '20000000-0000-4000-8000-000000000034';
const branchA = '30000000-0000-4000-8000-000000000034';
const branchB = '40000000-0000-4000-8000-000000000034';
const stationA = '50000000-0000-4000-8000-000000000034';
const stationASecond = '51000000-0000-4000-8000-000000000034';
const stationB = '60000000-0000-4000-8000-000000000034';
const userA = '70000000-0000-4000-8000-000000000034';
const userASecond = '70100000-0000-4000-8000-000000000034';
const roleA = '71000000-0000-4000-8000-000000000034';
const assignmentA = '72000000-0000-4000-8000-000000000034';
const assignmentASecond = '72100000-0000-4000-8000-000000000034';
const stationCredentialA = '73000000-0000-4000-8000-000000000034';
const stationCredentialB = '74000000-0000-4000-8000-000000000034';
const stationCredentialAAlternate = '75000000-0000-4000-8000-000000000034';
const stationCredentialASecond = '76000000-0000-4000-8000-000000000034';

function config(applicationName) {
  return Object.freeze({
    identity: Object.freeze({
      host: process.env.SR_OWNER_SCOPED_PG_HOST,
      port: Number(process.env.SR_OWNER_SCOPED_PG_PORT),
      database: process.env.SR_OWNER_SCOPED_PG_NAME,
      user: process.env.SR_OWNER_SCOPED_PG_USER,
      password: process.env.SR_OWNER_SCOPED_PG_PASSWORD,
    }),
    transport: Object.freeze({ sslMode: 'disable' }),
    pool: Object.freeze({ min: 0, max: 8, idleTimeoutMs: 1_000, connectionTimeoutMs: 2_000, statementTimeoutMs: 20_000, queryTimeoutMs: 20_000 }),
    runtime: Object.freeze({ environment: 'development', role: 'migration', accessMode: 'read-write', migrationsEnabled: true, testRunId: null }),
    observability: Object.freeze({ applicationName, labels: Object.freeze({ component: 'access', environment: 'development', role: 'migration' }) }),
  });
}

function applicationRuntimeEnvironment(applicationName) {
  const environment = Object.freeze({
    SR_DB_ACCESS_MODE: 'read-write',
    SR_DB_APPLICATION_NAME: applicationName,
    SR_DB_CONNECTION_TIMEOUT_MS: '2000',
    SR_DB_ENVIRONMENT: 'development',
    SR_DB_HOST: process.env.SR_OWNER_SCOPED_PG_HOST,
    SR_DB_IDLE_TIMEOUT_MS: '1000',
    SR_DB_MIGRATIONS_ENABLED: 'false',
    SR_DB_NAME: process.env.SR_OWNER_SCOPED_PG_NAME,
    SR_DB_PASSWORD: process.env.SR_OWNER_SCOPED_PG_PASSWORD,
    SR_DB_POOL_MAX: '8',
    SR_DB_POOL_MIN: '0',
    SR_DB_PORT: process.env.SR_OWNER_SCOPED_PG_PORT,
    SR_DB_QUERY_TIMEOUT_MS: '20000',
    SR_DB_ROLE: 'application',
    SR_DB_SSL_MODE: 'disable',
    SR_DB_STATEMENT_TIMEOUT_MS: '20000',
    SR_DB_USER: process.env.SR_OWNER_SCOPED_PG_USER,
  });
  return Object.freeze({
    applicationDatabaseConfigured: () => true,
    applicationDatabaseEnvironment: () => environment,
  });
}

function adminPool() {
  return new Pool({
    database: process.env.SR_OWNER_SCOPED_PG_NAME,
    host: process.env.SR_OWNER_SCOPED_PG_HOST,
    password: process.env.SR_OWNER_SCOPED_PG_PASSWORD,
    port: Number(process.env.SR_OWNER_SCOPED_PG_PORT),
    ssl: false,
    user: process.env.SR_OWNER_SCOPED_PG_USER,
  });
}

async function waitForApplicationLocks(admin, applicationNames, expectedCount) {
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    const result = await admin.query(
      `select count(distinct pid)::integer as count
         from pg_stat_activity
        where application_name = any($1::text[])
          and state = 'active'
          and wait_event_type = 'Lock'`,
      [applicationNames],
    );
    if (result.rows[0].count >= expectedCount) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert.fail(
    `Expected ${expectedCount} blocked application transaction(s): ${applicationNames.join(', ')}`,
  );
}

async function beginSessionTableBarrier(admin) {
  const client = await admin.connect();
  await client.query('begin');
  await client.query('lock table access_operational_sessions in access exclusive mode');
  return client;
}

async function beginSessionRowBarrier(admin, sessionId) {
  const client = await admin.connect();
  await client.query('begin');
  await client.query(
    'select session_id from access_operational_sessions where tenant_id=$1 and session_id=$2 for update',
    [tenantA, sessionId],
  );
  return client;
}

function source() {
  return Object.freeze({ root: migrationRoot, authorizedRoot: migrationRoot, normalizedRoot: 'src/infrastructure/database/migrations', mode: 'compiled' });
}

function authorization(item) {
  return Object.freeze({ migrationName: item.name, expectedHash: item.hash, reason: 'verify Operational Session migration reversal', environment: 'development', confirmation: 'REVERT_ONE_MIGRATION' });
}

async function reset(admin) {
  await admin.query('drop function if exists reject_catalog_reference_deletion_event_mutation() cascade');
  await admin.query('drop function if exists reject_repair_catalog_reference_deletion_event_mutation() cascade');
  await admin.query('drop function if exists catalog_reject_append_only_mutation() cascade');
  await admin.query('drop function if exists repairs_reject_business_audit_event_mutation() cascade');
  await admin.query('drop function if exists stations_advance_admission_revision() cascade');
  await admin.query('drop function if exists users_advance_admission_revision() cascade');
  await admin.query('drop function if exists access_validate_operational_session_admission() cascade');
  await admin.query('drop function if exists access_invalidate_operational_sessions_for_context_change() cascade');
  await admin.query('drop function if exists access_advance_pin_credential_version() cascade');
  await admin.query(`drop table if exists ${allTables.map((name) => `"${name}"`).join(', ')} cascade`);
}

async function seed(admin) {
  await admin.query('insert into tenants (tenant_id, created_at) values ($1, now()), ($2, now())', [tenantA, tenantB]);
  await admin.query('insert into branches (tenant_id, branch_id, active, created_at) values ($1,$2,true,now()),($3,$4,true,now())', [tenantA, branchA, tenantB, branchB]);
  await admin.query("insert into stations (tenant_id,station_id,status,created_at,updated_at) values ($1,$2,'active',now(),now()),($1,$3,'active',now(),now()),($4,$5,'active',now(),now())", [tenantA, stationA, stationASecond, tenantB, stationB]);
  await admin.query('insert into station_bindings (tenant_id,station_id,branch_id,created_at) values ($1,$2,$3,now()),($1,$4,$3,now()),($5,$6,$7,now())', [tenantA, stationA, branchA, stationASecond, tenantB, stationB, branchB]);
  await admin.query("insert into station_credentials (credential_id,credential_hash,tenant_id,station_id,created_at) values ($1,'station-a-hash',$2,$3,now()),($4,'station-b-hash',$5,$6,now()),($7,'station-a-alternate-hash',$2,$3,now()),($8,'station-a-second-hash',$2,$9,now())", [stationCredentialA, tenantA, stationA, stationCredentialB, tenantB, stationB, stationCredentialAAlternate, stationCredentialASecond, stationASecond]);
  await admin.query("insert into users (tenant_id,user_id,display_name,operational_identifier,status,version,created_at,updated_at) values ($1,$2,'Operador A','operador-a','active',0,now(),now()),($1,$3,'Operador A2','operador-a2','active',0,now(),now()),($4,$2,'Operador B','operador-b','active',0,now(),now())", [tenantA, userA, userASecond, tenantB]);
  await admin.query("insert into access_roles (tenant_id,role_id,role_key,display_name,status,version,created_at,updated_at) values ($1,$2,'operator','Operador','active',0,now(),now())", [tenantA, roleA]);
  await admin.query("insert into access_role_assignments (tenant_id,assignment_id,user_id,role_id,assignment_scope,branch_id,status,version,assigned_at) values ($1,$2,$3,$4,'BRANCH_RESTRICTED',$5,'active',0,now()),($1,$6,$7,$4,'BRANCH_RESTRICTED',$5,'active',0,now())", [tenantA, assignmentA, userA, roleA, branchA, assignmentASecond, userASecond]);
  await admin.query("insert into access_pin_credentials (tenant_id,user_id,credential_id,status,algorithm,profile_version,pepper_version,memory_kib,passes,parallelism,salt,verifier,credential_version,consecutive_failures,created_at,updated_at) values ($1,$2,gen_random_uuid(),'active','argon2id',1,1,65536,3,4,$5,$6,3,0,now(),now()),($1,$3,gen_random_uuid(),'active','argon2id',1,1,65536,3,4,$7,$8,3,0,now(),now()),($4,$2,gen_random_uuid(),'active','argon2id',1,1,65536,3,4,$5,$6,3,0,now(),now())", [tenantA, userA, userASecond, tenantB, Buffer.alloc(16, 1), Buffer.alloc(32, 2), Buffer.alloc(16, 3), Buffer.alloc(32, 4)]);
}

function input(
  sessionId,
  fill,
  occurredAt = '2026-09-07T12:00:00.000Z',
  expectedSessionId = null,
) {
  return Object.freeze({
    sessionId,
    userId: userA,
    userVersion: 0,
    userAdmissionRevision: 0,
    credentialVersion: 3,
    bearerVerifier: Buffer.alloc(32, fill),
    csrfVerifier: Buffer.alloc(32, fill + 1),
    expectedSessionId,
    occurredAt,
    expiresAt: new Date(new Date(occurredAt).getTime() + 12 * 60 * 60 * 1_000).toISOString(),
  });
}

function tokenInput(
  sessionId,
  material,
  occurredAt = '2026-09-07T12:00:00.000Z',
  expectedSessionId = null,
) {
  return Object.freeze({
    sessionId,
    userId: userA,
    userVersion: 0,
    userAdmissionRevision: 0,
    credentialVersion: 3,
    bearerVerifier: material.bearerVerifier,
    csrfVerifier: material.csrfVerifier,
    expectedSessionId,
    occurredAt,
    expiresAt: new Date(new Date(occurredAt).getTime() + 12 * 60 * 60 * 1_000).toISOString(),
  });
}

async function stationContext(
  admin,
  tenantId,
  branchId,
  stationId,
  stationCredentialId,
) {
  const row = (await admin.query(
    `select b.admission_revision as branch_revision,
            s.admission_revision as station_revision,
            sb.admission_revision as binding_revision,
            sc.admission_revision as credential_revision
       from station_credentials sc
       inner join stations s
         on s.tenant_id = sc.tenant_id and s.station_id = sc.station_id
       inner join station_bindings sb
         on sb.tenant_id = s.tenant_id and sb.station_id = s.station_id
       inner join branches b
         on b.tenant_id = sb.tenant_id and b.branch_id = sb.branch_id
      where sc.tenant_id = $1
        and sc.station_id = $2
        and sc.credential_id = $3
        and sb.branch_id = $4`,
    [tenantId, stationId, stationCredentialId, branchId],
  )).rows[0];
  assert.ok(row);
  return createTrustedStationContext({
    tenantId,
    branchId,
    stationId,
    stationCredentialId,
    branchAdmissionRevision: row.branch_revision,
    stationAdmissionRevision: row.station_revision,
    stationBindingAdmissionRevision: row.binding_revision,
    stationCredentialAdmissionRevision: row.credential_revision,
  });
}

test('PostgreSQL 18.4 enforces concurrent Operational Sessions, exact lifecycle, isolation, and rollback safety', { skip: !enabled, timeout: 180_000 }, async () => {
  assert.equal(process.version, 'v24.18.0');
  const admin = adminPool();
  const firstConnection = createDatabaseConnection(config('srtaller-access-session-pg-a'));
  const secondConnection = createDatabaseConnection(config('srtaller-access-session-pg-b'));
  const migrationConnection = createDatabaseConnection(config('srtaller-access-session-pg-migration'));
  const inspection = await inspectMigrationSource(source());
  const runner = createMigrationRunner(migrationConnection, { expectedManifestHash: inspection.manifest.aggregateSha256, [databaseMigrationSourceOverride]: source() });
  try {
    await reset(admin);
    const fresh = await runner.migrateToLatest();
    assert.equal(fresh.status.migrations.length, inspection.manifest.migrations.length);
    let latest = [...fresh.status.migrations].reverse().find(({ state }) => state === 'applied');
    while (latest?.name !== '20260907120000_access_create_operational_sessions') {
      assert.ok(latest);
      await runner.migrateDown(authorization(latest));
      const intermediateStatus = await runner.getMigrationStatus();
      latest = [...intermediateStatus.migrations].reverse().find(({ state }) => state === 'applied');
    }
    assert.equal(latest?.name, '20260907120000_access_create_operational_sessions');
    await runner.migrateDown(authorization(latest));
    assert.deepEqual((await admin.query("select tablename from pg_tables where schemaname='public' and tablename = any($1::text[])", [sessionTables])).rows, []);

    await seed(admin);
    const sessionBase = await runner.migrateUp();
    assert.equal(sessionBase.results[0]?.name, '20260907120000_access_create_operational_sessions');
    await Promise.all([firstConnection.verify(), secondConnection.verify()]);
    const repositoryA = new KyselyOperationalSessionRepository(
      firstConnection,
      new KyselyStationCredentialVerifier(firstConnection),
      new KyselyAuthenticationUserReader(firstConnection),
    );
    const repositoryB = new KyselyOperationalSessionRepository(
      secondConnection,
      new KyselyStationCredentialVerifier(secondConnection),
      new KyselyAuthenticationUserReader(secondConnection),
    );
    let contextA = await stationContext(admin, tenantA, branchA, stationA, stationCredentialA);
    await assert.rejects(
      admin.query(
        'update access_pin_credentials set credential_version=credential_version-1 where tenant_id=$1 and user_id=$2',
        [tenantA, userA],
      ),
      /access_pin_credentials_version_monotonic_ck|cannot decrease/iu,
    );
    const wrongBranch = createTrustedStationContext({
      ...contextA,
      branchId: branchB,
    });
    const first = await repositoryA.createForProfile(contextA, input('80000000-0000-4000-8000-000000000034', 1));
    assert.equal(first.status, 'active');
    const concurrencyMigration = await runner.migrateToLatest();
    assert.equal(
      concurrencyMigration.results.find(({ name }) =>
        name === '20260912180000_access_enable_concurrent_operational_sessions')?.name,
      '20260912180000_access_enable_concurrent_operational_sessions',
    );
    assert.equal(
      (await admin.query(
        'select status from access_operational_sessions where tenant_id=$1 and session_id=$2',
        [tenantA, first.sessionId],
      )).rows[0].status,
      'active',
    );
    assert.equal(await repositoryA.findByBearerVerifier(wrongBranch, Buffer.alloc(32, 1)), null);

    const startBarrier = await beginSessionTableBarrier(admin);
    const concurrentStartsPromise = Promise.allSettled([
      repositoryA.createForProfile(contextA, input(
        '81000000-0000-4000-8000-000000000034',
        2,
        '2026-09-07T12:00:01.000Z',
      )),
      repositoryB.createForProfile(contextA, input(
        '82000000-0000-4000-8000-000000000034',
        3,
        '2026-09-07T12:00:01.000Z',
      )),
    ]);
    let concurrentStartsSettled = false;
    void concurrentStartsPromise.then(() => { concurrentStartsSettled = true; });
    try {
      await waitForApplicationLocks(
        admin,
        ['srtaller-access-session-pg-a', 'srtaller-access-session-pg-b'],
        2,
      );
      assert.equal(concurrentStartsSettled, false);
    } finally {
      await startBarrier.query('commit').catch(() => undefined);
      startBarrier.release();
    }
    const concurrentStarts = await concurrentStartsPromise;
    assert.equal(concurrentStarts.filter(({ status }) => status === 'fulfilled').length, 2);
    assert.equal(concurrentStarts.filter(({ status }) => status === 'rejected').length, 0);
    const rows = await admin.query("select status,count(*)::integer count from access_operational_sessions where tenant_id=$1 and station_id=$2 group by status order by status", [tenantA, stationA]);
    assert.deepEqual(rows.rows, [{ status: 'active', count: 3 }]);
    assert.ok(await repositoryA.findByBearerVerifier(contextA, Buffer.alloc(32, 2)));
    assert.ok(await repositoryA.findByBearerVerifier(contextA, Buffer.alloc(32, 3)));

    const contextASecond = await stationContext(
      admin,
      tenantA,
      branchA,
      stationASecond,
      stationCredentialASecond,
    );
    const differentStation = await repositoryA.createForProfile(
      contextASecond,
      input('81200000-0000-4000-8000-000000000034', 23),
    );
    const differentUser = await repositoryA.createForProfile(contextA, {
      ...input('81300000-0000-4000-8000-000000000034', 25),
      userId: userASecond,
    });
    assert.equal(differentStation.stationId, stationASecond);
    assert.equal(differentStation.userId, userA);
    assert.equal(differentUser.stationId, stationA);
    assert.equal(differentUser.userId, userASecond);

    const switchBarrier = await beginSessionRowBarrier(admin, first.sessionId);
    const concurrentSwitchesPromise = Promise.allSettled([
      repositoryA.createForProfile(contextA, input(
        '81500000-0000-4000-8000-000000000034',
        7,
        '2026-09-07T12:00:02.000Z',
        first.sessionId,
      )),
      repositoryB.createForProfile(contextA, input(
        '81600000-0000-4000-8000-000000000034',
        9,
        '2026-09-07T12:00:02.000Z',
        first.sessionId,
      )),
    ]);
    let concurrentSwitchesSettled = false;
    void concurrentSwitchesPromise.then(() => { concurrentSwitchesSettled = true; });
    try {
      await waitForApplicationLocks(
        admin,
        ['srtaller-access-session-pg-a', 'srtaller-access-session-pg-b'],
        2,
      );
      assert.equal(concurrentSwitchesSettled, false);
    } finally {
      await switchBarrier.query('commit').catch(() => undefined);
      switchBarrier.release();
    }
    const concurrentSwitches = await concurrentSwitchesPromise;
    assert.equal(concurrentSwitches.filter(({ status }) => status === 'fulfilled').length, 1);
    assert.equal(concurrentSwitches.filter(({ status }) => status === 'rejected').length, 1);
    assert.ok(
      concurrentSwitches.find(({ status }) => status === 'rejected')?.reason instanceof
        OperationalSessionAdmissionError,
    );
    const concurrentActiveSessionId = concurrentSwitches.find(
      ({ status }) => status === 'fulfilled',
    ).value.sessionId;
    assert.equal(
      (await admin.query(
        "select count(*)::integer count from access_operational_sessions where tenant_id=$1 and station_id=$2 and status='active'",
        [tenantA, stationA],
      )).rows[0].count,
      4,
    );

    const sharedRuntime = new ApplicationDatabaseRuntimeProvider(
      applicationRuntimeEnvironment('srtaller-access-session-shared-runtime'),
    );
    await sharedRuntime.onModuleInit();
    try {
      const sharedRepository = new KyselyOperationalSessionRepository(
        sharedRuntime,
        new KyselyStationCredentialVerifier(sharedRuntime),
        new KyselyAuthenticationUserReader(sharedRuntime),
      );
      const sharedUserReader = new KyselyAuthenticationUserReader(sharedRuntime);
      const [sharedStarts, sharedUser] = await Promise.all([
        Promise.all([
          sharedRepository.createForProfile(
            contextA,
            input('82500000-0000-4000-8000-000000000034', 11, '2026-09-07T12:00:03.000Z'),
          ),
          sharedRepository.createForProfile(
            contextA,
            input('82600000-0000-4000-8000-000000000034', 13, '2026-09-07T12:00:03.000Z'),
          ),
        ]),
        sharedUserReader.findAuthenticationUser({ tenantId: tenantA }, userA),
      ]);
      assert.equal(sharedStarts.length, 2);
      assert.equal(sharedUser?.userId, userA);
      assert.equal(
        (await admin.query(
          "select count(*)::integer count from access_operational_sessions where tenant_id=$1 and station_id=$2 and status='active'",
          [tenantA, stationA],
        )).rows[0].count,
        6,
      );
    } finally {
      await sharedRuntime.onModuleDestroy();
    }

    const activeBeforeTouches = (await admin.query(
      'select session_id,version,last_activity_at from access_operational_sessions where tenant_id=$1 and session_id=$2',
      [tenantA, concurrentActiveSessionId],
    )).rows[0];
    assert.ok(activeBeforeTouches);
    const touchBarrier = await beginSessionRowBarrier(admin, activeBeforeTouches.session_id);
    const touchResultsPromise = Promise.all([
      repositoryA.confirmActive(contextA, {
        sessionId: activeBeforeTouches.session_id,
        expectedVersion: activeBeforeTouches.version,
        occurredAt: '2026-09-07T12:20:00.000Z',
        recordActivity: true,
      }),
      repositoryB.confirmActive(contextA, {
        sessionId: activeBeforeTouches.session_id,
        expectedVersion: activeBeforeTouches.version,
        occurredAt: '2026-09-07T12:10:00.000Z',
        recordActivity: true,
      }),
    ]);
    let touchResultsSettled = false;
    void touchResultsPromise.then(() => { touchResultsSettled = true; });
    try {
      await waitForApplicationLocks(
        admin,
        ['srtaller-access-session-pg-a', 'srtaller-access-session-pg-b'],
        2,
      );
      assert.equal(touchResultsSettled, false);
    } finally {
      await touchBarrier.query('commit').catch(() => undefined);
      touchBarrier.release();
    }
    const touchResults = await touchResultsPromise;
    assert.equal(touchResults.filter((value) => value?.status === 'active').length, 1);
    assert.equal(touchResults.filter((value) => value === null).length, 1);
    const touched = (await admin.query(
      'select version,last_activity_at from access_operational_sessions where tenant_id=$1 and session_id=$2',
      [tenantA, activeBeforeTouches.session_id],
    )).rows[0];
    assert.equal(touched.version, activeBeforeTouches.version + 1);
    assert.ok([
      '2026-09-07T12:10:00.000Z',
      '2026-09-07T12:20:00.000Z',
    ].includes(touched.last_activity_at.toISOString()));

    await assert.rejects(
      repositoryA.createForProfile(wrongBranch, input(
        '83000000-0000-4000-8000-000000000034',
        4,
        '2026-09-07T12:00:00.000Z',
        activeBeforeTouches.session_id,
      )),
      OperationalSessionAdmissionError,
    );
    assert.equal(
      (await admin.query("select count(*)::integer count from access_operational_sessions where tenant_id=$1 and station_id=$2 and status='active'", [tenantA, stationA])).rows[0].count,
      6,
    );
    assert.equal(await repositoryA.isPinCredentialCurrent(contextA, userA, 3), true);
    assert.equal(await repositoryA.isPinCredentialCurrent({ ...contextA, tenantId: tenantB }, userA, 4), false);

    await admin.query(
      'update station_credentials set revoked_at=clock_timestamp() where tenant_id=$1 and credential_id=$2',
      [tenantA, stationCredentialA],
    );
    await assert.rejects(
      repositoryA.createForProfile(
        contextA,
        input(
          '83100000-0000-4000-8000-000000000034',
          15,
          '2026-09-07T12:00:00.000Z',
          activeBeforeTouches.session_id,
        ),
      ),
      OperationalSessionAdmissionError,
    );
    await admin.query(
      'update station_credentials set revoked_at=null where tenant_id=$1 and credential_id=$2',
      [tenantA, stationCredentialA],
    );
    await assert.rejects(
      repositoryA.createForProfile(
        contextA,
        input(
          '83150000-0000-4000-8000-000000000034',
          16,
          '2026-09-07T12:00:00.000Z',
          activeBeforeTouches.session_id,
        ),
      ),
      OperationalSessionAdmissionError,
    );
    contextA = await stationContext(admin, tenantA, branchA, stationA, stationCredentialA);

    const stationAdmissionRaceClient = await admin.connect();
    try {
      await stationAdmissionRaceClient.query('begin');
      await stationAdmissionRaceClient.query(
        'update station_credentials set revoked_at=clock_timestamp() where tenant_id=$1 and credential_id=$2',
        [tenantA, stationCredentialA],
      );
      const racedStationAdmission = repositoryA.createForProfile(
        contextA,
        input(
          '83160000-0000-4000-8000-000000000034',
          18,
          '2026-09-07T12:00:00.000Z',
          activeBeforeTouches.session_id,
        ),
      );
      let racedStationAdmissionSettled = false;
      void racedStationAdmission.then(
        () => { racedStationAdmissionSettled = true; },
        () => { racedStationAdmissionSettled = true; },
      );
      await waitForApplicationLocks(admin, ['srtaller-access-session-pg-a'], 1);
      assert.equal(racedStationAdmissionSettled, false);
      await stationAdmissionRaceClient.query('commit');
      await assert.rejects(
        racedStationAdmission,
        OperationalSessionAdmissionError,
      );
    } finally {
      await stationAdmissionRaceClient.query('rollback').catch(() => undefined);
      stationAdmissionRaceClient.release();
    }
    await admin.query(
      'update station_credentials set revoked_at=null where tenant_id=$1 and credential_id=$2',
      [tenantA, stationCredentialA],
    );
    contextA = await stationContext(admin, tenantA, branchA, stationA, stationCredentialA);

    await admin.query(
      'update users set version=version+1,updated_at=clock_timestamp() where tenant_id=$1 and user_id=$2',
      [tenantA, userA],
    );
    await assert.rejects(
      repositoryA.createForProfile(
        contextA,
        input(
          '83200000-0000-4000-8000-000000000034',
          17,
          '2026-09-07T12:00:00.000Z',
          activeBeforeTouches.session_id,
        ),
      ),
      OperationalSessionAdmissionError,
    );
    await admin.query(
      'update users set version=0,updated_at=clock_timestamp() where tenant_id=$1 and user_id=$2',
      [tenantA, userA],
    );

    const admissionRaceClient = await admin.connect();
    try {
      await admissionRaceClient.query('begin');
      await admissionRaceClient.query(
        "update users set status='inactive',version=version+1,updated_at=clock_timestamp() where tenant_id=$1 and user_id=$2",
        [tenantA, userA],
      );
      const racedAdmission = repositoryA.createForProfile(
        contextA,
        input(
          '83300000-0000-4000-8000-000000000034',
          19,
          '2026-09-07T12:00:00.000Z',
          activeBeforeTouches.session_id,
        ),
      );
      let racedAdmissionSettled = false;
      void racedAdmission.then(
        () => { racedAdmissionSettled = true; },
        () => { racedAdmissionSettled = true; },
      );
      await waitForApplicationLocks(admin, ['srtaller-access-session-pg-a'], 1);
      assert.equal(racedAdmissionSettled, false);
      await admissionRaceClient.query('commit');
      await assert.rejects(racedAdmission, OperationalSessionAdmissionError);
    } finally {
      await admissionRaceClient.query('rollback').catch(() => undefined);
      admissionRaceClient.release();
    }
    await admin.query(
      "update users set status='active',version=0,updated_at=clock_timestamp() where tenant_id=$1 and user_id=$2",
      [tenantA, userA],
    );
    await repositoryA.createForProfile(
      contextA,
      {
        ...input(
          '83400000-0000-4000-8000-000000000034',
          21,
          '2026-09-07T12:00:00.000Z',
          activeBeforeTouches.session_id,
        ),
        userAdmissionRevision: 2,
      },
    );

    const invalidVerifier = {
      ...input(
        '84000000-0000-4000-8000-000000000034',
        5,
        '2026-09-07T12:00:00.000Z',
        '83400000-0000-4000-8000-000000000034',
      ),
      userAdmissionRevision: 2,
    };
    await assert.rejects(
      repositoryA.createForProfile(contextA, {
        ...invalidVerifier,
        bearerVerifier: Buffer.alloc(31, 5),
      }),
      /access_operational_sessions_verifier_ck|constraint/iu,
    );
    const invalidLifetime = {
      ...input(
        '85000000-0000-4000-8000-000000000034',
        6,
        '2026-09-07T12:00:00.000Z',
        '83400000-0000-4000-8000-000000000034',
      ),
      userAdmissionRevision: 2,
    };
    await assert.rejects(
      repositoryA.createForProfile(contextA, {
        ...invalidLifetime,
        expiresAt: '2026-09-08T00:00:00.001Z',
      }),
      /access_operational_sessions_time_ck|constraint/iu,
    );
    assert.equal(
      (await admin.query("select count(*)::integer count from access_operational_sessions where tenant_id=$1 and station_id=$2 and status='active'", [tenantA, stationA])).rows[0].count,
      6,
    );

    const tokenService = new NodeSessionToken();
    const userReader = new KyselyAuthenticationUserReader(firstConnection);
    const applicableUsers = new ListApplicableUsersUseCase(createKyselyAccessRepository(firstConnection));
    const now = { value: new Date('2026-09-07T14:00:01.000Z') };
    const resolver = new ResolveOperationalSessionUseCase(
      repositoryA,
      userReader,
      applicableUsers,
      tokenService,
      () => new Date(now.value),
    );
    const createMaterialSession = async (
      id,
      occurredAt = '2026-09-07T14:00:00.000Z',
      expectedOverride = undefined,
    ) => {
      const material = tokenService.issue();
      const expectedSessionId = expectedOverride === undefined
        ? null
        : expectedOverride;
      const userVersion = (await admin.query(
        'select version from users where tenant_id=$1 and user_id=$2',
        [tenantA, userA],
      )).rows[0].version;
      const userAdmissionRevision = (await admin.query(
        'select admission_revision from users where tenant_id=$1 and user_id=$2',
        [tenantA, userA],
      )).rows[0].admission_revision;
      const credentialVersion = (await admin.query(
        'select credential_version from access_pin_credentials where tenant_id=$1 and user_id=$2',
        [tenantA, userA],
      )).rows[0].credential_version;
      await repositoryA.createForProfile(
        contextA,
        {
          ...tokenInput(id, material, occurredAt),
          expectedSessionId,
          userVersion,
          userAdmissionRevision,
          credentialVersion,
        },
      );
      return material;
    };
    const resolveMaterial = (material) => resolver.execute(contextA, {
      bearer: material.bearer,
      csrfCookie: material.csrf,
      touch: false,
    });
    const persistedStatus = async (id) => (await admin.query(
      'select status from access_operational_sessions where tenant_id=$1 and session_id=$2',
      [tenantA, id],
    )).rows[0]?.status;

    const plaintextMaterial = await createMaterialSession(
      '86000000-0000-4000-8000-000000000034',
      '2026-09-07T14:00:00.000Z',
      null,
    );
    const stationSiblingMaterial = await createMaterialSession(
      '86100000-0000-4000-8000-000000000034',
    );
    const storedVerifier = (await admin.query(
      "select encode(token_verifier,'hex') token_hex, encode(csrf_verifier,'hex') csrf_hex, row_to_json(access_operational_sessions)::text serialized from access_operational_sessions where tenant_id=$1 and session_id=$2",
      [tenantA, '86000000-0000-4000-8000-000000000034'],
    )).rows[0];
    assert.equal(storedVerifier.token_hex, Buffer.from(plaintextMaterial.bearerVerifier).toString('hex'));
    assert.equal(storedVerifier.csrf_hex, Buffer.from(plaintextMaterial.csrfVerifier).toString('hex'));
    assert.doesNotMatch(storedVerifier.serialized, new RegExp(plaintextMaterial.bearer, 'u'));
    assert.doesNotMatch(storedVerifier.serialized, new RegExp(plaintextMaterial.csrf, 'u'));
    assert.equal(await repositoryA.findByBearerVerifier(
      await stationContext(admin, tenantB, branchB, stationB, stationCredentialB),
      plaintextMaterial.bearerVerifier,
    ), null);

    await admin.query("update stations set status='revoked',revoked_at=clock_timestamp(),updated_at=clock_timestamp() where tenant_id=$1 and station_id=$2", [tenantA, stationA]);
    assert.equal(await persistedStatus('86000000-0000-4000-8000-000000000034'), 'active');
    await admin.query("update stations set status='active',revoked_at=null,updated_at=clock_timestamp() where tenant_id=$1 and station_id=$2", [tenantA, stationA]);
    contextA = await stationContext(admin, tenantA, branchA, stationA, stationCredentialA);
    await assert.rejects(resolveMaterial(plaintextMaterial), OperationalSessionError);
    await assert.rejects(resolveMaterial(stationSiblingMaterial), OperationalSessionError);
    assert.equal(await persistedStatus('86000000-0000-4000-8000-000000000034'), 'invalidated');
    assert.equal(await persistedStatus('86100000-0000-4000-8000-000000000034'), 'invalidated');

    const bindingMaterial = await createMaterialSession('87000000-0000-4000-8000-000000000034');
    const bindingSiblingMaterial = await createMaterialSession('87100000-0000-4000-8000-000000000034');
    await admin.query('update station_bindings set revoked_at=clock_timestamp() where tenant_id=$1 and station_id=$2', [tenantA, stationA]);
    assert.equal(await persistedStatus('87000000-0000-4000-8000-000000000034'), 'active');
    await admin.query('update station_bindings set revoked_at=null where tenant_id=$1 and station_id=$2', [tenantA, stationA]);
    contextA = await stationContext(admin, tenantA, branchA, stationA, stationCredentialA);
    await assert.rejects(resolveMaterial(bindingMaterial), OperationalSessionError);
    await assert.rejects(resolveMaterial(bindingSiblingMaterial), OperationalSessionError);
    assert.equal(await persistedStatus('87000000-0000-4000-8000-000000000034'), 'invalidated');
    assert.equal(await persistedStatus('87100000-0000-4000-8000-000000000034'), 'invalidated');

    const branchMaterial = await createMaterialSession('88000000-0000-4000-8000-000000000034');
    await admin.query('update branches set active=false where tenant_id=$1 and branch_id=$2', [tenantA, branchA]);
    assert.equal(await persistedStatus('88000000-0000-4000-8000-000000000034'), 'active');
    await admin.query('update branches set active=true where tenant_id=$1 and branch_id=$2', [tenantA, branchA]);
    contextA = await stationContext(admin, tenantA, branchA, stationA, stationCredentialA);
    await assert.rejects(resolveMaterial(branchMaterial), OperationalSessionError);
    assert.equal(await persistedStatus('88000000-0000-4000-8000-000000000034'), 'invalidated');

    const alternateCredentialMaterial = await createMaterialSession('88500000-0000-4000-8000-000000000034');
    await admin.query("update station_credentials set credential_hash='station-a-alternate-rotated' where tenant_id=$1 and credential_id=$2", [tenantA, stationCredentialAAlternate]);
    await admin.query("update station_credentials set credential_hash='station-a-alternate-hash' where tenant_id=$1 and credential_id=$2", [tenantA, stationCredentialAAlternate]);
    assert.equal((await resolveMaterial(alternateCredentialMaterial)).userId, userA);

    const credentialMaterial = await createMaterialSession('89000000-0000-4000-8000-000000000034');
    const credentialSiblingMaterial = await createMaterialSession('89100000-0000-4000-8000-000000000034');
    await admin.query("update station_credentials set credential_hash='station-a-rotated' where tenant_id=$1 and credential_id=$2", [tenantA, stationCredentialA]);
    assert.equal(await persistedStatus('89000000-0000-4000-8000-000000000034'), 'active');
    await admin.query("update station_credentials set credential_hash='station-a-hash' where tenant_id=$1 and credential_id=$2", [tenantA, stationCredentialA]);
    contextA = await stationContext(admin, tenantA, branchA, stationA, stationCredentialA);
    await assert.rejects(resolveMaterial(credentialMaterial), OperationalSessionError);
    await assert.rejects(resolveMaterial(credentialSiblingMaterial), OperationalSessionError);
    assert.equal(await persistedStatus('89000000-0000-4000-8000-000000000034'), 'invalidated');
    assert.equal(await persistedStatus('89100000-0000-4000-8000-000000000034'), 'invalidated');

    const userMaterial = await createMaterialSession('90000000-0000-4000-8000-000000000034');
    const userSiblingMaterial = await createMaterialSession('90100000-0000-4000-8000-000000000034');
    assert.equal((await resolveMaterial(userMaterial)).userId, userA);
    await admin.query("update users set status='inactive',version=version+1,updated_at=clock_timestamp() where tenant_id=$1 and user_id=$2", [tenantA, userA]);
    await admin.query("update users set status='active',version=version+1,updated_at=clock_timestamp() where tenant_id=$1 and user_id=$2", [tenantA, userA]);
    await assert.rejects(resolveMaterial(userMaterial), OperationalSessionError);
    await assert.rejects(resolveMaterial(userSiblingMaterial), OperationalSessionError);
    assert.equal(await persistedStatus('90000000-0000-4000-8000-000000000034'), 'invalidated');
    assert.equal(await persistedStatus('90100000-0000-4000-8000-000000000034'), 'invalidated');
    assert.equal(await persistedStatus(differentUser.sessionId), 'active');

    const roleMaterial = tokenService.issue();
    await repositoryA.createForProfile(
      contextA,
      {
        ...tokenInput('90500000-0000-4000-8000-000000000034', roleMaterial),
        expectedSessionId: null,
        userVersion: 2,
        userAdmissionRevision: 4,
      },
    );
    await admin.query("update access_roles set status='disabled',version=version+1,updated_at=clock_timestamp() where tenant_id=$1 and role_id=$2", [tenantA, roleA]);
    assert.equal(await persistedStatus('90500000-0000-4000-8000-000000000034'), 'invalidated');
    await admin.query("update access_roles set status='active',version=version+1,updated_at=clock_timestamp() where tenant_id=$1 and role_id=$2", [tenantA, roleA]);

    const assignmentMaterial = tokenService.issue();
    await repositoryA.createForProfile(
      contextA,
      {
        ...tokenInput('91000000-0000-4000-8000-000000000034', assignmentMaterial),
        expectedSessionId: null,
        userVersion: 2,
        userAdmissionRevision: 4,
      },
    );
    await admin.query("update access_role_assignments set status='revoked',version=version+1,revoked_at=clock_timestamp() where tenant_id=$1 and assignment_id=$2", [tenantA, assignmentA]);
    assert.equal(await persistedStatus('91000000-0000-4000-8000-000000000034'), 'invalidated');
    await assert.rejects(resolveMaterial(assignmentMaterial), OperationalSessionError);
    await admin.query("update access_role_assignments set status='active',version=version+1,revoked_at=null where tenant_id=$1 and assignment_id=$2", [tenantA, assignmentA]);
    await assert.rejects(resolveMaterial(assignmentMaterial), OperationalSessionError);

    const unaffectedUserSession = await repositoryA.createForProfile(contextA, {
      ...input(
        '91500000-0000-4000-8000-000000000034',
        27,
        '2026-09-07T14:00:00.000Z',
      ),
      userId: userASecond,
    });

    const pinMaterial = tokenService.issue();
    const pinSiblingMaterial = tokenService.issue();
    await repositoryA.createForProfile(
      contextA,
      {
        ...tokenInput('92000000-0000-4000-8000-000000000034', pinMaterial),
        expectedSessionId: null,
        userVersion: 2,
        userAdmissionRevision: 4,
      },
    );
    await repositoryA.createForProfile(
      contextA,
      {
        ...tokenInput('92100000-0000-4000-8000-000000000034', pinSiblingMaterial),
        expectedSessionId: null,
        userVersion: 2,
        userAdmissionRevision: 4,
      },
    );
    await admin.query("update access_pin_credentials set status='revoked',revoked_at=clock_timestamp(),updated_at=clock_timestamp() where tenant_id=$1 and user_id=$2", [tenantA, userA]);
    assert.equal(await persistedStatus('92000000-0000-4000-8000-000000000034'), 'invalidated');
    assert.equal(await persistedStatus('92100000-0000-4000-8000-000000000034'), 'invalidated');
    assert.equal(await persistedStatus(unaffectedUserSession.sessionId), 'active');
    await assert.rejects(resolveMaterial(pinMaterial), OperationalSessionError);
    await assert.rejects(resolveMaterial(pinSiblingMaterial), OperationalSessionError);
    await admin.query("update access_pin_credentials set status='active',revoked_at=null,updated_at=clock_timestamp() where tenant_id=$1 and user_id=$2", [tenantA, userA]);
    await assert.rejects(resolveMaterial(pinMaterial), OperationalSessionError);
    await assert.rejects(
      repositoryA.createForProfile(
        contextA,
        {
          ...tokenInput('92500000-0000-4000-8000-000000000034', tokenService.issue()),
          expectedSessionId: null,
          userVersion: 2,
          userAdmissionRevision: 4,
        },
      ),
      OperationalSessionAdmissionError,
    );

    const csrfSessionA = await createMaterialSession('92600000-0000-4000-8000-000000000034');
    const csrfSessionB = await createMaterialSession('92700000-0000-4000-8000-000000000034');
    assert.equal(await repositoryA.closeAuthenticated(contextA, {
      bearerVerifier: csrfSessionB.bearerVerifier,
      csrfVerifier: csrfSessionA.csrfVerifier,
      status: 'logged_out',
      occurredAt: '2026-09-07T14:00:09.000Z',
    }), false);
    assert.equal(await persistedStatus('92600000-0000-4000-8000-000000000034'), 'active');
    assert.equal(await persistedStatus('92700000-0000-4000-8000-000000000034'), 'active');
    assert.equal((await resolveMaterial(csrfSessionB)).sessionId, '92700000-0000-4000-8000-000000000034');

    const raceMaterial = await createMaterialSession('93000000-0000-4000-8000-000000000034');
    const raceBefore = await repositoryA.findByBearerVerifier(contextA, raceMaterial.bearerVerifier);
    assert.ok(raceBefore);
    assert.equal(await repositoryA.closeAuthenticated(wrongBranch, {
      bearerVerifier: raceMaterial.bearerVerifier,
      csrfVerifier: raceMaterial.csrfVerifier,
      status: 'logged_out',
      occurredAt: '2026-09-07T14:00:09.000Z',
    }), false);
    assert.equal(await repositoryA.closeAuthenticated(contextA, {
      bearerVerifier: raceMaterial.bearerVerifier,
      csrfVerifier: Buffer.alloc(32, 0xff),
      status: 'logged_out',
      occurredAt: '2026-09-07T14:00:09.000Z',
    }), false);
    assert.equal(await persistedStatus('93000000-0000-4000-8000-000000000034'), 'active');
    const closeTouchBarrier = await beginSessionRowBarrier(admin, raceBefore.sessionId);
    const closeTouchPromise = Promise.all([
      repositoryA.closeAuthenticated(contextA, {
        bearerVerifier: raceMaterial.bearerVerifier,
        csrfVerifier: raceMaterial.csrfVerifier,
        status: 'logged_out',
        occurredAt: '2026-09-07T14:00:11.000Z',
      }),
      repositoryB.confirmActive(contextA, {
        sessionId: raceBefore.sessionId,
        expectedVersion: raceBefore.version,
        occurredAt: '2026-09-07T14:00:10.000Z',
        recordActivity: true,
      }),
    ]);
    try {
      await waitForApplicationLocks(
        admin,
        ['srtaller-access-session-pg-a', 'srtaller-access-session-pg-b'],
        2,
      );
    } finally {
      await closeTouchBarrier.query('commit').catch(() => undefined);
      closeTouchBarrier.release();
    }
    const [closed, racedTouch] = await closeTouchPromise;
    assert.equal(closed, true);
    assert.ok(racedTouch === null || racedTouch.status === 'active');
    const raceAfter = (await admin.query(
      'select status,version,last_activity_at from access_operational_sessions where tenant_id=$1 and session_id=$2',
      [tenantA, raceBefore.sessionId],
    )).rows[0];
    assert.equal(raceAfter.status, 'logged_out');
    assert.equal(await persistedStatus('93000000-0000-4000-8000-000000000034'), 'logged_out');
    await assert.rejects(resolveMaterial(raceMaterial), OperationalSessionError);

    const idleMaterial = await createMaterialSession(
      '94000000-0000-4000-8000-000000000034',
      '2026-09-07T15:00:00.000Z',
      null,
    );
    now.value = new Date('2026-09-07T15:59:59.999Z');
    assert.equal((await resolveMaterial(idleMaterial)).userId, userA);
    assert.equal(await persistedStatus('94000000-0000-4000-8000-000000000034'), 'active');
    now.value = new Date('2026-09-07T16:00:00.000Z');
    await assert.rejects(resolveMaterial(idleMaterial), OperationalSessionError);
    assert.equal(await persistedStatus('94000000-0000-4000-8000-000000000034'), 'expired');
    await createMaterialSession(
      '94200000-0000-4000-8000-000000000034',
      '2026-09-07T16:00:00.000Z',
      null,
    );
    assert.equal(await persistedStatus('94200000-0000-4000-8000-000000000034'), 'active');

    const absoluteMaterial = await createMaterialSession(
      '94300000-0000-4000-8000-000000000034',
      '2026-09-07T17:00:00.000Z',
      null,
    );
    await admin.query(
      'update access_operational_sessions set last_activity_at=$3 where tenant_id=$1 and session_id=$2',
      [tenantA, '94300000-0000-4000-8000-000000000034', '2026-09-08T04:59:59.999Z'],
    );
    now.value = new Date('2026-09-08T05:00:00.000Z');
    await assert.rejects(resolveMaterial(absoluteMaterial), OperationalSessionError);
    assert.equal(await persistedStatus('94300000-0000-4000-8000-000000000034'), 'expired');

    const transitionA = tokenService.issue();
    await repositoryA.createForProfile(contextA, {
      ...tokenInput(
        '95000000-0000-4000-8000-000000000034',
        transitionA,
        '2026-09-07T16:00:01.000Z',
      ),
      expectedSessionId: '94200000-0000-4000-8000-000000000034',
      userVersion: 2,
      userAdmissionRevision: 4,
      credentialVersion: 5,
    });
    const transitionB = tokenService.issue();
    const switchLogoutBarrier = await beginSessionRowBarrier(
      admin,
      '95000000-0000-4000-8000-000000000034',
    );
    const switchLogoutPromise = Promise.allSettled([
      repositoryA.createForProfile(contextA, {
        ...tokenInput(
          '95100000-0000-4000-8000-000000000034',
          transitionB,
          '2026-09-07T16:00:02.000Z',
        ),
        expectedSessionId: '95000000-0000-4000-8000-000000000034',
        userVersion: 2,
        userAdmissionRevision: 4,
        credentialVersion: 5,
      }),
      repositoryB.closeAuthenticated(contextA, {
        bearerVerifier: transitionA.bearerVerifier,
        csrfVerifier: transitionA.csrfVerifier,
        status: 'logged_out',
        occurredAt: '2026-09-07T16:00:02.000Z',
      }),
    ]);
    try {
      await waitForApplicationLocks(
        admin,
        ['srtaller-access-session-pg-a', 'srtaller-access-session-pg-b'],
        2,
      );
    } finally {
      await switchLogoutBarrier.query('commit').catch(() => undefined);
      switchLogoutBarrier.release();
    }
    const [createTransition, closeTransition] = await switchLogoutPromise;
    const createWon = createTransition.status === 'fulfilled';
    const closeWon = closeTransition.status === 'fulfilled' && closeTransition.value;
    assert.equal(Number(createWon) + Number(closeWon), 1);
    if (createWon) {
      assert.equal(closeTransition.status, 'fulfilled');
      assert.equal(closeTransition.value, false);
      assert.equal(await persistedStatus('95000000-0000-4000-8000-000000000034'), 'replaced');
      assert.equal(await persistedStatus('95100000-0000-4000-8000-000000000034'), 'active');
    } else {
      assert.ok(createTransition.reason instanceof OperationalSessionAdmissionError);
      assert.equal(await persistedStatus('95000000-0000-4000-8000-000000000034'), 'logged_out');
      assert.equal(await persistedStatus('95100000-0000-4000-8000-000000000034'), undefined);
    }

    const currentCredentialVersion = (await admin.query(
      'select credential_version from access_pin_credentials where tenant_id=$1 and user_id=$2',
      [tenantA, userA],
    )).rows[0].credential_version;
    await createMaterialSession(
      '95400000-0000-4000-8000-000000000034',
      '2026-09-07T16:00:03.000Z',
      null,
    );
    await createMaterialSession(
      '95500000-0000-4000-8000-000000000034',
      '2026-09-07T16:00:03.000Z',
      null,
    );
    const credentialInvalidations = await repositoryA.invalidateByCredentialVersion(
      { tenantId: tenantA },
      {
        userId: userA,
        credentialVersion: currentCredentialVersion,
        occurredAt: '2026-09-07T16:00:04.000Z',
      },
    );
    assert.ok(credentialInvalidations >= 2);
    assert.equal(await persistedStatus('95400000-0000-4000-8000-000000000034'), 'invalidated');
    assert.equal(await persistedStatus('95500000-0000-4000-8000-000000000034'), 'invalidated');
    assert.equal(await persistedStatus(unaffectedUserSession.sessionId), 'active');

    await createMaterialSession(
      '95600000-0000-4000-8000-000000000034',
      '2026-09-07T16:00:05.000Z',
      null,
    );
    await createMaterialSession(
      '95700000-0000-4000-8000-000000000034',
      '2026-09-07T16:00:05.000Z',
      null,
    );
    assert.equal(
      await repositoryA.invalidateByUser(
        { tenantId: tenantA },
        { userId: userA, occurredAt: '2026-09-07T16:00:06.000Z' },
      ),
      2,
    );
    const exactMaterial = await createMaterialSession(
      '95800000-0000-4000-8000-000000000034',
      '2026-09-07T16:00:07.000Z',
      null,
    );
    const exactBefore = await repositoryA.findByBearerVerifier(
      contextA,
      exactMaterial.bearerVerifier,
    );
    assert.ok(exactBefore);
    assert.equal(await repositoryA.invalidateOne(
      { tenantId: tenantA },
      {
        sessionId: exactBefore.sessionId,
        expectedVersion: exactBefore.version,
        occurredAt: '2026-09-07T16:00:08.000Z',
      },
    ), true);
    assert.equal(await repositoryA.invalidateOne(
      { tenantId: tenantA },
      {
        sessionId: exactBefore.sessionId,
        expectedVersion: exactBefore.version,
        occurredAt: '2026-09-07T16:00:08.000Z',
      },
    ), false);

    await createMaterialSession(
      '96000000-0000-4000-8000-000000000034',
      '2026-09-07T16:01:00.000Z',
      null,
    );
    await createMaterialSession(
      '96100000-0000-4000-8000-000000000034',
      '2026-09-07T16:01:00.000Z',
      null,
    );
    const activeBeforeRollback = (await admin.query(
      "select count(*)::integer count from access_operational_sessions where tenant_id=$1 and station_id=$2 and status='active'",
      [tenantA, stationA],
    )).rows[0].count;
    assert.ok(activeBeforeRollback >= 2);
    const catalogIdentityMigration = [...(await runner.getMigrationStatus()).migrations]
      .reverse()
      .find(({ state }) => state === 'applied');
    assert.equal(
      catalogIdentityMigration?.name,
      '20260913130000_catalog_enforce_reference_identity',
    );
    await runner.migrateDown(authorization(catalogIdentityMigration));
    const repairsSafeDeleteMigration = [...(await runner.getMigrationStatus()).migrations]
      .reverse()
      .find(({ state }) => state === 'applied');
    assert.equal(
      repairsSafeDeleteMigration?.name,
      '20260913121000_repairs_add_reference_safe_delete',
    );
    await runner.migrateDown(authorization(repairsSafeDeleteMigration));
    const catalogSafeDeleteMigration = [...(await runner.getMigrationStatus()).migrations]
      .reverse()
      .find(({ state }) => state === 'applied');
    assert.equal(
      catalogSafeDeleteMigration?.name,
      '20260913120000_catalog_add_reference_safe_delete',
    );
    await runner.migrateDown(authorization(catalogSafeDeleteMigration));
    const catalogMigration = [...(await runner.getMigrationStatus()).migrations]
      .reverse()
      .find(({ state }) => state === 'applied');
    assert.equal(
      catalogMigration?.name,
      '20260912210000_catalog_unify_pending_reference_reconciliation',
    );
    await runner.migrateDown(authorization(catalogMigration));
    const latestMigration = [...(await runner.getMigrationStatus()).migrations]
      .reverse()
      .find(({ state }) => state === 'applied');
    assert.equal(
      latestMigration?.name,
      '20260912180000_access_enable_concurrent_operational_sessions',
    );
    await assert.rejects(
      runner.migrateDown(authorization(latestMigration)),
      (error) => error?.code === 'DATABASE_MIGRATION_DOWN_FAILED',
    );
    assert.equal(
      (await admin.query(
        "select count(*)::integer count from access_operational_sessions where tenant_id=$1 and station_id=$2 and status='active'",
        [tenantA, stationA],
      )).rows[0].count,
      activeBeforeRollback,
    );

    assert.equal(
      await repositoryA.invalidateByStation(
        { tenantId: tenantA },
        { stationId: stationA, occurredAt: '2026-09-07T16:02:00.000Z' },
      ),
      activeBeforeRollback,
    );
    await createMaterialSession(
      '96200000-0000-4000-8000-000000000034',
      '2026-09-07T16:03:00.000Z',
      null,
    );
    const recoveryRunner = createMigrationRunner(migrationConnection, {
      expectedManifestHash: inspection.manifest.aggregateSha256,
      [databaseMigrationSourceOverride]: source(),
    });
    const safeDown = await recoveryRunner.migrateDown(authorization(latestMigration));
    assert.equal(safeDown.results[0]?.status, 'Success');
    const rollbackIndexes = (await admin.query(
      "select indexname from pg_indexes where schemaname='public' and tablename='access_operational_sessions' order by indexname",
    )).rows.map(({ indexname }) => indexname);
    assert.ok(rollbackIndexes.includes('access_operational_sessions_one_active_station_uq'));
    assert.ok(!rollbackIndexes.includes('access_operational_sessions_active_station_idx'));
    const restored = await recoveryRunner.migrateUp();
    assert.equal(restored.results[0]?.status, 'Success');
    assert.equal(await persistedStatus('96200000-0000-4000-8000-000000000034'), 'active');
  } finally {
    await Promise.allSettled([firstConnection.close(), secondConnection.close(), migrationConnection.close()]);
    await reset(admin).catch(() => undefined);
    await admin.end();
  }
});
