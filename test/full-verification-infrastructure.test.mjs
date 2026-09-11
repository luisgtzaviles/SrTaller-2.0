import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

import {
  assertCandidateFingerprintStable,
  assertCandidatePreflight,
  createCandidateFingerprint,
} from '../scripts/lib/candidate-fingerprint.mjs';
import { validateExternalConfigurationCandidate } from '../scripts/lib/external-configuration-contract.mjs';
import { createFullVerificationSmokeHarness } from '../scripts/lib/full-verification-smoke.mjs';
import { reserveLoopbackPort } from '../scripts/lib/loopback-port.mjs';
import { assertExternalEvidenceDirectory } from '../scripts/lib/full-verification-orchestrator.mjs';

const execute = promisify(execFile);

async function initializeFixture(root) {
  await execute('git', ['init', '--quiet'], { cwd: root });
  await execute('git', ['config', 'user.email', 'synthetic@example.invalid'], { cwd: root });
  await execute('git', ['config', 'user.name', 'Synthetic Test'], { cwd: root });
  await writeFile(join(root, '.gitignore'), 'dist/\n');
  await writeFile(join(root, '.env.local.example'), 'SR_DB_PASSWORD=generated-by-local-config\n');
  await writeFile(join(root, 'tracked.txt'), 'baseline\n');
  await execute('git', ['add', '.gitignore', '.env.local.example', 'tracked.txt'], { cwd: root });
  await execute('git', ['commit', '--quiet', '-m', 'fixture'], { cwd: root });
}

