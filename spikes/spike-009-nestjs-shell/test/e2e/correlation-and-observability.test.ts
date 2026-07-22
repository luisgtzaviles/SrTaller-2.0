import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import type { PostgresPool } from '../../src/synthetic/infrastructure/postgres/postgres-pool.js';
import {
  capturedOperationalLogger,
  createTestApplication,
  listen,
  postSynthetic,
} from '../support.js';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('server-authoritative correlation and sanitized operational signals', () => {
  const captured = capturedOperationalLogger();
  let app: Awaited<ReturnType<typeof createTestApplication>>['app'];
  let pool: PostgresPool;
  let baseUrl: string;

  before(async () => {
    ({ app, pool } = await createTestApplication({ logger: captured.logger }));
    baseUrl = await listen(app);
  });

  after(async () => {
    await app.close();
  });

  it('always generates a server ID and normalizes or discards client candidates', async () => {
    const cases = [
      undefined,
      '  valid-client-reference  ',
      'invalid candidate with spaces',
      'x'.repeat(81),
    ] as const;
    for (const [index, candidate] of cases.entries()) {
      const response = await postSynthetic(baseUrl, {
        credential: 'credential-a',
        station: 'station-a',
        ...(candidate === undefined ? {} : { clientCorrelationIdCandidate: candidate }),
        body: { nextValue: `correlation-case-${index}` },
      });
      assert.equal(response.status, 201);
      assert.match(response.serverCorrelationId ?? '', uuid);
      assert.notEqual(response.serverCorrelationId, candidate?.trim());
    }
  });

  it('keeps equal concurrent candidates secondary and returns unique server IDs', async () => {
    const candidate = 'same-client-reference';
    const responses = await Promise.all(Array.from({ length: 8 }, (_, index) => postSynthetic(baseUrl, {
      credential: 'credential-a',
      station: 'station-a',
      clientCorrelationIdCandidate: candidate,
      body: { nextValue: `same-candidate-${index}` },
    })));
    assert.equal(responses.every((response) => response.status === 201), true);
    const serverIds = responses.map((response) => response.serverCorrelationId ?? '');
    assert.equal(new Set(serverIds).size, responses.length);
    assert.equal(serverIds.every((value) => uuid.test(value) && value !== candidate), true);
  });

  it('uses the server ID in response, telemetry log and authoritative audit', async () => {
    const candidate = 'secondary-client-reference';
    const response = await postSynthetic(baseUrl, {
      credential: 'credential-a',
      station: 'station-a',
      clientCorrelationIdCandidate: candidate,
      body: { nextValue: 'audit-server-correlation' },
    });
    const serverCorrelationId = response.serverCorrelationId ?? '';
    const audit = await pool.query<{ correlation_id: string }>(
      'SELECT correlation_id FROM synthetic_audit_events WHERE correlation_id = $1',
      [serverCorrelationId],
    );
    assert.deepEqual(audit.rows, [{ correlation_id: serverCorrelationId }]);
    const candidateAudit = await pool.query(
      'SELECT correlation_id FROM synthetic_audit_events WHERE correlation_id = $1',
      [candidate],
    );
    assert.equal(candidateAudit.rows.length, 0);
    assert.equal(captured.records.some((record) =>
      record.event === 'http.request.completed' &&
      record.serverCorrelationId === serverCorrelationId &&
      record.clientCorrelationIdCandidate === candidate), true);
    const logs = captured.serialized.join('\n');
    assert.doesNotMatch(logs, /credential-a|postgresql:\/\/|record-shared|audit-server-correlation/);
  });
});
