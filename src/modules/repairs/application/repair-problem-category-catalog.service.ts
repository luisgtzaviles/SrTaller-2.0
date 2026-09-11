import { randomUUID } from 'node:crypto';

import type { RepairPersistenceScope, RepairProblemCategoryCatalogContext, RepairProblemCategoryRecord, RepairProblemPendingRecord, RepairRepositoryPort } from './ports/repair-repository.port.js';
import { normalizeInputLookupKey, normalizeRelatedRepairCatalogInput } from '../domain/new-repair-input-normalization.js';
export { RepairProblemCategoryAuthorizationChangedError, RepairProblemCategoryConcurrencyConflictError, RepairProblemCategoryDeleteNotAllowedError, RepairProblemCategoryDuplicateError, RepairProblemCategoryNotFoundError, RepairProblemPendingNotFoundError } from './ports/repair-repository.port.js';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
export class RepairProblemCategoryInputError extends Error { constructor(readonly parameter: string) { super('Repair problem category input is invalid.'); this.name = 'RepairProblemCategoryInputError'; } }
function exact(value: unknown, keys: readonly string[]): Readonly<Record<string, unknown>> { if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new RepairProblemCategoryInputError('payload'); const input = value as Readonly<Record<string, unknown>>; if (Object.keys(input).some((key) => !keys.includes(key))) throw new RepairProblemCategoryInputError('payload'); return input; }
function label(value: unknown): string {
  if (typeof value !== 'string') throw new RepairProblemCategoryInputError('canonicalLabel');
  const result = normalizeRelatedRepairCatalogInput('problemCategory', value);
  if (
    result.length < 2
    || result.length > 160
    || normalizeRepairProblemCategoryKey(result).length < 2
  ) throw new RepairProblemCategoryInputError('canonicalLabel');
  return result;
}
export function normalizeRepairProblemCategoryKey(value: string): string { return normalizeInputLookupKey(value); }
function id(value: unknown, parameter = 'categoryId'): string { if (typeof value !== 'string' || !uuid.test(value)) throw new RepairProblemCategoryInputError(parameter); return value; }
function version(value: unknown): number { if (!Number.isInteger(value) || Number(value) < 1) throw new RepairProblemCategoryInputError('expectedVersion'); return Number(value); }

export class RepairProblemCategoryCatalogService {
  constructor(private readonly repository: RepairRepositoryPort, private readonly now: () => Date = () => new Date(), private readonly createId: () => string = randomUUID) {}
  listEffective(scope: RepairPersistenceScope) { return this.repository.listEffectiveActiveProblemCategories(scope); }
  listAdmin(scope: RepairPersistenceScope) { return this.repository.listAdminProblemCategories(scope); }
  listPending(scope: RepairPersistenceScope) { return this.repository.listPendingProblems(scope); }
  create(context: RepairProblemCategoryCatalogContext, value: unknown): Promise<RepairProblemCategoryRecord> {
    const input = exact(value, ['canonicalLabel']); const canonicalLabel = label(input.canonicalLabel); const normalizedKey = normalizeRepairProblemCategoryKey(canonicalLabel);
    const categoryId = id(this.createId()); const eventId = id(this.createId(), 'eventId'); const correlationId = id(this.createId(), 'correlationId');
    return this.repository.createProblemCategory(context, { categoryId, eventId, correlationId, canonicalLabel, normalizedKey, occurredAt: this.now() });
  }
  rename(context: RepairProblemCategoryCatalogContext, value: unknown) { const input = exact(value, ['categoryId', 'canonicalLabel', 'expectedVersion']); const canonicalLabel = label(input.canonicalLabel); return this.repository.changeProblemCategory(context, { categoryId: id(input.categoryId), eventId: id(this.createId(), 'eventId'), correlationId: id(this.createId(), 'correlationId'), expectedVersion: version(input.expectedVersion), canonicalLabel, normalizedKey: normalizeRepairProblemCategoryKey(canonicalLabel), action: 'repair_problem_category.renamed', occurredAt: this.now() }); }
  deactivate(context: RepairProblemCategoryCatalogContext, value: unknown) { return this.status(context, value, 'inactive', 'repair_problem_category.deactivated'); }
  reactivate(context: RepairProblemCategoryCatalogContext, value: unknown) { return this.status(context, value, 'active', 'repair_problem_category.reactivated'); }
  delete(context: RepairProblemCategoryCatalogContext, value: unknown) {
    const input = exact(value, ['categoryId', 'expectedVersion']);
    const categoryId = id(input.categoryId);
    const expectedVersion = version(input.expectedVersion);
    return this.repository.deleteProblemCategory(context, {
      categoryId,
      eventId: id(this.createId(), 'eventId'),
      correlationId: id(this.createId(), 'correlationId'),
      expectedVersion,
      occurredAt: this.now(),
    });
  }
  resolve(context: RepairProblemCategoryCatalogContext, value: unknown): Promise<RepairProblemPendingRecord> {
    const input = exact(value, ['pendingProblemValueId', 'canonicalCategoryId', 'canonicalLabel', 'expectedVersion']);
    const hasExisting = input.canonicalCategoryId !== undefined && input.canonicalCategoryId !== null;
    const hasNew = input.canonicalLabel !== undefined && input.canonicalLabel !== null;
    if (hasExisting === hasNew) throw new RepairProblemCategoryInputError('resolution');
    const canonicalLabel = hasNew ? label(input.canonicalLabel) : null;
    const newCategoryId = hasNew ? id(this.createId(), 'newCategoryId') : null;
    return this.repository.resolvePendingProblem(context, {
      pendingProblemValueId: id(input.pendingProblemValueId, 'pendingProblemValueId'),
      canonicalCategoryId: hasExisting ? id(input.canonicalCategoryId, 'canonicalCategoryId') : null,
      newCategoryId,
      newCanonicalLabel: canonicalLabel,
      newNormalizedKey: canonicalLabel ? normalizeRepairProblemCategoryKey(canonicalLabel) : null,
      eventId: id(this.createId(), 'eventId'),
      correlationId: id(this.createId(), 'correlationId'),
      expectedVersion: version(input.expectedVersion),
      occurredAt: this.now(),
    });
  }
  private status(context: RepairProblemCategoryCatalogContext, value: unknown, status: 'active' | 'inactive', action: 'repair_problem_category.deactivated' | 'repair_problem_category.reactivated') { const input = exact(value, ['categoryId', 'expectedVersion']); return this.repository.changeProblemCategory(context, { categoryId: id(input.categoryId), eventId: id(this.createId(), 'eventId'), correlationId: id(this.createId(), 'correlationId'), expectedVersion: version(input.expectedVersion), status, action, occurredAt: this.now() }); }
}
