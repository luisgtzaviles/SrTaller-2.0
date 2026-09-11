import { randomUUID } from 'node:crypto';

import type {
  RepairPersistenceScope,
  RepairRepositoryPort,
  RepairRiskCatalogContext,
  RepairRiskRecord,
} from './ports/repair-repository.port.js';
import { normalizeInputLookupKey, normalizeRelatedRepairCatalogInput } from '../domain/new-repair-input-normalization.js';
export {
  RepairRiskAuthorizationChangedError,
  RepairRiskConcurrencyConflictError,
  RepairRiskDuplicateError,
  RepairRiskNotFoundError,
} from './ports/repair-repository.port.js';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

export class RepairRiskInputError extends Error {
  constructor(readonly parameter: string) {
    super('Repair risk catalog input is invalid.');
    this.name = 'RepairRiskInputError';
  }
}

function exactObject(value: unknown, keys: readonly string[]): Readonly<Record<string, unknown>> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new RepairRiskInputError('payload');
  }
  const input = value as Readonly<Record<string, unknown>>;
  if (Object.keys(input).some((key) => !keys.includes(key))) {
    throw new RepairRiskInputError('payload');
  }
  return input;
}

function label(value: unknown): string {
  if (typeof value !== 'string') throw new RepairRiskInputError('canonicalLabel');
  const canonicalLabel = normalizeRelatedRepairCatalogInput('risk', value);
  if (canonicalLabel.length < 2 || canonicalLabel.length > 160) {
    throw new RepairRiskInputError('canonicalLabel');
  }
  return canonicalLabel;
}

export function normalizeRepairRiskKey(value: string): string {
  return normalizeInputLookupKey(value);
}

function expectedVersion(value: unknown): number {
  if (!Number.isInteger(value) || Number(value) < 1) {
    throw new RepairRiskInputError('expectedVersion');
  }
  return Number(value);
}

function riskId(value: unknown): string {
  if (typeof value !== 'string' || !uuid.test(value)) {
    throw new RepairRiskInputError('riskId');
  }
  return value;
}

function generatedIds(createId: () => string): readonly [string, string, string] {
  const ids = [createId(), createId(), createId()] as const;
  if (ids.some((id) => !uuid.test(id)) || new Set(ids).size !== ids.length) {
    throw new Error('Server-generated repair risk identifiers are invalid.');
  }
  return ids;
}

export class RepairRiskCatalogService {
  constructor(
    private readonly repository: RepairRepositoryPort,
    private readonly now: () => Date = () => new Date(),
    private readonly createId: () => string = randomUUID,
  ) {}

  listEffective(scope: RepairPersistenceScope): Promise<readonly RepairRiskRecord[]> {
    return this.repository.listEffectiveActiveRisks(scope);
  }

  listAdmin(scope: RepairPersistenceScope): Promise<readonly RepairRiskRecord[]> {
    return this.repository.listAdminRisks(scope);
  }

  create(context: RepairRiskCatalogContext, value: unknown): Promise<RepairRiskRecord> {
    const input = exactObject(value, ['canonicalLabel']);
    const canonicalLabel = label(input.canonicalLabel);
    const normalizedKey = normalizeRepairRiskKey(canonicalLabel);
    if (normalizedKey.length < 2) throw new RepairRiskInputError('canonicalLabel');
    const [newRiskId, eventId, correlationId] = generatedIds(this.createId);
    return this.repository.createRisk(context, {
      riskId: newRiskId,
      eventId,
      correlationId,
      canonicalLabel,
      normalizedKey,
      occurredAt: this.now(),
    });
  }

  rename(context: RepairRiskCatalogContext, value: unknown): Promise<RepairRiskRecord> {
    const input = exactObject(value, ['riskId', 'canonicalLabel', 'expectedVersion']);
    const canonicalLabel = label(input.canonicalLabel);
    const normalizedKey = normalizeRepairRiskKey(canonicalLabel);
    if (normalizedKey.length < 2) throw new RepairRiskInputError('canonicalLabel');
    const [, eventId, correlationId] = generatedIds(this.createId);
    return this.repository.changeRisk(context, {
      riskId: riskId(input.riskId),
      eventId,
      correlationId,
      expectedVersion: expectedVersion(input.expectedVersion),
      canonicalLabel,
      normalizedKey,
      action: 'repair_risk.renamed',
      occurredAt: this.now(),
    });
  }

  deactivate(context: RepairRiskCatalogContext, value: unknown): Promise<RepairRiskRecord> {
    return this.changeStatus(context, value, 'inactive', 'repair_risk.deactivated');
  }

  reactivate(context: RepairRiskCatalogContext, value: unknown): Promise<RepairRiskRecord> {
    return this.changeStatus(context, value, 'active', 'repair_risk.reactivated');
  }

  private changeStatus(
    context: RepairRiskCatalogContext,
    value: unknown,
    status: 'active' | 'inactive',
    action: 'repair_risk.deactivated' | 'repair_risk.reactivated',
  ): Promise<RepairRiskRecord> {
    const input = exactObject(value, ['riskId', 'expectedVersion']);
    const [, eventId, correlationId] = generatedIds(this.createId);
    return this.repository.changeRisk(context, {
      riskId: riskId(input.riskId),
      eventId,
      correlationId,
      expectedVersion: expectedVersion(input.expectedVersion),
      status,
      action,
      occurredAt: this.now(),
    });
  }
}
