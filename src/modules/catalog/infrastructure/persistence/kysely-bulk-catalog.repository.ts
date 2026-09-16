import { randomUUID } from 'node:crypto';
import type { Insertable } from 'kysely';
import type { DatabaseConnection } from '../../../../infrastructure/database/database-connection.js';
import { useDatabasePersistenceExecutor, useTransactionalDatabasePersistenceExecutor } from '../../../../infrastructure/database/database-persistence-capability.js';
import type { InternalDatabasePersistenceConnection, InternalDatabasePersistenceExecutor } from '../../../../infrastructure/database/database-persistence-capability.js';
import { runInTransaction } from '../../../../infrastructure/database/transaction-runner.js';
import type { DatabaseSchema } from '../../../../infrastructure/database/database-types.js';
import { CatalogAuthorizationChangedError, CatalogConflictError, CatalogInputError, CatalogNotFoundError, CatalogSupplierDeleteNotAllowedError, CatalogSupplierVersionAlreadyExistsError, CatalogUnavailableError, catalogKindCapabilities, catalogKindSkuPrefix } from '../../domain/catalog-item.js';
import type { CatalogItemKind } from '../../domain/catalog-item.js';
import { normalizeIdentifier, normalizeReference, retentionDate, sha256 } from '../../domain/bulk-catalog.js';
import type { BulkCatalogCandidateMatch, BulkCatalogClassification, BulkCatalogDecision, BulkCatalogMatchOrigin, BulkCatalogRowInput, BulkCatalogTitleDecision, SupplierCatalogCompleteness } from '../../domain/bulk-catalog.js';
import { BULK_CATALOG_MATCH_ALGORITHM_VERSION, buildSupplierHistoryTokenIndex, matchSupplierHistoryCandidates } from '../../domain/bulk-catalog-candidate-matching.js';
import type { SupplierHistoryCandidate } from '../../domain/bulk-catalog-candidate-matching.js';
import type { BulkCatalogRepositoryPort, SupplierSourceDeletionRecord, SupplierSourceRecord, SupplierVersionComparison, SupplierVersionRecord, SupplierVersionSummary } from '../../application/ports/bulk-catalog-repository.port.js';
import type { CatalogMutationContext, CatalogScope } from '../../application/ports/catalog-repository.port.js';

type BulkTables = 'catalog_supplier_sources' | 'catalog_supplier_catalog_versions' | 'catalog_supplier_version_raw_payloads' | 'catalog_supplier_listings' | 'catalog_update_batches' | 'catalog_update_row_decisions' | 'catalog_supplier_listing_resolutions' | 'catalog_supplier_reconciliation_memory' | 'catalog_supplier_source_deletion_events' | 'catalog_items' | 'catalog_item_identifiers' | 'catalog_sku_sequences' | 'catalog_barcode_sequences' | 'catalog_categories' | 'catalog_brands' | 'catalog_category_pending_values' | 'catalog_brand_pending_values' | 'catalog_brand_pending_kind_applicability' | 'catalog_base_price_revisions' | 'catalog_reference_cost_revisions' | 'catalog_audit_events';
type BulkExecutor = InternalDatabasePersistenceExecutor<'catalog'>;
const emptyCounts = (): Record<BulkCatalogClassification, number> => ({ NEW: 0, UPDATE: 0, REACTIVATE: 0, UNCHANGED: 0, CANDIDATE: 0, PENDING_REFERENCE: 0, AMBIGUOUS: 0, CONFLICT: 0, INVALID: 0 });

function translate(error: unknown): Error {
  if (error instanceof CatalogInputError || error instanceof CatalogNotFoundError || error instanceof CatalogConflictError || error instanceof CatalogAuthorizationChangedError) return error;
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  const constraint = typeof error === 'object' && error && 'constraint' in error ? String(error.constraint) : '';
  if (code === '23505' && constraint === 'catalog_supplier_versions_revision_uq') return new CatalogSupplierVersionAlreadyExistsError();
  if (['23505', '23503', '23514', 'DATABASE_TRANSACTION_SERIALIZATION_FAILURE', 'DATABASE_TRANSACTION_DEADLOCK'].includes(code)) return new CatalogConflictError();
  if (['22P02', '22001', '23502'].includes(code)) return new CatalogInputError('persistence');
  return new CatalogUnavailableError();
}

async function guardsCurrent(context: CatalogMutationContext, transactionContext: object): Promise<boolean> {
  for (const guard of context.commitGuards) if (!await guard.confirmCurrent(transactionContext) || !await guard.confirmTemporalCurrent(transactionContext)) return false;
  return true;
}

function supplierMemoryKeys(proposal: BulkCatalogRowInput): readonly string[] {
  const signature = sha256({
    kind: proposal.kind,
    title: normalizeReference(proposal.supplierObservedTitle ?? proposal.title),
    description: normalizeReference(proposal.description),
    category: normalizeReference(proposal.category),
    brand: normalizeReference(proposal.brand),
  });
  return Object.freeze(proposal.supplierItemCode
    ? [`SUPPLIER_CODE:${normalizeReference(proposal.supplierItemCode)}`]
    : [`SIGNATURE:${signature}`]);
}

async function readVersion(executor: BulkExecutor, tenantId: string, versionId: string, includeReferenceCost: boolean): Promise<SupplierVersionRecord | null> {
  const row = await executor.selectFrom('catalog_supplier_catalog_versions as v').innerJoin('catalog_supplier_sources as s', (join) => join.onRef('s.tenant_id', '=', 'v.tenant_id').onRef('s.source_id', '=', 'v.source_id')).innerJoin('catalog_update_batches as b', (join) => join.onRef('b.tenant_id', '=', 'v.tenant_id').onRef('b.version_id', '=', 'v.version_id')).select(['v.version_id', 'v.source_id', 'v.supersedes_version_id', 's.display_name as source_name', 'v.sequence_number', 'v.source_revision', 'v.description', 'v.composer_mode', 'v.completeness', 'v.column_signature', 'v.lifecycle', 'v.lock_version', 'v.row_count', 'v.created_at', 'v.ingested_at', 'b.batch_id', 'b.lifecycle as batch_lifecycle', 'b.lock_version as batch_version', 'b.counts', 'b.published_at']).where('v.tenant_id', '=', tenantId).where('v.version_id', '=', versionId).executeTakeFirst();
  if (!row) return null;
  const decisionRows = await executor.selectFrom('catalog_update_row_decisions as d')
    .innerJoin('catalog_supplier_listings as l', (join) => join.onRef('l.tenant_id', '=', 'd.tenant_id').onRef('l.listing_id', '=', 'd.listing_id'))
    .leftJoin('catalog_items as i', (join) => join.onRef('i.tenant_id', '=', 'd.tenant_id').onRef('i.item_id', '=', 'd.target_item_id'))
    .leftJoin('catalog_categories as c', (join) => join.onRef('c.tenant_id', '=', 'i.tenant_id').onRef('c.category_id', '=', 'i.category_id'))
    .leftJoin('catalog_brands as cb', (join) => join.onRef('cb.tenant_id', '=', 'i.tenant_id').onRef('cb.brand_id', '=', 'i.brand_id'))
    .select(['d.row_decision_id', 'd.row_number', 'l.supplier_title', 'd.proposal', 'd.classification', 'd.decision', 'd.title_decision', 'd.target_item_id', 'i.kind as target_kind', 'i.title as target_title', 'i.description as target_description', 'i.status as target_status', 'c.display_name as target_category', 'cb.display_name as target_brand', 'd.expected_item_version', 'd.preselected_by_memory', 'd.match_origin', 'd.match_algorithm_version', 'd.candidate_matches', 'd.errors', 'd.warnings', 'd.lock_version'])
    .where('d.tenant_id', '=', tenantId).where('d.batch_id', '=', row.batch_id).orderBy('d.row_number').execute();
  const targetIds = [...new Set(decisionRows.flatMap((value) => value.target_item_id ? [value.target_item_id] : []))];
  const [priceRows, costRows] = targetIds.length === 0 ? [[], []] : await Promise.all([
    executor.selectFrom('catalog_base_price_revisions').select(['item_id', 'amount_minor']).where('tenant_id', '=', tenantId).where('item_id', 'in', targetIds).orderBy('effective_from', 'desc').orderBy('revision_id', 'desc').execute(),
    includeReferenceCost ? executor.selectFrom('catalog_reference_cost_revisions').select(['item_id', 'amount_minor']).where('tenant_id', '=', tenantId).where('item_id', 'in', targetIds).orderBy('effective_from', 'desc').orderBy('revision_id', 'desc').execute() : Promise.resolve([]),
  ]);
  const prices = new Map<string, number>(); for (const value of priceRows) if (!prices.has(value.item_id)) prices.set(value.item_id, Number(value.amount_minor));
  const costs = new Map<string, number>(); for (const value of costRows) if (!costs.has(value.item_id)) costs.set(value.item_id, Number(value.amount_minor));
  const rows = decisionRows.map((value) => {
    const proposal = value.proposal as BulkCatalogRowInput;
    const before = value.target_item_id && value.target_kind && value.target_title && value.target_status ? Object.freeze({ kind: value.target_kind, title: value.target_title, description: value.target_description, category: value.target_category, brand: value.target_brand, status: value.target_status, basePriceMinor: prices.get(value.target_item_id) ?? null, referenceCostMinor: includeReferenceCost ? costs.get(value.target_item_id) ?? null : null }) : null;
    return Object.freeze({ rowDecisionId: value.row_decision_id, rowNumber: value.row_number, supplierObservedTitle: value.supplier_title, proposal: includeReferenceCost ? proposal : Object.freeze({ ...proposal, referenceCostMinor: null }), classification: value.classification, decision: value.decision, titleDecision: value.title_decision, targetItemId: value.target_item_id, targetTitle: value.target_title, expectedItemVersion: value.expected_item_version, before, preselectedByMemory: value.preselected_by_memory, matchOrigin: value.match_origin, matchAlgorithmVersion: value.match_algorithm_version, candidates: Object.freeze(value.candidate_matches as BulkCatalogCandidateMatch[]), errors: Object.freeze(value.errors as string[]), warnings: Object.freeze(value.warnings as string[]), version: value.lock_version });
  });
  const counts = { ...emptyCounts(), ...(row.counts as Partial<Record<BulkCatalogClassification, number>>) };
  return Object.freeze({ versionId: row.version_id, sourceId: row.source_id, sourceName: row.source_name, sequenceNumber: row.sequence_number, sourceRevision: row.source_revision, description: row.description, mode: row.composer_mode, completeness: row.completeness, supersedesVersionId: row.supersedes_version_id, columnSignature: row.column_signature, lifecycle: row.lifecycle, version: row.lock_version, rowCount: row.row_count, createdAt: row.created_at.toISOString(), ingestedAt: row.ingested_at?.toISOString() ?? null, batch: Object.freeze({ batchId: row.batch_id, lifecycle: row.batch_lifecycle, version: row.batch_version, counts: Object.freeze(counts), publishedAt: row.published_at?.toISOString() ?? null }), rows: Object.freeze(rows) });
}

