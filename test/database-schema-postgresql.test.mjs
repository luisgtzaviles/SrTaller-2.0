import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { inspect } from 'node:util';

import { Pool } from 'pg';

const enabled = process.env.SR_SCHEMA_PG_TEST === '1';

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
const {
  DatabaseMigrationError,
  createMigrationRunner,
} = enabled
  ? await import('../dist/infrastructure/database/migration-runner.js')
  : {};

const migrationName =
  '20260725183832_database_create_tenants_and_branches';
const stationMigrationName =
  '20260726160000_stations_create_stations_and_bindings';
const compiledMigrationRoot = fileURLToPath(
  new URL('../dist/infrastructure/database/migrations/', import.meta.url),
);
const atomicFixtureRoot = fileURLToPath(
  new URL(
    './fixtures/database-schema/atomic-failure/',
    import.meta.url,
  ),
);
const expectedColumns = Object.freeze([
  {
    table_name: 'branches',
    column_name: 'tenant_id',
    ordinal_position: 1,
    is_nullable: 'NO',
    udt_name: 'uuid',
    column_default: null,
  },
  {
    table_name: 'branches',
    column_name: 'branch_id',
    ordinal_position: 2,
    is_nullable: 'NO',
    udt_name: 'uuid',
    column_default: null,
  },
  {
    table_name: 'branches',
    column_name: 'created_at',
    ordinal_position: 3,
    is_nullable: 'NO',
    udt_name: 'timestamptz',
    column_default: null,
  },
  {
    table_name: 'tenants',
    column_name: 'tenant_id',
    ordinal_position: 1,
    is_nullable: 'NO',
    udt_name: 'uuid',
    column_default: null,
  },
  {
    table_name: 'tenants',
    column_name: 'created_at',
    ordinal_position: 2,
    is_nullable: 'NO',
    udt_name: 'timestamptz',
    column_default: null,
  },
]);

function databaseConfig() {
  return Object.freeze({
    identity: Object.freeze({
      host: process.env.SR_SCHEMA_PG_HOST,
      port: Number(process.env.SR_SCHEMA_PG_PORT),
      database: process.env.SR_SCHEMA_PG_NAME,
      user: process.env.SR_SCHEMA_PG_USER,
      password: process.env.SR_SCHEMA_PG_PASSWORD,
    }),
    transport: Object.freeze({ sslMode: 'disable' }),
    pool: Object.freeze({
      min: 0,
      max: 1,
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
      applicationName: 'srtaller-pbi023-schema-postgresql',
      labels: Object.freeze({
        component: 'persistence',
        environment: 'development',
        role: 'migration',
      }),
    }),
  });
}

function adminPool() {
  return new Pool({
    database: process.env.SR_SCHEMA_PG_NAME,
    host: process.env.SR_SCHEMA_PG_HOST,
    max: 2,
    password: process.env.SR_SCHEMA_PG_PASSWORD,
    port: Number(process.env.SR_SCHEMA_PG_PORT),
    ssl: false,
    user: process.env.SR_SCHEMA_PG_USER,
  });
}

function source(root, normalizedRoot) {
  return Object.freeze({
    root,
    authorizedRoot: root,
    normalizedRoot,
    mode: 'compiled',
  });
}

function authorization(item) {
  return Object.freeze({
    migrationName: item.name,
    expectedHash: item.hash,
    reason: 'verified tenant schema single-step reversal',
    environment: 'development',
    confirmation: 'REVERT_ONE_MIGRATION',
  });
}

function expectsRunnerCode(code) {
  return (error) => {
    assert.ok(error instanceof DatabaseMigrationError);
    assert.equal(error.code, code);
    assert.doesNotMatch(
      `${JSON.stringify(error)}\n${inspect(error)}`,
      /postgres:\/\/|password=|SR_SCHEMA_PG_|\/Users\/|synthetic_/iu,
    );
    return true;
  };
}

function expectsPostgreSqlCode(code) {
  return (error) => {
    assert.equal(error?.code, code);
    return true;
  };
}

async function tableExists(admin, table) {
  const result = await admin.query(
    `select exists (
       select 1
       from pg_catalog.pg_tables
       where schemaname = 'public' and tablename = $1
     ) as present`,
    [table],
  );
  return result.rows[0].present;
}

