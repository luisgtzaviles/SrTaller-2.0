import { CatalogConflictError, CatalogInputError, CatalogNotFoundError } from '../domain/catalog-item.js';
import { newId, normalizeReference, parseBulkRows, positiveVersion, requiredText, requiredUuid, sha256 } from '../domain/bulk-catalog.js';
import type { BulkCatalogClassification, BulkCatalogDecision, BulkCatalogMode, BulkCatalogTitleDecision, SupplierCatalogCompleteness } from '../domain/bulk-catalog.js';
import type { BulkCatalogRepositoryPort } from './ports/bulk-catalog-repository.port.js';
import type { CatalogMutationContext, CatalogScope } from './ports/catalog-repository.port.js';

type ObjectValue = Record<string, unknown>;
function object(value: unknown): ObjectValue { if (!value || typeof value !== 'object' || Array.isArray(value)) throw new CatalogInputError('body'); return value as ObjectValue; }
function mode(value: unknown): BulkCatalogMode { if (value !== 'FULL' && value !== 'COMPACT') throw new CatalogInputError('mode'); return value; }
function completeness(value: unknown): SupplierCatalogCompleteness { if (value !== 'PARTIAL' && value !== 'COMPLETE') throw new CatalogInputError('completeness'); return value; }
function decision(value: unknown): BulkCatalogDecision { if (value !== 'UNRESOLVED' && value !== 'APPLY' && value !== 'EXCLUDE') throw new CatalogInputError('decision'); return value; }
function titleDecision(value: unknown): BulkCatalogTitleDecision | null {
  if (value === undefined || value === null || value === '') return null;
  if (value !== 'KEEP_CURRENT' && value !== 'ADOPT_OBSERVED') throw new CatalogInputError('titleDecision');
  return value;
}
function coverageReviewAcknowledged(value: unknown): boolean {
  if (value === undefined) return false;
  if (typeof value !== 'boolean') throw new CatalogInputError('coverageReviewAcknowledged');
  return value;
}
function optionalText(value: unknown, parameter: string, maximum: number): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') throw new CatalogInputError(parameter);
  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.length > maximum) throw new CatalogInputError(parameter);
  return normalized;
}
const classifications = new Set<BulkCatalogClassification>(['NEW', 'UPDATE', 'REACTIVATE', 'UNCHANGED', 'CANDIDATE', 'PENDING_REFERENCE', 'AMBIGUOUS', 'CONFLICT', 'INVALID']);
function raw(value: unknown): string {
  if (typeof value !== 'string' || Buffer.byteLength(value, 'utf8') > 10 * 1024 * 1024) throw new CatalogInputError('rawPayload');
  const lines = value.replace(/\r/gu, '').split('\n'); let nonEmptyCells = 0;
  for (const line of lines) {
    const cells = line.split('\t');
    if (cells.length > 32) throw new CatalogInputError('rawPayload.columns');
    for (const cell of cells) { if (cell.length > 4_096) throw new CatalogInputError('rawPayload.cell'); if (cell.length > 0) nonEmptyCells += 1; }
  }
  if (nonEmptyCells > 200_000) throw new CatalogInputError('rawPayload.cells');
  return value;
}

