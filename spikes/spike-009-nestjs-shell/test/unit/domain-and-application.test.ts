import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SyntheticAuthorizationPolicy } from '../../src/synthetic/application/authorization-policy.js';
import { AuthorizationError } from '../../src/synthetic/application/errors.js';
import { ExecuteSyntheticOperation } from '../../src/synthetic/application/execute-synthetic-operation.js';
import { createOperationalContext } from '../../src/synthetic/application/operational-context.js';
import type { AuditEvent, AuditPort, TransactionScope, UnitOfWork } from '../../src/synthetic/application/ports.js';
import { DomainValidationError } from '../../src/synthetic/domain/errors.js';
import { ProtectedRecord, SyntheticValue } from '../../src/synthetic/domain/protected-record.js';

const allowedContext = createOperationalContext({
  tenantId: 'tenant-a',
  branchId: 'branch-a',
  stationId: 'station-a',
  userId: 'user-a',
  sessionId: 'session-a',
  capabilities: ['synthetic:write'],
  serverCorrelationId: 'unit-server-correlation',
});

class InMemoryUnitOfWork implements UnitOfWork {
  readonly record = ProtectedRecord.rehydrate({
    id: 'record-shared',
    tenantId: 'tenant-a',
    branchId: 'branch-a',
    value: 'initial-value',
    version: 1,
  });

  async execute<T>(_context: typeof allowedContext, work: (scope: TransactionScope) => Promise<T>) {
    return work({
      protectedRecords: {
        findForUpdate: async () => this.record,
        save: async () => undefined,
      },
    });
  }
}

class InMemoryAudit implements AuditPort {
  readonly events: AuditEvent[] = [];

  async record(event: AuditEvent): Promise<void> {
    this.events.push(event);
  }
}

describe('domain without framework', () => {
  it('enforces the synthetic value invariant', () => {
    assert.throws(() => SyntheticValue.create('x'), DomainValidationError);
    assert.equal(SyntheticValue.create(' valid ').value, 'valid');
  });

  it('updates value and version', () => {
    const record = ProtectedRecord.rehydrate({
      id: 'record', tenantId: 'tenant-a', branchId: 'branch-a', value: 'before', version: 1,
    });
    record.update('after');
    assert.equal(record.value, 'after');
    assert.equal(record.version, 2);
  });

  it('rejects no-op updates', () => {
    const record = ProtectedRecord.rehydrate({
      id: 'record', tenantId: 'tenant-a', branchId: 'branch-a', value: 'same', version: 1,
    });
    assert.throws(() => record.update('same'), DomainValidationError);
  });
});

describe('application authorization without NestJS', () => {
  it('executes with explicit authorized context', async () => {
    const unitOfWork = new InMemoryUnitOfWork();
    const audit = new InMemoryAudit();
    const operation = new ExecuteSyntheticOperation(new SyntheticAuthorizationPolicy(), unitOfWork, audit);
    const result = await operation.execute(allowedContext, {
      recordId: 'record-shared', nextValue: 'unit-updated',
    });
    assert.equal(result.value, 'unit-updated');
    assert.equal(audit.events[0]?.result, 'SUCCEEDED');
  });

  it('cannot bypass policy through direct invocation', async () => {
    const operation = new ExecuteSyntheticOperation(
      new SyntheticAuthorizationPolicy(), new InMemoryUnitOfWork(), new InMemoryAudit(),
    );
    const deniedContext = createOperationalContext({ ...allowedContext, capabilities: [] });
    await assert.rejects(
      operation.execute(deniedContext, { recordId: 'record-shared', nextValue: 'forbidden' }),
      AuthorizationError,
    );
  });

  it('freezes context and capabilities', () => {
    assert.equal(Object.isFrozen(allowedContext), true);
    assert.equal(Object.isFrozen(allowedContext.capabilities), true);
  });
});