async function resetDatabase(admin) {
  await admin.query(
    `drop table if exists
       schema_branch_reference_probe,
       station_bindings,
       stations,
       branches,
       tenants,
       kysely_migration,
       kysely_migration_lock
     cascade`,
  );
}

async function assertNoRetainedObjects(admin) {
  const result = await admin.query(
    `select tablename
     from pg_catalog.pg_tables
     where schemaname = 'public'
       and tablename in (
         'schema_branch_reference_probe',
         'station_bindings',
         'stations',
         'branches',
         'tenants',
         'kysely_migration',
         'kysely_migration_lock'
       )
     order by tablename`,
  );
  assert.deepEqual(result.rows, []);
}

async function introspectSchema(admin) {
  const columns = await admin.query(
    `select table_name, column_name, ordinal_position, is_nullable,
            udt_name, column_default
     from information_schema.columns
     where table_schema = 'public'
       and table_name in ('tenants', 'branches')
     order by table_name, ordinal_position`,
  );
  const constraints = await admin.query(
    `select conrelid::regclass::text as table_name,
            conname,
            contype,
            confupdtype,
            confdeltype,
            pg_get_constraintdef(oid, true) as definition
     from pg_catalog.pg_constraint
     where connamespace = 'public'::regnamespace
       and conrelid in ('public.tenants'::regclass, 'public.branches'::regclass)
     order by table_name, conname`,
  );
  const indexes = await admin.query(
    `select tablename, indexname, indexdef
     from pg_catalog.pg_indexes
     where schemaname = 'public'
       and tablename in ('tenants', 'branches')
     order by tablename, indexname`,
  );
  const relations = await admin.query(
    `select c.relname, c.relkind, n.nspname
     from pg_catalog.pg_class c
     join pg_catalog.pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and c.relname in ('tenants', 'branches', 'tenants_pk', 'branches_pk')
     order by c.relname`,
  );
  const attributes = await admin.query(
    `select c.relname as table_name, a.attname as column_name,
            a.attnum, a.attnotnull,
            pg_catalog.format_type(a.atttypid, a.atttypmod) as data_type
     from pg_catalog.pg_attribute a
     join pg_catalog.pg_class c on c.oid = a.attrelid
     join pg_catalog.pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and c.relname in ('tenants', 'branches')
       and a.attnum > 0
       and not a.attisdropped
     order by c.relname, a.attnum`,
  );
  const namespaces = await admin.query(
    `select nspname
     from pg_catalog.pg_namespace
     where nspname = 'public'`,
  );
  return Object.freeze({
    columns: columns.rows,
    constraints: constraints.rows,
    indexes: indexes.rows,
    relations: relations.rows,
    attributes: attributes.rows,
    namespaces: namespaces.rows,
  });
}

