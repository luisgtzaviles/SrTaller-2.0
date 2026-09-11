import { randomUUID } from 'node:crypto';

import {
  newRepairFieldRegistry,
  newRepairPolicySchemaVersion,
  systemNewRepairFieldStates,
  validateNewRepairFieldStates,
} from '../domain/new-repair-field-policy.js';
import type {
  NewRepairPolicyRecord,
  RepairConfigurationContext,
  RepairPersistenceScope,
  RepairRepositoryPort,
} from './ports/repair-repository.port.js';
export { NewRepairPolicyAuthorizationChangedError, NewRepairPolicyConcurrencyConflictError } from './ports/repair-repository.port.js';

export class NewRepairPolicyInputError extends Error {
  constructor(readonly parameter: string) { super('New Repair field policy input is invalid.'); this.name = 'NewRepairPolicyInputError'; }
}

export interface NewRepairPolicyProjection extends NewRepairPolicyRecord {
  readonly source: 'system-default' | 'branch';
  readonly registry: typeof newRepairFieldRegistry;
}

function exactObject(value: unknown, keys: readonly string[]): Readonly<Record<string, unknown>> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new NewRepairPolicyInputError('payload');
  const input = value as Readonly<Record<string, unknown>>;
  if (Object.keys(input).some((key) => !keys.includes(key))) throw new NewRepairPolicyInputError('payload');
  return input;
}

function expectedVersion(value: unknown): number {
  if (!Number.isInteger(value) || Number(value) < 0) throw new NewRepairPolicyInputError('expectedVersion');
  return Number(value);
}

function effectiveFieldStates(record: NewRepairPolicyRecord): NewRepairPolicyRecord['fieldStates'] {
  const compatible = { ...record.fieldStates } as Record<string, unknown>;
  if (compatible.warrantyReviewRequested === 'hidden') compatible.warrantyReviewRequested = 'optional';
  return validateNewRepairFieldStates(compatible);
}

export class NewRepairPolicyService {
  constructor(
    private readonly repository: RepairRepositoryPort,
    private readonly now: () => Date = () => new Date(),
    private readonly createId: () => string = randomUUID,
  ) {}

  async effective(scope: RepairPersistenceScope): Promise<NewRepairPolicyProjection> {
    const stored = await this.repository.readNewRepairPolicy(scope);
    const record = stored ?? Object.freeze({
      schemaVersion: newRepairPolicySchemaVersion,
      policyVersion: 0,
      fieldStates: systemNewRepairFieldStates(),
      updatedAt: null,
    });
    return Object.freeze({ ...record, fieldStates: effectiveFieldStates(record), source: stored ? 'branch' : 'system-default', registry: newRepairFieldRegistry });
  }

  async update(context: RepairConfigurationContext, value: unknown): Promise<NewRepairPolicyProjection> {
    const input = exactObject(value, ['expectedVersion', 'fieldStates']);
    const current = await this.effective(context);
    let fieldStates;
    try { fieldStates = validateNewRepairFieldStates(input.fieldStates); } catch { throw new NewRepairPolicyInputError('fieldStates'); }
    const result = await this.repository.changeNewRepairPolicy(context, {
      expectedVersion: expectedVersion(input.expectedVersion),
      schemaVersion: newRepairPolicySchemaVersion,
      previousFieldStates: current.fieldStates,
      fieldStates,
      action: 'new_repair_policy.updated',
      correlationId: this.createId(),
      occurredAt: this.now(),
    });
    return Object.freeze({ ...result, source: 'branch', registry: newRepairFieldRegistry });
  }

  async reset(context: RepairConfigurationContext, value: unknown): Promise<NewRepairPolicyProjection> {
    const input = exactObject(value, ['expectedVersion']);
    const current = await this.effective(context);
    const result = await this.repository.changeNewRepairPolicy(context, {
      expectedVersion: expectedVersion(input.expectedVersion),
      schemaVersion: newRepairPolicySchemaVersion,
      previousFieldStates: current.fieldStates,
      fieldStates: systemNewRepairFieldStates(),
      action: 'new_repair_policy.reset',
      correlationId: this.createId(),
      occurredAt: this.now(),
    });
    return Object.freeze({ ...result, source: 'branch', registry: newRepairFieldRegistry });
  }
}
