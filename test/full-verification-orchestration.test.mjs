import assert from 'node:assert/strict';
import test from 'node:test';

import {
  fullVerificationStages,
  renderFullVerificationSummary,
  runFullVerificationCampaign,
} from '../scripts/lib/full-verification-orchestrator.mjs';
import {
  assertBaseSkipSummary,
  assertPostgresqlSkipInventory,
  expectedPostgresqlSkipInventory,
  inspectPostgresqlSkipInventory,
} from '../scripts/lib/postgresql-skip-inventory.mjs';

function fingerprint(value = 'candidate-a') {
  return Object.freeze({
    baseHead: '94065dfedc55234fd1738a6674289278aa49d224',
    candidateSha256: value,
    statusSha256: 'status',
    trackedDiffSha256: 'diff',
    untrackedManifestSha256: 'untracked',
    untracked: Object.freeze({ categories: Object.freeze({}), count: 0, unknown: Object.freeze([]) }),
  });
}

function campaignFixture({ failAt = null, finalFingerprint = fingerprint() } = {}) {
  const calls = [];
  let fingerprintCalls = 0;
  let writtenEvidence = null;
  const operation = (name, result = Object.freeze({ status: 'PASS' })) => async () => {
    calls.push(name);
    if (failAt === name) throw new Error(`${name} failed`);
    return result;
  };
  const smoke = Object.freeze({
    cleanup: operation('smoke-cleanup'),
    evidence: Object.freeze({ database: 'synthetic' }),
    smokeStart: operation('smoke-start'),
    smokeUi: operation('smoke-ui'),
  });
  const operations = {
    candidateFingerprint: async () => {
      calls.push(fingerprintCalls === 0 ? 'fingerprint-before' : 'fingerprint-after');
      fingerprintCalls += 1;
      return fingerprintCalls === 1 ? fingerprint() : finalFingerprint;
    },
    candidatePreflight: operation('candidate-preflight', Object.freeze({ status: 'PASS', baselineSha: 'baseline' })),
    resourcePreflight: operation('resource-preflight'),
    toolchain: operation('toolchain', Object.freeze({ node: '24.18.0', pnpm: '11.15.1' })),
    integrity: operation('integrity'),
    baseVerify: operation('base-verify'),
    postgresqlComposite: operation('postgresql-composite'),
    pbi039Postgresql: operation('pbi039-postgresql'),
    pbi040Postgresql: operation('pbi040-postgresql'),
    pbi041Postgresql: operation('pbi041-postgresql'),
    tl02Postgresql: operation('tl02-postgresql'),
    tl03Postgresql: operation('tl03-postgresql'),
    tl04Postgresql: operation('tl04-postgresql'),
    previewRuntime: operation('preview-runtime'),
    smokeProvision: operation('smoke-provision', smoke),
    cleanup: async (activeSmoke) => {
      calls.push('cleanup');
      if (activeSmoke) await activeSmoke.cleanup();
      return Object.freeze({ status: 'PASS' });
    },
    assertCandidateStable: (before, after) => {
      calls.push('fingerprint-compare');
      if (before.candidateSha256 !== after.candidateSha256) {
        throw new Error('candidate changed');
      }
    },
  };
  return {
    calls,
    operations,
    readEvidence: () => writtenEvidence,
    writeEvidence: async (_path, evidence) => {
      calls.push('write-evidence');
      writtenEvidence = evidence;
    },
  };
}

test('verify:full stage contract preserves the authoritative order', () => {
  assert.deepEqual(
    fullVerificationStages.map(({ id }) => id),
    [
      'candidate-preflight',
      'toolchain',
      'repository-integrity',
      'base-verify',
      'postgresql-composite',
      'pbi039-postgresql',
      'pbi040-postgresql',
      'pbi041-postgresql',
      'tl02-postgresql',
      'tl03-postgresql',
      'tl04-postgresql',
      'preview-runtime',
      'smoke-provision',
      'smoke-start',
      'smoke-ui',
      'cleanup',
      'candidate-final',
    ],
  );
});

test('campaign invokes verify before material PostgreSQL and writes PASS evidence', async () => {
  const fixture = campaignFixture();
  const evidence = await runFullVerificationCampaign({
    campaignId: 'test-campaign',
    evidencePath: '/external/evidence.json',
    operations: fixture.operations,
    output: () => undefined,
    writeEvidence: fixture.writeEvidence,
  });
  assert.ok(fixture.calls.indexOf('base-verify') < fixture.calls.indexOf('postgresql-composite'));
  assert.ok(fixture.calls.indexOf('postgresql-composite') < fixture.calls.indexOf('pbi039-postgresql'));
  assert.ok(fixture.calls.indexOf('pbi039-postgresql') < fixture.calls.indexOf('pbi040-postgresql'));
  assert.ok(fixture.calls.indexOf('pbi040-postgresql') < fixture.calls.indexOf('pbi041-postgresql'));
  assert.ok(fixture.calls.indexOf('pbi041-postgresql') < fixture.calls.indexOf('tl02-postgresql'));
  assert.ok(fixture.calls.indexOf('tl02-postgresql') < fixture.calls.indexOf('tl03-postgresql'));
  assert.ok(fixture.calls.indexOf('smoke-provision') < fixture.calls.indexOf('smoke-start'));
  assert.ok(fixture.calls.indexOf('smoke-start') < fixture.calls.indexOf('smoke-ui'));
  assert.ok(fixture.calls.indexOf('cleanup') < fixture.calls.indexOf('fingerprint-after'));
  assert.equal(evidence.verdict, 'PASS');
  assert.equal(evidence.integrationBaseline.status, 'PASS');
  assert.equal(fixture.readEvidence().warnings[0].disposition, 'ACCEPTED WARNING');
  assert.match(renderFullVerificationSummary(evidence), /Stage 3 Base verify gate/u);
  assert.match(renderFullVerificationSummary(evidence), /Verdict: PASS/u);
});

