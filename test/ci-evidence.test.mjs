import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

import {
  comparableStationMutationManifest,
  compareEvidenceManifests,
  inspectDist,
  validateStationMutationManifest,
  validateEvidenceManifest,
} from '../scripts/lib/ci-evidence.mjs';
import {
  criticalPostgresqlSuites,
  finalizePostgresqlCiManifest,
  postgresqlImage,
  postgresqlImageDigest,
  productiveMigration,
  stationMigration,
} from '../scripts/lib/postgresql-ci-evidence.mjs';

async function createDistFixture({
  absoluteSource = false,
  inlineSources = false,
} = {}) {
  const root = await mkdtemp(join(tmpdir(), 'srtaller-vc024-dist-'));
  await mkdir(resolve(root, 'dist'), { recursive: true });
  await writeFile(
    resolve(root, 'dist/main.js'),
    "export const state = 'ready';\n//# sourceMappingURL=main.js.map\n",
  );
  const sourceMap = {
    file: 'main.js',
    mappings: '',
    names: [],
    sources: [absoluteSource ? '/private/src/main.ts' : '../src/main.ts'],
    version: 3,
  };
  if (inlineSources) {
    sourceMap.sourcesContent = ["export const state = 'ready';"];
  }
  await writeFile(
    resolve(root, 'dist/main.js.map'),
    `${JSON.stringify(sourceMap)}\n`,
  );
  return root;
}

function manifest(label) {
  return {
    schemaVersion: 1,
    contract: 'DEC-004/VC-024',
    commit: '0123456789abcdef0123456789abcdef01234567',
    execution: {
      label,
      workflowRunId: '1234',
    },
    environment: {
      arch: 'x64',
      libc: 'glibc 2.39',
      os: 'linux',
    },
    toolchain: {
      nestjs: '11.1.28',
      node: '24.18.0',
      pnpm: '11.15.1',
      typescript: '6.0.3',
    },
    inputs: {
      'package.json': 'a'.repeat(64),
    },
    commands: [
      {
        command: 'pnpm run verify',
        exitCode: 0,
        name: 'verify',
      },
    ],
    dist: {
      aggregateSha256: 'b'.repeat(64),
      algorithm: 'sha256',
      files: [
        {
          bytes: 1,
          path: 'dist/main.js',
          sha256: 'c'.repeat(64),
        },
      ],
    },
    repository: {
      finalClean: true,
      initialClean: true,
    },
    verdict: 'PASS',
  };
}

function postgresqlManifest(label) {
  return finalizePostgresqlCiManifest({
    schemaVersion: 1,
    contract: 'PBI-024/POSTGRESQL-CI',
    execution: {
      attempt: '1',
      event: 'pull_request',
      headSha: '0123456789abcdef0123456789abcdef01234567',
      label,
      workflowRunId: '1234',
    },
    image: {
      reference: postgresqlImage,
      digest: postgresqlImageDigest,
      os: 'linux',
      architecture: 'amd64',
    },
    postgres: {
      version: '18.4',
      serverVersion: 'postgres (PostgreSQL) 18.4',
      clientVersion: 'psql (PostgreSQL) 18.4',
      encoding: 'UTF8',
      timezone: 'UTC',
      locale: 'C.UTF-8',
    },
    database: {
      isolation: 'fresh database and container per critical suite',
      identitiesExposed: false,
      persistentStorage: false,
      suiteDatabases: criticalPostgresqlSuites.length,
    },
    roles: {
      mode: 'synthetic ephemeral lifecycle identity per suite',
      migration: 'migration-enabled only in migration/schema/adapter suites',
      application:
        'test/application behavior without production privilege claim',
    },
    migration: {
      filename: productiveMigration,
      stationFilename: stationMigration,
      sha256: 'a'.repeat(64),
      stationSha256: 'd'.repeat(64),
      status: 'PASS',
      emptyDatabase: 'PASS',
      downReapply: 'PASS',
      drift: 'PASS',
      journal: 'PASS',
      lock: 'PASS',
    },
    schema: {
      sha256: 'b'.repeat(64),
      tables: ['branches', 'tenants'],
      stationTables: ['station_bindings', 'stations'],
      stationSha256: 'e'.repeat(64),
      columns: 5,
      constraints: 8,
      indexes: 2,
    },
    suites: criticalPostgresqlSuites.map((name, index) => ({
      name,
      status: 'PASS',
      cleanup: 'PASS',
      materialSha256: `${index}`.repeat(64),
      scenarios: ['governed'],
      tests: {
        tests: index === 0 ? 6 : 1,
        pass: index === 0 ? 6 : 1,
        fail: 0,
        cancelled: 0,
        skipped: 0,
        todo: 0,
      },
    })),
    totals: {
      suites: criticalPostgresqlSuites.length,
      testsExecuted: criticalPostgresqlSuites.length + 5,
      criticalSkips: 0,
      failures: 0,
      previouslyGatedSkips: 10,
    },
    isolation: {
      schema: 'PASS',
      adapters: 'PASS',
      crossTenantRead: 'PASS',
      tenantScopedList: 'PASS',
    },
    cleanup: {
      status: 'PASS',
      containers: 0,
      volumes: 0,
      dedicatedNetworks: 0,
      persistentFiles: 0,
      dumps: 0,
      environmentFiles: 0,
    },
    sanitization: {
      status: 'PASS',
      credentials: 'not recorded',
      connectionStrings: 'not recorded',
      rawSqlLogs: 'not recorded',
      personalPaths: 'not recorded',
    },
    artifacts: [
      'POSTGRESQL_MANIFEST.json',
      'EVIDENCE_MANIFEST.json',
      'DIST_MANIFEST.json',
    ],
    result: 'PASS',
  });
}

