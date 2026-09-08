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
const { createKyselyAccessRepository } = enabled
  ? await import('../dist/modules/access/infrastructure/persistence/kysely-access.repository.js')
  : {};
const { AccessPersistenceError } = enabled
  ? await import('../dist/modules/access/application/ports/access-repository.port.js')
  : {};
const { KyselyAdministrationAuthorizationCommitGuard } = enabled
  ? await import('../dist/modules/access/infrastructure/persistence/kysely-administration-authorization-commit.guard.js')
  : {};

const migrationRoot = fileURLToPath(
  new URL('../dist/infrastructure/database/migrations/', import.meta.url),
);
const accessTables = [
  'access_role_commands',
  'access_role_assignment_commands',
  'access_role_assignments',
  'access_role_capabilities',
  'access_roles',
  'access_capabilities',
  'access_pin_eligibility_tenant_guards',
];
const tables = [
  'repair_operational_note_request_guards',
  'repair_business_audit_events',
  'access_operational_sessions',
  'access_operational_session_station_guards',
  ...accessTables,
  'user_lifecycle_commands',
  'user_profile_update_commands',
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

const tenantA = '10000000-0000-4000-8000-000000000033';
const tenantB = '20000000-0000-4000-8000-000000000033';
const branchA = '30000000-0000-4000-8000-000000000033';
const branchA2 = '31000000-0000-4000-8000-000000000033';
const branchB = '40000000-0000-4000-8000-000000000033';
const sharedAdminUser = '50000000-0000-4000-8000-000000000033';
const technicianUserA = '51000000-0000-4000-8000-000000000033';
const concurrentUserA = '52000000-0000-4000-8000-000000000033';
const userOnlyB = '53000000-0000-4000-8000-000000000033';
const idempotentUserA = '54000000-0000-4000-8000-000000000033';
const sharedAdminRole = '60000000-0000-4000-8000-000000000033';
const technicianRoleA = '61000000-0000-4000-8000-000000000033';
const roleOnlyB = '62000000-0000-4000-8000-000000000033';
const adminAssignmentA = '70000000-0000-4000-8000-000000000033';
const technicianAssignmentA = '71000000-0000-4000-8000-000000000033';
const adminAssignmentB = '72000000-0000-4000-8000-000000000033';
const concurrentAssignmentA = '73000000-0000-4000-8000-000000000033';
const competingAssignmentA = '74000000-0000-4000-8000-000000000033';
const idempotentAssignmentA = '79000000-0000-4000-8000-000000000033';
const idempotentCompetingAssignmentA =
  '7a000000-0000-4000-8000-000000000033';
const secondRoleAssignmentB = '7b000000-0000-4000-8000-000000000033';
const rollbackAssignmentB = '7c000000-0000-4000-8000-000000000033';
const deniedAssignmentA = '7d000000-0000-4000-8000-000000000033';
const assignAdminRequestA = '80000000-0000-4000-8000-000000000033';
const assignTechnicianRequestA = '81000000-0000-4000-8000-000000000033';
const assignAdminRequestB = '82000000-0000-4000-8000-000000000033';
const concurrentRequestA = '83000000-0000-4000-8000-000000000033';
const competingRequestA = '84000000-0000-4000-8000-000000000033';
const staleRevokeRequestA = '85000000-0000-4000-8000-000000000033';
const revokeRequestA = '86000000-0000-4000-8000-000000000033';
const secondRevokeRequestA = '87000000-0000-4000-8000-000000000033';
const crossTenantRequest = '88000000-0000-4000-8000-000000000033';
const crossUserRequest = '89000000-0000-4000-8000-000000000033';
const crossRoleRequest = '8a000000-0000-4000-8000-000000000033';
const crossBranchRequest = '8b000000-0000-4000-8000-000000000033';
const idempotentAssignRequestA = '8c000000-0000-4000-8000-000000000033';
const secondRoleRequestB = '8d000000-0000-4000-8000-000000000033';
const rollbackAssignRequestB = '8e000000-0000-4000-8000-000000000033';
const rollbackRevokeRequestA = '8f000000-0000-4000-8000-000000000033';
const deniedAssignRequestA = '9f000000-0000-4000-8000-000000000033';
const continuityRequestA = '9e000000-0000-4000-8000-000000000033';
const authorityRaceRequestA = '9d000000-0000-4000-8000-000000000033';
const unusableAdminRequestA = '9c000000-0000-4000-8000-000000000033';

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
      applicationName: 'srtaller-access-postgresql-review',
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
    reason: 'verify Access role and capability migration reversal',
    environment: 'development',
    confirmation: 'REVERT_ONE_MIGRATION',
  });
}