test('failure stops later stages but cleanup, final fingerprint and failure evidence still run', async () => {
  const fixture = campaignFixture({ failAt: 'postgresql-composite' });
  await assert.rejects(
    runFullVerificationCampaign({
      campaignId: 'test-failure',
      evidencePath: '/external/evidence.json',
      operations: fixture.operations,
      output: () => undefined,
      writeEvidence: fixture.writeEvidence,
    }),
    /postgresql-composite/u,
  );
  assert.ok(!fixture.calls.includes('pbi039-postgresql'));
  assert.ok(!fixture.calls.includes('preview-runtime'));
  assert.ok(!fixture.calls.includes('smoke-provision'));
  assert.ok(fixture.calls.includes('cleanup'));
  assert.ok(fixture.calls.includes('fingerprint-after'));
  assert.equal(fixture.readEvidence().failedStage, 'postgresql-composite');
  assert.equal(fixture.readEvidence().verdict, 'FAIL');
});

test('preflight failure still records both available candidate fingerprints', async () => {
  const fixture = campaignFixture({ failAt: 'candidate-preflight' });
  await assert.rejects(
    runFullVerificationCampaign({
      campaignId: 'test-preflight-failure',
      evidencePath: '/external/evidence.json',
      operations: fixture.operations,
      output: () => undefined,
      writeEvidence: fixture.writeEvidence,
    }),
  );
  assert.ok(!fixture.calls.includes('toolchain'));
  assert.ok(fixture.calls.includes('cleanup'));
  assert.equal(fixture.readEvidence().candidateFingerprintBefore.candidateSha256, 'candidate-a');
  assert.equal(fixture.readEvidence().candidateFingerprintAfter.candidateSha256, 'candidate-a');
});

test('second smoke failure still executes mandatory cleanup', async () => {
  const fixture = campaignFixture({ failAt: 'smoke-ui' });
  await assert.rejects(
    runFullVerificationCampaign({
      campaignId: 'test-smoke-failure',
      evidencePath: '/external/evidence.json',
      operations: fixture.operations,
      output: () => undefined,
      writeEvidence: fixture.writeEvidence,
    }),
  );
  assert.ok(fixture.calls.includes('smoke-start'));
  assert.ok(fixture.calls.includes('smoke-ui'));
  assert.ok(fixture.calls.indexOf('smoke-ui') < fixture.calls.indexOf('cleanup'));
  assert.ok(fixture.calls.includes('smoke-cleanup'));
});

test('candidate mutation turns an otherwise green campaign into failure evidence', async () => {
  const fixture = campaignFixture({ finalFingerprint: fingerprint('candidate-b') });
  await assert.rejects(
    runFullVerificationCampaign({
      campaignId: 'test-mutation',
      evidencePath: '/external/evidence.json',
      operations: fixture.operations,
      output: () => undefined,
      writeEvidence: fixture.writeEvidence,
    }),
    /candidate-final/u,
  );
  assert.equal(fixture.readEvidence().failedStage, 'candidate-final');
  assert.equal(fixture.readEvidence().verdict, 'FAIL');
  assert.equal(fixture.readEvidence().candidateFingerprintAfter.candidateSha256, 'candidate-b');
});

test('PostgreSQL skip inventory maps all 38 exact material test identities to one authoritative stage', async () => {
  const inventory = await inspectPostgresqlSkipInventory();
  assert.equal(inventory.total, 38);
  assert.equal(inventory.material.postgresqlComposite, 17);
  assert.equal(inventory.material.pbi039Postgresql, 2);
  assert.equal(inventory.material.pbi040Postgresql, 1);
  assert.equal(inventory.material.pbi041Postgresql, 10);
  assert.equal(inventory.material.tl02Postgresql, 2);
  assert.equal(inventory.material.tl03Postgresql, 3);
  assert.equal(inventory.material.tl04Postgresql, 3);
  assert.equal(inventory.files.length, expectedPostgresqlSkipInventory.length);
  assert.deepEqual(assertBaseSkipSummary('ℹ skipped 38\n', inventory).skipped, 38);
  assert.throws(() => assertBaseSkipSummary('ℹ skipped 37\n', inventory), /expected 38/u);
  assert.throws(() => assertBaseSkipSummary('ℹ skipped 38\nℹ skipped 38\n', inventory), /one authoritative/u);
});

test('PostgreSQL skip inventory fails closed on removal, unknown tests and duplicate registrations', async () => {
  const inventory = await inspectPostgresqlSkipInventory();
  assert.throws(() => assertPostgresqlSkipInventory(inventory.files.slice(1)), /inventory changed/u);
  assert.throws(
    () => assertPostgresqlSkipInventory([...inventory.files, { file: 'test/unknown-postgresql.test.mjs', title: 'Unknown material test', guard: 'enabled' }]),
    /inventory changed/u,
  );
  assert.throws(
    () => assertPostgresqlSkipInventory(inventory.files, [...expectedPostgresqlSkipInventory, expectedPostgresqlSkipInventory[0]]),
    /duplicate governed test identity/u,
  );
});