function mutationManifest(durationOffset = 0) {
  return {
    schemaVersion: 1,
    mode: 'semantic',
    workspaceStrategy: 'controlled-temporary-copy',
    total: 25,
    killed: 25,
    survived: 0,
    results: Array.from({ length: 25 }, (_, index) => ({
      id: `MUT-024-${String(index + 1).padStart(2, '0')}`,
      description: `semantic mutation ${index + 1}`,
      file: 'src/modules/stations/example.ts',
      transformation: 'semantic defect',
      command: 'pnpm run build && node --test target',
      expectedTest: `target ${index + 1}`,
      applied: true,
      compile: { code: 0, timedOut: false },
      test: { code: 1, timedOut: false },
      expectedFailureObserved: true,
      failedTest: `target ${index + 1}`,
      manual: index < 5,
      cleanupComplete: true,
      residualFile: false,
      workingTreePreserved: true,
      durationMs: durationOffset + index,
    })),
  };
}

test('dist inspection produces a stable relative SHA-256 inventory', async () => {
  const root = await createDistFixture();
  try {
    const first = await inspectDist({ projectRoot: root });
    const second = await inspectDist({ projectRoot: root });
    assert.deepEqual(first, second);
    assert.equal(first.files.length, 2);
    assert.deepEqual(
      first.files.map(({ path }) => path),
      ['dist/main.js', 'dist/main.js.map'],
    );
    assert.match(first.aggregateSha256, /^[0-9a-f]{64}$/u);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test('dist inspection rejects inline source content', async () => {
  const root = await createDistFixture({ inlineSources: true });
  try {
    await assert.rejects(
      inspectDist({ projectRoot: root }),
      /Inline source content/u,
    );
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test('dist inspection rejects absolute source map paths', async () => {
  const root = await createDistFixture({ absoluteSource: true });
  try {
    await assert.rejects(
      inspectDist({ projectRoot: root }),
      /Non-portable source map entry/u,
    );
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test('manifest validation fails closed for a dirty checkout', () => {
  const dirty = manifest('run-1');
  dirty.repository.finalClean = false;
  assert.throws(
    () => validateEvidenceManifest(dirty),
    /clean initial and final/u,
  );
});

test('two independent manifests compare by semantic evidence', () => {
  const comparison = compareEvidenceManifests(
    manifest('run-1'),
    manifest('run-2'),
  );
  assert.equal(comparison.equivalent, true);
  assert.equal(
    comparison.comparableSha256.left,
    comparison.comparableSha256.right,
  );
});

test('comparison rejects reused execution labels', () => {
  assert.throws(
    () => compareEvidenceManifests(manifest('run-1'), manifest('run-1')),
    /distinct job labels/u,
  );
});

test('comparison exposes a material artifact difference', () => {
  const right = manifest('run-2');
  right.dist.files[0].sha256 = 'd'.repeat(64);
  const comparison = compareEvidenceManifests(manifest('run-1'), right);
  assert.equal(comparison.equivalent, false);
  assert.notEqual(
    comparison.comparableSha256.left,
    comparison.comparableSha256.right,
  );
});

test('schemaVersion 2 compares PostgreSQL evidence while ignoring run identity', () => {
  const left = manifest('run-1');
  left.schemaVersion = 2;
  left.postgresql = postgresqlManifest('run-1');
  const right = manifest('run-2');
  right.schemaVersion = 2;
  right.postgresql = postgresqlManifest('run-2');
  const comparison = compareEvidenceManifests(left, right);
  assert.equal(comparison.equivalent, true);
  assert.equal(
    comparison.comparableSha256.left,
    comparison.comparableSha256.right,
  );
});

test('PostgreSQL evidence fails closed when a critical suite is skipped', () => {
  const evidence = postgresqlManifest('run-1');
  const unsafe = structuredClone(evidence);
  unsafe.suites[0].tests.skipped = 1;
  assert.throws(
    () => finalizePostgresqlCiManifest(unsafe),
    /skipped or failed/u,
  );
});

test('semantic mutation evidence requires 25 compiled and killed defects', () => {
  const evidence = mutationManifest();
  assert.equal(validateStationMutationManifest(evidence), evidence);
  const comparable = comparableStationMutationManifest(evidence);
  assert.equal(comparable.killed, 25);
  assert.equal(comparable.manualDemonstrations.length, 5);

  const survivor = structuredClone(evidence);
  survivor.results[0].test.code = 0;
  assert.throws(
    () => validateStationMutationManifest(survivor),
    /MUT-024-01/u,
  );
});

test('mutation comparison ignores duration but detects semantic drift', () => {
  const left = manifest('run-1');
  left.mutations = comparableStationMutationManifest(
    mutationManifest(0),
  );
  const right = manifest('run-2');
  right.mutations = comparableStationMutationManifest(
    mutationManifest(10_000),
  );
  assert.equal(compareEvidenceManifests(left, right).equivalent, true);

  right.mutations = {
    ...right.mutations,
    materialSha256: 'f'.repeat(64),
  };
  assert.equal(compareEvidenceManifests(left, right).equivalent, false);
});