async function replaceRows(executor: BulkExecutor, tenantId: string, versionId: string, batchId: string, rows: readonly BulkCatalogRowInput[], now: Date): Promise<void> {
  await executor.deleteFrom('catalog_update_row_decisions').where('tenant_id', '=', tenantId).where('batch_id', '=', batchId).execute();
  await executor.deleteFrom('catalog_supplier_listings').where('tenant_id', '=', tenantId).where('version_id', '=', versionId).execute();
  const chunkSize = 500;
  for (let offset = 0; offset < rows.length; offset += chunkSize) {
    const slice = rows.slice(offset, offset + chunkSize);
    const listings = slice.map((row, index) => {
      const normalizedSupplierItemCode = normalizeReference(row.supplierItemCode);
      const normalizedSignature = sha256({ kind: row.kind, title: normalizeReference(row.supplierObservedTitle), description: normalizeReference(row.description), category: normalizeReference(row.category), brand: normalizeReference(row.brand) });
      return { tenant_id: tenantId, listing_id: randomUUID(), version_id: versionId, row_number: offset + index + 1, item_kind: row.kind, supplier_item_code: row.supplierItemCode, normalized_supplier_item_code: normalizedSupplierItemCode, normalized_signature: normalizedSignature, supplier_sku: row.sku, supplier_barcode: row.barcode, supplier_title: row.supplierObservedTitle, supplier_description: row.description, category_label: row.category, brand_label: row.brand, supplier_cost_minor: row.referenceCostMinor === null ? null : String(row.referenceCostMinor), currency: null, source_observation: { kind: row.kind, title: row.supplierObservedTitle, description: row.description, category: row.category, brand: row.brand, supplierItemCode: row.supplierItemCode, sku: row.sku, barcode: row.barcode, basePriceMinor: row.basePriceMinor, referenceCostMinor: row.referenceCostMinor }, created_at: now };
    });
    await executor.insertInto('catalog_supplier_listings').values(listings).execute();
    await executor.insertInto('catalog_update_row_decisions').values(listings.map((listing, index) => ({ tenant_id: tenantId, row_decision_id: randomUUID(), batch_id: batchId, listing_id: listing.listing_id, row_number: listing.row_number, proposal: slice[index]!, classification: 'INVALID' as const, decision: 'UNRESOLVED' as const, target_item_id: null, expected_item_version: null, preselected_by_memory: false, match_origin: 'NONE' as const, match_algorithm_version: BULK_CATALOG_MATCH_ALGORITHM_VERSION, candidate_matches: JSON.stringify([]), errors: JSON.stringify(['PENDING_ANALYSIS']), warnings: JSON.stringify([]), lock_version: 1, updated_at: now }))).execute();
  }
}

async function allocateSkus(executor: BulkExecutor, tenantId: string, kind: CatalogItemKind, count: number): Promise<string[]> {
  if (count === 0) return [];
  await executor.insertInto('catalog_sku_sequences').values({ tenant_id: tenantId, kind, next_value: '1' }).onConflict((conflict) => conflict.columns(['tenant_id', 'kind']).doNothing()).execute();
  const row = await executor.selectFrom('catalog_sku_sequences').select('next_value').where('tenant_id', '=', tenantId).where('kind', '=', kind).forUpdate().executeTakeFirstOrThrow();
  const value = BigInt(row.next_value); await executor.updateTable('catalog_sku_sequences').set({ next_value: String(value + BigInt(count)) }).where('tenant_id', '=', tenantId).where('kind', '=', kind).execute();
  return Array.from({ length: count }, (_, index) => `${catalogKindSkuPrefix[kind]}-${(value + BigInt(index)).toString().padStart(6, '0')}`);
}
async function allocateBarcodes(executor: BulkExecutor, tenantId: string, count: number): Promise<string[]> {
  if (count === 0) return [];
  await executor.insertInto('catalog_barcode_sequences').values({ tenant_id: tenantId, next_value: '1' }).onConflict((conflict) => conflict.column('tenant_id').doNothing()).execute();
  const row = await executor.selectFrom('catalog_barcode_sequences').select('next_value').where('tenant_id', '=', tenantId).forUpdate().executeTakeFirstOrThrow();
  const value = BigInt(row.next_value); await executor.updateTable('catalog_barcode_sequences').set({ next_value: String(value + BigInt(count)) }).where('tenant_id', '=', tenantId).execute();
  return Array.from({ length: count }, (_, index) => `SR${(value + BigInt(index)).toString().padStart(8, '0')}`);
}

