import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

import {
  createPreviewMigrationSnapshot,
  evaluatePreviewMigrationState,
  inspectMigrationManifestAtRevision,
  inspectSourceMigrationManifest,
} from '../scripts/lib/migration-state-snapshot.mjs';
import {
  appendWorkflowMetric,
  authoritativeWorkflowStageNames,
  comparableWorkflowMetrics,
  validateAuthoritativeWorkflowMetrics,
  validateWorkflowMetrics,
} from '../scripts/lib/workflow-metrics.mjs';
import {
  compareVerifiedTreeAttestations,
  finalizeVerifiedTreeAttestation,
} from '../scripts/lib/verified-tree-attestation.mjs';

const releaseSha = '0123456789abcdef0123456789abcdef01234567';
const execute = promisify(execFile);

test('migration manifest covers the governed source and rejects duplicate content', async () => {
  const current = await inspectSourceMigrationManifest();
  assert.equal(current.migrations.length, 88);
  assert.match(current.aggregateSha256, /^[0-9a-f]{64}$/u);
  const integratedBaseline = await inspectMigrationManifestAtRevision({
    revision: 'a0604941a5707c87f2601c467e89743fc2883e90',
  });
  assert.equal(integratedBaseline.migrations.length, 62);
  assert.equal(
    integratedBaseline.aggregateSha256,
    'f2635edc881683f32fee6f54dfd3f048ffdfe0dfecff9f65219e82cc3a665ba0',
  );

  const fixture = await mkdtemp(join(tmpdir(), 'srtaller-migration-snapshot-'));
  try {
    await mkdir(fixture, { recursive: true });
    const content = 'export async function up() {}\nexport async function down() {}\n';
    await writeFile(join(fixture, '20260914010000_database_create_probe_one.ts'), content);
    await writeFile(join(fixture, '20260914020000_database_create_probe_two.ts'), content);
    await assert.rejects(
      inspectSourceMigrationManifest({ root: fixture }),
      /MIGRATION_CONTENT_DUPLICATE/u,
    );
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});

test('Preview snapshot rejects duplicate and out-of-order journal entries', async () => {
  const manifest = await inspectSourceMigrationManifest();
  const names = manifest.migrations.map(({ name }) => name);
  assert.throws(() => createPreviewMigrationSnapshot({
    capturedAt: '2026-09-14T12:00:00.000Z',
    journalNames: [names[0], names[0]],
    manifest,
    releaseSha,
  }), /MIGRATION_DUPLICATE/u);
  assert.throws(() => createPreviewMigrationSnapshot({
    capturedAt: '2026-09-14T12:00:00.000Z',
    journalNames: [names[1], names[0]],
    manifest,
    releaseSha,
  }), /ORDER_INVALID/u);
});

test('Preview migration snapshot is fresh for 24 hours and stale never asserts compatibility', async () => {
  const manifest = await inspectSourceMigrationManifest();
  const capturedAt = '2026-09-14T12:00:00.000Z';
  const snapshot = createPreviewMigrationSnapshot({
    capturedAt,
    journalNames: manifest.migrations.map(({ name }) => name),
    manifest,
    releaseSha,
  });
  const fresh = evaluatePreviewMigrationState({
    candidate: manifest,
    snapshot,
    now: new Date('2026-09-15T11:59:59.000Z'),
    phase: 'pre-merge',
  });
  assert.equal(fresh.status, 'PASS');
  assert.equal(fresh.compatibility, 'COMPATIBLE');
  assert.equal(fresh.blocking, false);

  const stale = evaluatePreviewMigrationState({
    candidate: manifest,
    snapshot,
    now: new Date('2026-09-15T12:00:01.000Z'),
    phase: 'pre-merge',
  });
  assert.equal(stale.status, 'UNKNOWN');
  assert.equal(stale.compatibility, 'NOT_ASSERTED');
  assert.equal(stale.blocking, false);
  assert.ok(stale.findings.includes('PREVIEW_MIGRATION_SNAPSHOT_STALE'));

  const predeploy = evaluatePreviewMigrationState({
    candidate: manifest,
    snapshot,
    now: new Date('2026-09-15T12:00:01.000Z'),
    phase: 'pre-deploy',
  });
  assert.equal(predeploy.blocking, true);
});

test('known migration conflict blocks both pre-merge and pre-deploy', async () => {
  const manifest = await inspectSourceMigrationManifest();
  const snapshot = createPreviewMigrationSnapshot({
    capturedAt: '2026-09-14T12:00:00.000Z',
    journalNames: manifest.migrations.map(({ name }) => name),
    manifest,
    releaseSha,
  });
  const changed = {
    ...manifest,
    migrations: manifest.migrations.map((item, index) =>
      index === 0 ? { ...item, sha256: 'f'.repeat(64) } : item,
    ),
  };
  const result = evaluatePreviewMigrationState({
    candidate: changed,
    snapshot,
    now: new Date('2026-09-14T13:00:00.000Z'),
    phase: 'pre-merge',
  });
  assert.equal(result.status, 'CONFLICT');
  assert.equal(result.blocking, true);
  assert.match(result.findings[0], /APPLIED_MIGRATION_HASH_CHANGED/u);
});

test('uncaptured Preview state is advisory pre-merge and blocking pre-deploy', async () => {
  const manifest = await inspectSourceMigrationManifest();
  const snapshot = { status: 'NOT_CAPTURED' };
  assert.equal(
    evaluatePreviewMigrationState({ candidate: manifest, snapshot, phase: 'pre-merge' }).blocking,
    false,
  );
  assert.equal(
    evaluatePreviewMigrationState({ candidate: manifest, snapshot, phase: 'pre-deploy' }).blocking,
    true,
  );
});

test('workflow metrics preserve timings but compare only deterministic results', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'srtaller-workflow-metrics-'));
  const path = join(directory, 'metrics.json');
  try {
    const first = await appendWorkflowMetric(path, {
      name: 'base-verify',
      result: 'PASS',
      finding: null,
      startedAt: '2026-09-14T12:00:00.000Z',
      finishedAt: '2026-09-14T12:00:01.000Z',
      durationMs: 1_000,
    });
    assert.equal(first.stages[0].durationMs, 1_000);
    assert.deepEqual(comparableWorkflowMetrics(first).stages[0], {
      name: 'base-verify',
      result: 'PASS',
      finding: null,
    });
    assert.throws(
      () => validateWorkflowMetrics({ ...first, password: 'must-not-exist' }),
      /forbidden/u,
    );
    assert.throws(
      () => validateWorkflowMetrics({
        ...first,
        stages: [...first.stages, first.stages[0]],
      }),
      /duplicated/u,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('authoritative evidence requires the exact ordered full stage inventory', () => {
  const stages = authoritativeWorkflowStageNames.map((name, index) => ({
    name,
    result: 'PASS',
    finding: null,
    startedAt: `2026-09-14T12:00:${String(index).padStart(2, '0')}.000Z`,
    finishedAt: `2026-09-14T12:00:${String(index + 1).padStart(2, '0')}.000Z`,
    durationMs: 1_000,
  }));
  const metrics = {
    schemaVersion: 1,
    contract: 'WF-005/WORKFLOW-METRICS',
    stages,
  };
  assert.doesNotThrow(() => validateAuthoritativeWorkflowMetrics(metrics));
  assert.throws(
    () => validateAuthoritativeWorkflowMetrics({ ...metrics, stages: stages.slice(0, -1) }),
    /exact ordered full stage inventory/u,
  );
  assert.throws(
    () => validateAuthoritativeWorkflowMetrics({
      ...metrics,
      stages: [stages[1], stages[0], ...stages.slice(2)],
    }),
    /exact ordered full stage inventory/u,
  );
  assert.throws(
    () => validateAuthoritativeWorkflowMetrics({
      ...metrics,
      stages: [...stages, { ...stages[0], name: 'unexpected-stage' }],
    }),
    /exact ordered full stage inventory/u,
  );
});

test('workflow stage wrapper records a sanitized spawn failure', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'srtaller-workflow-stage-'));
  const path = join(directory, 'metrics.json');
  try {
    await assert.rejects(execute(process.execPath, [
      'scripts/run-workflow-stage.mjs',
      '--metrics', path,
      '--stage', 'spawn-probe',
      '--', 'srtaller-command-that-does-not-exist',
    ]));
    const metrics = validateWorkflowMetrics(JSON.parse(await readFile(path, 'utf8')));
    assert.deepEqual(
      metrics.stages.map(({ name, result, finding }) => ({ name, result, finding })),
      [{ name: 'spawn-probe', result: 'FAIL', finding: 'STAGE_SPAWN_FAILURE' }],
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('verified-tree attestation stays shadow-only even when fingerprints match', () => {
  const candidate = finalizeVerifiedTreeAttestation({
    sourceCommit: releaseSha,
    treeSha1: '1'.repeat(40),
    inputSha256: '2'.repeat(64),
    migrationManifestSha256: '3'.repeat(64),
    distAggregateSha256: '4'.repeat(64),
  });
  const integrated = finalizeVerifiedTreeAttestation({
    sourceCommit: '89abcdef0123456789abcdef0123456789abcdef',
    treeSha1: '1'.repeat(40),
    inputSha256: '2'.repeat(64),
    migrationManifestSha256: '3'.repeat(64),
    distAggregateSha256: '4'.repeat(64),
  });
  const comparison = compareVerifiedTreeAttestations(candidate, integrated);
  assert.equal(comparison.equivalent, true);
  assert.equal(comparison.canReduceExactMain, false);
  assert.equal(comparison.fullExactMainRequired, true);
});

test('development preflight source is read-only and snapshot capture is explicit', async () => {
  const [preflight, capture] = await Promise.all([
    readFile('scripts/lib/development-preflight.mjs', 'utf8'),
    readFile('scripts/capture-preview-migration-state.mjs', 'utf8'),
  ]);
  assert.match(preflight, /begin read only/u);
  assert.doesNotMatch(preflight, /\b(?:insert|update|delete|truncate|drop|alter)\b/iu);
  assert.doesNotMatch(preflight, /docker|local:db:reset|local:db:seed/u);
  assert.match(capture, /authorized-real-journal-read/u);
  assert.match(capture, /--replace-existing/u);
});
