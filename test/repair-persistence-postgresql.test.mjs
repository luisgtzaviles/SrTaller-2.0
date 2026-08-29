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
const { RepairOperationalNoteIdempotencyConflictError } = enabled
  ? await import('../dist/modules/repairs/application/ports/repair-repository.port.js')
  : {};
const { createKyselyRepairRepository } = enabled
  ? await import('../dist/modules/repairs/infrastructure/persistence/kysely-repair.repository.js')
  : {};

const migrationRoot = fileURLToPath(
  new URL('../dist/infrastructure/database/migrations/', import.meta.url),
);
const tables = [
  'repair_attachments',
  'repair_timeline_entries',
  'repair_intakes',
  'repairs',
  'branches',
  'tenants',
  'kysely_migration',
  'kysely_migration_lock',
];

const tenantA = '10000000-0000-4000-8000-000000000001';
const tenantB = '20000000-0000-4000-8000-000000000002';
const branchA = 'a0000000-0000-4000-8000-000000000001';
const branchB = 'b0000000-0000-4000-8000-000000000002';
const repairA = '30000000-0000-4000-8000-000000000001';
const repairPercent = '30000000-0000-4000-8000-000000000002';
const repairB = '30000000-0000-4000-8000-000000000003';
const actorId = '40000000-0000-4000-8000-000000000001';

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
        'Samsung', 'S22', 'No enciende', null, null, 'pending', 'active', $7)`,
    [repairA, tenantA, branchA, repairPercent, repairB, tenantB, createdAt, actorId, branchB],
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
      assert.equal(applied.status.migrations.length, 6);
      assert.ok(applied.status.migrations.every(({ state }) => state === 'applied'));
      await seed(admin);

      const repository = createKyselyRepairRepository(
        connection,
        () => new Date('2026-08-21T18:00:00.000Z'),
      );
      const scopeA = Object.freeze({ tenantId: tenantA, branchId: branchA });
      const scopeB = Object.freeze({ tenantId: tenantB, branchId: branchB });

      const allA = await repository.listWorklist(scopeA, listQuery());
      assert.equal(allA.totalCount, 2);
      assert.deepEqual(allA.items.map(({ id }) => id), [repairA, repairPercent]);
      assert.equal(allA.technicians.length, 1);
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