export class KyselyBulkCatalogRepository implements BulkCatalogRepositoryPort {
  constructor(private readonly connection: InternalDatabasePersistenceConnection) {}
  private execute<Result>(operation: (executor: BulkExecutor) => Promise<Result>): Promise<Result> { return useDatabasePersistenceExecutor(this.connection, 'catalog', operation); }
  private async transaction<Result>(operation: (executor: BulkExecutor, tx: object) => Promise<Result>): Promise<Result> {
    let safe: Error | null = null;
    try { return await runInTransaction(this.connection as unknown as DatabaseConnection, { isolationLevel: 'serializable' }, (context) => useTransactionalDatabasePersistenceExecutor(context, 'catalog', async (executor) => { try { return await operation(executor, context); } catch (error) { safe = translate(error); throw safe; } })); }
    catch (error) { throw safe ?? translate(error); }
  }
  private async aggregateTransaction<Result>(operation: (executor: BulkExecutor, tx: object) => Promise<Result>): Promise<Result> {
    let safe: Error | null = null;
    try { return await runInTransaction(this.connection as unknown as DatabaseConnection, { isolationLevel: 'read committed' }, (context) => useTransactionalDatabasePersistenceExecutor(context, 'catalog', async (executor) => { try { return await operation(executor, context); } catch (error) { safe = translate(error); throw safe; } })); }
    catch (error) { throw safe ?? translate(error); }
  }
  async listSources(scope: CatalogScope) { try { return await this.execute(async (db) => {
    const rows = await db.selectFrom('catalog_supplier_sources').selectAll().where('tenant_id', '=', scope.tenantId).orderBy('normalized_name').execute();
    const records: SupplierSourceRecord[] = [];
    for (const row of rows) {
      const versions = await db.selectFrom('catalog_supplier_catalog_versions').select(['version_id', 'lifecycle']).where('tenant_id', '=', scope.tenantId).where('source_id', '=', row.source_id).execute();
      const versionIds = versions.map(({ version_id }) => version_id);
      const [resolution, memory, retirementPlan, retirementEvent] = await Promise.all([
        db.selectFrom('catalog_supplier_listing_resolutions').select('resolution_id').where('tenant_id', '=', scope.tenantId).where('source_id', '=', row.source_id).limit(1).executeTakeFirst(),
        db.selectFrom('catalog_supplier_reconciliation_memory').select('source_id').where('tenant_id', '=', scope.tenantId).where('source_id', '=', row.source_id).limit(1).executeTakeFirst(),
        versionIds.length === 0 ? Promise.resolve(undefined) : db.selectFrom('catalog_retirement_plans').innerJoin('catalog_update_batches', (join) => join.onRef('catalog_update_batches.tenant_id', '=', 'catalog_retirement_plans.tenant_id').onRef('catalog_update_batches.batch_id', '=', 'catalog_retirement_plans.batch_id')).select('catalog_retirement_plans.plan_id').where('catalog_retirement_plans.tenant_id', '=', scope.tenantId).where('catalog_update_batches.version_id', 'in', versionIds).limit(1).executeTakeFirst(),
        versionIds.length === 0 ? Promise.resolve(undefined) : db.selectFrom('catalog_retirement_events').innerJoin('catalog_update_batches', (join) => join.onRef('catalog_update_batches.tenant_id', '=', 'catalog_retirement_events.tenant_id').onRef('catalog_update_batches.batch_id', '=', 'catalog_retirement_events.batch_id')).select('catalog_retirement_events.event_id').where('catalog_retirement_events.tenant_id', '=', scope.tenantId).where('catalog_update_batches.version_id', 'in', versionIds).limit(1).executeTakeFirst(),
      ]);
      const published = versions.some(({ lifecycle }) => lifecycle === 'INGESTED');
      const dependent = Boolean(resolution || memory || retirementPlan || retirementEvent);
      records.push(Object.freeze({ sourceId: row.source_id, name: row.display_name, status: row.status, version: row.version, versionCount: versions.length, deletionEligibility: Object.freeze({ allowed: !published && !dependent, reason: published ? 'PUBLISHED_HISTORY' as const : dependent ? 'DEPENDENT_HISTORY' as const : 'SAFE_DRAFT_ONLY' as const }) }));
    }
    return Object.freeze(records);
  }); } catch (error) { throw translate(error); } }
  async createSource(context: CatalogMutationContext, input: Readonly<{ sourceId: string; name: string; normalizedName: string; occurredAt: Date }>) {
    return this.transaction(async (db, tx) => { await db.insertInto('catalog_supplier_sources').values({ tenant_id: context.tenantId, source_id: input.sourceId, display_name: input.name, normalized_name: input.normalizedName, status: 'ACTIVE', version: 1, next_version_sequence: 1, created_by_actor_id: context.actorUserId, created_at: input.occurredAt, updated_at: input.occurredAt }).execute(); if (!await guardsCurrent(context, tx)) throw new CatalogAuthorizationChangedError(); return Object.freeze({ sourceId: input.sourceId, name: input.name, status: 'ACTIVE' as const, version: 1, versionCount: 0, deletionEligibility: Object.freeze({ allowed: true, reason: 'SAFE_DRAFT_ONLY' as const }) }); });
  }
  async listVersions(scope: CatalogScope, sourceId?: string) { return this.execute(async (db) => {
    let query = db.selectFrom('catalog_supplier_catalog_versions').select('version_id').where('tenant_id', '=', scope.tenantId); if (sourceId) query = query.where('source_id', '=', sourceId); const ids = await query.orderBy('created_at', 'desc').execute();
    const values: SupplierVersionSummary[] = []; for (const { version_id } of ids) { const found = await readVersion(db, scope.tenantId, version_id, false); if (found) { const { rows: _rows, ...summary } = found; values.push(summary); } } return Object.freeze(values);
  }); }
  getVersion(scope: CatalogScope, versionId: string, includeReferenceCost: boolean) { return this.execute((db) => readVersion(db, scope.tenantId, versionId, includeReferenceCost)); }
  async createDraft(context: CatalogMutationContext, input: Readonly<{ versionId: string; batchId: string; sourceId: string; description: string | null; clientRequestId: string; requestSha256: string; mode: 'FULL' | 'COMPACT'; completeness: SupplierCatalogCompleteness; columnSignature: string; rawPayload: string; rows: readonly BulkCatalogRowInput[]; includeReferenceCost: boolean; occurredAt: Date }>) {
    return this.aggregateTransaction(async (db, tx) => { const source = await db.selectFrom('catalog_supplier_sources').selectAll().where('tenant_id', '=', context.tenantId).where('source_id', '=', input.sourceId).forUpdate().executeTakeFirst(); if (!source || source.status !== 'ACTIVE') throw new CatalogNotFoundError(); const replay = await db.selectFrom('catalog_supplier_catalog_versions').select(['version_id', 'create_request_sha256']).where('tenant_id', '=', context.tenantId).where('create_client_request_id', '=', input.clientRequestId).executeTakeFirst(); if (replay) { if (replay.create_request_sha256 !== input.requestSha256) throw new CatalogConflictError(); return (await readVersion(db, context.tenantId, replay.version_id, input.includeReferenceCost))!; } const sequenceNumber = source.next_version_sequence; const prior = await db.selectFrom('catalog_supplier_catalog_versions').select('version_id').where('tenant_id', '=', context.tenantId).where('source_id', '=', input.sourceId).where('lifecycle', '=', 'INGESTED').orderBy('sequence_number', 'desc').executeTakeFirst(); await db.updateTable('catalog_supplier_sources').set({ next_version_sequence: sequenceNumber + 1, version: source.version + 1, updated_at: input.occurredAt }).where('tenant_id', '=', context.tenantId).where('source_id', '=', input.sourceId).execute(); await db.insertInto('catalog_supplier_catalog_versions').values({ tenant_id: context.tenantId, version_id: input.versionId, source_id: input.sourceId, supersedes_version_id: prior?.version_id ?? null, sequence_number: sequenceNumber, source_revision: `v${sequenceNumber}`, description: input.description, create_client_request_id: input.clientRequestId, create_request_sha256: input.requestSha256, composer_mode: input.mode, completeness: input.completeness, column_signature: input.columnSignature, lifecycle: 'DRAFT', lock_version: 1, row_count: input.rows.length, content_sha256: null, ingested_at: null, created_by_actor_id: context.actorUserId, created_at: input.occurredAt, updated_at: input.occurredAt }).execute(); await db.insertInto('catalog_supplier_version_raw_payloads').values({ tenant_id: context.tenantId, version_id: input.versionId, payload_text: input.rawPayload, retained_until: retentionDate(input.occurredAt), purged_at: null, created_at: input.occurredAt }).execute(); await db.insertInto('catalog_update_batches').values({ tenant_id: context.tenantId, batch_id: input.batchId, version_id: input.versionId, lifecycle: 'DRAFT', lock_version: 1, counts: emptyCounts(), analysis_sha256: null, publish_client_request_id: null, publish_request_sha256: null, published_at: null, published_by_actor_id: null, created_at: input.occurredAt, updated_at: input.occurredAt }).execute(); await replaceRows(db, context.tenantId, input.versionId, input.batchId, input.rows, input.occurredAt); if (!await guardsCurrent(context, tx)) throw new CatalogAuthorizationChangedError(); return (await readVersion(db, context.tenantId, input.versionId, input.includeReferenceCost))!; });
  }
  async replaceDraft(context: CatalogMutationContext, input: Readonly<{ versionId: string; expectedVersion: number; description: string | null; completeness: SupplierCatalogCompleteness; columnSignature: string; rawPayload: string; rows: readonly BulkCatalogRowInput[]; includeReferenceCost: boolean; occurredAt: Date }>) {
    return this.transaction(async (db, tx) => { const current = await db.selectFrom('catalog_supplier_catalog_versions').selectAll().where('tenant_id', '=', context.tenantId).where('version_id', '=', input.versionId).forUpdate().executeTakeFirst(); if (!current) throw new CatalogNotFoundError(); if (current.lifecycle !== 'DRAFT' || current.lock_version !== input.expectedVersion) throw new CatalogConflictError(); const batch = await db.selectFrom('catalog_update_batches').selectAll().where('tenant_id', '=', context.tenantId).where('version_id', '=', input.versionId).forUpdate().executeTakeFirstOrThrow(); await replaceRows(db, context.tenantId, input.versionId, batch.batch_id, input.rows, input.occurredAt); await db.updateTable('catalog_supplier_version_raw_payloads').set({ payload_text: input.rawPayload, purged_at: null }).where('tenant_id', '=', context.tenantId).where('version_id', '=', input.versionId).execute(); await db.updateTable('catalog_supplier_catalog_versions').set({ description: input.description, completeness: input.completeness, column_signature: input.columnSignature, row_count: input.rows.length, lock_version: current.lock_version + 1, updated_at: input.occurredAt }).where('tenant_id', '=', context.tenantId).where('version_id', '=', input.versionId).execute(); await db.updateTable('catalog_update_batches').set({ lifecycle: 'DRAFT', counts: emptyCounts(), analysis_sha256: null, lock_version: batch.lock_version + 1, updated_at: input.occurredAt }).where('tenant_id', '=', context.tenantId).where('batch_id', '=', batch.batch_id).execute(); if (!await guardsCurrent(context, tx)) throw new CatalogAuthorizationChangedError(); return (await readVersion(db, context.tenantId, input.versionId, input.includeReferenceCost))!; });
  }
  async analyze(context: CatalogMutationContext, input: Readonly<{ versionId: string; expectedVersion: number; includeReferenceCost: boolean; occurredAt: Date }>) {
    return this.transaction(async (db, tx) => {
      const current = await db.selectFrom('catalog_supplier_catalog_versions').selectAll().where('tenant_id', '=', context.tenantId).where('version_id', '=', input.versionId).forUpdate().executeTakeFirst(); if (!current) throw new CatalogNotFoundError(); if (!['DRAFT', 'INGESTED'].includes(current.lifecycle) || current.lock_version !== input.expectedVersion) throw new CatalogConflictError();
      const batch = await db.selectFrom('catalog_update_batches').selectAll().where('tenant_id', '=', context.tenantId).where('version_id', '=', input.versionId).forUpdate().executeTakeFirstOrThrow(); if (batch.lifecycle === 'APPLIED') throw new CatalogConflictError(); const rows = await db.selectFrom('catalog_update_row_decisions').selectAll().where('tenant_id', '=', context.tenantId).where('batch_id', '=', batch.batch_id).orderBy('row_number').execute();
      const identifiers = await db.selectFrom('catalog_item_identifiers').innerJoin('catalog_items', (join) => join.onRef('catalog_items.tenant_id', '=', 'catalog_item_identifiers.tenant_id').onRef('catalog_items.item_id', '=', 'catalog_item_identifiers.item_id')).select(['catalog_item_identifiers.scheme', 'catalog_item_identifiers.normalized_value', 'catalog_items.item_id', 'catalog_items.kind', 'catalog_items.title', 'catalog_items.description', 'catalog_items.category_id', 'catalog_items.brand_id', 'catalog_items.pending_category_value_id', 'catalog_items.pending_brand_value_id', 'catalog_items.version', 'catalog_items.status']).where('catalog_item_identifiers.tenant_id', '=', context.tenantId).execute();
      const itemMap = new Map(identifiers.map((value) => [value.item_id, value]));
      const idMap = new Map(identifiers.map((value) => [`${value.scheme}:${value.normalized_value}`, value])); const duplicate = new Set<string>(); const seen = new Map<string, number>();
      for (const row of rows) { const p = row.proposal as BulkCatalogRowInput; for (const key of [p.sku ? `SKU:${p.sku}` : null, p.barcode ? `BARCODE:${p.barcode}` : null, ...supplierMemoryKeys(p)]) if (key) { if (seen.has(key)) duplicate.add(key); else seen.set(key, row.row_number); } }
      const categories = await db.selectFrom('catalog_categories').select(['category_id', 'kind', 'normalized_name', 'status']).where('tenant_id', '=', context.tenantId).where('merged_into_id', 'is', null).execute(); const brands = await db.selectFrom('catalog_brands').select(['brand_id', 'normalized_name', 'status']).where('tenant_id', '=', context.tenantId).where('merged_into_id', 'is', null).execute();
      const pendingCategories = await db.selectFrom('catalog_category_pending_values').select(['pending_category_value_id', 'kind', 'normalized_key']).where('tenant_id', '=', context.tenantId).where('resolution_status', '=', 'PENDING').execute();
      const pendingBrands = await db.selectFrom('catalog_brand_pending_values').select(['pending_brand_value_id', 'normalized_key']).where('tenant_id', '=', context.tenantId).where('resolution_status', '=', 'PENDING').execute();
      const memories = await db.selectFrom('catalog_supplier_reconciliation_memory as m')
        .innerJoin('catalog_supplier_listing_resolutions as r', (join) => join.onRef('r.tenant_id', '=', 'm.tenant_id').onRef('r.resolution_id', '=', 'm.last_resolution_id'))
        .innerJoin('catalog_update_batches as rb', (join) => join.onRef('rb.tenant_id', '=', 'r.tenant_id').onRef('rb.batch_id', '=', 'r.batch_id'))
        .select(['m.identifier_scheme', 'm.normalized_identifier', 'm.item_id', 'm.item_kind', 'm.consistency_state', 'm.correction_count', 'm.last_resolution_id', 'r.item_id as resolution_item_id', 'rb.lifecycle as resolution_batch_lifecycle'])
        .where('m.tenant_id', '=', context.tenantId).where('m.source_id', '=', current.source_id).where('m.column_signature', '=', current.column_signature).execute();
      const memoryMap = new Map(memories.map((value) => [`${value.identifier_scheme}:${value.normalized_identifier}`, value]));
      const publishedHistoryRows = await db.selectFrom('catalog_supplier_listing_resolutions as r')
        .innerJoin('catalog_supplier_listings as l', (join) => join.onRef('l.tenant_id', '=', 'r.tenant_id').onRef('l.listing_id', '=', 'r.listing_id'))
        .innerJoin('catalog_update_batches as hb', (join) => join.onRef('hb.tenant_id', '=', 'r.tenant_id').onRef('hb.batch_id', '=', 'r.batch_id'))
        .innerJoin('catalog_items as hi', (join) => join.onRef('hi.tenant_id', '=', 'r.tenant_id').onRef('hi.item_id', '=', 'r.item_id'))
        .select(['r.item_id', 'l.supplier_title', 'hi.title', 'hi.kind', 'hi.category_id', 'hi.pending_category_value_id', 'hi.brand_id', 'hi.pending_brand_value_id', 'hi.status', 'hi.version'])
        .where('r.tenant_id', '=', context.tenantId).where('r.source_id', '=', current.source_id).where('hb.lifecycle', '=', 'APPLIED').where('r.item_id', 'is not', null).execute();
      const publishedHistory: SupplierHistoryCandidate[] = publishedHistoryRows.flatMap((value) => value.item_id && value.supplier_title ? [Object.freeze({ itemId: value.item_id, title: value.title, observedTitle: value.supplier_title, kind: value.kind, categoryIdentity: value.category_id ? `C:${value.category_id}` : value.pending_category_value_id ? `P:${value.pending_category_value_id}` : null, brandIdentity: value.brand_id ? `C:${value.brand_id}` : value.pending_brand_value_id ? `P:${value.pending_brand_value_id}` : null, status: value.status, version: value.version })] : []);
      const candidateIndex = buildSupplierHistoryTokenIndex(publishedHistory);
      const priceRows = await db.selectFrom('catalog_base_price_revisions').select(['item_id', 'amount_minor']).where('tenant_id', '=', context.tenantId).orderBy('effective_from', 'desc').orderBy('revision_id', 'desc').execute();
      const costRows = await db.selectFrom('catalog_reference_cost_revisions').select(['item_id', 'amount_minor']).where('tenant_id', '=', context.tenantId).orderBy('effective_from', 'desc').orderBy('revision_id', 'desc').execute();
      const currentPrices = new Map<string, number>(); for (const value of priceRows) if (!currentPrices.has(value.item_id)) currentPrices.set(value.item_id, Number(value.amount_minor));
      const currentCosts = new Map<string, number>(); for (const value of costRows) if (!currentCosts.has(value.item_id)) currentCosts.set(value.item_id, Number(value.amount_minor));
      const counts = emptyCounts(); let unresolvedCount = 0;
      const analyzedWrites: Array<Insertable<DatabaseSchema['catalog_update_row_decisions']>> = [];
      for (const row of rows) {
        const p = row.proposal as BulkCatalogRowInput; const identifierKeys = [p.sku ? `SKU:${p.sku}` : null, p.barcode ? `BARCODE:${p.barcode}` : null].filter((value): value is string => Boolean(value)); const historyKeys = supplierMemoryKeys(p); const errors: string[] = []; const warnings: string[] = [];
        if ([...identifierKeys, ...historyKeys].some((key) => duplicate.has(key))) errors.push('DUPLICATE_OBSERVATION_IN_VERSION');
        const categoryKey = normalizeReference(p.category); const brandKey = normalizeReference(p.brand);
        const proposedCategory = categoryKey ? categories.find((value) => value.kind === p.kind && value.normalized_name === categoryKey && value.status === 'ACTIVE') : null;
        const proposedPendingCategory = categoryKey ? pendingCategories.find((value) => value.kind === p.kind && value.normalized_key === categoryKey) : null;
        const proposedBrand = brandKey ? brands.find((value) => value.normalized_name === brandKey && value.status === 'ACTIVE') : null;
        const proposedPendingBrand = brandKey ? pendingBrands.find((value) => value.normalized_key === brandKey) : null;
        const categoryIdentity = proposedCategory ? `C:${proposedCategory.category_id}` : proposedPendingCategory ? `P:${proposedPendingCategory.pending_category_value_id}` : null;
        const brandIdentity = proposedBrand ? `C:${proposedBrand.brand_id}` : proposedPendingBrand ? `P:${proposedPendingBrand.pending_brand_value_id}` : null;
        const matched = [...new Map(identifierKeys.map((key) => idMap.get(key)).filter(Boolean).map((value) => [value!.item_id, value!])).values()]; let target = matched[0] ?? null; let trusted = false; let matchOrigin: BulkCatalogMatchOrigin = target ? 'INTERNAL_IDENTIFIER' : 'NONE'; let candidateMatches: readonly BulkCatalogCandidateMatch[] = Object.freeze([]);
        if (matched.length > 1) errors.push('IDENTIFIERS_POINT_TO_DIFFERENT_ITEMS');
        const historicalRows = historyKeys.map((key) => memoryMap.get(key)).filter((value) => value !== undefined);
        const historicalTargets = [...new Map(historicalRows.map((value) => [value.item_id, value])).values()];
        if (historicalRows.some((value) => value.consistency_state === 'CONFLICTED')) errors.push('CORRECTED_MAPPING_CONFLICT');
        else if (historicalTargets.length > 1 || (target && historicalTargets.some((candidate) => candidate.item_id !== target!.item_id))) errors.push('AMBIGUOUS_HISTORY');
        else if (historicalTargets.length === 1) {
          const memory = historicalTargets[0]!; const item = itemMap.get(memory.item_id);
          if (!item) errors.push('HISTORICAL_TARGET_NOT_AVAILABLE');
          else if (p.kind && item.kind !== p.kind) errors.push('TYPE_CONTRADICTION');
          else if ((categoryIdentity && categoryIdentity !== (item.category_id ? `C:${item.category_id}` : item.pending_category_value_id ? `P:${item.pending_category_value_id}` : null)) || (brandIdentity && brandIdentity !== (item.brand_id ? `C:${item.brand_id}` : item.pending_brand_value_id ? `P:${item.pending_brand_value_id}` : null))) errors.push('REFERENCE_CONTRADICTION');
          else if (memory.consistency_state !== 'CONSISTENT' || memory.correction_count !== 0 || memory.resolution_batch_lifecycle !== 'APPLIED' || memory.resolution_item_id !== memory.item_id) errors.push('UNTRUSTED_HISTORY_REQUIRES_OWNER_DECISION');
          else {
            if (!target) target = item;
            if (target.item_id === item.item_id) {
              trusted = true; matchOrigin = 'TRUSTED_HISTORY';
              warnings.push(item.status === 'INACTIVE' ? 'TRUSTED_HISTORICAL_MATCH_AUTO_REACTIVATES' : 'TRUSTED_HISTORICAL_MATCH_AUTO_RESOLVED');
            }
          }
        }
        if (target?.status === 'INACTIVE' && !trusted) errors.push('HISTORICAL_ITEM_RETIRED_REQUIRES_REACTIVATION');
        if (target && p.kind && target.kind !== p.kind) errors.push('TYPE_CONTRADICTION');
        let classification: BulkCatalogClassification; let decision: BulkCatalogDecision = 'UNRESOLVED';
        if (errors.length) classification = errors.includes('AMBIGUOUS_HISTORY') ? 'AMBIGUOUS' : 'CONFLICT';
        else if (!target && current.composer_mode === 'COMPACT') { classification = 'INVALID'; errors.push('COMPACT_ROW_TARGET_NOT_FOUND'); }
        else if (!target) {
          const categoryKnown = Boolean(proposedCategory); const brandKnown = !p.brand || Boolean(proposedBrand);
          if (categoryKnown && brandKnown) {
            const candidateResult = matchSupplierHistoryCandidates(p, categoryIdentity, brandIdentity, candidateIndex); candidateMatches = candidateResult.candidates;
            if (candidateMatches.length > 1) { classification = 'AMBIGUOUS'; warnings.push('MULTIPLE_BOUNDED_CANDIDATES'); matchOrigin = 'CANDIDATE'; }
            else if (candidateMatches.length === 1) { classification = 'CANDIDATE'; warnings.push('CANDIDATE_MATCH_REQUIRES_OWNER_DECISION'); matchOrigin = 'CANDIDATE'; }
            else { classification = 'NEW'; decision = 'APPLY'; }
          } else classification = 'PENDING_REFERENCE';
        } else {
          if (p.title !== null && p.title !== target.title) warnings.push('SUPPLIER_TITLE_DIFF_NOT_APPLIED');
          if ((p.category && !proposedCategory && !proposedPendingCategory) || (p.brand && !proposedBrand && !proposedPendingBrand)) { classification = 'PENDING_REFERENCE'; decision = 'UNRESOLVED'; warnings.push('REFERENCE_REQUIRES_GOVERNANCE'); }
          else { const changed = (p.description !== null && p.description !== target.description) || (Boolean(proposedCategory) && (proposedCategory!.category_id !== target.category_id || target.pending_category_value_id !== null)) || (Boolean(proposedPendingCategory) && proposedPendingCategory!.pending_category_value_id !== target.pending_category_value_id) || (Boolean(proposedBrand) && (proposedBrand!.brand_id !== target.brand_id || target.pending_brand_value_id !== null)) || (Boolean(proposedPendingBrand) && proposedPendingBrand!.pending_brand_value_id !== target.pending_brand_value_id) || (p.basePriceMinor !== null && p.basePriceMinor !== currentPrices.get(target.item_id)) || (p.referenceCostMinor !== null && p.referenceCostMinor !== currentCosts.get(target.item_id)); classification = target.status === 'INACTIVE' ? 'REACTIVATE' : changed ? 'UPDATE' : 'UNCHANGED'; decision = 'APPLY'; }
        }
        counts[classification] += 1; if (decision === 'UNRESOLVED') unresolvedCount += 1;
        const titleDecision: BulkCatalogTitleDecision | null = target && p.title !== null && p.title !== target.title ? 'KEEP_CURRENT' : null;
        analyzedWrites.push({ tenant_id: row.tenant_id, row_decision_id: row.row_decision_id, batch_id: row.batch_id, listing_id: row.listing_id, row_number: row.row_number, proposal: row.proposal, classification, decision, title_decision: titleDecision, target_item_id: target?.item_id ?? null, expected_item_version: target?.version ?? null, preselected_by_memory: trusted, match_origin: matchOrigin, match_algorithm_version: BULK_CATALOG_MATCH_ALGORITHM_VERSION, candidate_matches: JSON.stringify(candidateMatches), errors: JSON.stringify(errors), warnings: JSON.stringify(warnings), lock_version: row.lock_version + 1, updated_at: input.occurredAt });
      }
      for (let offset = 0; offset < analyzedWrites.length; offset += 500) await db.insertInto('catalog_update_row_decisions').values(analyzedWrites.slice(offset, offset + 500)).onConflict((conflict) => conflict.columns(['tenant_id', 'row_decision_id']).doUpdateSet((eb) => ({ classification: eb.ref('excluded.classification'), decision: eb.ref('excluded.decision'), title_decision: eb.ref('excluded.title_decision'), target_item_id: eb.ref('excluded.target_item_id'), expected_item_version: eb.ref('excluded.expected_item_version'), preselected_by_memory: eb.ref('excluded.preselected_by_memory'), match_origin: eb.ref('excluded.match_origin'), match_algorithm_version: eb.ref('excluded.match_algorithm_version'), candidate_matches: eb.ref('excluded.candidate_matches'), errors: eb.ref('excluded.errors'), warnings: eb.ref('excluded.warnings'), lock_version: eb.ref('excluded.lock_version'), updated_at: input.occurredAt }))).execute();
      const content = sha256(rows.map((row) => row.proposal));
      if (current.lifecycle === 'DRAFT') await db.updateTable('catalog_supplier_catalog_versions').set({ lifecycle: 'INGESTED', content_sha256: content, ingested_at: input.occurredAt, lock_version: current.lock_version + 1, updated_at: input.occurredAt }).where('tenant_id', '=', context.tenantId).where('version_id', '=', input.versionId).execute();
      await db.updateTable('catalog_update_batches').set({ lifecycle: unresolvedCount === 0 ? 'READY' : 'RECONCILING', counts, analysis_sha256: sha256({ content, counts }), lock_version: batch.lock_version + 1, updated_at: input.occurredAt }).where('tenant_id', '=', context.tenantId).where('batch_id', '=', batch.batch_id).execute(); if (!await guardsCurrent(context, tx)) throw new CatalogAuthorizationChangedError(); return (await readVersion(db, context.tenantId, input.versionId, input.includeReferenceCost))!;
    });
  }
  async decide(context: CatalogMutationContext, input: Readonly<{ versionId: string; rowDecisionId: string; expectedRowVersion: number; decision: BulkCatalogDecision; targetItemId: string | null; titleDecision: BulkCatalogTitleDecision | null; includeReferenceCost: boolean; occurredAt: Date }>) {
    return this.transaction(async (db, tx) => {
      const version = await db.selectFrom('catalog_supplier_catalog_versions').selectAll().where('tenant_id', '=', context.tenantId).where('version_id', '=', input.versionId).executeTakeFirst(); if (!version) throw new CatalogNotFoundError(); if (version.lifecycle !== 'INGESTED') throw new CatalogConflictError();
      const batch = await db.selectFrom('catalog_update_batches').selectAll().where('tenant_id', '=', context.tenantId).where('version_id', '=', input.versionId).forUpdate().executeTakeFirstOrThrow();
      const row = await db.selectFrom('catalog_update_row_decisions').selectAll().where('tenant_id', '=', context.tenantId).where('row_decision_id', '=', input.rowDecisionId).where('batch_id', '=', batch.batch_id).forUpdate().executeTakeFirst(); if (!row) throw new CatalogNotFoundError(); if (row.lock_version !== input.expectedRowVersion) throw new CatalogConflictError();
      let classification = row.classification; let expected = row.expected_item_version; let targetItemId = input.targetItemId ?? row.target_item_id; let selectedTitleDecision: BulkCatalogTitleDecision | null = row.title_decision;
      if (input.targetItemId) {
        if (input.decision !== 'APPLY') throw new CatalogConflictError();
        const persistedCandidates = row.candidate_matches as BulkCatalogCandidateMatch[];
        if (['CANDIDATE', 'AMBIGUOUS'].includes(row.classification) && !persistedCandidates.some((candidate) => candidate.itemId === input.targetItemId && candidate.expectedItemVersion >= 1)) throw new CatalogConflictError();
        const competing = await db.selectFrom('catalog_update_row_decisions').select('row_decision_id').where('tenant_id', '=', context.tenantId).where('batch_id', '=', batch.batch_id).where('row_decision_id', '!=', input.rowDecisionId).where('target_item_id', '=', input.targetItemId).where('decision', '!=', 'EXCLUDE').executeTakeFirst(); if (competing) throw new CatalogConflictError();
        const item = await db.selectFrom('catalog_items as i').leftJoin('catalog_categories as c', (join) => join.onRef('c.tenant_id', '=', 'i.tenant_id').onRef('c.category_id', '=', 'i.category_id')).leftJoin('catalog_category_pending_values as pc', (join) => join.onRef('pc.tenant_id', '=', 'i.tenant_id').onRef('pc.pending_category_value_id', '=', 'i.pending_category_value_id')).leftJoin('catalog_brands as b', (join) => join.onRef('b.tenant_id', '=', 'i.tenant_id').onRef('b.brand_id', '=', 'i.brand_id')).leftJoin('catalog_brand_pending_values as pb', (join) => join.onRef('pb.tenant_id', '=', 'i.tenant_id').onRef('pb.pending_brand_value_id', '=', 'i.pending_brand_value_id')).select(['i.version', 'i.kind', 'i.status', 'i.title', 'i.description', 'c.normalized_name as category_name', 'pc.normalized_key as pending_category_name', 'b.normalized_name as brand_name', 'pb.normalized_key as pending_brand_name']).where('i.tenant_id', '=', context.tenantId).where('i.item_id', '=', input.targetItemId).executeTakeFirst();
        if (!item) throw new CatalogConflictError(); const proposal = row.proposal as BulkCatalogRowInput; if (proposal.kind && item.kind !== proposal.kind) throw new CatalogConflictError();
        const [price, cost] = await Promise.all([
          db.selectFrom('catalog_base_price_revisions').select('amount_minor').where('tenant_id', '=', context.tenantId).where('item_id', '=', input.targetItemId).orderBy('effective_from', 'desc').orderBy('revision_id', 'desc').executeTakeFirst(),
          db.selectFrom('catalog_reference_cost_revisions').select('amount_minor').where('tenant_id', '=', context.tenantId).where('item_id', '=', input.targetItemId).orderBy('effective_from', 'desc').orderBy('revision_id', 'desc').executeTakeFirst(),
        ]);
        const titleDiffers = proposal.title !== null && proposal.title !== item.title;
        if (titleDiffers && input.titleDecision === null) throw new CatalogInputError('titleDecision');
        if (!titleDiffers && input.titleDecision === 'ADOPT_OBSERVED') throw new CatalogInputError('titleDecision');
        selectedTitleDecision = titleDiffers ? input.titleDecision : null;
        const changed = selectedTitleDecision === 'ADOPT_OBSERVED' || (proposal.description !== null && proposal.description !== item.description) || (proposal.category !== null && normalizeReference(proposal.category) !== (item.category_name ?? item.pending_category_name)) || (proposal.brand !== null && normalizeReference(proposal.brand) !== (item.brand_name ?? item.pending_brand_name)) || (proposal.basePriceMinor !== null && proposal.basePriceMinor !== (price ? Number(price.amount_minor) : undefined)) || (proposal.referenceCostMinor !== null && proposal.referenceCostMinor !== (cost ? Number(cost.amount_minor) : undefined));
        classification = item.status === 'INACTIVE' ? 'REACTIVATE' : changed ? 'UPDATE' : 'UNCHANGED'; expected = item.version;
      } else if (input.decision === 'APPLY' && row.classification === 'CANDIDATE') { classification = 'NEW'; targetItemId = null; expected = null; selectedTitleDecision = null; }
      if (input.decision === 'APPLY' && ['AMBIGUOUS', 'CONFLICT', 'INVALID'].includes(classification) && !input.targetItemId) throw new CatalogConflictError();
      await db.updateTable('catalog_update_row_decisions').set({ classification, decision: input.decision, title_decision: input.decision === 'APPLY' ? selectedTitleDecision : null, target_item_id: targetItemId, expected_item_version: expected, preselected_by_memory: false, match_origin: input.decision === 'APPLY' ? 'OWNER_SELECTED' : row.match_origin, errors: input.targetItemId || classification === 'NEW' ? [] : row.errors, lock_version: row.lock_version + 1, updated_at: input.occurredAt }).where('tenant_id', '=', context.tenantId).where('row_decision_id', '=', input.rowDecisionId).execute();
      const classified = await db.selectFrom('catalog_update_row_decisions').select(['classification', 'decision']).where('tenant_id', '=', context.tenantId).where('batch_id', '=', batch.batch_id).execute(); const counts = emptyCounts(); for (const value of classified) counts[value.classification] += 1;
      const unresolvedCount = classified.filter((value) => value.decision === 'UNRESOLVED').length;
      await db.updateTable('catalog_update_batches').set({ lifecycle: unresolvedCount === 0 ? 'READY' : 'RECONCILING', counts, lock_version: batch.lock_version + 1, updated_at: input.occurredAt }).where('tenant_id', '=', context.tenantId).where('batch_id', '=', batch.batch_id).execute();
      if (!await guardsCurrent(context, tx)) throw new CatalogAuthorizationChangedError(); return (await readVersion(db, context.tenantId, input.versionId, input.includeReferenceCost))!;
    });
  }
  async decideMany(context: CatalogMutationContext, input: Readonly<{ versionId: string; expectedBatchVersion: number; classifications: readonly BulkCatalogClassification[]; decision: Exclude<BulkCatalogDecision, 'UNRESOLVED'>; includeReferenceCost: boolean; occurredAt: Date }>) {
    return this.transaction(async (db, tx) => {
      const version = await db.selectFrom('catalog_supplier_catalog_versions').select('lifecycle').where('tenant_id', '=', context.tenantId).where('version_id', '=', input.versionId).executeTakeFirst();
      if (!version) throw new CatalogNotFoundError();
      if (version.lifecycle !== 'INGESTED') throw new CatalogConflictError();
      const batch = await db.selectFrom('catalog_update_batches').selectAll().where('tenant_id', '=', context.tenantId).where('version_id', '=', input.versionId).forUpdate().executeTakeFirstOrThrow();
      if (batch.lock_version !== input.expectedBatchVersion || batch.lifecycle === 'APPLIED') throw new CatalogConflictError();
      if (input.decision === 'APPLY' && input.classifications.some((value) => ['CANDIDATE', 'AMBIGUOUS', 'CONFLICT', 'INVALID'].includes(value))) throw new CatalogConflictError();
      await db.updateTable('catalog_update_row_decisions').set({ decision: input.decision, preselected_by_memory: false, lock_version: (eb) => eb('lock_version', '+', 1), updated_at: input.occurredAt }).where('tenant_id', '=', context.tenantId).where('batch_id', '=', batch.batch_id).where('classification', 'in', input.classifications).where('decision', '=', 'UNRESOLVED').execute();
      const unresolved = await db.selectFrom('catalog_update_row_decisions').select(({ fn }) => fn.countAll<string>().as('count')).where('tenant_id', '=', context.tenantId).where('batch_id', '=', batch.batch_id).where('decision', '=', 'UNRESOLVED').executeTakeFirstOrThrow();
      await db.updateTable('catalog_update_batches').set({ lifecycle: Number(unresolved.count) === 0 ? 'READY' : 'RECONCILING', lock_version: batch.lock_version + 1, updated_at: input.occurredAt }).where('tenant_id', '=', context.tenantId).where('batch_id', '=', batch.batch_id).execute();
      if (!await guardsCurrent(context, tx)) throw new CatalogAuthorizationChangedError();
      return (await readVersion(db, context.tenantId, input.versionId, input.includeReferenceCost))!;
    });
  }
  async publish(context: CatalogMutationContext, input: Readonly<{ versionId: string; expectedVersion: number; clientRequestId: string; requestSha256: string; currency: string; mayWriteCost: boolean; occurredAt: Date }>) {
    return this.transaction(async (db, tx) => {
      const version = await db.selectFrom('catalog_supplier_catalog_versions').selectAll().where('tenant_id', '=', context.tenantId).where('version_id', '=', input.versionId).forUpdate().executeTakeFirst(); if (!version) throw new CatalogNotFoundError(); const batch = await db.selectFrom('catalog_update_batches').selectAll().where('tenant_id', '=', context.tenantId).where('version_id', '=', input.versionId).forUpdate().executeTakeFirstOrThrow(); if (batch.lifecycle === 'APPLIED') { if (batch.publish_client_request_id !== input.clientRequestId || batch.publish_request_sha256 !== input.requestSha256) throw new CatalogConflictError(); return (await readVersion(db, context.tenantId, input.versionId, input.mayWriteCost))!; } if (version.lock_version !== input.expectedVersion || batch.lifecycle !== 'READY') throw new CatalogConflictError(); const rows = await db.selectFrom('catalog_update_row_decisions').selectAll().where('tenant_id', '=', context.tenantId).where('batch_id', '=', batch.batch_id).orderBy('row_number').forUpdate().execute(); if (rows.some((row) => row.decision === 'UNRESOLVED')) throw new CatalogConflictError();
      if (!await guardsCurrent(context, tx)) throw new CatalogAuthorizationChangedError();
      const priceRows = await db.selectFrom('catalog_base_price_revisions').select(['item_id', 'amount_minor']).where('tenant_id', '=', context.tenantId).orderBy('effective_from', 'desc').orderBy('revision_id', 'desc').execute();
      const costRows = await db.selectFrom('catalog_reference_cost_revisions').select(['item_id', 'amount_minor']).where('tenant_id', '=', context.tenantId).orderBy('effective_from', 'desc').orderBy('revision_id', 'desc').execute();
      const currentPrices = new Map<string, number>(); for (const value of priceRows) if (!currentPrices.has(value.item_id)) currentPrices.set(value.item_id, Number(value.amount_minor));
      const currentCosts = new Map<string, number>(); for (const value of costRows) if (!currentCosts.has(value.item_id)) currentCosts.set(value.item_id, Number(value.amount_minor));
      const newRows = rows.filter((row) => row.decision === 'APPLY' && !row.target_item_id).map((row) => row.proposal as BulkCatalogRowInput);
      const listingsById = new Map((await db.selectFrom('catalog_supplier_listings').selectAll().where('tenant_id', '=', context.tenantId).where('version_id', '=', version.version_id).execute()).map((listing) => [listing.listing_id, listing]));
      const targetItemIds = [...new Set(rows.map((row) => row.target_item_id).filter((value): value is string => Boolean(value)))];
      const targetItems = targetItemIds.length === 0 ? [] : await db.selectFrom('catalog_items').selectAll().where('tenant_id', '=', context.tenantId).where('item_id', 'in', targetItemIds).forUpdate().execute();
      const targetItemsById = new Map(targetItems.map((item) => [item.item_id, item]));
      const generatedSkus = new Map<CatalogItemKind, string[]>();
      for (const kind of ['PART', 'PRODUCT', 'SERVICE', 'SUPPLY'] as const) generatedSkus.set(kind, await allocateSkus(db, context.tenantId, kind, newRows.filter((row) => row.kind === kind && !row.sku).length));
      const generatedBarcodes = await allocateBarcodes(db, context.tenantId, newRows.filter((row) => !row.barcode).length);
      const itemWrites: Array<Insertable<DatabaseSchema['catalog_items']>> = [];
      const identifierWrites: Array<Insertable<DatabaseSchema['catalog_item_identifiers']>> = [];
      const priceWrites: Array<Insertable<DatabaseSchema['catalog_base_price_revisions']>> = [];
      const costWrites: Array<Insertable<DatabaseSchema['catalog_reference_cost_revisions']>> = [];
      const resolutionWrites: Array<Insertable<DatabaseSchema['catalog_supplier_listing_resolutions']>> = [];
      const memoryWrites = new Map<string, Insertable<DatabaseSchema['catalog_supplier_reconciliation_memory']>>();
      const existingMemoryRows = await db.selectFrom('catalog_supplier_reconciliation_memory').selectAll().where('tenant_id', '=', context.tenantId).where('source_id', '=', version.source_id).where('column_signature', '=', version.column_signature).forUpdate().execute();
      const existingMemory = new Map(existingMemoryRows.map((value) => [`${value.identifier_scheme}:${value.normalized_identifier}`, value]));
      const auditWrites: Array<Insertable<DatabaseSchema['catalog_audit_events']>> = [];
      const categoryReferences = new Map<string, { categoryId: string | null; pendingCategoryId: string | null }>();
      for (const value of await db.selectFrom('catalog_categories').select(['category_id', 'kind', 'normalized_name']).where('tenant_id', '=', context.tenantId).where('status', '=', 'ACTIVE').where('merged_into_id', 'is', null).execute()) categoryReferences.set(`${value.kind}:${value.normalized_name}`, { categoryId: value.category_id, pendingCategoryId: null });
      for (const value of await db.selectFrom('catalog_category_pending_values').select(['pending_category_value_id', 'kind', 'normalized_key']).where('tenant_id', '=', context.tenantId).where('resolution_status', '=', 'PENDING').execute()) if (!categoryReferences.has(`${value.kind}:${value.normalized_key}`)) categoryReferences.set(`${value.kind}:${value.normalized_key}`, { categoryId: null, pendingCategoryId: value.pending_category_value_id });
      const brandReferences = new Map<string, { brandId: string | null; pendingBrandId: string | null }>();
      for (const value of await db.selectFrom('catalog_brands').select(['brand_id', 'normalized_name']).where('tenant_id', '=', context.tenantId).where('status', '=', 'ACTIVE').where('merged_into_id', 'is', null).execute()) brandReferences.set(value.normalized_name, { brandId: value.brand_id, pendingBrandId: null });
      for (const value of await db.selectFrom('catalog_brand_pending_values').select(['pending_brand_value_id', 'normalized_key']).where('tenant_id', '=', context.tenantId).where('resolution_status', '=', 'PENDING').execute()) if (!brandReferences.has(value.normalized_key)) brandReferences.set(value.normalized_key, { brandId: null, pendingBrandId: value.pending_brand_value_id });
      const pendingBrandKindApplicability = new Set((await db.selectFrom('catalog_brand_pending_kind_applicability').select(['pending_brand_value_id', 'kind']).where('tenant_id', '=', context.tenantId).execute()).map((value) => `${value.pending_brand_value_id}:${value.kind}`));
      const resolveCategory = async (kind: CatalogItemKind, label: string) => { const normalized = normalizeReference(label)!; const key = `${kind}:${normalized}`; const existing = categoryReferences.get(key); if (existing) return existing; const pendingCategoryId = randomUUID(); await db.insertInto('catalog_category_pending_values').values({ tenant_id: context.tenantId, pending_category_value_id: pendingCategoryId, raw_label_example: label, normalized_key: normalized, kind, resolution_status: 'PENDING', canonical_category_id: null, version: 1, first_seen_at: input.occurredAt, last_seen_at: input.occurredAt, captured_by_actor_id: context.actorUserId, captured_by_actor_display_name: context.actorDisplayName, captured_in_branch_id: context.branchId, captured_in_station_id: context.stationId, captured_in_session_id: context.sessionId, resolved_by_actor_id: null, resolved_at: null }).execute(); const resolved = { categoryId: null, pendingCategoryId }; categoryReferences.set(key, resolved); return resolved; };
      const resolveBrand = async (kind: CatalogItemKind, label: string) => { const normalized = normalizeReference(label)!; const existing = brandReferences.get(normalized); if (existing) { const applicabilityKey = `${existing.pendingBrandId}:${kind}`; if (existing.pendingBrandId && !pendingBrandKindApplicability.has(applicabilityKey)) { await db.insertInto('catalog_brand_pending_kind_applicability').values({ tenant_id: context.tenantId, pending_brand_value_id: existing.pendingBrandId, kind }).execute(); pendingBrandKindApplicability.add(applicabilityKey); } return existing; } const pendingBrandId = randomUUID(); await db.insertInto('catalog_brand_pending_values').values({ tenant_id: context.tenantId, pending_brand_value_id: pendingBrandId, raw_label_example: label, normalized_key: normalized, resolution_status: 'PENDING', canonical_brand_id: null, version: 1, first_seen_at: input.occurredAt, last_seen_at: input.occurredAt, captured_by_actor_id: context.actorUserId, captured_by_actor_display_name: context.actorDisplayName, captured_in_branch_id: context.branchId, captured_in_station_id: context.stationId, captured_in_session_id: context.sessionId, resolved_by_actor_id: null, resolved_at: null }).execute(); await db.insertInto('catalog_brand_pending_kind_applicability').values({ tenant_id: context.tenantId, pending_brand_value_id: pendingBrandId, kind }).execute(); pendingBrandKindApplicability.add(`${pendingBrandId}:${kind}`); const resolved = { brandId: null, pendingBrandId }; brandReferences.set(normalized, resolved); return resolved; };
      for (const row of rows) {
        const p = row.proposal as BulkCatalogRowInput;
        const listing = listingsById.get(row.listing_id); if (!listing) throw new CatalogConflictError();
        if (row.decision === 'EXCLUDE') { resolutionWrites.push({ tenant_id: context.tenantId, resolution_id: randomUUID(), source_id: version.source_id, version_id: version.version_id, listing_id: listing.listing_id, batch_id: batch.batch_id, item_id: null, resolution: 'EXCLUDED', identifier_scheme: null, normalized_identifier: null, column_signature: version.column_signature, actor_user_id: context.actorUserId, correlation_id: randomUUID(), occurred_at: input.occurredAt }); continue; }
        let itemId = row.target_item_id; let itemVersion: number;
        if (itemId) {
          const item = targetItemsById.get(itemId); const expectedStatus = row.classification === 'REACTIVATE' ? 'INACTIVE' : 'ACTIVE'; if (!item || item.status !== expectedStatus || item.version !== row.expected_item_version || (p.kind && item.kind !== p.kind)) throw new CatalogConflictError();
          const titleDiffers = p.title !== null && p.title !== item.title;
          if (titleDiffers && row.title_decision === null) throw new CatalogConflictError();
          if (!titleDiffers && row.title_decision === 'ADOPT_OBSERVED') throw new CatalogConflictError();
          const adoptedTitle = titleDiffers && row.title_decision === 'ADOPT_OBSERVED' ? p.title : null;
          if (row.classification === 'UNCHANGED') itemVersion = item.version;
          else {
            itemVersion = item.version + 1;
            let categoryId = item.category_id; let pendingCategoryId = item.pending_category_value_id;
            if (p.category) {
              const resolved = await resolveCategory(p.kind ?? item.kind, p.category); categoryId = resolved.categoryId; pendingCategoryId = resolved.pendingCategoryId;
            }
            let brandId = item.brand_id; let pendingBrandId = item.pending_brand_value_id;
            if (p.brand) {
              const resolved = await resolveBrand(p.kind ?? item.kind, p.brand); brandId = resolved.brandId; pendingBrandId = resolved.pendingBrandId;
            }
            await db.updateTable('catalog_items').set({ ...(adoptedTitle ? { title: adoptedTitle, normalized_title: normalizeReference(adoptedTitle)! } : {}), ...(p.description !== null ? { description: p.description } : {}), category_id: categoryId, pending_category_value_id: pendingCategoryId, brand_id: brandId, pending_brand_value_id: pendingBrandId, ...(row.classification === 'REACTIVATE' ? { status: 'ACTIVE' as const } : {}), version: itemVersion, updated_at: input.occurredAt }).where('tenant_id', '=', context.tenantId).where('item_id', '=', itemId).execute();
          }
        }
        else {
          if (!p.kind || !p.title || !p.category) throw new CatalogConflictError(); itemId = randomUUID(); itemVersion = 1;
          const category = await resolveCategory(p.kind, p.category); const brand = p.brand ? await resolveBrand(p.kind, p.brand) : { brandId: null, pendingBrandId: null };
          const capabilities = catalogKindCapabilities[p.kind]; itemWrites.push({ tenant_id: context.tenantId, item_id: itemId, kind: p.kind, title: p.title, normalized_title: normalizeReference(p.title)!, description: p.description, category_id: category.categoryId, brand_id: brand.brandId, pending_category_value_id: category.pendingCategoryId, pending_brand_value_id: brand.pendingBrandId, status: 'ACTIVE', sellable: capabilities.sellable, stockable: capabilities.stockable, purchasable: capabilities.purchasable, applicable_to_repair: capabilities.applicableToRepair, version: 1, created_at: input.occurredAt, updated_at: input.occurredAt }); const sku = p.sku ?? generatedSkus.get(p.kind)!.shift(); const barcode = p.barcode ?? generatedBarcodes.shift(); if (!sku || !barcode) throw new CatalogConflictError(); identifierWrites.push({ tenant_id: context.tenantId, identifier_id: randomUUID(), item_id: itemId, scheme: 'SKU', normalized_value: normalizeIdentifier('SKU', sku)!, display_value: sku, created_at: input.occurredAt }, { tenant_id: context.tenantId, identifier_id: randomUUID(), item_id: itemId, scheme: 'BARCODE', normalized_value: normalizeIdentifier('BARCODE', barcode)!, display_value: barcode, created_at: input.occurredAt });
        }
        if (p.basePriceMinor !== null && p.basePriceMinor !== currentPrices.get(itemId)) priceWrites.push({ tenant_id: context.tenantId, revision_id: randomUUID(), item_id: itemId, amount_minor: String(p.basePriceMinor), currency: input.currency, item_version: itemVersion, reason: `Importación ${version.source_revision}`, actor_user_id: context.actorUserId, correlation_id: randomUUID(), effective_from: input.occurredAt }); if (p.referenceCostMinor !== null && p.referenceCostMinor !== currentCosts.get(itemId)) { if (!input.mayWriteCost) throw new CatalogAuthorizationChangedError(); costWrites.push({ tenant_id: context.tenantId, revision_id: randomUUID(), item_id: itemId, amount_minor: String(p.referenceCostMinor), currency: input.currency, source_type: 'IMPORTED', source_label: version.source_revision, observed_at: input.occurredAt, item_version: itemVersion, reason: 'Bulk Catalog Composer', actor_user_id: context.actorUserId, correlation_id: randomUUID(), effective_from: input.occurredAt }); }
        const itemKind = p.kind ?? targetItemsById.get(itemId)?.kind; if (!itemKind) throw new CatalogConflictError();
        for (const key of supplierMemoryKeys(p)) { const separator = key.indexOf(':'); const scheme = key.slice(0, separator) as 'SUPPLIER_CODE' | 'SIGNATURE'; const normalized = key.slice(separator + 1); const resolutionId = randomUUID(); const priorMemory = existingMemory.get(key); const corrected = priorMemory !== undefined && priorMemory.item_id !== itemId; const consistencyState = priorMemory?.consistency_state === 'CONFLICTED' || corrected ? 'CONFLICTED' as const : 'CONSISTENT' as const; const correctionCount = (priorMemory?.correction_count ?? 0) + (corrected ? 1 : 0); resolutionWrites.push({ tenant_id: context.tenantId, resolution_id: resolutionId, source_id: version.source_id, version_id: version.version_id, listing_id: listing.listing_id, batch_id: batch.batch_id, item_id: itemId, resolution: row.target_item_id ? 'MATCHED' : 'CREATED', identifier_scheme: scheme, normalized_identifier: normalized, column_signature: version.column_signature, actor_user_id: context.actorUserId, correlation_id: randomUUID(), occurred_at: input.occurredAt }); memoryWrites.set(key, { tenant_id: context.tenantId, source_id: version.source_id, identifier_scheme: scheme, normalized_identifier: normalized, column_signature: version.column_signature, item_id: itemId, item_kind: itemKind, last_resolution_id: resolutionId, first_confirmed_at: priorMemory?.first_confirmed_at ?? input.occurredAt, last_confirmed_at: input.occurredAt, consistency_state: consistencyState, correction_count: correctionCount, version: (priorMemory?.version ?? 0) + 1 }); }
        const priorItem = targetItemsById.get(itemId);
        auditWrites.push({ tenant_id: context.tenantId, audit_id: randomUUID(), branch_id: null, station_id: context.stationId, session_id: context.sessionId, actor_user_id: context.actorUserId, actor_display_name: context.actorDisplayName, capability: 'catalog.import.publish', action: 'catalog.bulk.publish.row', resource_id: itemId, old_version: row.expected_item_version, new_version: itemVersion, change_summary: { batchId: batch.batch_id, sourceId: version.source_id, supplierCatalogVersionId: version.version_id, supplierListingId: listing.listing_id, rowNumber: row.row_number, classification: row.classification, titleDecision: row.title_decision, ...(priorItem && row.title_decision === 'ADOPT_OBSERVED' && p.title && p.title !== priorItem.title ? { canonicalTitle: { before: priorItem.title, after: p.title } } : {}), ...(row.classification === 'REACTIVATE' ? { lifecycle: { before: 'INACTIVE', after: 'ACTIVE' } } : {}) }, result: 'SUCCEEDED', correlation_id: randomUUID(), client_request_id: input.clientRequestId, occurred_at: input.occurredAt });
      }
      for (let offset = 0; offset < itemWrites.length; offset += 500) await db.insertInto('catalog_items').values(itemWrites.slice(offset, offset + 500)).execute();
      for (let offset = 0; offset < identifierWrites.length; offset += 500) await db.insertInto('catalog_item_identifiers').values(identifierWrites.slice(offset, offset + 500)).execute();
      for (let offset = 0; offset < priceWrites.length; offset += 500) await db.insertInto('catalog_base_price_revisions').values(priceWrites.slice(offset, offset + 500)).execute();
      for (let offset = 0; offset < costWrites.length; offset += 500) await db.insertInto('catalog_reference_cost_revisions').values(costWrites.slice(offset, offset + 500)).execute();
      for (let offset = 0; offset < resolutionWrites.length; offset += 1_000) await db.insertInto('catalog_supplier_listing_resolutions').values(resolutionWrites.slice(offset, offset + 1_000)).execute();
      const memoriesToWrite = [...memoryWrites.values()];
      for (let offset = 0; offset < memoriesToWrite.length; offset += 1_000) await db.insertInto('catalog_supplier_reconciliation_memory').values(memoriesToWrite.slice(offset, offset + 1_000)).onConflict((conflict) => conflict.columns(['tenant_id', 'source_id', 'identifier_scheme', 'normalized_identifier', 'column_signature']).doUpdateSet((eb) => ({ item_id: eb.ref('excluded.item_id'), last_resolution_id: eb.ref('excluded.last_resolution_id'), last_confirmed_at: eb.ref('excluded.last_confirmed_at'), consistency_state: eb.ref('excluded.consistency_state'), correction_count: eb.ref('excluded.correction_count'), version: eb.ref('excluded.version') }))).execute();
      for (let offset = 0; offset < auditWrites.length; offset += 500) await db.insertInto('catalog_audit_events').values(auditWrites.slice(offset, offset + 500)).execute();
      await db.updateTable('catalog_update_batches').set({ lifecycle: 'APPLIED', publish_client_request_id: input.clientRequestId, publish_request_sha256: input.requestSha256, published_at: input.occurredAt, published_by_actor_id: context.actorUserId, lock_version: batch.lock_version + 1, updated_at: input.occurredAt }).where('tenant_id', '=', context.tenantId).where('batch_id', '=', batch.batch_id).execute(); return (await readVersion(db, context.tenantId, input.versionId, input.mayWriteCost))!;
    });
  }
  compare(scope: CatalogScope, leftVersionId: string, rightVersionId: string): Promise<SupplierVersionComparison> { return this.execute(async (db) => {
    const versions = await db.selectFrom('catalog_supplier_catalog_versions')
      .select(['version_id', 'source_id', 'sequence_number', 'completeness'])
      .where('tenant_id', '=', scope.tenantId).where('version_id', 'in', [leftVersionId, rightVersionId]).execute();
    const leftVersion = versions.find((value) => value.version_id === leftVersionId);
    const rightVersion = versions.find((value) => value.version_id === rightVersionId);
    if (!leftVersion || !rightVersion || leftVersion.source_id !== rightVersion.source_id || leftVersion.sequence_number >= rightVersion.sequence_number) throw new CatalogConflictError();
    const rows = async (id: string) => db.selectFrom('catalog_supplier_listings').select(['normalized_supplier_item_code', 'normalized_signature', 'source_observation']).where('tenant_id', '=', scope.tenantId).where('version_id', '=', id).execute();
    const [left, right] = await Promise.all([rows(leftVersionId), rows(rightVersionId)]);
    const key = (r: { normalized_supplier_item_code: string | null; normalized_signature: string }) => r.normalized_supplier_item_code ? `C:${r.normalized_supplier_item_code}` : `S:${r.normalized_signature}`;
    const lm = new Map(left.map((r) => [key(r), r])); const rm = new Map(right.map((r) => [key(r), r])); let mapped = 0, changed = 0, added = 0, ambiguous = 0;
    const count = (values: readonly { normalized_supplier_item_code: string | null; normalized_signature: string }[]) => { const m = new Map<string, number>(); for (const r of values) m.set(key(r), (m.get(key(r)) ?? 0) + 1); return m; };
    const lc = count(left), rc = count(right);
    for (const [k, r] of rm) { if ((lc.get(k) ?? 0) > 1 || (rc.get(k) ?? 0) > 1) { ambiguous++; continue; } const l = lm.get(k); if (!l) added++; else { mapped++; if (sha256(l.source_observation) !== sha256(r.source_observation)) changed++; } }
    const absenceStatus = rightVersion.completeness === 'PARTIAL' ? 'PARTIAL_CURRENT' as const : leftVersion.completeness !== 'COMPLETE' ? 'NO_PREVIOUS_COMPLETE' as const : 'EVALUATED' as const;
    const notObserved = absenceStatus === 'EVALUATED' ? [...lm.keys()].filter((keyValue) => !rm.has(keyValue)).length : null;
    return Object.freeze({ leftVersionId, rightVersionId, mapped, changed, added, ambiguous, absenceStatus, notObserved });
  }); }
  purgeExpiredRaw(context: CatalogMutationContext, now: Date) { return this.transaction(async (db, tx) => {
    const expired = await db.selectFrom('catalog_supplier_version_raw_payloads').select('version_id').where('tenant_id', '=', context.tenantId).where('retained_until', '<=', now).where('payload_text', 'is not', null).orderBy('retained_until').orderBy('version_id').forUpdate().skipLocked().limit(1000).execute();
    if (expired.length > 0) await db.updateTable('catalog_supplier_version_raw_payloads').set({ payload_text: null, purged_at: now }).where('tenant_id', '=', context.tenantId).where('version_id', 'in', expired.map(({ version_id }) => version_id)).execute();
    if (!await guardsCurrent(context, tx)) throw new CatalogAuthorizationChangedError();
    return expired.length;
  }); }
  async deleteSource(context: CatalogMutationContext, input: Readonly<{ sourceId: string; expectedVersion: number; clientRequestId: string; requestSha256: string; reauthenticatedAt: Date; occurredAt: Date }>): Promise<SupplierSourceDeletionRecord> {
    return this.aggregateTransaction(async (db, tx) => {
      const readReplay = async () => db.selectFrom('catalog_supplier_source_deletion_events')
        .select(['source_id', 'source_name', 'deleted_version_count', 'deleted_listing_count', 'request_sha256', 'occurred_at'])
        .where('tenant_id', '=', context.tenantId)
        .where('client_request_id', '=', input.clientRequestId)
        .executeTakeFirst();
      const replay = await readReplay();
      if (replay) {
        if (replay.source_id !== input.sourceId || replay.request_sha256 !== input.requestSha256) throw new CatalogConflictError();
        return Object.freeze({ sourceId: replay.source_id, sourceName: replay.source_name, deletedVersionCount: replay.deleted_version_count, deletedListingCount: replay.deleted_listing_count, deletedAt: replay.occurred_at.toISOString() });
      }

      const source = await db.selectFrom('catalog_supplier_sources').selectAll()
        .where('tenant_id', '=', context.tenantId).where('source_id', '=', input.sourceId).forUpdate().executeTakeFirst();
      if (!source) {
        const concurrentReplay = await readReplay();
        if (concurrentReplay && concurrentReplay.source_id === input.sourceId && concurrentReplay.request_sha256 === input.requestSha256) {
          return Object.freeze({ sourceId: concurrentReplay.source_id, sourceName: concurrentReplay.source_name, deletedVersionCount: concurrentReplay.deleted_version_count, deletedListingCount: concurrentReplay.deleted_listing_count, deletedAt: concurrentReplay.occurred_at.toISOString() });
        }
        throw new CatalogNotFoundError();
      }
      if (source.version !== input.expectedVersion) throw new CatalogSupplierDeleteNotAllowedError('SOURCE_CHANGED');

      const versions = await db.selectFrom('catalog_supplier_catalog_versions').select(['version_id', 'lifecycle'])
        .where('tenant_id', '=', context.tenantId).where('source_id', '=', input.sourceId).forUpdate().execute();
      if (versions.some(({ lifecycle }) => lifecycle === 'INGESTED')) throw new CatalogSupplierDeleteNotAllowedError('PUBLISHED_HISTORY');
      const versionIds = versions.map(({ version_id }) => version_id);
      const batches = versionIds.length === 0 ? [] : await db.selectFrom('catalog_update_batches').select('batch_id')
        .where('tenant_id', '=', context.tenantId).where('version_id', 'in', versionIds).forUpdate().execute();
      const batchIds = batches.map(({ batch_id }) => batch_id);
      const [resolution, memory, retirementPlan, retirementEvent] = await Promise.all([
        db.selectFrom('catalog_supplier_listing_resolutions').select('resolution_id').where('tenant_id', '=', context.tenantId).where('source_id', '=', input.sourceId).limit(1).executeTakeFirst(),
        db.selectFrom('catalog_supplier_reconciliation_memory').select('source_id').where('tenant_id', '=', context.tenantId).where('source_id', '=', input.sourceId).limit(1).executeTakeFirst(),
        batchIds.length === 0 ? Promise.resolve(undefined) : db.selectFrom('catalog_retirement_plans').select('plan_id').where('tenant_id', '=', context.tenantId).where('batch_id', 'in', batchIds).limit(1).executeTakeFirst(),
        batchIds.length === 0 ? Promise.resolve(undefined) : db.selectFrom('catalog_retirement_events').select('event_id').where('tenant_id', '=', context.tenantId).where('batch_id', 'in', batchIds).limit(1).executeTakeFirst(),
      ]);
      if (resolution || memory || retirementPlan || retirementEvent) throw new CatalogSupplierDeleteNotAllowedError('DEPENDENT_HISTORY');

      const listings = versionIds.length === 0 ? [] : await db.selectFrom('catalog_supplier_listings').select('listing_id')
        .where('tenant_id', '=', context.tenantId).where('version_id', 'in', versionIds).execute();
      if (!await guardsCurrent(context, tx)) throw new CatalogAuthorizationChangedError();
      if (batchIds.length > 0) await db.deleteFrom('catalog_update_row_decisions').where('tenant_id', '=', context.tenantId).where('batch_id', 'in', batchIds).execute();
      if (versionIds.length > 0) {
        await db.deleteFrom('catalog_supplier_listings').where('tenant_id', '=', context.tenantId).where('version_id', 'in', versionIds).execute();
        await db.deleteFrom('catalog_update_batches').where('tenant_id', '=', context.tenantId).where('version_id', 'in', versionIds).execute();
        await db.deleteFrom('catalog_supplier_version_raw_payloads').where('tenant_id', '=', context.tenantId).where('version_id', 'in', versionIds).execute();
        await db.deleteFrom('catalog_supplier_catalog_versions').where('tenant_id', '=', context.tenantId).where('version_id', 'in', versionIds).execute();
      }
      await db.deleteFrom('catalog_supplier_sources').where('tenant_id', '=', context.tenantId).where('source_id', '=', input.sourceId).execute();
      await db.insertInto('catalog_supplier_source_deletion_events').values({
        tenant_id: context.tenantId,
        deletion_id: randomUUID(),
        source_id: source.source_id,
        source_name: source.display_name,
        normalized_name: source.normalized_name,
        source_version: source.version,
        deleted_version_count: versions.length,
        deleted_listing_count: listings.length,
        station_id: context.stationId,
        session_id: context.sessionId,
        actor_user_id: context.actorUserId,
        actor_display_name: context.actorDisplayName,
        capability: 'catalog.suppliers.delete',
        sensitivity_level: 2,
        reauthenticated_at: input.reauthenticatedAt,
        client_request_id: input.clientRequestId,
        request_sha256: input.requestSha256,
        correlation_id: randomUUID(),
        occurred_at: input.occurredAt,
      }).execute();
      return Object.freeze({ sourceId: source.source_id, sourceName: source.display_name, deletedVersionCount: versions.length, deletedListingCount: listings.length, deletedAt: input.occurredAt.toISOString() });
    });
  }
}

export function createKyselyBulkCatalogRepository(connection: InternalDatabasePersistenceConnection): BulkCatalogRepositoryPort { return new KyselyBulkCatalogRepository(connection); }