function assertSchemaContract(schema) {
  assert.deepEqual(schema.columns, expectedColumns);
  assert.deepEqual(schema.constraints, [
    {
      table_name: 'branches',
      conname: 'branches_branch_id_not_null',
      contype: 'n',
      confupdtype: ' ',
      confdeltype: ' ',
      definition: 'NOT NULL branch_id',
    },
    {
      table_name: 'branches',
      conname: 'branches_created_at_not_null',
      contype: 'n',
      confupdtype: ' ',
      confdeltype: ' ',
      definition: 'NOT NULL created_at',
    },
    {
      table_name: 'branches',
      conname: 'branches_pk',
      contype: 'p',
      confupdtype: ' ',
      confdeltype: ' ',
      definition: 'PRIMARY KEY (tenant_id, branch_id)',
    },
    {
      table_name: 'branches',
      conname: 'branches_tenant_fk',
      contype: 'f',
      confupdtype: 'r',
      confdeltype: 'r',
      definition:
        'FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON UPDATE RESTRICT ON DELETE RESTRICT',
    },
    {
      table_name: 'branches',
      conname: 'branches_tenant_id_not_null',
      contype: 'n',
      confupdtype: ' ',
      confdeltype: ' ',
      definition: 'NOT NULL tenant_id',
    },
    {
      table_name: 'tenants',
      conname: 'tenants_created_at_not_null',
      contype: 'n',
      confupdtype: ' ',
      confdeltype: ' ',
      definition: 'NOT NULL created_at',
    },
    {
      table_name: 'tenants',
      conname: 'tenants_pk',
      contype: 'p',
      confupdtype: ' ',
      confdeltype: ' ',
      definition: 'PRIMARY KEY (tenant_id)',
    },
    {
      table_name: 'tenants',
      conname: 'tenants_tenant_id_not_null',
      contype: 'n',
      confupdtype: ' ',
      confdeltype: ' ',
      definition: 'NOT NULL tenant_id',
    },
  ]);
  assert.deepEqual(
    schema.indexes.map(({ tablename, indexname }) => ({
      tablename,
      indexname,
    })),
    [
      { tablename: 'branches', indexname: 'branches_pk' },
      { tablename: 'tenants', indexname: 'tenants_pk' },
    ],
  );
  for (const index of schema.indexes) {
    assert.match(index.indexdef, /UNIQUE INDEX/u);
    assert.doesNotMatch(index.indexdef, /WHERE/u);
  }
  assert.deepEqual(schema.relations, [
    { relname: 'branches', relkind: 'r', nspname: 'public' },
    { relname: 'branches_pk', relkind: 'i', nspname: 'public' },
    { relname: 'tenants', relkind: 'r', nspname: 'public' },
    { relname: 'tenants_pk', relkind: 'i', nspname: 'public' },
  ]);
  assert.equal(schema.attributes.length, 5);
  assert.ok(schema.attributes.every(({ attnotnull }) => attnotnull));
  assert.deepEqual(schema.namespaces, [{ nspname: 'public' }]);
}

async function writeSchemaEvidence(schema, isolation) {
  const output = process.env.SR_SCHEMA_PG_EVIDENCE_OUTPUT;
  if (!output) {
    return;
  }
  const material = JSON.stringify({
    columns: schema.columns,
    constraints: schema.constraints,
    indexes: schema.indexes,
    relations: schema.relations,
  });
  await writeFile(
    output,
    `${JSON.stringify(
      {
        schemaVersion: 1,
        schemaSha256: createHash('sha256')
          .update(material)
          .digest('hex'),
        tables: ['branches', 'tenants'],
        columns: schema.columns.length,
        constraints: schema.constraints.length,
        indexes: schema.indexes.length,
        negativeIsolation: isolation.negativeIsolation,
        futureCompositeReference: isolation.futureCompositeReference,
      },
      null,
      2,
    )}\n`,
  );
}