function assignment(overrides = {}) {
  return Object.freeze({
    assignmentId: adminAssignmentA,
    userId: sharedAdminUser,
    roleId: sharedAdminRole,
    assignmentScope: 'TENANT_WIDE',
    branchId: null,
    clientRequestId: assignAdminRequestA,
    occurredAt: '2026-09-06T18:30:00.000Z',
    ...overrides,
  });
}

function revocation(overrides = {}) {
  return Object.freeze({
    assignmentId: technicianAssignmentA,
    expectedVersion: 0,
    clientRequestId: revokeRequestA,
    occurredAt: '2026-09-06T19:30:00.000Z',
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

async function assertAccessTables(admin, expected) {
  const result = await admin.query(
    `select tablename from pg_catalog.pg_tables
     where schemaname = 'public' and tablename = any($1::text[])
     order by tablename`,
    [accessTables],
  );
  assert.deepEqual(
    result.rows.map(({ tablename }) => tablename),
    [...expected].sort(),
  );
}

async function rejectsWithCode(promise, code) {
  await assert.rejects(
    promise,
    (error) => error instanceof AccessPersistenceError && error.code === code,
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
    `insert into users (
       tenant_id, user_id, display_name, operational_identifier,
       status, version, created_at, updated_at
     ) values
       ($1, $2, 'Administración A', 'admin-a', 'active', 0, now(), now()),
       ($1, $3, 'Técnico A', 'tecnico-a', 'active', 0, now(), now()),
       ($1, $4, 'Concurrente A', 'concurrente-a', 'active', 0, now(), now()),
       ($1, $7, 'Idempotente A', 'idempotente-a', 'active', 0, now(), now()),
       ($5, $2, 'Administración B', 'admin-b', 'active', 0, now(), now()),
       ($5, $6, 'Persona sólo B', 'persona-b', 'active', 0, now(), now())`,
    [
      tenantA,
      sharedAdminUser,
      technicianUserA,
      concurrentUserA,
      tenantB,
      userOnlyB,
      idempotentUserA,
    ],
  );
  await admin.query(
    `insert into access_roles (
       tenant_id, role_id, role_key, display_name, status, version,
       created_at, updated_at
     ) values
       ($1, $2, 'administrador', 'Administrador', 'active', 0, now(), now()),
       ($1, $3, 'tecnico', 'Técnico', 'active', 0, now(), now()),
       ($4, $2, 'administrador', 'Administrador', 'active', 0, now(), now()),
       ($4, $5, 'solo_b', 'Sólo B', 'active', 0, now(), now())`,
    [tenantA, sharedAdminRole, technicianRoleA, tenantB, roleOnlyB],
  );
  await admin.query(
    `insert into access_role_capabilities (
       tenant_id, role_id, capability_code, created_at
     ) values
       ($1, $2, 'users.read', now()),
       ($1, $2, 'access_matrix.read', now()),
       ($1, $2, 'repairs.read', now()),
       ($1, $2, 'repairs.add_note', now()),
       ($1, $2, 'users.manage', now()),
       ($1, $2, 'access_matrix.manage', now()),
       ($1, $3, 'repairs.read', now()),
       ($1, $3, 'repairs.add_note', now()),
       ($4, $2, 'users.read', now()),
       ($4, $5, 'users.read', now()),
       ($4, $5, 'repairs.read', now())`,
    [tenantA, sharedAdminRole, technicianRoleA, tenantB, roleOnlyB],
  );
  await admin.query(
    `insert into access_pin_credentials (
       tenant_id, user_id, credential_id, status, algorithm,
       profile_version, pepper_version, memory_kib, passes, parallelism,
       salt, verifier, lookup_digest, credential_version,
       consecutive_failures, created_at, updated_at
     ) values (
       $1, $2, gen_random_uuid(), 'active', 'argon2id',
       1, 1, 65536, 3, 4,
       $3, $4, $5, 0,
       0, now(), now()
     )`,
    [
      tenantA,
      sharedAdminUser,
      Buffer.alloc(16, 1),
      Buffer.alloc(32, 2),
      Buffer.alloc(32, 3),
    ],
  );
}

test(
  'PostgreSQL 18.4 enforces tenant-scoped roles, capabilities, assignments, and read models',
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
    const repository = createKyselyAccessRepository(connection);

    try {
      await resetDatabase(admin);
      await assertNoObjects(admin);

      const applied = await runner.migrateToLatest();
      assert.equal(applied.status.migrations.length, 30);
      assert.ok(
        applied.status.migrations.every(({ state }) => state === 'applied'),
      );
      await assertAccessTables(admin, accessTables);

      const idempotentApply = await runner.migrateToLatest();
      assert.deepEqual(idempotentApply.results, []);

      const catalog = await admin.query(
        `select capability_code, created_at
         from access_capabilities
         order by capability_code`,
      );
      assert.deepEqual(
        catalog.rows.map(({ capability_code }) => capability_code),
        [
          'access_matrix.manage',
          'access_matrix.read',
          'repairs.add_note',
          'repairs.read',
          'users.manage',
          'users.read',
        ],
      );
      assert.deepEqual(
        catalog.rows.map(({ capability_code, created_at }) => ({
          capabilityCode: capability_code,
          createdAt: created_at.toISOString(),
        })),
        [
          { capabilityCode: 'access_matrix.manage', createdAt: '2026-09-07T23:00:00.000Z' },
          { capabilityCode: 'access_matrix.read', createdAt: '2026-09-06T18:00:00.000Z' },
          { capabilityCode: 'repairs.add_note', createdAt: '2026-09-06T18:00:00.000Z' },
          { capabilityCode: 'repairs.read', createdAt: '2026-09-06T18:00:00.000Z' },
          { capabilityCode: 'users.manage', createdAt: '2026-09-07T23:00:00.000Z' },
          { capabilityCode: 'users.read', createdAt: '2026-09-06T18:00:00.000Z' },
        ],
      );
      await assert.rejects(
        admin.query(
          `insert into access_capabilities (capability_code, created_at)
           values ('sessions.start', now())`,
        ),
        (error) => error?.code === '23514',
      );

      await seedAuthorities(admin);

      await rejectsWithCode(
        repository.assignRole(
          { tenantId: tenantA },
          assignment({
            assignmentId: deniedAssignmentA,
            clientRequestId: deniedAssignRequestA,
          }),
          { async confirmCurrent() { return false; } },
        ),
        'ACCESS_AUTHORIZATION_CHANGED',
      );
      assert.equal(
        Number((await admin.query(
          `select count(*) from access_role_assignments
           where tenant_id = $1 and assignment_id = $2`,
          [tenantA, deniedAssignmentA],
        )).rows[0].count),
        0,
      );

      await assert.rejects(
        admin.query(
          `insert into access_role_capabilities (
             tenant_id, role_id, capability_code, created_at
           ) values ($1, $2, 'repairs.read', now())`,
          [tenantA, roleOnlyB],
        ),
        (error) => error?.code === '23503',
      );
      await assert.rejects(
        admin.query(
          `insert into access_role_assignments (
             tenant_id, assignment_id, user_id, role_id, assignment_scope,
             branch_id, status, version, assigned_at, revoked_at
           ) values ($1, $2, $3, $4, 'TENANT_WIDE', $5, 'active', 0, now(), null)`,
          [
            tenantA,
            '75000000-0000-4000-8000-000000000033',
            sharedAdminUser,
            sharedAdminRole,
            branchA,
          ],
        ),
        (error) => error?.code === '23514',
      );

      const assignedAdminA = await repository.assignRole(
        { tenantId: tenantA },
        assignment(),
      );
      assert.equal(assignedAdminA.status, 'active');
      assert.equal(assignedAdminA.version, 0);

      const administrationGuard = new KyselyAdministrationAuthorizationCommitGuard();
      const authorityGuard = Object.freeze({
        confirmCurrent: (transactionContext) => administrationGuard.confirmCurrent(
          { tenantId: tenantA, userId: sharedAdminUser },
          'access_matrix.manage',
          transactionContext,
        ),
        confirmContinuity: (transactionContext) => administrationGuard.confirmContinuity(
          { tenantId: tenantA, userId: sharedAdminUser },
          transactionContext,
        ),
      });
      await admin.query(
        `update access_pin_credentials
         set lookup_digest = null
         where tenant_id = $1 and user_id = $2`,
        [tenantA, sharedAdminUser],
      );
      await rejectsWithCode(
        repository.replaceRoleCapabilities(
          { tenantId: tenantA },
          {
            roleId: sharedAdminRole,
            expectedVersion: 0,
            capabilityCodes: [
              'users.read',
              'users.manage',
              'access_matrix.read',
              'access_matrix.manage',
              'repairs.read',
              'repairs.add_note',
            ],
            clientRequestId: unusableAdminRequestA,
            occurredAt: new Date().toISOString(),
          },
          authorityGuard,
        ),
        'ACCESS_AUTHORIZATION_CHANGED',
      );
      await admin.query(
        `update access_pin_credentials
         set lookup_digest = $3
         where tenant_id = $1 and user_id = $2`,
        [tenantA, sharedAdminUser, Buffer.alloc(32, 3)],
      );
      await rejectsWithCode(
        repository.replaceRoleCapabilities(
          { tenantId: tenantA },
          {
            roleId: sharedAdminRole,
            expectedVersion: 0,
            capabilityCodes: [
              'users.read',
              'access_matrix.read',
              'access_matrix.manage',
              'repairs.read',
              'repairs.add_note',
            ],
            clientRequestId: continuityRequestA,
            occurredAt: new Date().toISOString(),
          },
          authorityGuard,
        ),
        'ACCESS_AUTHORIZATION_CHANGED',
      );
      assert.deepEqual(
        (
          await admin.query(
            `select version,
                    exists (
                      select 1 from access_role_capabilities
                      where tenant_id = $1 and role_id = $2
                        and capability_code = 'users.manage'
                    ) as users_manage
             from access_roles where tenant_id = $1 and role_id = $2`,
            [tenantA, sharedAdminRole],
          )
        ).rows,
        [{ version: 0, users_manage: true }],
      );

      const pendingAuthorityRace = repository.assignRole(
        { tenantId: tenantA },
        assignment({
          assignmentId: deniedAssignmentA,
          userId: concurrentUserA,
          roleId: technicianRoleA,
          clientRequestId: authorityRaceRequestA,
        }),
        {
          async confirmCurrent(transactionContext) {
            await admin.query(
              `delete from access_role_capabilities
               where tenant_id = $1 and role_id = $2
                 and capability_code = 'access_matrix.manage'`,
              [tenantA, sharedAdminRole],
            );
            return authorityGuard.confirmCurrent(transactionContext);
          },
          confirmContinuity: authorityGuard.confirmContinuity,
        },
      );
      await rejectsWithCode(pendingAuthorityRace, 'ACCESS_AUTHORIZATION_CHANGED');
      assert.equal(
        Number((await admin.query(
          `select count(*) from access_role_assignments
           where tenant_id = $1 and assignment_id = $2`,
          [tenantA, deniedAssignmentA],
        )).rows[0].count),
        0,
      );
      await admin.query(
        `insert into access_role_capabilities (
           tenant_id, role_id, capability_code, created_at
         ) values ($1, $2, 'access_matrix.manage', now())`,
        [tenantA, sharedAdminRole],
      );
      assert.deepEqual(
        await repository.assignRole({ tenantId: tenantA }, assignment()),
        assignedAdminA,
      );
      await rejectsWithCode(
        repository.assignRole(
          { tenantId: tenantA },
          assignment({ roleId: technicianRoleA }),
        ),
        'ACCESS_IDEMPOTENCY_CONFLICT',
      );

      const assignedTechnicianA = await repository.assignRole(
        { tenantId: tenantA },
        assignment({
          assignmentId: technicianAssignmentA,
          userId: technicianUserA,
          roleId: technicianRoleA,
          assignmentScope: 'BRANCH_RESTRICTED',
          branchId: branchA,
          clientRequestId: assignTechnicianRequestA,
          occurredAt: '2026-09-06T18:31:00.000Z',
        }),
      );
      assert.equal(assignedTechnicianA.branchId, branchA);

      const assignedAdminB = await repository.assignRole(
        { tenantId: tenantB },
        assignment({
          assignmentId: adminAssignmentB,
          clientRequestId: assignAdminRequestB,
          occurredAt: '2026-09-06T18:32:00.000Z',
        }),
      );
      assert.equal(assignedAdminB.tenantId, tenantB);

      const assignedSecondRoleB = await repository.assignRole(
        { tenantId: tenantB },
        assignment({
          assignmentId: secondRoleAssignmentB,
          roleId: roleOnlyB,
          clientRequestId: secondRoleRequestB,
          occurredAt: '2026-09-06T18:35:00.000Z',
        }),
      );
      assert.equal(assignedSecondRoleB.roleId, roleOnlyB);

      const competing = await Promise.allSettled([
        repository.assignRole(
          { tenantId: tenantA },
          assignment({
            assignmentId: concurrentAssignmentA,
            userId: concurrentUserA,
            roleId: technicianRoleA,
            assignmentScope: 'BRANCH_RESTRICTED',
            branchId: branchA,
            clientRequestId: concurrentRequestA,
            occurredAt: '2026-09-06T18:33:00.000Z',
          }),
        ),
        repository.assignRole(
          { tenantId: tenantA },
          assignment({
            assignmentId: competingAssignmentA,
            userId: concurrentUserA,
            roleId: technicianRoleA,
            assignmentScope: 'BRANCH_RESTRICTED',
            branchId: branchA,
            clientRequestId: competingRequestA,
            occurredAt: '2026-09-06T18:33:01.000Z',
          }),
        ),
      ]);
      assert.equal(
        competing.filter(({ status }) => status === 'fulfilled').length,
        1,
      );

      const idempotentReplay = await Promise.all([
        repository.assignRole(
          { tenantId: tenantA },
          assignment({
            assignmentId: idempotentAssignmentA,
            userId: idempotentUserA,
            roleId: technicianRoleA,
            assignmentScope: 'BRANCH_RESTRICTED',
            branchId: branchA,
            clientRequestId: idempotentAssignRequestA,
            occurredAt: '2026-09-06T18:34:00.000Z',
          }),
        ),
        repository.assignRole(
          { tenantId: tenantA },
          assignment({
            assignmentId: idempotentCompetingAssignmentA,
            userId: idempotentUserA,
            roleId: technicianRoleA,
            assignmentScope: 'BRANCH_RESTRICTED',
            branchId: branchA,
            clientRequestId: idempotentAssignRequestA,
            occurredAt: '2026-09-06T18:34:01.000Z',
          }),
        ),
      ]);
      assert.deepEqual(idempotentReplay[0], idempotentReplay[1]);
      assert.ok(
        [idempotentAssignmentA, idempotentCompetingAssignmentA].includes(
          idempotentReplay[0].assignmentId,
        ),
      );
      assert.deepEqual(
        (
          await admin.query(
            `select
               (select count(*)::integer from access_role_assignments
                where tenant_id = $1 and user_id = $2) as assignments,
               (select count(*)::integer from access_role_assignment_commands
                where tenant_id = $1 and client_request_id = $3) as commands`,
            [tenantA, idempotentUserA, idempotentAssignRequestA],
          )
        ).rows,
        [{ assignments: 1, commands: 1 }],
      );
      const assignmentLoser = competing.find(
        ({ status }) => status === 'rejected',
      );
      assert.ok(assignmentLoser);
      assert.ok(assignmentLoser.reason instanceof AccessPersistenceError);
      assert.equal(
        assignmentLoser.reason.code,
        'ACCESS_ASSIGNMENT_CONFLICT',
      );
      assert.equal(
        (
          await admin.query(
            `select count(*)::integer as count
             from access_role_assignments
             where tenant_id = $1 and user_id = $2 and status = 'active'`,
            [tenantA, concurrentUserA],
          )
        ).rows[0].count,
        1,
      );

      await rejectsWithCode(
        repository.assignRole(
          { tenantId: tenantA },
          assignment({
            assignmentId: '76000000-0000-4000-8000-000000000033',
            userId: userOnlyB,
            clientRequestId: crossUserRequest,
          }),
        ),
        'ACCESS_REFERENCE_NOT_FOUND',
      );

      await admin.query(
        `alter table access_role_assignment_commands
         add constraint access_commands_synthetic_rollback_ck
         check (client_request_id not in (
           '8e000000-0000-4000-8000-000000000033'::uuid,
           '8f000000-0000-4000-8000-000000000033'::uuid
         )) not valid`,
      );
      await rejectsWithCode(
        repository.assignRole(
          { tenantId: tenantB },
          assignment({
            assignmentId: rollbackAssignmentB,
            userId: userOnlyB,
            roleId: roleOnlyB,
            clientRequestId: rollbackAssignRequestB,
            occurredAt: '2026-09-06T18:40:00.000Z',
          }),
        ),
        'ACCESS_INPUT_INVALID',
      );
      assert.deepEqual(
        (
          await admin.query(
            `select
               (select count(*)::integer from access_role_assignments
                where tenant_id = $1 and assignment_id = $2) as assignments,
               (select count(*)::integer from access_role_assignment_commands
                where tenant_id = $1 and client_request_id = $3) as commands`,
            [tenantB, rollbackAssignmentB, rollbackAssignRequestB],
          )
        ).rows,
        [{ assignments: 0, commands: 0 }],
      );
      await rejectsWithCode(
        repository.revokeRoleAssignment(
          { tenantId: tenantA },
          revocation({
            assignmentId: adminAssignmentA,
            clientRequestId: rollbackRevokeRequestA,
            occurredAt: '2026-09-06T18:41:00.000Z',
          }),
        ),
        'ACCESS_INPUT_INVALID',
      );
      assert.deepEqual(
        (
          await admin.query(
            `select status, version, revoked_at
             from access_role_assignments
             where tenant_id = $1 and assignment_id = $2`,
            [tenantA, adminAssignmentA],
          )
        ).rows,
        [{ status: 'active', version: 0, revoked_at: null }],
      );
      assert.equal(
        (
          await admin.query(
            `select count(*)::integer as count
             from access_role_assignment_commands
             where tenant_id = $1 and client_request_id = $2`,
            [tenantA, rollbackRevokeRequestA],
          )
        ).rows[0].count,
        0,
      );
      await admin.query(
        `alter table access_role_assignment_commands
         drop constraint access_commands_synthetic_rollback_ck`,
      );
      await rejectsWithCode(
        repository.assignRole(
          { tenantId: tenantA },
          assignment({
            assignmentId: '77000000-0000-4000-8000-000000000033',
            roleId: roleOnlyB,
            clientRequestId: crossRoleRequest,
          }),
        ),
        'ACCESS_REFERENCE_NOT_FOUND',
      );
      await rejectsWithCode(
        repository.assignRole(
          { tenantId: tenantA },
          assignment({
            assignmentId: '78000000-0000-4000-8000-000000000033',
            userId: technicianUserA,
            roleId: technicianRoleA,
            assignmentScope: 'BRANCH_RESTRICTED',
            branchId: branchB,
            clientRequestId: crossBranchRequest,
          }),
        ),
        'ACCESS_REFERENCE_NOT_FOUND',
      );

      const matrixA = await repository.listMatrix({ tenantId: tenantA });
      const matrixB = await repository.listMatrix({ tenantId: tenantB });
      assert.deepEqual(
        matrixA.capabilities.map(({ capabilityCode }) => capabilityCode),
        [
          'access_matrix.manage',
          'access_matrix.read',
          'repairs.add_note',
          'repairs.read',
          'users.manage',
          'users.read',
        ],
      );
      assert.deepEqual(
        matrixA.roles.map(({ roleKey, capabilityCodes }) => ({
          roleKey,
          capabilityCodes,
        })),
        [
          {
            roleKey: 'administrador',
            capabilityCodes: [
              'users.read',
              'users.manage',
              'access_matrix.read',
              'access_matrix.manage',
              'repairs.read',
              'repairs.add_note',
            ],
          },
          {
            roleKey: 'tecnico',
            capabilityCodes: ['repairs.read', 'repairs.add_note'],
          },
        ],
      );
      assert.equal(matrixA.assignments.length, 4);
      assert.ok(
        matrixA.assignments.every(({ tenantId }) => tenantId === tenantA),
      );
      assert.deepEqual(
        matrixB.roles.map(({ roleKey, capabilityCodes }) => ({
          roleKey,
          capabilityCodes,
        })),
        [
          { roleKey: 'administrador', capabilityCodes: ['users.read'] },
          {
            roleKey: 'solo_b',
            capabilityCodes: ['users.read', 'repairs.read'],
          },
        ],
      );
      assert.deepEqual(
        matrixB.assignments.map(({ tenantId, userId, roleId }) => ({
          tenantId,
          userId,
          roleId,
        })),
        [
          {
            tenantId: tenantB,
            userId: sharedAdminUser,
            roleId: sharedAdminRole,
          },
          {
            tenantId: tenantB,
            userId: sharedAdminUser,
            roleId: roleOnlyB,
          },
        ],
      );

      assert.deepEqual(
        await repository.listApplicableUserIds({
          tenantId: tenantA,
          branchId: branchA,
        }),
        [sharedAdminUser, technicianUserA, concurrentUserA, idempotentUserA],
      );
      assert.deepEqual(
        await repository.listApplicableUserIds({
          tenantId: tenantA,
          branchId: branchA2,
        }),
        [sharedAdminUser],
      );
      assert.deepEqual(
        await repository.listApplicableUserIds({
          tenantId: tenantB,
          branchId: branchB,
        }),
        [sharedAdminUser],
      );
      assert.deepEqual(
        await repository.resolveEffectiveCapabilities({
          tenantId: tenantA,
          branchId: branchA,
          userId: sharedAdminUser,
        }),
        [
          'users.read',
          'users.manage',
          'access_matrix.read',
          'access_matrix.manage',
          'repairs.read',
          'repairs.add_note',
        ],
      );
      assert.deepEqual(
        await repository.resolveEffectiveCapabilities({
          tenantId: tenantA,
          branchId: branchA,
          userId: technicianUserA,
        }),
        ['repairs.read', 'repairs.add_note'],
      );
      assert.deepEqual(
        await repository.resolveEffectiveCapabilities({
          tenantId: tenantA,
          branchId: branchA2,
          userId: technicianUserA,
        }),
        [],
      );
      assert.deepEqual(
        await repository.resolveEffectiveCapabilities({
          tenantId: tenantB,
          branchId: branchB,
          userId: sharedAdminUser,
        }),
        ['users.read', 'repairs.read'],
      );

      await admin.query(
        `update access_roles set status = 'disabled', version = version + 1
         where tenant_id = $1 and role_id = $2`,
        [tenantA, technicianRoleA],
      );
      assert.deepEqual(
        await repository.resolveEffectiveCapabilities({
          tenantId: tenantA,
          branchId: branchA,
          userId: technicianUserA,
        }),
        [],
      );
      assert.deepEqual(
        await repository.listApplicableUserIds({
          tenantId: tenantA,
          branchId: branchA,
        }),
        [sharedAdminUser],
      );
      await admin.query(
        `update access_roles set status = 'archived', version = version + 1
         where tenant_id = $1 and role_id = $2`,
        [tenantA, technicianRoleA],
      );
      assert.deepEqual(
        await repository.resolveEffectiveCapabilities({
          tenantId: tenantA,
          branchId: branchA,
          userId: technicianUserA,
        }),
        [],
      );
      assert.deepEqual(
        await repository.listApplicableUserIds({
          tenantId: tenantA,
          branchId: branchA,
        }),
        [sharedAdminUser],
      );
      await admin.query(
        `update access_roles set status = 'active', version = version + 1
         where tenant_id = $1 and role_id = $2`,
        [tenantA, technicianRoleA],
      );

      await rejectsWithCode(
        repository.revokeRoleAssignment(
          { tenantId: tenantA },
          revocation({
            expectedVersion: 1,
            clientRequestId: staleRevokeRequestA,
          }),
        ),
        'ACCESS_STALE_WRITE',
      );
      await rejectsWithCode(
        repository.revokeRoleAssignment(
          { tenantId: tenantB },
          revocation({ clientRequestId: crossTenantRequest }),
        ),
        'ACCESS_ASSIGNMENT_NOT_FOUND',
      );

      const concurrentRevocation = await Promise.all([
        repository.revokeRoleAssignment(
          { tenantId: tenantA },
          revocation(),
        ),
        repository.revokeRoleAssignment(
          { tenantId: tenantA },
          revocation(),
        ),
      ]);
      assert.deepEqual(concurrentRevocation[0], concurrentRevocation[1]);
      assert.equal(concurrentRevocation[0].status, 'revoked');
      assert.equal(concurrentRevocation[0].version, 1);
      assert.equal(
        concurrentRevocation[0].revokedAt,
        '2026-09-06T19:30:00.000Z',
      );
      assert.deepEqual(
        await repository.revokeRoleAssignment(
          { tenantId: tenantA },
          revocation(),
        ),
        concurrentRevocation[0],
      );
      await rejectsWithCode(
        repository.revokeRoleAssignment(
          { tenantId: tenantA },
          revocation({ assignmentId: adminAssignmentA }),
        ),
        'ACCESS_IDEMPOTENCY_CONFLICT',
      );
      await rejectsWithCode(
        repository.revokeRoleAssignment(
          { tenantId: tenantA },
          revocation({ clientRequestId: secondRevokeRequestA }),
        ),
        'ACCESS_ASSIGNMENT_REVOKED',
      );
      assert.deepEqual(
        await repository.resolveEffectiveCapabilities({
          tenantId: tenantA,
          branchId: branchA,
          userId: technicianUserA,
        }),
        [],
      );
      assert.deepEqual(
        await repository.listApplicableUserIds({
          tenantId: tenantA,
          branchId: branchA,
        }),
        [sharedAdminUser, concurrentUserA, idempotentUserA],
      );
      const matrixAfterRevoke = await repository.listMatrix({
        tenantId: tenantA,
      });
      assert.equal(
        matrixAfterRevoke.assignments.find(
          ({ assignmentId }) => assignmentId === technicianAssignmentA,
        )?.status,
        'revoked',
      );

      await rejectsWithCode(
        repository.listMatrix({ tenantId: 'tenant-a' }),
        'ACCESS_TENANT_SCOPE_REQUIRED',
      );
      await rejectsWithCode(
        repository.listApplicableUserIds({
          tenantId: tenantA,
          branchId: 'branch-a',
        }),
        'ACCESS_INPUT_INVALID',
      );
      await rejectsWithCode(
        repository.assignRole(
          { tenantId: tenantA },
          assignment({
            assignmentScope: 'BRANCH_RESTRICTED',
            branchId: null,
          }),
        ),
        'ACCESS_INPUT_INVALID',
      );

      assert.equal(
        (
          await admin.query(
            `select count(*)::integer as count
             from access_role_assignment_commands`,
          )
        ).rows[0].count,
        7,
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

      const reapplied = await runner.migrateToLatest();
      assert.ok(
        reapplied.status.migrations.every(({ state }) => state === 'applied'),
      );
      await assertAccessTables(admin, accessTables);

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
