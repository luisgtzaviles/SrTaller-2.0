import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

import {
  compareEvidenceManifests,
  inspectDist,
  validateEvidenceManifest,
} from '../scripts/lib/ci-evidence.mjs';
import {
  criticalPostgresqlSuites,
  finalizePostgresqlCiManifest,
  postgresqlImage,
  postgresqlImageDigest,
  productiveMigration,
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
    contract: 'PBI-023/POSTGRESQL-CI',
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
      suiteDatabases: 5,
    },
    roles: {
      mode: 'synthetic ephemeral lifecycle identity per suite',
      migration: 'migration-enabled only in migration/schema/adapter suites',
      application:
        'test/application behavior without production privilege claim',
    },
    migration: {
      filename: productiveMigration,
      sha256: 'a'.repeat(64),
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
      suites: 5,
      testsExecuted: 10,
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
