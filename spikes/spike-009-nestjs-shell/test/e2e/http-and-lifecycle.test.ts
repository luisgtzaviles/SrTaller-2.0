import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import type { PostgresPool } from '../../src/synthetic/infrastructure/postgres/postgres-pool.js';
import type { FixtureAuthority } from '../../src/synthetic/infrastructure/security/fixture-authority.js';
import type { DeferredJobRunner } from '../../src/synthetic/infrastructure/jobs/deferred-job-runner.js';
import { ContextResolutionError } from '../../src/synthetic/application/errors.js';
import { capturedOperationalLogger, createTestApplication, listen, postSynthetic } from '../support.js';

describe('HTTP adapter and lifecycle', () => {
  const captured = capturedOperationalLogger();
  let app: Awaited<ReturnType<typeof createTestApplication>>['app'];
  let pool: PostgresPool;
  let authority: FixtureAuthority;
  let jobs: DeferredJobRunner;
  let baseUrl: string;
  let closed = false;

  before(async () => {
    ({ app, pool, authority, jobs } = await createTestApplication({ logger: captured.logger }));
    baseUrl = await listen(app);
  });

  after(async () => {
    if (!closed) await app.close();
  });

  it('exposes minimal liveness and readiness without internals', async () => {
    for (const path of ['live', 'ready']) {
      const response = await fetch(`${baseUrl}/health/${path}`);
      assert.equal(response.status, 200);
      const body = JSON.stringify(await response.json());
      assert.doesNotMatch(body, /postgres|host|port|version|connection/i);
    }
  });

  it('permits an authorized operation through a thin controller', async () => {
    const response = await postSynthetic(baseUrl, {
      credential: 'credential-a', station: 'station-a', clientCorrelationIdCandidate: 'http-allowed',
      body: { nextValue: 'http-authorized-value' },
    });
    assert.equal(response.status, 201);
    assert.equal(response.body.value, 'http-authorized-value');
  });

  it('fails closed when authentication or context is missing', async () => {
    assert.equal((await postSynthetic(baseUrl, { station: 'station-a' })).status, 401);
    assert.equal((await postSynthetic(baseUrl, { credential: 'credential-a' })).status, 403);
  });

  it('denies missing capability inside application', async () => {
    const response = await postSynthetic(baseUrl, {
      credential: 'credential-no-cap', station: 'station-a', body: { nextValue: 'must-not-write' },
    });
    assert.equal(response.status, 403);
    assert.equal(response.body.error, 'OPERATION_DENIED');
  });

  it('denies an unauthorized branch and tenant/station conflict', async () => {
    assert.equal((await postSynthetic(baseUrl, {
      credential: 'credential-a', station: 'station-a-other', body: { nextValue: 'wrong-branch' },
    })).status, 403);
    assert.equal((await postSynthetic(baseUrl, {
      credential: 'credential-b', station: 'station-a', body: { nextValue: 'wrong-tenant' },
    })).status, 403);
  });

  it('applies revocation to the next request without restart', async () => {
    const identity = authority.authenticate('credential-revocable');
    authority.revokeSession(identity.sessionId);
    const response = await postSynthetic(baseUrl, {
      credential: 'credential-revocable', station: 'station-a', body: { nextValue: 'revoked-write' },
    });
    assert.equal(response.status, 401);
    authority.restoreSession(identity.sessionId);
  });

  it('does not reveal cross-tenant record existence', async () => {
    const response = await postSynthetic(baseUrl, {
      credential: 'credential-b', station: 'station-b', recordId: 'record-a-only',
      body: { nextValue: 'cross-tenant-write' },
    });
    assert.equal(response.status, 404);
    const serialized = JSON.stringify(response.body);
    assert.doesNotMatch(serialized, /tenant-a|sql|stack|postgres|127\.0\.0\.1/i);
  });

  it('maps structural validation and unexpected failure safely', async () => {
    const invalid = await postSynthetic(baseUrl, {
      credential: 'credential-a', station: 'station-a', body: { nextValue: 'x', extra: 'forbidden' },
    });
    assert.equal(invalid.status, 400);
    const failed = await postSynthetic(baseUrl, {
      credential: 'credential-a', station: 'station-a',
      body: { nextValue: 'synthetic-failure-value', simulateFailure: true },
    });
    assert.equal(failed.status, 500);
    assert.deepEqual(failed.body, {
      error: 'INTERNAL_ERROR', message: 'Operation could not be completed.',
    });
  });

  it('keeps concurrent tenant A/B operations isolated', async () => {
    const operations = Array.from({ length: 12 }, (_, index) => [
      postSynthetic(baseUrl, {
        credential: 'credential-a', station: 'station-a', clientCorrelationIdCandidate: `concurrent-a-${index}`,
        body: { nextValue: `A-value-${index.toString().padStart(3, '0')}` },
      }),
      postSynthetic(baseUrl, {
        credential: 'credential-b', station: 'station-b', clientCorrelationIdCandidate: `concurrent-b-${index}`,
        body: { nextValue: `B-value-${index.toString().padStart(3, '0')}` },
      }),
    ]).flat();
    const responses = await Promise.all(operations);
    assert.equal(responses.every((response) => response.status === 201), true);
    const values = await pool.query<{ tenant_id: string; value: string }>(
      'SELECT tenant_id, value FROM synthetic_protected_records WHERE record_id = $1 ORDER BY tenant_id',
      ['record-shared'],
    );
    assert.match(values.rows[0]?.value ?? '', /^A-value-/);
    assert.match(values.rows[1]?.value ?? '', /^B-value-/);
  });

  it('drains an accepted pending job and closes listener and pool deterministically', {
    timeout: 5_000,
  }, async () => {
    const blocker = await pool.connect();
    let blockerReleased = false;
    await blocker.query('BEGIN');
    await blocker.query(
      'SELECT record_id FROM synthetic_protected_records WHERE tenant_id = $1 AND record_id = $2 FOR UPDATE',
      ['tenant-a', 'record-shared'],
    );
    const task = jobs.run({
      credentialId: 'credential-a',
      stationId: 'station-a',
      clientCorrelationIdCandidate: 'pending-job-shutdown',
      command: { recordId: 'record-shared', nextValue: 'drained-during-shutdown' },
    });
    assert.equal(jobs.pendingCount, 1);

    const drainStarted = waitForOperationalEvent('lifecycle.jobs.drain.started');
    const closing = app.close();
    try {
      await drainStarted;
      await assert.rejects(jobs.run({
        credentialId: 'credential-a',
        stationId: 'station-a',
        clientCorrelationIdCandidate: 'must-not-be-accepted',
        command: { recordId: 'record-shared', nextValue: 'must-not-run' },
      }), ContextResolutionError);
      await blocker.query('ROLLBACK');
      blocker.release();
      blockerReleased = true;
      const result = await task as { readonly value: string };
      await closing;
      closed = true;
      assert.equal(result.value, 'drained-during-shutdown');
      assert.equal(jobs.pendingCount, 0);
      assert.equal(pool.isClosed, true);
      assert.equal(captured.records.some((record) => record.event === 'lifecycle.listener.closed'), true);
      assert.equal(captured.records.some((record) => record.event === 'lifecycle.shutdown.completed'), true);
      await assert.rejects(fetch(`${baseUrl}/health/live`));
    } finally {
      if (!closed) {
        if (!blockerReleased) {
          await blocker.query('ROLLBACK').catch(() => undefined);
          blocker.release();
          blockerReleased = true;
        }
        await Promise.allSettled([task, closing]);
        closed = true;
      }
    }
  });

  function waitForOperationalEvent(event: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        unsubscribe();
        reject(new Error(`Timed out waiting for ${event}`));
      }, 2_000);
      const unsubscribe = captured.logger.subscribe((record) => {
        if (record.event !== event) return;
        clearTimeout(timer);
        unsubscribe();
        resolve();
      });
    });
  }
});
