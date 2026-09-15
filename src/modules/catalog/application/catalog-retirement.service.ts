import { CatalogConflictError, CatalogInputError } from '../domain/catalog-item.js';
import { newId, requiredUuid } from '../domain/bulk-catalog.js';
import type { CatalogRetirementRepositoryPort, CatalogRetirementScope } from './ports/catalog-retirement-repository.port.js';
import type { CatalogMutationContext } from './ports/catalog-repository.port.js';

const planTtlMs = 5 * 60 * 1_000;

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new CatalogInputError('body');
  return value as Record<string, unknown>;
}

function scope(value: unknown): CatalogRetirementScope {
  if (value !== 'ACTIVE_CATALOG' && value !== 'BATCH_CREATED') throw new CatalogInputError('scope');
  return value;
}

export class CatalogRetirementService {
  constructor(
    private readonly repository: CatalogRetirementRepositoryPort,
    private readonly now: () => Date = () => new Date(),
  ) {}

  createPlan(context: CatalogMutationContext, value: unknown) {
    const input = object(value);
    const targetScope = scope(input.scope);
    const sourceVersionId = targetScope === 'BATCH_CREATED'
      ? requiredUuid(input.sourceVersionId, 'sourceVersionId')
      : null;
    if (targetScope === 'ACTIVE_CATALOG' && input.sourceVersionId !== undefined && input.sourceVersionId !== null) {
      throw new CatalogInputError('sourceVersionId');
    }
    const occurredAt = this.now();
    return this.repository.createPlan(context, {
      planId: newId(),
      scope: targetScope,
      sourceVersionId,
      occurredAt,
      expiresAt: new Date(occurredAt.getTime() + planTtlMs),
    });
  }

  async executePlan(context: CatalogMutationContext, value: unknown, reauthenticatedAt: string) {
    const input = object(value);
    const planId = requiredUuid(input.planId, 'planId');
    const clientRequestId = requiredUuid(input.clientRequestId, 'clientRequestId');
    if (input.confirmation !== 'RETIRE_ACTIVE_CATALOG' && input.confirmation !== 'RETIRE_BATCH_CREATED_ITEMS') {
      throw new CatalogInputError('confirmation');
    }
    const confirmedAt = new Date(reauthenticatedAt);
    if (!Number.isFinite(confirmedAt.getTime())) throw new CatalogConflictError();
    return this.repository.executePlan(context, {
      planId,
      confirmation: input.confirmation,
      clientRequestId,
      correlationId: newId(),
      reauthenticatedAt: confirmedAt,
      occurredAt: this.now(),
    });
  }
}
