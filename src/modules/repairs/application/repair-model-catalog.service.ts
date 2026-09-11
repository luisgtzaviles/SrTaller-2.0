import { randomUUID } from 'node:crypto';

import type { RepairModelCatalogContext, RepairModelPendingRecord, RepairModelRecord, RepairPersistenceScope, RepairRepositoryPort } from './ports/repair-repository.port.js';
import { normalizeInputLookupKey, normalizeRelatedRepairCatalogInput } from '../domain/new-repair-input-normalization.js';
export { RepairModelAuthorizationChangedError, RepairModelConcurrencyConflictError, RepairModelDuplicateError, RepairModelNotFoundError, RepairModelPendingNotFoundError } from './ports/repair-repository.port.js';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

export class RepairModelInputError extends Error {
  constructor(readonly parameter: string) { super('Repair model catalog input is invalid.'); this.name = 'RepairModelInputError'; }
}

function exactObject(value: unknown, keys: readonly string[]): Readonly<Record<string, unknown>> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new RepairModelInputError('payload');
  const input = value as Readonly<Record<string, unknown>>;
  if (Object.keys(input).some((key) => !keys.includes(key))) throw new RepairModelInputError('payload');
  return input;
}
function id(value: unknown, parameter: string): string {
  if (typeof value !== 'string' || !uuid.test(value)) throw new RepairModelInputError(parameter);
  return value;
}
function label(value: unknown): string {
  if (typeof value !== 'string') throw new RepairModelInputError('canonicalLabel');
  const result = normalizeRelatedRepairCatalogInput('model', value);
  if (result.length < 2 || result.length > 160) throw new RepairModelInputError('canonicalLabel');
  return result;
}
function version(value: unknown): number {
  if (!Number.isInteger(value) || Number(value) < 1) throw new RepairModelInputError('expectedVersion');
  return Number(value);
}
function ids(createId: () => string, count: number): readonly string[] {
  const values = Array.from({ length: count }, () => createId());
  if (values.some((value) => !uuid.test(value)) || new Set(values).size !== values.length) throw new Error('Server-generated repair model identifiers are invalid.');
  return values;
}

export function normalizeRepairModelKey(value: string): string {
  return normalizeInputLookupKey(value);
}

export class RepairModelCatalogService {
  constructor(private readonly repository: RepairRepositoryPort, private readonly now: () => Date = () => new Date(), private readonly createId: () => string = randomUUID) {}

  listEffective(scope: RepairPersistenceScope, brandId: unknown, query?: unknown): Promise<readonly RepairModelRecord[]> {
    return this.repository.listEffectiveActiveModels(scope, id(brandId, 'canonicalBrandId'), typeof query === 'string' ? query.trim().slice(0, 160) : '');
  }
  listAdmin(scope: RepairPersistenceScope, brandId?: unknown): Promise<readonly RepairModelRecord[]> {
    return this.repository.listAdminModels(scope, brandId === undefined ? null : id(brandId, 'canonicalBrandId'));
  }
  listPending(scope: RepairPersistenceScope, brandId?: unknown): Promise<readonly RepairModelPendingRecord[]> {
    return this.repository.listPendingModels(scope, brandId === undefined ? null : id(brandId, 'canonicalBrandId'));
  }
  create(context: RepairModelCatalogContext, value: unknown): Promise<RepairModelRecord> {
    const input = exactObject(value, ['canonicalBrandId', 'canonicalLabel']);
    const canonicalLabel = label(input.canonicalLabel);
    const [modelId, eventId, correlationId] = ids(this.createId, 3);
    return this.repository.createModel(context, { modelId: modelId!, canonicalBrandId: id(input.canonicalBrandId, 'canonicalBrandId'), eventId: eventId!, correlationId: correlationId!, canonicalLabel, normalizedKey: normalizeRepairModelKey(canonicalLabel), occurredAt: this.now() });
  }
  rename(context: RepairModelCatalogContext, value: unknown): Promise<RepairModelRecord> {
    const input = exactObject(value, ['modelId', 'canonicalLabel', 'expectedVersion']);
    const canonicalLabel = label(input.canonicalLabel);
    const [, eventId, correlationId] = ids(this.createId, 3);
    return this.repository.changeModel(context, { modelId: id(input.modelId, 'modelId'), eventId: eventId!, correlationId: correlationId!, expectedVersion: version(input.expectedVersion), canonicalLabel, normalizedKey: normalizeRepairModelKey(canonicalLabel), action: 'repair_model.renamed', occurredAt: this.now() });
  }
  deactivate(context: RepairModelCatalogContext, value: unknown): Promise<RepairModelRecord> { return this.changeStatus(context, value, 'inactive', 'repair_model.deactivated'); }
  reactivate(context: RepairModelCatalogContext, value: unknown): Promise<RepairModelRecord> { return this.changeStatus(context, value, 'active', 'repair_model.reactivated'); }
  resolve(context: RepairModelCatalogContext, value: unknown): Promise<RepairModelPendingRecord> {
    const input = exactObject(value, ['pendingModelValueId', 'canonicalModelId', 'canonicalLabel', 'expectedVersion']);
    const hasExisting = input.canonicalModelId !== undefined && input.canonicalModelId !== null;
    const hasNew = input.canonicalLabel !== undefined && input.canonicalLabel !== null;
    if (hasExisting === hasNew) throw new RepairModelInputError('resolution');
    const generated = ids(this.createId, hasNew ? 3 : 2);
    const canonicalLabel = hasNew ? label(input.canonicalLabel) : null;
    return this.repository.resolvePendingModel(context, {
      pendingModelValueId: id(input.pendingModelValueId, 'pendingModelValueId'),
      canonicalModelId: hasExisting ? id(input.canonicalModelId, 'canonicalModelId') : null,
      newModelId: hasNew ? generated[0]! : null,
      newCanonicalLabel: canonicalLabel,
      newNormalizedKey: canonicalLabel ? normalizeRepairModelKey(canonicalLabel) : null,
      eventId: generated[hasNew ? 1 : 0]!, correlationId: generated[hasNew ? 2 : 1]!,
      expectedVersion: version(input.expectedVersion), occurredAt: this.now(),
    });
  }
  private changeStatus(context: RepairModelCatalogContext, value: unknown, status: 'active' | 'inactive', action: 'repair_model.deactivated' | 'repair_model.reactivated'): Promise<RepairModelRecord> {
    const input = exactObject(value, ['modelId', 'expectedVersion']);
    const [, eventId, correlationId] = ids(this.createId, 3);
    return this.repository.changeModel(context, { modelId: id(input.modelId, 'modelId'), eventId: eventId!, correlationId: correlationId!, expectedVersion: version(input.expectedVersion), status, action, occurredAt: this.now() });
  }
}
