import type { CatalogItemKind } from '../../domain/catalog-item.js';
import type { BulkCatalogClassification, BulkCatalogDecision, BulkCatalogMode, BulkCatalogRowInput } from '../../domain/bulk-catalog.js';
import type { CatalogMutationContext, CatalogScope } from './catalog-repository.port.js';

export type SupplierSourceRecord = Readonly<{ sourceId: string; name: string; status: 'ACTIVE' | 'INACTIVE'; version: number }>;
export type BulkCatalogRowRecord = Readonly<{
  rowDecisionId: string; rowNumber: number; supplierObservedTitle: string | null; proposal: BulkCatalogRowInput;
  classification: BulkCatalogClassification; decision: BulkCatalogDecision;
  targetItemId: string | null; targetTitle: string | null; expectedItemVersion: number | null;
  before: Readonly<{ kind: CatalogItemKind; title: string; description: string | null; category: string | null; brand: string | null; status: 'ACTIVE' | 'INACTIVE'; basePriceMinor: number | null; referenceCostMinor: number | null }> | null;
  preselectedByMemory: boolean; errors: readonly string[]; warnings: readonly string[]; version: number;
}>;
export type SupplierVersionRecord = Readonly<{
  versionId: string; sourceId: string; sourceName: string; sourceRevision: string; mode: BulkCatalogMode;
  supersedesVersionId: string | null; columnSignature: string; lifecycle: 'DRAFT' | 'INGESTED'; version: number; rowCount: number;
  createdAt: string; ingestedAt: string | null; batch: Readonly<{
    batchId: string; lifecycle: 'DRAFT' | 'ANALYZING' | 'RECONCILING' | 'READY' | 'APPLIED'; version: number;
    counts: Readonly<Record<BulkCatalogClassification, number>>; publishedAt: string | null;
  }>; rows: readonly BulkCatalogRowRecord[];
}>;
export type SupplierVersionSummary = Omit<SupplierVersionRecord, 'rows'>;
export type SupplierVersionComparison = Readonly<{ leftVersionId: string; rightVersionId: string; mapped: number; changed: number; added: number; disappeared: number; ambiguous: number }>;

export interface BulkCatalogRepositoryPort {
  listSources(scope: CatalogScope): Promise<readonly SupplierSourceRecord[]>;
  createSource(context: CatalogMutationContext, input: Readonly<{ sourceId: string; name: string; normalizedName: string; occurredAt: Date }>): Promise<SupplierSourceRecord>;
  listVersions(scope: CatalogScope, sourceId?: string): Promise<readonly SupplierVersionSummary[]>;
  getVersion(scope: CatalogScope, versionId: string, includeReferenceCost: boolean): Promise<SupplierVersionRecord | null>;
  createDraft(context: CatalogMutationContext, input: Readonly<{ versionId: string; batchId: string; sourceId: string; sourceRevision: string; mode: BulkCatalogMode; columnSignature: string; rawPayload: string; rows: readonly BulkCatalogRowInput[]; includeReferenceCost: boolean; occurredAt: Date }>): Promise<SupplierVersionRecord>;
  replaceDraft(context: CatalogMutationContext, input: Readonly<{ versionId: string; expectedVersion: number; columnSignature: string; rawPayload: string; rows: readonly BulkCatalogRowInput[]; includeReferenceCost: boolean; occurredAt: Date }>): Promise<SupplierVersionRecord>;
  analyze(context: CatalogMutationContext, input: Readonly<{ versionId: string; expectedVersion: number; includeReferenceCost: boolean; occurredAt: Date }>): Promise<SupplierVersionRecord>;
  decide(context: CatalogMutationContext, input: Readonly<{ versionId: string; rowDecisionId: string; expectedRowVersion: number; decision: BulkCatalogDecision; targetItemId: string | null; includeReferenceCost: boolean; occurredAt: Date }>): Promise<SupplierVersionRecord>;
  decideMany(context: CatalogMutationContext, input: Readonly<{ versionId: string; expectedBatchVersion: number; classifications: readonly BulkCatalogClassification[]; decision: Exclude<BulkCatalogDecision, 'UNRESOLVED'>; includeReferenceCost: boolean; occurredAt: Date }>): Promise<SupplierVersionRecord>;
  publish(context: CatalogMutationContext, input: Readonly<{ versionId: string; expectedVersion: number; clientRequestId: string; requestSha256: string; currency: string; mayWriteCost: boolean; occurredAt: Date }>): Promise<SupplierVersionRecord>;
  compare(scope: CatalogScope, leftVersionId: string, rightVersionId: string): Promise<SupplierVersionComparison>;
  purgeExpiredRaw(context: CatalogMutationContext, now: Date): Promise<number>;
}

export type { CatalogItemKind };