export class BulkCatalogService {
  constructor(private readonly repository: BulkCatalogRepositoryPort, private readonly readCurrency: (tenantId: string) => Promise<string | null>) {}
  listSources(scope: CatalogScope) { return this.repository.listSources(scope); }
  listVersions(scope: CatalogScope, sourceId?: unknown) { return this.repository.listVersions(scope, sourceId === undefined ? undefined : requiredUuid(sourceId, 'sourceId')); }
  async getVersion(scope: CatalogScope, versionId: unknown, includeReferenceCost: boolean) { const found = await this.repository.getVersion(scope, requiredUuid(versionId, 'versionId'), includeReferenceCost); if (!found) throw new CatalogNotFoundError(); return found; }
  createSource(context: CatalogMutationContext, value: unknown) { const body = object(value); const name = requiredText(body.name, 'name', 160); return this.repository.createSource(context, { sourceId: newId(), name, normalizedName: normalizeReference(name)!, occurredAt: new Date() }); }
  createDraft(context: CatalogMutationContext, value: unknown) { const body = object(value); const selectedMode = mode(body.mode); const selectedCompleteness = completeness(body.completeness); const rows = parseBulkRows(body.rows, selectedMode); const rawPayload = raw(body.rawPayload); const signature = requiredText(body.columnSignature, 'columnSignature', 64); if (!/^[a-f0-9]{64}$/u.test(signature)) throw new CatalogInputError('columnSignature'); const sourceId = requiredUuid(body.sourceId, 'sourceId'); const supersedesVersionId = body.supersedesVersionId === undefined || body.supersedesVersionId === null ? null : requiredUuid(body.supersedesVersionId, 'supersedesVersionId'); const clientRequestId = requiredUuid(body.clientRequestId, 'clientRequestId'); const description = optionalText(body.description, 'description', 500); const requestSha256 = sha256({ sourceId, supersedesVersionId, description, mode: selectedMode, completeness: selectedCompleteness, columnSignature: signature, rawPayload, rows, includeReferenceCost: body.includeReferenceCost === true }); return this.repository.createDraft(context, { versionId: newId(), batchId: newId(), sourceId, supersedesVersionId, description, clientRequestId, requestSha256, mode: selectedMode, completeness: selectedCompleteness, columnSignature: signature, rawPayload, rows, includeReferenceCost: body.includeReferenceCost === true, occurredAt: new Date() }); }
  replaceDraft(context: CatalogMutationContext, versionId: unknown, value: unknown) { const body = object(value); const selectedMode = mode(body.mode); const rows = parseBulkRows(body.rows, selectedMode); const signature = requiredText(body.columnSignature, 'columnSignature', 64); return this.repository.replaceDraft(context, { versionId: requiredUuid(versionId, 'versionId'), expectedVersion: positiveVersion(body.expectedVersion), mode: selectedMode, description: optionalText(body.description, 'description', 500), completeness: completeness(body.completeness), columnSignature: signature, rawPayload: raw(body.rawPayload), rows, includeReferenceCost: body.includeReferenceCost === true, occurredAt: new Date() }); }
  analyze(context: CatalogMutationContext, versionId: unknown, value: unknown) { const body = object(value); return this.repository.analyze(context, { versionId: requiredUuid(versionId, 'versionId'), expectedVersion: positiveVersion(body.expectedVersion), includeReferenceCost: body.includeReferenceCost === true, occurredAt: new Date() }); }
  decide(context: CatalogMutationContext, versionId: unknown, rowDecisionId: unknown, value: unknown) { const body = object(value); return this.repository.decide(context, { versionId: requiredUuid(versionId, 'versionId'), rowDecisionId: requiredUuid(rowDecisionId, 'rowDecisionId'), expectedRowVersion: positiveVersion(body.expectedRowVersion, 'expectedRowVersion'), decision: decision(body.decision), targetItemId: body.targetItemId === null || body.targetItemId === undefined ? null : requiredUuid(body.targetItemId, 'targetItemId'), titleDecision: titleDecision(body.titleDecision), includeReferenceCost: body.includeReferenceCost === true, occurredAt: new Date() }); }
  decideMany(context: CatalogMutationContext, versionId: unknown, value: unknown) { const body = object(value); const selected = body.classifications; if (!Array.isArray(selected) || selected.length === 0 || selected.some((item) => typeof item !== 'string' || !classifications.has(item as BulkCatalogClassification))) throw new CatalogInputError('classifications'); const selectedDecision = decision(body.decision); if (selectedDecision === 'UNRESOLVED') throw new CatalogInputError('decision'); return this.repository.decideMany(context, { versionId: requiredUuid(versionId, 'versionId'), expectedBatchVersion: positiveVersion(body.expectedBatchVersion, 'expectedBatchVersion'), classifications: Object.freeze(selected as BulkCatalogClassification[]), decision: selectedDecision, includeReferenceCost: body.includeReferenceCost === true, occurredAt: new Date() }); }
  async publish(context: CatalogMutationContext, versionId: unknown, value: unknown, mayWriteCost: boolean) { const body = object(value); const clientRequestId = requiredUuid(body.clientRequestId, 'clientRequestId'); const expectedVersion = positiveVersion(body.expectedVersion); const expectedBatchVersion = positiveVersion(body.expectedBatchVersion, 'expectedBatchVersion'); const normalizedVersionId = requiredUuid(versionId, 'versionId'); const acknowledged = coverageReviewAcknowledged(body.coverageReviewAcknowledged); const currency = await this.readCurrency(context.tenantId); if (!currency || !/^[A-Z]{3}$/u.test(currency)) throw new CatalogConflictError(); const fingerprint = sha256({ versionId: normalizedVersionId, expectedVersion, clientRequestId, currency, mayWriteCost, coverageReviewAcknowledged: acknowledged }); return this.repository.publish(context, { versionId: normalizedVersionId, expectedVersion, expectedBatchVersion, clientRequestId, requestSha256: fingerprint, currency, mayWriteCost, coverageReviewAcknowledged: acknowledged, occurredAt: new Date() }); }
  compare(scope: CatalogScope, leftVersionId: unknown, rightVersionId: unknown) { return this.repository.compare(scope, requiredUuid(leftVersionId, 'leftVersionId'), requiredUuid(rightVersionId, 'rightVersionId')); }
  purgeExpiredRaw(context: CatalogMutationContext) { return this.repository.purgeExpiredRaw(context, new Date()); }
  deleteSource(context: CatalogMutationContext, sourceId: unknown, value: unknown, reauthenticatedAt: string) { const body = object(value); if (body.confirmation !== 'DELETE_SUPPLIER_SOURCE') throw new CatalogInputError('confirmation'); const normalizedSourceId = requiredUuid(sourceId, 'sourceId'); const expectedVersion = positiveVersion(body.expectedVersion); const clientRequestId = requiredUuid(body.clientRequestId, 'clientRequestId'); const requestSha256 = sha256({ sourceId: normalizedSourceId, expectedVersion, confirmation: body.confirmation }); const parsedReauthenticatedAt = new Date(reauthenticatedAt); if (Number.isNaN(parsedReauthenticatedAt.valueOf())) throw new CatalogConflictError(); return this.repository.deleteSource(context, { sourceId: normalizedSourceId, expectedVersion, clientRequestId, requestSha256, reauthenticatedAt: parsedReauthenticatedAt, occurredAt: new Date() }); }
}
