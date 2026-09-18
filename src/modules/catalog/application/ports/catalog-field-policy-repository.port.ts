import type { CatalogFieldPolicyLevelsByKey } from '../../domain/catalog-field-policy.js';

export interface CatalogFieldPolicyScope { readonly tenantId: string; }
export interface CatalogFieldPolicyConfigurationContext {
  readonly tenantId: string; readonly branchId: string; readonly stationId: string; readonly sessionId: string;
  readonly actorUserId: string; readonly actorDisplayName: string;
  readonly capability: 'catalog.configuration.manage';
  readonly commitGuards: readonly Readonly<{ confirmCurrent(transactionContext: object): Promise<boolean>; confirmTemporalCurrent(transactionContext: object): Promise<boolean> }> [];
}
export interface CatalogFieldPolicyRecord {
  readonly schemaVersion: number; readonly policyVersion: number;
  readonly fieldLevels: CatalogFieldPolicyLevelsByKey; readonly updatedAt: string | null;
}
export interface ChangeCatalogFieldPolicyRecord {
  readonly expectedVersion: number; readonly schemaVersion: number;
  readonly previousFieldLevels: CatalogFieldPolicyLevelsByKey; readonly fieldLevels: CatalogFieldPolicyLevelsByKey;
  readonly action: 'catalog_field_policy.updated' | 'catalog_field_policy.reset';
  readonly correlationId: string; readonly occurredAt: Date;
}
export class CatalogFieldPolicyConcurrencyConflictError extends Error { constructor() { super('Catalog field policy version is stale.'); this.name = 'CatalogFieldPolicyConcurrencyConflictError'; } }
export class CatalogFieldPolicyAuthorizationChangedError extends Error { constructor() { super('Catalog field policy authorization changed.'); this.name = 'CatalogFieldPolicyAuthorizationChangedError'; } }
export interface CatalogFieldPolicyRepositoryPort {
  readCatalogFieldPolicy(scope: CatalogFieldPolicyScope): Promise<CatalogFieldPolicyRecord | null>;
  changeCatalogFieldPolicy(context: CatalogFieldPolicyConfigurationContext, change: ChangeCatalogFieldPolicyRecord): Promise<CatalogFieldPolicyRecord>;
}
