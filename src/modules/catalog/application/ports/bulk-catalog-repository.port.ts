import type { CatalogItemKind } from '../../domain/catalog-item.js';
import type { BulkCatalogCandidateMatch, BulkCatalogClassification, BulkCatalogDecision, BulkCatalogMatchOrigin, BulkCatalogMode, BulkCatalogRowInput, BulkCatalogTitleDecision, SupplierCatalogCompleteness } from '../../domain/bulk-catalog.js';
import type { SupplierCoveragePlausibility } from '../../domain/supplier-coverage.js';
import type { CatalogMutationContext, CatalogScope } from './catalog-repository.port.js';

export type SupplierSourceRecord = Readonly<{
  sourceId: string; name: string; status: 'ACTIVE' | 'INACTIVE'; version: number; versionCount: number;
  deletionEligibility: Readonly<{ allowed: boolean; reason: 'SAFE_DRAFT_ONLY' | 'PUBLISHED_HISTORY' | 'DEPENDENT_HISTORY' }>;
}>;
export type SupplierCoverageItem = Readonly<{
  itemId: string | null;
  canonicalTitle: string | null;
  observedTitle: string | null;
  baselineObservedTitle: string | null;
  status: 'ACTIVE' | 'INACTIVE' | null;
}>;
export type { SupplierCoveragePlausibility } from '../../domain/supplier-coverage.js';
export type BulkCatalogRowRecord = Readonly<{
  rowDecisionId: string; rowNumber: number; supplierObservedTitle: string | null; proposal: BulkCatalogRowInput;
  classification: BulkCatalogClassification; decision: BulkCatalogDecision;
  titleDecision: BulkCatalogTitleDecision | null;
  targetItemId: string | null; targetTitle: string | null; expectedItemVersion: number | null;
  before: Readonly<{ kind: CatalogItemKind; title: string; description: string | null; category: string | null; brand: string | null; status: 'ACTIVE' | 'INACTIVE'; basePriceMinor: number | null; referenceCostMinor: number | null }> | null;
  preselectedByMemory: boolean; matchOrigin: BulkCatalogMatchOrigin; matchAlgorithmVersion: number;
  candidates: readonly BulkCatalogCandidateMatch[]; errors: readonly string[]; warnings: readonly string[]; version: number;
}>;
export type SupplierVersionRecord = Readonly<{
  versionId: string; sourceId: string; sourceName: string; sequenceNumber: number; sourceRevision: string; description: string | null; mode: BulkCatalogMode; completeness: SupplierCatalogCompleteness;
  supersedesVersionId: string | null; columnSignature: string; lifecycle: 'DRAFT' | 'INGESTED'; version: number; rowCount: number;
  createdAt: string; ingestedAt: string | null; batch: Readonly<{
    batchId: string; lifecycle: 'DRAFT' | 'ANALYZING' | 'RECONCILING' | 'READY' | 'APPLIED'; version: number;
    counts: Readonly<Record<BulkCatalogClassification, number>>; publishedAt: string | null;
  }>;
  absenceBaseline: Readonly<{
    status: 'NOT_APPLICABLE' | 'NO_BASELINE' | 'EVALUATED';
    versionId: string | null; sequenceNumber: number | null; observed: number | null; notObserved: number | null;
    baselineCount: number | null; currentCount: number; continuedCount: number | null; notObservedCount: number | null; additionalCount: number | null;
    continuedItems: readonly SupplierCoverageItem[]; notObservedItems: readonly SupplierCoverageItem[]; additionalItems: readonly SupplierCoverageItem[];
    plausibility: SupplierCoveragePlausibility;
  }>;
  rows: readonly BulkCatalogRowRecord[];
}>;
export type SupplierVersionSummary = Omit<SupplierVersionRecord, 'rows' | 'absenceBaseline'>;
export type SupplierVersionComparison = Readonly<{ leftVersionId: string; rightVersionId: string; mapped: number; changed: number; added: number; ambiguous: number; absenceStatus: 'PARTIAL_CURRENT' | 'NO_PREVIOUS_COMPLETE' | 'EVALUATED'; notObserved: number | null }>;
export type SupplierSourceDeletionRecord = Readonly<{ sourceId: string; sourceName: string; deletedVersionCount: number; deletedListingCount: number; deletedAt: string }>;

export interface BulkCatalogRepositoryPort {
  listSources(scope: CatalogScope): Promise<readonly SupplierSourceRecord[]>;
  createSource(context: CatalogMutationContext, input: Readonly<{ sourceId: string; name: string; normalizedName: string; occurredAt: Date }>): Promise<SupplierSourceRecord>;
  listVersions(scope: CatalogScope, sourceId?: string): Promise<readonly SupplierVersionSummary[]>;
  getVersion(scope: CatalogScope, versionId: string, includeReferenceCost: boolean): Promise<SupplierVersionRecord | null>;
  createDraft(context: CatalogMutationContext, input: Readonly<{ versionId: string; batchId: string; sourceId: string; description: string | null; clientRequestId: string; requestSha256: string; mode: BulkCatalogMode; completeness: SupplierCatalogCompleteness; columnSignature: string; rawPayload: string; rows: readonly BulkCatalogRowInput[]; includeReferenceCost: boolean; occurredAt: Date }>): Promise<SupplierVersionRecord>;
  replaceDraft(context: CatalogMutationContext, input: Readonly<{ versionId: string; expectedVersion: number; description: string | null; completeness: SupplierCatalogCompleteness; columnSignature: string; rawPayload: string; rows: readonly BulkCatalogRowInput[]; includeReferenceCost: boolean; occurredAt: Date }>): Promise<SupplierVersionRecord>;
  analyze(context: CatalogMutationContext, input: Readonly<{ versionId: string; expectedVersion: number; includeReferenceCost: boolean; occurredAt: Date }>): Promise<SupplierVersionRecord>;
  decide(context: CatalogMutationContext, input: Readonly<{ versionId: string; rowDecisionId: string; expectedRowVersion: number; decision: BulkCatalogDecision; targetItemId: string | null; titleDecision: BulkCatalogTitleDecision | null; includeReferenceCost: boolean; occurredAt: Date }>): Promise<SupplierVersionRecord>;
  decideMany(context: CatalogMutationContext, input: Readonly<{ versionId: string; expectedBatchVersion: number; classifications: readonly BulkCatalogClassification[]; decision: Exclude<BulkCatalogDecision, 'UNRESOLVED'>; includeReferenceCost: boolean; occurredAt: Date }>): Promise<SupplierVersionRecord>;
  publish(context: CatalogMutationContext, input: Readonly<{ versionId: string; expectedVersion: number; clientRequestId: string; requestSha256: string; currency: string; mayWriteCost: boolean; coverageReviewAcknowledged: boolean; occurredAt: Date }>): Promise<SupplierVersionRecord>;
  compare(scope: CatalogScope, leftVersionId: string, rightVersionId: string): Promise<SupplierVersionComparison>;
  purgeExpiredRaw(context: CatalogMutationContext, now: Date): Promise<number>;
  deleteSource(context: CatalogMutationContext, input: Readonly<{ sourceId: string; expectedVersion: number; clientRequestId: string; requestSha256: string; reauthenticatedAt: Date; occurredAt: Date }>): Promise<SupplierSourceDeletionRecord>;
}

export type { CatalogItemKind };
