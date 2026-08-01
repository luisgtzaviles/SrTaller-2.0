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
  previewMigration,
  productiveMigration,
  stationMigration,
} from '../scripts/lib/postgresql-ci-evidence.mjs';

async function createDistFixture({
  absoluteSource = false,
  inlineSources = false,
  previewAssets = false,
} = {}) {
  const root = await mkdtemp(join(tmpdir(), 'srtaller-vc024-dist-'));
  await mkdir(resolve(root, 'dist'), { recursive: true });
  await writeFile(
    resolve(root, 'dist/main.js'),
    "export const state = 'ready';\n//# sourceMappingURL=main.js.map\n",
  );
  if (previewAssets) {
    await mkdir(resolve(root, 'dist/public/assets'), { recursive: true });
    await writeFile(
      resolve(root, 'dist/public/index.html'),
      '<!doctype html><title>Preview</title>\n',
    );
    await writeFile(
      resolve(root, 'dist/public/assets/index.css'),
      ':root { color: black; }\n',
    );
    await writeFile(
      resolve(root, 'dist/public/assets/index.js'),
      'document.documentElement.dataset.preview = "ready";\n',
    );
  }
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
      previewFilename: previewMigration,
      sha256: 'a'.repeat(64),
      stationSha256: 'd'.repeat(64),
      previewSha256: 'f'.repeat(64),
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
      previewTables: ['preview_repair_status_history', 'preview_repairs'],
      stationSha256: 'e'.repeat(64),
      previewSha256: '9'.repeat(64),
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
  const causalSignature = {
    errorCode: 'ERR_TEST_FAILURE',
    failureType: 'testCodeFailure',
  };
  const failedTest = (index) => ({
    error: {
      name: 'Error',
      code: 'ERR_TEST_FAILURE',
      message: `target ${index + 1} failed`,
      stack: `Error: target ${index + 1} failed`,
      failureType: 'testCodeFailure',
    },
    file: 'test/station.test.mjs',
    fullName: `target ${index + 1}`,
    status: 'FAIL',
  });
  const inventory = Array.from({ length: 25 }, (_, index) => ({
    error: null,
    file: 'test/station.test.mjs',
    fullName: `target ${index + 1}`,
    status: 'PASS',
  }));
  const targets = inventory.map(({ file, fullName, status }) => ({
    file,
    fullName,
    status,
  }));
  return {
    schemaVersion: 2,
    mode: 'semantic',
    mutationMode: 'semantic',
    causalCorrelation: 'structured',
    reporterFormat: 'srtaller-node-test-results/v1',
    expectedTestIdentity: 'file-and-full-name',
    workspaceStrategy: 'controlled-temporary-copy',
    baselineStatus: 'PASS',
    baseline: {
      buildStatus: 'PASS',
      executedTestFiles: ['test/station.test.mjs'],
      inventory,
      nodeModulesSymlink: true,
      reporterFormat: 'srtaller-node-test-results/v1',
      status: 'PASS',
      targets,
      testProcessStatus: 'PASS',
    },
    total: 25,
    killed: 25,
    survived: 0,
    unrelatedFailureCount: 0,
    unexpectedTestFailureCount: 0,
    parserFailureCount: 0,
    infrastructureFailureCount: 0,
    timeoutCount: 0,
    negativeHarnessTests: 'PASS',
    falsePositiveRegressionStatus: 'PASS',
    falsePositiveRegression: {
      classification: 'UNRELATED_TEST_FAILURE',
      expectedTestsFailed: [],
      killed: false,
      status: 'PASS',
      unexpectedTestsFailed: [failedTest(0)],
    },
    workspaceCleanup: 'PASS',
    workingTreePreserved: true,
    results: Array.from({ length: 25 }, (_, index) => ({
      mutationId: `MUT-024-${String(index + 1).padStart(2, '0')}`,
      description: `semantic mutation ${index + 1}`,
      targetFile: 'src/modules/stations/example.ts',
      expectedTests: [{
        causalSignature,
        file: 'test/station.test.mjs',
        fullName: `target ${index + 1}`,
      }],
      executedTestFiles: ['test/station.test.mjs'],
      applied: true,
      buildStatus: 'PASS',
      testProcessStatus: 'TEST_FAILURE',
      parsedTestResults: [failedTest(index)],
      failedTests: [failedTest(index)],
      expectedTestsFailed: [failedTest(index)],
      unexpectedTestsFailed: [],
      timeout: false,
      infrastructureFailure: false,
      classification: 'EXPECTED_TEST_FAILURE',
      causalMatch: true,
      killed: true,
      manual: index < 5,
      reporterFormat: 'srtaller-node-test-results/v1',
      nodeModulesSymlink: true,
      childProcessesStatus: 'PASS',
      cleanupStatus: 'PASS',
      residualWorkspace: false,
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

test('dist inspection accepts controlled preview static assets', async () => {
  const root = await createDistFixture({ previewAssets: true });
  try {
    const inspected = await inspectDist({ projectRoot: root });
    assert.deepEqual(
      inspected.files.map(({ path }) => path),
      [
        'dist/main.js',
        'dist/main.js.map',
        'dist/public/assets/index.css',
        'dist/public/assets/index.js',
        'dist/public/index.html',
      ],
    );
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test('dist inspection rejects non-code artifacts outside preview public root', async () => {
  const root = await createDistFixture();
  try {
    await writeFile(resolve(root, 'dist/rogue.html'), '<p>rogue</p>\n');
    await assert.rejects(
      inspectDist({ projectRoot: root }),
      /Unexpected dist artifact/u,
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
  survivor.results[0].classification = 'PASS';
  survivor.results[0].killed = false;
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
