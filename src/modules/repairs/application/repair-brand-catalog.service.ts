import { randomUUID } from 'node:crypto';

import type {
  RepairBrandCatalogContext,
  RepairBrandPendingRecord,
  RepairBrandRecord,
  RepairPersistenceScope,
  RepairRepositoryPort,
} from './ports/repair-repository.port.js';
import { normalizeInputLookupKey, normalizeRelatedRepairCatalogInput } from '../domain/new-repair-input-normalization.js';
export {
  RepairBrandAuthorizationChangedError,
  RepairBrandConcurrencyConflictError,
  RepairBrandDuplicateError,
  RepairBrandNotFoundError,
  RepairBrandPendingNotFoundError,
} from './ports/repair-repository.port.js';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

export class RepairBrandInputError extends Error {
  constructor(readonly parameter: string) { super('Repair brand catalog input is invalid.'); this.name = 'RepairBrandInputError'; }
}

function exactObject(value: unknown, keys: readonly string[]): Readonly<Record<string, unknown>> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new RepairBrandInputError('payload');
  const input = value as Readonly<Record<string, unknown>>;
  if (Object.keys(input).some((key) => !keys.includes(key))) throw new RepairBrandInputError('payload');
  return input;
}

function label(value: unknown): string {
  if (typeof value !== 'string') throw new RepairBrandInputError('canonicalLabel');
  const canonicalLabel = normalizeRelatedRepairCatalogInput('brand', value);
  if (canonicalLabel.length < 2 || canonicalLabel.length > 160) throw new RepairBrandInputError('canonicalLabel');
  return canonicalLabel;
}

export function normalizeRepairBrandKey(value: string): string {
  return normalizeInputLookupKey(value);
}

function id(value: unknown, parameter: string): string {
  if (typeof value !== 'string' || !uuid.test(value)) throw new RepairBrandInputError(parameter);
  return value;
}

function version(value: unknown): number {
  if (!Number.isInteger(value) || Number(value) < 1) throw new RepairBrandInputError('expectedVersion');
  return Number(value);
}

function ids(createId: () => string, count: number): readonly string[] {
  const values = Array.from({ length: count }, () => createId());
  if (values.some((value) => !uuid.test(value)) || new Set(values).size !== values.length) throw new Error('Server-generated repair brand identifiers are invalid.');
  return values;
}

export class RepairBrandCatalogService {
  constructor(private readonly repository: RepairRepositoryPort, private readonly now: () => Date = () => new Date(), private readonly createId: () => string = randomUUID) {}

  listEffective(scope: RepairPersistenceScope, query?: unknown): Promise<readonly RepairBrandRecord[]> {
    const normalized = typeof query === 'string' ? query.trim().slice(0, 160) : '';
    return this.repository.listEffectiveActiveBrands(scope, normalized);
  }
  listAdmin(scope: RepairPersistenceScope): Promise<readonly RepairBrandRecord[]> { return this.repository.listAdminBrands(scope); }
  listPending(scope: RepairPersistenceScope): Promise<readonly RepairBrandPendingRecord[]> { return this.repository.listPendingBrands(scope); }

  create(context: RepairBrandCatalogContext, value: unknown): Promise<RepairBrandRecord> {
    const input = exactObject(value, ['canonicalLabel']);
    const canonicalLabel = label(input.canonicalLabel);
    const normalizedKey = normalizeRepairBrandKey(canonicalLabel);
    if (normalizedKey.length < 2) throw new RepairBrandInputError('canonicalLabel');
    const [brandId, eventId, correlationId] = ids(this.createId, 3);
    return this.repository.createBrand(context, { brandId: brandId!, eventId: eventId!, correlationId: correlationId!, canonicalLabel, normalizedKey, occurredAt: this.now() });
  }

  rename(context: RepairBrandCatalogContext, value: unknown): Promise<RepairBrandRecord> {
    const input = exactObject(value, ['brandId', 'canonicalLabel', 'expectedVersion']);
    const canonicalLabel = label(input.canonicalLabel);
    const normalizedKey = normalizeRepairBrandKey(canonicalLabel);
    const [, eventId, correlationId] = ids(this.createId, 3);
    return this.repository.changeBrand(context, { brandId: id(input.brandId, 'brandId'), eventId: eventId!, correlationId: correlationId!, expectedVersion: version(input.expectedVersion), canonicalLabel, normalizedKey, action: 'repair_brand.renamed', occurredAt: this.now() });
  }

  deactivate(context: RepairBrandCatalogContext, value: unknown): Promise<RepairBrandRecord> { return this.changeStatus(context, value, 'inactive', 'repair_brand.deactivated'); }
  reactivate(context: RepairBrandCatalogContext, value: unknown): Promise<RepairBrandRecord> { return this.changeStatus(context, value, 'active', 'repair_brand.reactivated'); }

  resolve(context: RepairBrandCatalogContext, value: unknown): Promise<RepairBrandPendingRecord> {
    const input = exactObject(value, ['pendingBrandValueId', 'canonicalBrandId', 'canonicalLabel', 'expectedVersion']);
    const pendingBrandValueId = id(input.pendingBrandValueId, 'pendingBrandValueId');
    const expectedVersion = version(input.expectedVersion);
    const hasExisting = input.canonicalBrandId !== undefined && input.canonicalBrandId !== null;
    const hasNew = input.canonicalLabel !== undefined && input.canonicalLabel !== null;
    if (hasExisting === hasNew) throw new RepairBrandInputError('resolution');
    const generated = ids(this.createId, hasNew ? 3 : 2);
    const canonicalLabel = hasNew ? label(input.canonicalLabel) : null;
    return this.repository.resolvePendingBrand(context, {
      pendingBrandValueId,
      canonicalBrandId: hasExisting ? id(input.canonicalBrandId, 'canonicalBrandId') : null,
      newBrandId: hasNew ? generated[0]! : null,
      newCanonicalLabel: canonicalLabel,
      newNormalizedKey: canonicalLabel ? normalizeRepairBrandKey(canonicalLabel) : null,
      eventId: generated[hasNew ? 1 : 0]!,
      correlationId: generated[hasNew ? 2 : 1]!,
      expectedVersion,
      occurredAt: this.now(),
    });
  }

  private changeStatus(context: RepairBrandCatalogContext, value: unknown, status: 'active' | 'inactive', action: 'repair_brand.deactivated' | 'repair_brand.reactivated'): Promise<RepairBrandRecord> {
    const input = exactObject(value, ['brandId', 'expectedVersion']);
    const [, eventId, correlationId] = ids(this.createId, 3);
    return this.repository.changeBrand(context, { brandId: id(input.brandId, 'brandId'), eventId: eventId!, correlationId: correlationId!, expectedVersion: version(input.expectedVersion), status, action, occurredAt: this.now() });
  }
}
