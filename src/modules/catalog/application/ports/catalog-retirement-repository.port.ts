import type { CatalogMutationContext } from './catalog-repository.port.js';

export type CatalogRetirementScope = 'ACTIVE_CATALOG' | 'BATCH_CREATED';

export type CatalogRetirementPlanRecord = Readonly<{
  planId: string;
  scope: CatalogRetirementScope;
  batchId: string | null;
  sourceVersionId: string | null;
  activeCount: number;
  alreadyInactiveCount: number;
  expiresAt: string;
  status: 'PENDING' | 'EXECUTED' | 'STALE' | 'EXPIRED';
  retiredCount: number | null;
}>;

export type CatalogRetirementExecutionRecord = Readonly<{
  planId: string;
  scope: CatalogRetirementScope;
  retiredCount: number;
  activeCatalogCount: number;
  executedAt: string;
}>;

export interface CatalogRetirementRepositoryPort {
  createPlan(context: CatalogMutationContext, input: Readonly<{
    planId: string;
    scope: CatalogRetirementScope;
    sourceVersionId: string | null;
    occurredAt: Date;
    expiresAt: Date;
  }>): Promise<CatalogRetirementPlanRecord>;
  executePlan(context: CatalogMutationContext, input: Readonly<{
    planId: string;
    confirmation: 'RETIRE_ACTIVE_CATALOG' | 'RETIRE_BATCH_CREATED_ITEMS';
    clientRequestId: string;
    correlationId: string;
    reauthenticatedAt: Date;
    occurredAt: Date;
  }>): Promise<CatalogRetirementExecutionRecord>;
}