async function assertTenantIsolation(admin) {
  const tenantA = randomUUID();
  const tenantB = randomUUID();
  const missingTenant = randomUUID();
  const sharedBranch = randomUUID();
  const branchA = randomUUID();
  const branchB = randomUUID();
  const createdAt = new Date('2026-07-25T00:00:00.000Z');

  await admin.query(
    `insert into tenants (tenant_id, created_at)
     values ($1, $3), ($2, $3)`,
    [tenantA, tenantB, createdAt],
  );
  await admin.query(
    `insert into branches (tenant_id, branch_id, created_at)
     values ($1, $3, $5), ($2, $3, $5), ($1, $4, $5), ($2, $6, $5)`,
    [tenantA, tenantB, sharedBranch, branchA, createdAt, branchB],
  );

  await assert.rejects(
    admin.query(
      `insert into branches (tenant_id, branch_id, created_at)
       values ($1, $2, $3)`,
      [missingTenant, randomUUID(), createdAt],
    ),
    expectsPostgreSqlCode('23503'),
  );
  await assert.rejects(
    admin.query(
      `update branches
       set tenant_id = $1
       where tenant_id = $2 and branch_id = $3`,
      [missingTenant, tenantB, branchB],
    ),
    expectsPostgreSqlCode('23503'),
  );
  await assert.rejects(
    admin.query('delete from tenants where tenant_id = $1', [tenantA]),
    expectsPostgreSqlCode('23001'),
  );
  await assert.rejects(
    admin.query(
      `insert into branches (tenant_id, branch_id, created_at)
       values (null, $1, $2)`,
      [randomUUID(), createdAt],
    ),
    expectsPostgreSqlCode('23502'),
  );
  await assert.rejects(
    admin.query(
      `insert into branches (tenant_id, branch_id, created_at)
       values ($1, null, $2)`,
      [tenantA, createdAt],
    ),
    expectsPostgreSqlCode('23502'),
  );
  await assert.rejects(
    admin.query(
      `insert into branches (tenant_id, branch_id, created_at)
       values ($1, $2, $3)`,
      [tenantA, sharedBranch, createdAt],
    ),
    expectsPostgreSqlCode('23505'),
  );

  await admin.query(
    `create table schema_branch_reference_probe (
       probe_id uuid not null primary key,
       tenant_id uuid not null,
       branch_id uuid not null,
       constraint schema_branch_reference_probe_branch_fk
         foreign key (tenant_id, branch_id)
         references branches (tenant_id, branch_id)
         on update restrict on delete restrict
     )`,
  );
  await admin.query(
    `insert into schema_branch_reference_probe
       (probe_id, tenant_id, branch_id)
     values ($1, $2, $3)`,
    [randomUUID(), tenantA, branchA],
  );
  await assert.rejects(
    admin.query(
      `insert into schema_branch_reference_probe
         (probe_id, tenant_id, branch_id)
       values ($1, $2, $3)`,
      [randomUUID(), tenantA, branchB],
    ),
    expectsPostgreSqlCode('23503'),
  );

  const extraTenants = Array.from({ length: 48 }, () => randomUUID());
  const tenantTimes = extraTenants.map(() => createdAt);
  await admin.query(
    `insert into tenants (tenant_id, created_at)
     select * from unnest($1::uuid[], $2::timestamptz[])`,
    [extraTenants, tenantTimes],
  );
  const branchTenants = [];
  const branchIds = [];
  const branchTimes = [];
  for (const tenantId of extraTenants) {
    for (let index = 0; index < 48; index += 1) {
      branchTenants.push(tenantId);
      branchIds.push(randomUUID());
      branchTimes.push(createdAt);
    }
  }
  await admin.query(
    `insert into branches (tenant_id, branch_id, created_at)
     select * from unnest($1::uuid[], $2::uuid[], $3::timestamptz[])`,
    [branchTenants, branchIds, branchTimes],
  );
  await admin.query('analyze branches');

  const tenantPlan = await admin.query(
    `explain (format json, costs off)
     select tenant_id, branch_id, created_at
     from branches
     where tenant_id = $1`,
    [extraTenants[0]],
  );
  const branchPlan = await admin.query(
    `explain (format json, costs off)
     select tenant_id, branch_id, created_at
     from branches
     where tenant_id = $1 and branch_id = $2`,
    [extraTenants[0], branchIds[0]],
  );
  const renderedPlans = JSON.stringify([
    tenantPlan.rows[0]['QUERY PLAN'],
    branchPlan.rows[0]['QUERY PLAN'],
  ]);
  assert.match(renderedPlans, /branches_pk/u);

  return Object.freeze({
    branchIndex: 'branches_pk',
    futureCompositeReference: 'PASS',
    negativeIsolation: 'PASS',
    sharedBranchIdentityAcrossTenants: 'PASS',
  });
}

