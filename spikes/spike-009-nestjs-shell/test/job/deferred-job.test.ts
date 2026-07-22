import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { AuthenticationError, ContextResolutionError, RecordNotFoundError } from '../../src/synthetic/application/errors.js';
import type { DeferredJobRunner } from '../../src/synthetic/infrastructure/jobs/deferred-job-runner.js';
import type { PostgresPool } from '../../src/synthetic/infrastructure/postgres/postgres-pool.js';
import type { FixtureAuthority } from '../../src/synthetic/infrastructure/security/fixture-authority.js';
import { createTestApplication } from '../support.js';

describe('deferred job in the same artifact', () => {
  let app: Awaited<ReturnType<typeof createTestApplication>>['app'];
  let jobs: DeferredJobRunner;
  let pool: PostgresPool;
  let authority: FixtureAuthority;

  before(async () => {
    ({ app, jobs, pool, authority } = await createTestApplication());
  });

  after(async () => {
    await app.close();
  });

  it('uses the same use case, policy, repository and audit', async () => {
    const result = await jobs.run({
      credentialId: 'credential-a', stationId: 'station-a', clientCorrelationIdCandidate: 'job-allowed',
      command: { recordId: 'record-shared', nextValue: 'job-authorized-value' },
    });
    assert.deepEqual(result, { recordId: 'record-shared', value: 'job-authorized-value', version: 2 });
    const audit = await pool.query<{ result: string; correlation_id: string }>(
      'SELECT result, correlation_id FROM synthetic_audit_events WHERE resource_id = $1', ['record-shared'],
    );
    assert.equal(audit.rows.some((event) => event.result === 'SUCCEEDED'), true);
    assert.equal(audit.rows.some((event) => event.correlation_id === 'job-allowed'), false);
  });

  it('revalidates revocation before execution', async () => {
    const identity = authority.authenticate('credential-revocable');
    authority.revokeSession(identity.sessionId);
    await assert.rejects(jobs.run({
      credentialId: 'credential-revocable', stationId: 'station-a', clientCorrelationIdCandidate: 'job-revoked',
      command: { recordId: 'record-shared', nextValue: 'revoked-job' },
    }), AuthenticationError);
    authority.restoreSession(identity.sessionId);
  });

  it('fails closed for invalid context and cross-tenant record', async () => {
    await assert.rejects(jobs.run({
      credentialId: 'credential-b', stationId: 'station-a', clientCorrelationIdCandidate: 'job-invalid-context',
      command: { recordId: 'record-shared', nextValue: 'invalid-context-job' },
    }), ContextResolutionError);
    await assert.rejects(jobs.run({
      credentialId: 'credential-b', stationId: 'station-b', clientCorrelationIdCandidate: 'job-cross-tenant',
      command: { recordId: 'record-a-only', nextValue: 'cross-tenant-job' },
    }), RecordNotFoundError);
  });

  it('does not contaminate concurrent tenant jobs', async () => {
    await Promise.all(Array.from({ length: 8 }, (_, index) => Promise.all([
      jobs.run({
        credentialId: 'credential-a', stationId: 'station-a', clientCorrelationIdCandidate: `job-a-${index}`,
        command: { recordId: 'record-shared', nextValue: `job-A-${index.toString().padStart(3, '0')}` },
      }),
      jobs.run({
        credentialId: 'credential-b', stationId: 'station-b', clientCorrelationIdCandidate: `job-b-${index}`,
        command: { recordId: 'record-shared', nextValue: `job-B-${index.toString().padStart(3, '0')}` },
      }),
    ])));
    const values = await pool.query<{ tenant_id: string; value: string }>(
      'SELECT tenant_id, value FROM synthetic_protected_records WHERE record_id = $1 ORDER BY tenant_id',
      ['record-shared'],
    );
    assert.match(values.rows[0]?.value ?? '', /^job-A-/);
    assert.match(values.rows[1]?.value ?? '', /^job-B-/);
  });
});
