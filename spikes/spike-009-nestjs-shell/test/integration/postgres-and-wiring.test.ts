import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { TOKENS } from '../../src/bootstrap/tokens.js';
import { SyntheticAuthorizationPolicy } from '../../src/synthetic/application/authorization-policy.js';
import { RecordNotFoundError, SyntheticFailureError } from '../../src/synthetic/application/errors.js';
import { ExecuteSyntheticOperation } from '../../src/synthetic/application/execute-synthetic-operation.js';
import type { OperationalContext } from '../../src/synthetic/application/operational-context.js';
import type { AuditEvent, AuditPort } from '../../src/synthetic/application/ports.js';
import { PostgresUnitOfWork } from '../../src/synthetic/infrastructure/postgres/postgres-adapters.js';
import type { PostgresPool } from '../../src/synthetic/infrastructure/postgres/postgres-pool.js';
import type { FixtureAuthority } from '../../src/synthetic/infrastructure/security/fixture-authority.js';
import { createTestApplication, resetDatabase } from '../support.js';

describe('Nest wiring and real PostgreSQL adapter', () => {
  let app: Awaited<ReturnType<typeof createTestApplication>>['app'];
  let pool: PostgresPool;
  let authority: FixtureAuthority;
  let operation: ExecuteSyntheticOperation;

  before(async () => {
    ({ app, pool, authority } = await createTestApplication());
    operation = app.get<ExecuteSyntheticOperation>(TOKENS.operation);
  });

  beforeEach(async () => {
    await resetDatabase(pool);
  });

  after(async () => {
    await app.close();
  });

  it('resolves the use case through the Nest composition root', () => {
    assert.ok(operation);
    assert.ok(pool);
  });

  it('updates only the explicit tenant and branch inside a transaction', async () => {
    const contextA = contextFor('integration-update-isolated');
    await operation.execute(contextA, { recordId: 'record-shared', nextValue: 'integration-a-value' });
    const result = await pool.query<{ tenant_id: string; value: string }>(
      'SELECT tenant_id, value FROM synthetic_protected_records WHERE record_id = $1 ORDER BY tenant_id',
      ['record-shared'],
    );
    assert.deepEqual(result.rows, [
      { tenant_id: 'tenant-a', value: 'integration-a-value' },
      { tenant_id: 'tenant-b', value: 'tenant-b-initial' },
    ]);
  });

  it('rolls back the write after a synthetic transactional failure', async () => {
    const contextA = contextFor('integration-rollback-isolated');
    const beforeValue = await pool.query<{ value: string; version: number }>(
      'SELECT value, version FROM synthetic_protected_records WHERE tenant_id = $1 AND record_id = $2',
      ['tenant-a', 'record-shared'],
    );
    await assert.rejects(
      operation.execute(contextA, {
        recordId: 'record-shared', nextValue: 'must-roll-back', simulateFailure: true,
      }),
      SyntheticFailureError,
    );
    const afterValue = await pool.query<{ value: string; version: number }>(
      'SELECT value, version FROM synthetic_protected_records WHERE tenant_id = $1 AND record_id = $2',
      ['tenant-a', 'record-shared'],
    );
    assert.deepEqual(afterValue.rows, beforeValue.rows);
  });

  it('returns safe not-found semantics for a cross-tenant identifier', async () => {
    const contextB = authority.resolveContext(
      authority.authenticate('credential-b'), 'station-b', 'integration-b',
    );
    await assert.rejects(
      operation.execute(contextB, { recordId: 'record-a-only', nextValue: 'cross-tenant-attempt' }),
      RecordNotFoundError,
    );
  });

  it('records authoritative audit from fixtures created by this test only', async () => {
    const successCorrelation = 'integration-audit-success-isolated';
    const failureCorrelation = 'integration-audit-failure-isolated';
    await operation.execute(contextFor(successCorrelation), {
      recordId: 'record-shared', nextValue: 'audit-success-value',
    });
    await assert.rejects(operation.execute(contextFor(failureCorrelation), {
      recordId: 'record-shared', nextValue: 'audit-failure-value', simulateFailure: true,
    }), SyntheticFailureError);
    const result = await pool.query<{ result: string; control: string }>(
      `SELECT result, control FROM synthetic_audit_events
        WHERE correlation_id = ANY($1::text[]) ORDER BY correlation_id`,
      [[failureCorrelation, successCorrelation]],
    );
    assert.deepEqual(result.rows, [
      { result: 'FAILED', control: 'application-policy' },
      { result: 'SUCCEEDED', control: 'application-policy' },
    ]);
  });

  it('makes a post-commit audit failure observable without hiding the committed write', async () => {
    class FailingAudit implements AuditPort {
      readonly attempts: AuditEvent[] = [];

      async record(event: AuditEvent): Promise<void> {
        this.attempts.push(event);
        throw new Error('SyntheticAuditUnavailable');
      }
    }

    const audit = new FailingAudit();
    const operationWithFailingAudit = new ExecuteSyntheticOperation(
      new SyntheticAuthorizationPolicy(),
      new PostgresUnitOfWork(pool),
      audit,
    );
    await assert.rejects(operationWithFailingAudit.execute(contextFor('audit-adapter-failure'), {
      recordId: 'record-shared', nextValue: 'committed-before-audit-failure',
    }));
    const stored = await pool.query<{ value: string }>(
      'SELECT value FROM synthetic_protected_records WHERE tenant_id = $1 AND record_id = $2',
      ['tenant-a', 'record-shared'],
    );
    assert.equal(stored.rows[0]?.value, 'committed-before-audit-failure');
    assert.equal(audit.attempts.length, 2);
  });

  function contextFor(serverCorrelationId: string): OperationalContext {
    return authority.resolveContext(
      authority.authenticate('credential-a'),
      'station-a',
      serverCorrelationId,
    );
  }
});