test(
  'PostgreSQL 18.4 materializes the exact tenant schema and isolation contract',
  { skip: !enabled, timeout: 120_000 },
  async () => {
    assert.equal(process.version, 'v24.18.0');
    const admin = adminPool();
    const connections = new Set();
    const runners = new Set();
    try {
      await resetDatabase(admin);
      const productSource = source(
        compiledMigrationRoot,
        'src/infrastructure/database/migrations',
      );
      const inspection = await inspectMigrationSource(productSource);
      assert.deepEqual(
        inspection.manifest.migrations.map(({ migrationName }) => migrationName),
        [migrationName, stationMigrationName],
      );

      const connection = createDatabaseConnection(databaseConfig());
      connections.add(connection);
      const runner = createMigrationRunner(connection, {
        expectedManifestHash: inspection.manifest.aggregateSha256,
      });
      runners.add(runner);

      const pending = await runner.getMigrationStatus();
      assert.equal(pending.manifestVerification, 'match');
      assert.equal(pending.migrations[0].state, 'pending');
      const applied = await runner.migrateToLatest();
      assert.deepEqual(
        applied.results.map(({ name, direction, status }) => ({
          name,
          direction,
          status,
        })),
        [
          { name: migrationName, direction: 'Up', status: 'Success' },
          {
            name: stationMigrationName,
            direction: 'Up',
            status: 'Success',
          },
        ],
      );
      assert.equal(applied.status.migrations[0].state, 'applied');
      assert.equal(applied.status.migrations[1].state, 'applied');
      assert.deepEqual((await runner.migrateToLatest()).results, []);

      const firstSchema = await introspectSchema(admin);
      assertSchemaContract(firstSchema);
      const isolation = await assertTenantIsolation(admin);
      await writeSchemaEvidence(firstSchema, isolation);

      const stationDown = await runner.migrateDown(
        authorization(applied.status.migrations[1]),
      );
      assert.deepEqual(
        stationDown.results.map(({ name, direction, status }) => ({
          name,
          direction,
          status,
        })),
        [
          {
            name: stationMigrationName,
            direction: 'Down',
            status: 'Success',
          },
        ],
      );
      await assert.rejects(
        runner.migrateDown(
          authorization(applied.status.migrations[0]),
        ),
        expectsRunnerCode('DATABASE_MIGRATION_DOWN_FAILED'),
      );
      assert.equal(await tableExists(admin, 'branches'), true);
      assert.equal(await tableExists(admin, 'tenants'), true);

      await admin.query('drop table schema_branch_reference_probe');
      const down = await runner.migrateDown(
        authorization(applied.status.migrations[0]),
      );
      assert.deepEqual(
        down.results.map(({ name, direction, status }) => ({
          name,
          direction,
          status,
        })),
        [{ name: migrationName, direction: 'Down', status: 'Success' }],
      );
      assert.equal(await tableExists(admin, 'branches'), false);
      assert.equal(await tableExists(admin, 'tenants'), false);

      const reapplied = await runner.migrateToLatest();
      assert.deepEqual(
        reapplied.results.map(({ name, direction, status }) => ({
          name,
          direction,
          status,
        })),
        [
          { name: migrationName, direction: 'Up', status: 'Success' },
          {
            name: stationMigrationName,
            direction: 'Up',
            status: 'Success',
          },
        ],
      );
      assertSchemaContract(await introspectSchema(admin));
      await runner.migrateDown(
        authorization(reapplied.status.migrations[1]),
      );
      await runner.migrateDown(
        authorization(reapplied.status.migrations[0]),
      );
      await resetDatabase(admin);

      const atomicSource = source(
        atomicFixtureRoot,
        'test/fixtures/database-schema/atomic-failure',
      );
      const atomicInspection = await inspectMigrationSource(atomicSource);
      const atomicConnection = createDatabaseConnection(databaseConfig());
      connections.add(atomicConnection);
      const atomicRunner = createMigrationRunner(atomicConnection, {
        expectedManifestHash:
          atomicInspection.manifest.aggregateSha256,
        [databaseMigrationSourceOverride]: atomicSource,
      });
      runners.add(atomicRunner);
      await assert.rejects(
        atomicRunner.migrateToLatest(),
        expectsRunnerCode('DATABASE_MIGRATION_EXECUTION_FAILED'),
      );
      assert.equal(await tableExists(admin, 'branches'), false);
      assert.equal(await tableExists(admin, 'tenants'), false);
      assert.deepEqual(
        await admin
          .query(
            `select name
             from kysely_migration
             order by timestamp, name`,
          )
          .then(({ rows }) => rows),
        [],
      );

      await resetDatabase(admin);
      await assertNoRetainedObjects(admin);
    } finally {
      await Promise.allSettled(
        [...runners].map((runner) => runner.destroy()),
      );
      await Promise.allSettled(
        [...connections].map((connection) => connection.close()),
      );
      await resetDatabase(admin).catch(() => undefined);
      await assertNoRetainedObjects(admin);
      await admin.end();
    }
  },
);