test('candidate fingerprint covers tracked diff and classified untracked content', async () => {
  const root = await mkdtemp(join(tmpdir(), 'srtaller-candidate-fingerprint-'));
  try {
    await initializeFixture(root);
    await writeFile(join(root, 'tracked.txt'), 'changed\n');
    await mkdir(join(root, 'src'), { recursive: true });
    await writeFile(join(root, 'src', 'candidate.ts'), 'export const value = 1;\n');
    const first = assertCandidatePreflight(await createCandidateFingerprint(root));
    const second = await createCandidateFingerprint(root);
    assertCandidateFingerprintStable(first, second);
    assert.equal(first.untracked.categories['backend-product-source'], 1);
    await writeFile(join(root, 'src', 'candidate.ts'), 'export const value = 2;\n');
    const changed = await createCandidateFingerprint(root);
    assert.notEqual(changed.candidateSha256, first.candidateSha256);
    assert.notEqual(changed.untrackedManifestSha256, first.untrackedManifestSha256);
    await writeFile(join(root, 'unknown.file'), 'unknown\n');
    await assert.rejects(
      async () => assertCandidatePreflight(await createCandidateFingerprint(root)),
      /UNKNOWN untracked paths/u,
    );
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test('external configuration scans untracked candidates and excludes ignored files without leaking values', async () => {
  const root = await mkdtemp(join(tmpdir(), 'srtaller-external-config-'));
  try {
    await initializeFixture(root);
    await mkdir(join(root, 'apps', 'dev-preview-web', 'src'), { recursive: true });
    await writeFile(
      join(root, '.gitignore'),
      'dist/\napps/dev-preview-web/src/ignored-generated.ts\n',
    );
    await execute('git', ['add', '.gitignore'], { cwd: root });
    await execute('git', ['commit', '--quiet', '-m', 'ignore generated fixture'], { cwd: root });
    await writeFile(
      join(root, 'apps', 'dev-preview-web', 'src', 'candidate.ts'),
      'export const forbidden = import.meta.env.VITE_DB_PASSWORD;\n',
    );
    await writeFile(
      join(root, 'apps', 'dev-preview-web', 'src', 'ignored-generated.ts'),
      'export const ignored = import.meta.env.VITE_IGNORED_PASSWORD;\n',
    );
    const result = await validateExternalConfigurationCandidate(root);
    assert.deepEqual(result.problems, [
      'apps/dev-preview-web/src/candidate.ts: forbidden server-only secret reference in client boundary',
    ]);
    assert.doesNotMatch(JSON.stringify(result), /VITE_IGNORED_PASSWORD/u);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test('Preview runtime helper returns a relinquished ephemeral loopback port', async () => {
  const port = await reserveLoopbackPort();
  assert.notEqual(port, 31_991);
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  await new Promise((resolve) => server.close(resolve));
  const previewSource = await readFile('scripts/test-preview-database-runtime-postgresql.mjs', 'utf8');
  assert.doesNotMatch(previewSource, /31991/u);
  assert.match(previewSource, /reserveLoopbackPort/u);
});

test('smoke harness shares one migrated PostgreSQL context and emits no credential', async () => {
  const calls = [];
  let password = '';
  const docker = async (argumentsList) => {
    calls.push(`docker:${argumentsList[0]}`);
    const passwordArgument = argumentsList.find((value) => value.startsWith('POSTGRES_PASSWORD='));
    if (passwordArgument) password = passwordArgument.slice('POSTGRES_PASSWORD='.length);
    if (argumentsList[0] === 'run') return { stdout: 'container-id\n' };
    if (argumentsList[0] === 'exec') return { stdout: 'postgres (PostgreSQL) 18.4\n' };
    if (
      argumentsList[0] === 'inspect' &&
      argumentsList.some((value) => value.includes('.State.Health'))
    ) {
      return { stdout: 'healthy\n' };
    }
    if (argumentsList[0] === 'inspect') return { stdout: '55499\n' };
    return { stdout: '' };
  };
  const environments = [];
  const runCommand = async (_command, argumentsList, options) => {
    const name = argumentsList.at(-1);
    calls.push(`run:${name}`);
    environments.push(options.env);
    if (name === 'dist/db-migrate.js') {
      return { stdout: JSON.stringify({ applied: 51, pending: 0, manifestHash: 'manifest' }) };
    }
    if (name === 'scripts/smoke-ui.mjs') {
      return { stdout: JSON.stringify({ root: 200, spa: 200, asset: 200 }) };
    }
    return { stdout: 'Compiled dist startup, listener and shutdown verified\n' };
  };
  const harness = createFullVerificationSmokeHarness({
    campaignId: 'test-campaign',
    docker,
    environment: {
      PATH: process.env.PATH,
      DATABASE_URL: 'postgresql://personal-secret',
      SR_DB_PASSWORD: 'personal-db-secret',
      SR_STATION_BOOTSTRAP_SECRET: 'personal-bootstrap-secret',
    },
    runCommand,
  });
  const provision = await harness.provision();
  const start = await harness.smokeStart();
  const ui = await harness.smokeUi();
  const cleanup = await harness.cleanup();
  assert.deepEqual(calls.slice(0, 6), [
    'docker:pull', 'docker:run', 'docker:inspect', 'docker:exec', 'docker:inspect',
    'run:dist/db-migrate.js',
  ]);
  assert.equal(environments[0].SR_DB_NAME, environments[1].SR_DB_NAME);
  assert.equal(environments[1].SR_DB_NAME, environments[2].SR_DB_NAME);
  assert.equal(provision.migration.applied, 51);
  assert.equal(start.shutdown, 'PASS');
  assert.equal(ui.status, 'PASS');
  assert.equal(cleanup.status, 'PASS');
  assert.ok(password.length > 0);
  assert.doesNotMatch(JSON.stringify({ provision, start, ui, cleanup }), new RegExp(password, 'u'));
  assert.equal(environments[1].DATABASE_URL, undefined);
  assert.equal(environments[1].SR_STATION_BOOTSTRAP_SECRET, undefined);
});

test('Full Verification evidence path is fail-closed inside the candidate repository', () => {
  assert.throws(
    () => assertExternalEvidenceDirectory('/candidate', '/candidate/evidence'),
    /outside the repository/u,
  );
  assert.equal(
    assertExternalEvidenceDirectory('/candidate', '/external/evidence'),
    '/external/evidence',
  );
});

test('package keeps verify base semantics and exposes the dedicated full orchestrator', async () => {
  const packageManifest = JSON.parse(await readFile('package.json', 'utf8'));
  assert.equal(
    packageManifest.scripts.verify,
    'pnpm run verify:toolchain && pnpm run clean && pnpm run typecheck && pnpm run build && pnpm run test && pnpm run verify:structure && pnpm run verify:architecture && pnpm run verify:external-configuration && pnpm run verify:ui && pnpm run verify:ui:production',
  );
  assert.equal(
    packageManifest.scripts['verify:full'],
    'pnpm run verify:toolchain && node ./scripts/verify-full.mjs',
  );
});
