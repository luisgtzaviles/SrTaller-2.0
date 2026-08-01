import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { Pool } from 'pg';

const enabled = process.env.SR_PREVIEW_PG_TEST === '1';

const database = enabled
  ? await import('../dist/infrastructure/database/database-connection.js')
  : {};
const migrationProvider = enabled
  ? await import('../dist/infrastructure/database/database-migration-provider.js')
  : {};
const migrationRunner = enabled
  ? await import('../dist/infrastructure/database/migration-runner.js')
  : {};
const stationContext = enabled
  ? await import('../dist/modules/stations/application/contracts/trusted-station-context.js')
  : {};
const previewRepository = enabled
  ? await import('../dist/modules/preview/infrastructure/persistence/kysely-preview-repair.repository.js')
  : {};
const previewApplication = enabled
  ? await import('../dist/modules/preview/application/preview-repair.service.js')
  : {};

const migrationRoot = fileURLToPath(
  new URL('../dist/infrastructure/database/migrations/', import.meta.url),
);

function config() {
  return Object.freeze({
    identity: Object.freeze({
      host: process.env.SR_PREVIEW_PG_HOST,
      port: Number(process.env.SR_PREVIEW_PG_PORT),
      database: process.env.SR_PREVIEW_PG_NAME,
      user: process.env.SR_PREVIEW_PG_USER,
      password: process.env.SR_PREVIEW_PG_PASSWORD,
    }),
    transport: Object.freeze({ sslMode: 'disable' }),
    pool: Object.freeze({
      min: 0,
      max: 4,
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
      applicationName: 'srtaller-vs0-preview-postgresql',
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
    host: process.env.SR_PREVIEW_PG_HOST,
    port: Number(process.env.SR_PREVIEW_PG_PORT),
    database: process.env.SR_PREVIEW_PG_NAME,
    user: process.env.SR_PREVIEW_PG_USER,
    password: process.env.SR_PREVIEW_PG_PASSWORD,
    max: 2,
    ssl: false,
  });
}

test(
  'PostgreSQL 18.4 preserves preview tenant isolation, history and revision CAS',
  { skip: !enabled, timeout: 120_000 },
  async () => {
    assert.equal(process.version, 'v24.18.0');
    const connection = database.createDatabaseConnection(config());
    const admin = adminPool();
    let runner;
    try {
      const source = await migrationProvider.inspectMigrationSource(
        Object.freeze({
          root: migrationRoot,
          authorizedRoot: migrationRoot,
          normalizedRoot: 'src/infrastructure/database/migrations',
          mode: 'compiled',
        }),
      );
      runner = migrationRunner.createMigrationRunner(connection, {
        expectedManifestHash: source.manifest.aggregateSha256,
      });
      const applied = await runner.migrateToLatest();
      assert.equal(applied.results.length, 3);

      const scopeA = Object.freeze({
        tenantId: '10000000-0000-4000-8000-000000000001',
        branchId: '30000000-0000-4000-8000-000000000001',
        stationId: '50000000-0000-4000-8000-000000000001',
      });
      const scopeB = Object.freeze({
        tenantId: '20000000-0000-4000-8000-000000000002',
        branchId: '40000000-0000-4000-8000-000000000002',
        stationId: '60000000-0000-4000-8000-000000000002',
      });
      const now = '2026-08-01T12:00:00.000Z';
      for (const scope of [scopeA, scopeB]) {
        await admin.query(
          'insert into tenants (tenant_id, created_at) values ($1, $2)',
          [scope.tenantId, now],
        );
        await admin.query(
          'insert into branches (tenant_id, branch_id, created_at) values ($1, $2, $3)',
          [scope.tenantId, scope.branchId, now],
        );
        await admin.query(
          `insert into stations (
             tenant_id, station_id, status, revision, created_at, updated_at, revoked_at
           ) values ($1, $2, 'Active', 1, $3, $3, null)`,
          [scope.tenantId, scope.stationId, now],
        );
        await admin.query(
          `insert into station_bindings (
             tenant_id, station_id, binding_revision, branch_id, linked_at, unlinked_at
           ) values ($1, $2, 1, $3, $4, null)`,
          [scope.tenantId, scope.stationId, scope.branchId, now],
        );
      }
      const contextA = stationContext.createTrustedStationContext({
        ...scopeA,
        stationRevision: 1,
      });
      const contextB = stationContext.createTrustedStationContext({
        ...scopeB,
        stationRevision: 1,
      });
      const service = new previewApplication.PreviewRepairService(
        previewRepository.createKyselyPreviewRepairRepository(connection),
      );
      const repair = await service.create(
        { station: contextA, actorLabel: 'Operador Sintético A' },
        {
          customerName: 'Cliente Sintético',
          customerPhone: '6620000000',
          deviceBrand: 'Marca Demo',
          deviceModel: 'Modelo Demo',
          deviceSerial: null,
          deviceColor: 'Azul demo',
          reportedProblem: 'No enciende.',
          physicalCondition: 'Sin daño sintético.',
          notes: 'Sin datos reales.',
          estimatedPrice: 450,
          depositAmount: 100,
        },
      );
      assert.equal(repair.status, 'received');
      assert.equal(repair.revision, 1);
      assert.equal(repair.history.length, 1);
      assert.equal((await service.list(contextA)).length, 1);
      assert.deepEqual(await service.list(contextB), []);
      assert.equal(await service.detail(contextB, repair.id), null);

      const wrongRevision = await service.transitionStatus(
        { station: contextA, actorLabel: 'Operador Sintético A' },
        repair.id,
        2,
        'diagnosing',
      );
      assert.deepEqual(wrongRevision, {
        kind: 'revision-conflict',
        actualRevision: 1,
      });
      const transitioned = await service.transitionStatus(
        { station: contextA, actorLabel: 'Operador Sintético A' },
        repair.id,
        1,
        'diagnosing',
      );
      assert.equal(transitioned.kind, 'updated');
      assert.equal(transitioned.repair.status, 'diagnosing');
      assert.equal(transitioned.repair.revision, 2);
      assert.equal(transitioned.repair.history.length, 2);
      const stale = await service.transitionStatus(
        { station: contextA, actorLabel: 'Operador Sintético A' },
        repair.id,
        1,
        'ready',
      );
      assert.equal(stale.kind, 'revision-conflict');
      assert.equal((await service.detail(contextA, repair.id)).revision, 2);
    } finally {
      await runner?.destroy().catch(() => undefined);
      await connection.close().catch(() => undefined);
      await admin.end();
    }
  },
);
