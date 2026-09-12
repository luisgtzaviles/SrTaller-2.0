import type { CatalogIdentifierScheme, CatalogItemKind, CatalogLifecycle } from '../../domain/catalog-item.js';

export interface CatalogScope { readonly tenantId: string; readonly branchId: string }
export type CatalogCommitGuard = Readonly<{
  confirmCurrent(transactionContext: object): Promise<boolean>;
  confirmTemporalCurrent(transactionContext: object): Promise<boolean>;
}>;
export interface CatalogMutationContext {
  readonly tenantId: string;
  readonly branchId: string;
  stationId: string;
  sessionId: string;
  actorUserId: string;
  actorDisplayName: string;
  capability: string;
  commitGuards: readonly CatalogCommitGuard[];
}

export type CatalogCategoryRecord = Readonly<{
  categoryId: string; name: string; status: CatalogLifecycle; version: number;
}>;
export type CatalogBrandRecord = Readonly<{
  brandId: string; name: string; status: CatalogLifecycle; version: number;
}>;
export type CatalogIdentifierRecord = Readonly<{
  identifierId: string; scheme: CatalogIdentifierScheme; value: string;
}>;
export type CatalogMoneyRevision = Readonly<{
  revisionId: string; amountMinor: number; currency: string; itemVersion: number;
  effectiveFrom: string;
}>;
export type CatalogReferenceCostRecord = CatalogMoneyRevision & Readonly<{
  sourceType: 'MANUAL' | 'IMPORTED' | 'ESTIMATED' | 'THIRD_PARTY';
  sourceLabel: string | null; observedAt: string;
}>;
export type CatalogItemRecord = Readonly<{
  itemId: string;
  kind: CatalogItemKind;
  title: string;
  description: string | null;
  category: CatalogCategoryRecord;
  brand: CatalogBrandRecord | null;
  status: CatalogLifecycle;
  capabilities: Readonly<{ sellable: boolean; stockable: boolean; purchasable: boolean; applicableToRepair: boolean }>;
  identifiers: readonly CatalogIdentifierRecord[];
  version: number;
  createdAt: string;
  updatedAt: string;
}>;
export type CatalogPriceListItem = Readonly<{
  item: CatalogItemRecord;
  price: (CatalogMoneyRevision & Readonly<{ source: 'TENANT_BASE' | 'BRANCH_OVERRIDE' }>) | null;
  referenceCost?: CatalogReferenceCostRecord;
}>;

export type CreateCatalogReferenceInput = Readonly<{
  referenceId: string; name: string; normalizedName: string; clientRequestId: string;
  expectedVersion: 0; correlationId: string; occurredAt: Date;
}>;
export type CreateCatalogItemInput = Readonly<{
  itemId: string; kind: CatalogItemKind; title: string; normalizedTitle: string;
  description: string | null; categoryId: string; brandId: string | null;
  sku: string | null; identifiers: readonly Readonly<{ identifierId: string; scheme: CatalogIdentifierScheme; normalizedValue: string; displayValue: string }>[];
  basePrice: Readonly<{ revisionId: string; amountMinor: number }>;
  referenceCost: Readonly<{ revisionId: string; amountMinor: number; sourceType: 'MANUAL' | 'ESTIMATED' | 'THIRD_PARTY'; sourceLabel: string | null; observedAt: Date }> | null;
  currency: string; expectedVersion: 0; clientRequestId: string; correlationId: string; occurredAt: Date;
}>;
export type UpdateCatalogItemInput = Readonly<{
  itemId: string; title: string; normalizedTitle: string; description: string | null;
  categoryId: string; brandId: string | null; status: CatalogLifecycle;
  expectedVersion: number; clientRequestId: string; correlationId: string; occurredAt: Date;
}>;
export type ChangeCatalogMoneyInput = Readonly<{
  itemId: string; revisionId: string; amountMinor: number; currency: string;
  expectedVersion: number; clientRequestId: string; correlationId: string; reason: string | null; occurredAt: Date;
}>;
export type ChangeCatalogCostInput = ChangeCatalogMoneyInput & Readonly<{
  sourceType: 'MANUAL' | 'ESTIMATED' | 'THIRD_PARTY'; sourceLabel: string | null; observedAt: Date;
}>;
export type ChangeCatalogOverrideInput = ChangeCatalogMoneyInput & Readonly<{ revoke: boolean }>;

export interface CatalogRepositoryPort {
  listReferences(scope: CatalogScope): Promise<Readonly<{ categories: readonly CatalogCategoryRecord[]; brands: readonly CatalogBrandRecord[] }>>;
  createCategory(context: CatalogMutationContext, input: CreateCatalogReferenceInput): Promise<CatalogCategoryRecord>;
  createBrand(context: CatalogMutationContext, input: CreateCatalogReferenceInput): Promise<CatalogBrandRecord>;
  createItem(context: CatalogMutationContext, input: CreateCatalogItemInput): Promise<CatalogItemRecord>;
  updateItem(context: CatalogMutationContext, input: UpdateCatalogItemInput): Promise<CatalogItemRecord>;
  changeBasePrice(context: CatalogMutationContext, input: ChangeCatalogMoneyInput): Promise<CatalogItemRecord>;
  changeReferenceCost(context: CatalogMutationContext, input: ChangeCatalogCostInput): Promise<CatalogItemRecord>;
  changeBranchOverride(context: CatalogMutationContext, input: ChangeCatalogOverrideInput): Promise<CatalogItemRecord>;
  getItem(scope: CatalogScope, itemId: string): Promise<CatalogItemRecord | null>;
  search(scope: CatalogScope, input: Readonly<{ query: string; categoryId: string | null; brandId: string | null; page: number; pageSize: number; includeReferenceCost: boolean }>): Promise<Readonly<{ items: readonly CatalogPriceListItem[]; totalCount: number }>>;
}
