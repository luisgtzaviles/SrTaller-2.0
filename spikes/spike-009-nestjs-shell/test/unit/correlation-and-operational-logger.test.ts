import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createCorrelationIdentifiers,
  normalizeClientCorrelationIdCandidate,
} from '../../src/synthetic/infrastructure/observability/correlation.js';
import { OperationalLogger } from '../../src/synthetic/infrastructure/observability/operational-logger.js';

describe('correlation identifiers', () => {
  it('normalizes safe candidates and drops control characters or excessive values', () => {
    assert.equal(normalizeClientCorrelationIdCandidate('  client.reference-1  '), 'client.reference-1');
    assert.equal(normalizeClientCorrelationIdCandidate('bad\nvalue'), undefined);
    assert.equal(normalizeClientCorrelationIdCandidate('x'.repeat(81)), undefined);
    assert.equal(normalizeClientCorrelationIdCandidate(undefined), undefined);
  });

  it('always generates unique authoritative server identifiers', () => {
    const first = createCorrelationIdentifiers('same-candidate');
    const second = createCorrelationIdentifiers('same-candidate');
    assert.notEqual(first.serverCorrelationId, second.serverCorrelationId);
    assert.equal(first.clientCorrelationIdCandidate, 'same-candidate');
    assert.notEqual(first.serverCorrelationId, first.clientCorrelationIdCandidate);
  });
});

describe('operational logger', () => {
  it('emits parseable timestamp, level and event without implicit sensitive fields', () => {
    const lines: string[] = [];
    const logger = new OperationalLogger((line) => lines.push(line), () => new Date('2026-07-22T00:00:00.000Z'));
    logger.info('application.ready', { serverCorrelationId: 'server-id' });
    assert.deepEqual(JSON.parse(lines[0] ?? ''), {
      timestamp: '2026-07-22T00:00:00.000Z',
      level: 'info',
      event: 'application.ready',
      serverCorrelationId: 'server-id',
    });
  });
});
