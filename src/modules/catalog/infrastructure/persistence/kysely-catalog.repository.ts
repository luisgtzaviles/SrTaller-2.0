import { createHash, randomUUID } from 'node:crypto';
import type { Kysely } from 'kysely';

import type { DatabaseConnection } from '../../../../infrastructure/database/database-connection.js';
import {
  useDatabasePersistenceExecutor,
  useTransactionalDatabasePersistenceExecutor,
} from '../../../../infrastructure/database/database-persistence-capability.js';
import type { InternalDatabasePersistenceConnection } from '../../../../infrastructure/database/database-persistence-capability.js';
import { runInTransaction } from '../../../../infrastructure/database/transaction-runner.js';
import type { DatabaseSchema } from '../../../../infrastructure/database/database-types.js';
import { parseTenantId } from '../../../tenancy/index.js';
import {
  CatalogAuthorizationChangedError,
  CatalogConflictError,
  CatalogInputError,
  CatalogNotFoundError,
  CatalogUnavailableError,
  catalogKindCapabilities,
  catalogKindSkuPrefix,
} from '../../domain/catalog-item.js';
import type { CatalogItemKind } from '../../domain/catalog-item.js';
import type {
  CatalogBrandRecord,
  CatalogCategoryRecord,
  CatalogPendingBrandRecord,
  CatalogPendingCategoryRecord,
  CatalogItemRecord,
  CatalogMutationContext,
  CatalogPriceListItem,
  CatalogRepositoryPort,
  CatalogScope,
  ChangeCatalogCostInput,
  ChangeCatalogMoneyInput,
  ChangeCatalogOverrideInput,
  CreateCatalogItemInput,
  CreateCatalogReferenceInput,
  ResolveCatalogReferenceInput,
  UpdateCatalogReferenceInput,
  UpdateCatalogItemInput,
} from '../../application/ports/catalog-repository.port.js';

type CatalogTables = 'catalog_categories' | 'catalog_brands' | 'catalog_category_pending_values' | 'catalog_brand_pending_values' | 'catalog_brand_pending_kind_applicability' | 'catalog_items' |
  'catalog_item_identifiers' | 'catalog_sku_sequences' | 'catalog_barcode_sequences' |
  'catalog_category_kind_applicability' | 'catalog_brand_kind_applicability' | 'catalog_base_price_revisions' |
  'catalog_branch_price_revisions' | 'catalog_reference_cost_revisions' |
  'catalog_commands' | 'catalog_audit_events';
type CatalogExecutor = Kysely<Pick<DatabaseSchema, CatalogTables>>;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

function validateScope(scope: CatalogScope): CatalogScope {
  try {
    const tenantId = parseTenantId(scope?.tenantId);
    if (typeof scope?.branchId !== 'string' || !uuid.test(scope.branchId)) throw new Error();
    return Object.freeze({ tenantId, branchId: scope.branchId });
  } catch { throw new CatalogInputError('scope'); }
}

function driverCode(error: unknown): string {
  return typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string' ? error.code : '';
}

function translate(error: unknown): Error {
  if (error instanceof CatalogInputError || error instanceof CatalogNotFoundError || error instanceof CatalogConflictError || error instanceof CatalogAuthorizationChangedError) return error;
  const code = driverCode(error);
  if (code === '23505' || code === '23503' || code === '23514') return new CatalogConflictError();
  if (code === 'DATABASE_TRANSACTION_SERIALIZATION_FAILURE' || code === 'DATABASE_TRANSACTION_DEADLOCK') return new CatalogConflictError();
  if (code === '22P02' || code === '22001' || code === '23502') return new CatalogInputError('persistence');
  return new CatalogUnavailableError();
}

function fingerprint(value: unknown): Uint8Array {
  return createHash('sha256').update(JSON.stringify(value)).digest();
}

function sameFingerprint(left: Uint8Array, right: Uint8Array): boolean {
  return Buffer.from(left).equals(Buffer.from(right));
}

type ItemProjection = Readonly<{
  item_id: string; kind: CatalogItemKind; title: string; description: string | null;
  status: 'ACTIVE' | 'INACTIVE'; sellable: boolean; stockable: boolean; purchasable: boolean;
  applicable_to_repair: boolean; version: number; created_at: Date; updated_at: Date;
  category_id: string | null; category_name: string | null; pending_category_value_id: string | null; pending_category_label: string | null;
  brand_id: string | null; brand_name: string | null; pending_brand_value_id: string | null; pending_brand_label: string | null;
}>;

async function loadIdentifiers(executor: CatalogExecutor, tenantId: string, itemIds: readonly string[]) {
  if (itemIds.length === 0) return new Map<string, CatalogItemRecord['identifiers']>();
  const rows = await executor.selectFrom('catalog_item_identifiers')
    .select(['item_id', 'identifier_id', 'scheme', 'display_value'])
    .where('tenant_id', '=', tenantId).where('item_id', 'in', itemIds)
    .orderBy('scheme').orderBy('display_value').execute();
  const result = new Map<string, CatalogItemRecord['identifiers']>();
  for (const itemId of itemIds) result.set(itemId, []);
  for (const row of rows) {
    const values = result.get(row.item_id) ?? [];
    result.set(row.item_id, [...values, Object.freeze({ identifierId: row.identifier_id, scheme: row.scheme, value: row.display_value })]);
  }
  return result;
}

function mapItem(row: ItemProjection, identifiers: CatalogItemRecord['identifiers']): CatalogItemRecord {
  return Object.freeze({
    itemId: row.item_id, kind: row.kind, title: row.title, description: row.description,
    category: Object.freeze({ categoryId: row.category_id, pendingCategoryValueId: row.pending_category_value_id, name: row.category_name ?? row.pending_category_label ?? 'Categoría pendiente', reconciliationStatus: row.category_id ? 'CANONICAL' as const : 'PENDING' as const }),
    brand: row.brand_id || row.pending_brand_value_id ? Object.freeze({ brandId: row.brand_id, pendingBrandValueId: row.pending_brand_value_id, name: row.brand_name ?? row.pending_brand_label ?? 'Marca pendiente', reconciliationStatus: row.brand_id ? 'CANONICAL' as const : 'PENDING' as const }) : null, status: row.status,
    capabilities: Object.freeze({ sellable: row.sellable, stockable: row.stockable, purchasable: row.purchasable, applicableToRepair: row.applicable_to_repair }),
    identifiers: Object.freeze([...identifiers]), version: row.version,
    createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString(),
  });
}

function itemQuery(executor: CatalogExecutor, tenantId: string) {
  return executor.selectFrom('catalog_items')
    .leftJoin('catalog_categories', (join) => join
      .onRef('catalog_categories.tenant_id', '=', 'catalog_items.tenant_id')
      .onRef('catalog_categories.category_id', '=', 'catalog_items.category_id'))
    .leftJoin('catalog_brands', (join) => join
      .onRef('catalog_brands.tenant_id', '=', 'catalog_items.tenant_id')
      .onRef('catalog_brands.brand_id', '=', 'catalog_items.brand_id'))
    .leftJoin('catalog_category_pending_values', (join) => join
      .onRef('catalog_category_pending_values.tenant_id', '=', 'catalog_items.tenant_id')
      .onRef('catalog_category_pending_values.pending_category_value_id', '=', 'catalog_items.pending_category_value_id'))
    .leftJoin('catalog_brand_pending_values', (join) => join
      .onRef('catalog_brand_pending_values.tenant_id', '=', 'catalog_items.tenant_id')
      .onRef('catalog_brand_pending_values.pending_brand_value_id', '=', 'catalog_items.pending_brand_value_id'))
    .select([
      'catalog_items.item_id', 'catalog_items.kind', 'catalog_items.title', 'catalog_items.description', 'catalog_items.status', 'catalog_items.sellable',
      'catalog_items.stockable', 'catalog_items.purchasable', 'catalog_items.applicable_to_repair', 'catalog_items.version', 'catalog_items.created_at', 'catalog_items.updated_at',
      'catalog_categories.category_id', 'catalog_categories.display_name as category_name',
      'catalog_items.pending_category_value_id', 'catalog_category_pending_values.raw_label_example as pending_category_label',
      'catalog_brands.brand_id', 'catalog_brands.display_name as brand_name',
      'catalog_items.pending_brand_value_id', 'catalog_brand_pending_values.raw_label_example as pending_brand_label',
    ]).where('catalog_items.tenant_id', '=', tenantId);
}

async function guardsCurrent(context: CatalogMutationContext, transactionContext: object): Promise<boolean> {
  for (const guard of context.commitGuards) {
    if (!await guard.confirmCurrent(transactionContext) || !await guard.confirmTemporalCurrent(transactionContext)) return false;
  }
  return true;
}

async function commandReplay<T>(executor: CatalogExecutor, context: CatalogMutationContext, operation: string, clientRequestId: string, requestFingerprint: Uint8Array): Promise<T | null> {
  const prior = await executor.selectFrom('catalog_commands').select(['request_fingerprint', 'result_payload'])
    .where('tenant_id', '=', context.tenantId).where('operation', '=', operation)
    .where('client_request_id', '=', clientRequestId).executeTakeFirst();
  if (!prior) return null;
  if (!sameFingerprint(prior.request_fingerprint, requestFingerprint)) throw new CatalogConflictError();
  return prior.result_payload as T;
}

async function recordCommand(
  executor: CatalogExecutor, context: CatalogMutationContext, input: Readonly<{ clientRequestId: string; correlationId: string; occurredAt: Date }>,
  operation: string, requestFingerprint: Uint8Array, resourceId: string, oldVersion: number | null, result: Readonly<{ version: number }>, summary: unknown,
): Promise<void> {
  await executor.insertInto('catalog_commands').values({
    tenant_id: context.tenantId, operation, client_request_id: input.clientRequestId,
    request_fingerprint: requestFingerprint, result_item_id: resourceId, result_version: result.version,
    result_payload: result, applied_at: input.occurredAt,
  }).execute();
  await executor.insertInto('catalog_audit_events').values({
    tenant_id: context.tenantId, audit_id: randomUUID(), branch_id: operation.includes('branch_override') ? context.branchId : null,
    station_id: context.stationId, session_id: context.sessionId, actor_user_id: context.actorUserId,
    actor_display_name: context.actorDisplayName, capability: context.capability, action: operation,
    resource_id: resourceId, old_version: oldVersion, new_version: result.version,
    change_summary: summary, result: 'SUCCEEDED', correlation_id: input.correlationId,
    client_request_id: input.clientRequestId, occurred_at: input.occurredAt,
  }).execute();
}

export class KyselyCatalogRepository implements CatalogRepositoryPort {
  constructor(private readonly connection: InternalDatabasePersistenceConnection) {}

  private execute<Result>(operation: (executor: CatalogExecutor) => Promise<Result>) {
    return useDatabasePersistenceExecutor(this.connection, 'catalog', operation);
  }

  private async transaction<Result>(operation: (executor: CatalogExecutor, context: object) => Promise<Result>): Promise<Result> {
    let sanitizedCallbackError: Error | null = null;
    try {
      return await runInTransaction(this.connection as unknown as DatabaseConnection, { isolationLevel: 'serializable' },
        (context) => useTransactionalDatabasePersistenceExecutor(context, 'catalog', async (executor) => {
          try {
            return await operation(executor, context);
          } catch (error: unknown) {
            sanitizedCallbackError = translate(error);
            throw sanitizedCallbackError;
          }
        }));
    } catch (error: unknown) {
      // The shared transaction boundary intentionally hides raw callback causes.
      // Preserve only Catalog's already-sanitized public errors across that
      // boundary; driver details and arbitrary exceptions remain unavailable.
      if (sanitizedCallbackError) throw sanitizedCallbackError;
      throw translate(error);
    }
  }

  async listReferences(scopeValue: CatalogScope) {
    const scope = validateScope(scopeValue);
    try {
      return await this.execute(async (executor) => {
        const [categories, brands, pendingCategories, pendingBrands, categoryKinds, brandKinds, pendingBrandKinds, usages, pendingCategoryUsages, pendingBrandUsages, creationEvents, categoryBrandApplicability] = await Promise.all([
          executor.selectFrom('catalog_categories').selectAll().where('tenant_id', '=', scope.tenantId).orderBy('normalized_name').orderBy('category_id').execute(),
          executor.selectFrom('catalog_brands').selectAll().where('tenant_id', '=', scope.tenantId).orderBy('normalized_name').orderBy('brand_id').execute(),
          executor.selectFrom('catalog_category_pending_values').leftJoin('catalog_categories', (join) => join.onRef('catalog_categories.tenant_id', '=', 'catalog_category_pending_values.tenant_id').onRef('catalog_categories.category_id', '=', 'catalog_category_pending_values.canonical_category_id')).selectAll('catalog_category_pending_values').select('catalog_categories.display_name as canonical_name').where('catalog_category_pending_values.tenant_id', '=', scope.tenantId).where('catalog_category_pending_values.resolution_status', '=', 'PENDING').orderBy('catalog_category_pending_values.last_seen_at', 'desc').execute(),
          executor.selectFrom('catalog_brand_pending_values').leftJoin('catalog_brands', (join) => join.onRef('catalog_brands.tenant_id', '=', 'catalog_brand_pending_values.tenant_id').onRef('catalog_brands.brand_id', '=', 'catalog_brand_pending_values.canonical_brand_id')).selectAll('catalog_brand_pending_values').select('catalog_brands.display_name as canonical_name').where('catalog_brand_pending_values.tenant_id', '=', scope.tenantId).where('catalog_brand_pending_values.resolution_status', '=', 'PENDING').orderBy('catalog_brand_pending_values.last_seen_at', 'desc').execute(),
          executor.selectFrom('catalog_category_kind_applicability').select(['category_id', 'kind']).where('tenant_id', '=', scope.tenantId).orderBy('kind').execute(),
          executor.selectFrom('catalog_brand_kind_applicability').select(['brand_id', 'kind']).where('tenant_id', '=', scope.tenantId).orderBy('kind').execute(),
          executor.selectFrom('catalog_brand_pending_kind_applicability').select(['pending_brand_value_id', 'kind']).where('tenant_id', '=', scope.tenantId).orderBy('kind').execute(),
          executor.selectFrom('catalog_items').select(['category_id', 'brand_id']).select(({ fn }) => fn.countAll<string>().as('count')).where('tenant_id', '=', scope.tenantId).groupBy(['category_id', 'brand_id']).execute(),
          executor.selectFrom('catalog_items').select('pending_category_value_id').select(({ fn }) => fn.countAll<string>().as('count')).where('tenant_id', '=', scope.tenantId).where('pending_category_value_id', 'is not', null).groupBy('pending_category_value_id').execute(),
          executor.selectFrom('catalog_items').select('pending_brand_value_id').select(({ fn }) => fn.countAll<string>().as('count')).where('tenant_id', '=', scope.tenantId).where('pending_brand_value_id', 'is not', null).groupBy('pending_brand_value_id').execute(),
          executor.selectFrom('catalog_audit_events').select(['resource_id', 'actor_display_name', 'occurred_at']).where('tenant_id', '=', scope.tenantId).where('action', 'in', ['catalog.category.create', 'catalog.brand.create']).orderBy('occurred_at').execute(),
          executor.selectFrom('catalog_items').select(['category_id', 'brand_id', 'kind']).distinct().where('tenant_id', '=', scope.tenantId).where('status', '=', 'ACTIVE').where('sellable', '=', true).where('category_id', 'is not', null).where('brand_id', 'is not', null).orderBy('category_id').orderBy('brand_id').orderBy('kind').execute(),
        ]);
        const categoryKindMap = new Map<string, CatalogItemKind[]>();
        for (const row of categoryKinds) categoryKindMap.set(row.category_id, [...(categoryKindMap.get(row.category_id) ?? []), row.kind]);
        const brandKindMap = new Map<string, CatalogItemKind[]>();
        for (const row of brandKinds) brandKindMap.set(row.brand_id, [...(brandKindMap.get(row.brand_id) ?? []), row.kind]);
        const pendingBrandKindMap = new Map<string, CatalogItemKind[]>();
        for (const row of pendingBrandKinds) pendingBrandKindMap.set(row.pending_brand_value_id, [...(pendingBrandKindMap.get(row.pending_brand_value_id) ?? []), row.kind]);
        const categoryUsage = new Map<string, number>(); const brandUsage = new Map<string, number>();
        for (const row of usages) { if (row.category_id) categoryUsage.set(row.category_id, (categoryUsage.get(row.category_id) ?? 0) + Number(row.count)); if (row.brand_id) brandUsage.set(row.brand_id, (brandUsage.get(row.brand_id) ?? 0) + Number(row.count)); }
        const pendingCategoryUsage = new Map(pendingCategoryUsages.flatMap((row) => row.pending_category_value_id ? [[row.pending_category_value_id, Number(row.count)] as const] : []));
        const pendingBrandUsage = new Map(pendingBrandUsages.flatMap((row) => row.pending_brand_value_id ? [[row.pending_brand_value_id, Number(row.count)] as const] : []));
        const creators = new Map(creationEvents.map((row) => [row.resource_id, row.actor_display_name]));
        return Object.freeze({
          categories: Object.freeze(categories.map((row) => Object.freeze({ categoryId: row.category_id, name: row.display_name, status: row.status, applicableKinds: Object.freeze(categoryKindMap.get(row.category_id) ?? []), usageCount: categoryUsage.get(row.category_id) ?? 0, version: row.version, createdBy: creators.get(row.category_id) ?? null, createdAt: row.created_at.toISOString(), createdInBranchId: row.created_in_branch_id }))),
          brands: Object.freeze(brands.map((row) => Object.freeze({ brandId: row.brand_id, name: row.display_name, status: row.status, applicableKinds: Object.freeze(brandKindMap.get(row.brand_id) ?? []), usageCount: brandUsage.get(row.brand_id) ?? 0, version: row.version, createdBy: creators.get(row.brand_id) ?? null, createdAt: row.created_at.toISOString(), createdInBranchId: row.created_in_branch_id }))),
          pendingCategories: Object.freeze(pendingCategories.filter((row) => (pendingCategoryUsage.get(row.pending_category_value_id) ?? 0) > 0).map((row) => Object.freeze({ pendingCategoryValueId: row.pending_category_value_id, rawLabel: row.raw_label_example, normalizedKey: row.normalized_key, kind: row.kind, resolutionStatus: row.resolution_status, canonicalCategoryId: row.canonical_category_id, canonicalName: row.canonical_name, version: row.version, usageCount: pendingCategoryUsage.get(row.pending_category_value_id) ?? 0, firstSeenAt: row.first_seen_at.toISOString(), lastSeenAt: row.last_seen_at.toISOString(), capturedBy: row.captured_by_actor_display_name, capturedInBranchId: row.captured_in_branch_id }))),
          pendingBrands: Object.freeze(pendingBrands.filter((row) => (pendingBrandUsage.get(row.pending_brand_value_id) ?? 0) > 0).map((row) => Object.freeze({ pendingBrandValueId: row.pending_brand_value_id, rawLabel: row.raw_label_example, normalizedKey: row.normalized_key, applicableKinds: Object.freeze(pendingBrandKindMap.get(row.pending_brand_value_id) ?? []), resolutionStatus: row.resolution_status, canonicalBrandId: row.canonical_brand_id, canonicalName: row.canonical_name, version: row.version, usageCount: pendingBrandUsage.get(row.pending_brand_value_id) ?? 0, firstSeenAt: row.first_seen_at.toISOString(), lastSeenAt: row.last_seen_at.toISOString(), capturedBy: row.captured_by_actor_display_name, capturedInBranchId: row.captured_in_branch_id }))),
          categoryBrandApplicability: Object.freeze(categoryBrandApplicability.flatMap((row) => row.category_id && row.brand_id ? [Object.freeze({ categoryId: row.category_id, brandId: row.brand_id, kind: row.kind })] : [])),
        });
      });
    } catch (error: unknown) { throw translate(error); }
  }

  createCategory(context: CatalogMutationContext, input: CreateCatalogReferenceInput) {
    return this.createReference('category', context, input) as Promise<CatalogCategoryRecord>;
  }
  createBrand(context: CatalogMutationContext, input: CreateCatalogReferenceInput) {
    return this.createReference('brand', context, input) as Promise<CatalogBrandRecord>;
  }

  private async createReference(kind: 'category' | 'brand', context: CatalogMutationContext, input: CreateCatalogReferenceInput) {
    validateScope(context);
    const operation = `catalog.${kind}.create`;
    const fp = fingerprint({ name: input.name, applicableKinds: input.applicableKinds, expectedVersion: input.expectedVersion });
    return this.transaction(async (executor, tx) => {
      const replay = await commandReplay<CatalogCategoryRecord | CatalogBrandRecord>(executor, context, operation, input.clientRequestId, fp);
      if (replay) return Object.freeze(replay);
      if (!await guardsCurrent(context, tx)) throw new CatalogAuthorizationChangedError();
      const table = kind === 'category' ? 'catalog_categories' : 'catalog_brands';
      const idColumn = kind === 'category' ? 'category_id' : 'brand_id';
      await executor.insertInto(table).values({
        tenant_id: context.tenantId, [idColumn]: input.referenceId,
        display_name: input.name, normalized_name: input.normalizedName,
        status: 'ACTIVE',
        created_by_actor_id: context.actorUserId, created_in_branch_id: context.branchId,
        created_in_station_id: context.stationId, created_in_session_id: context.sessionId,
        version: 1, created_at: input.occurredAt, updated_at: input.occurredAt,
      } as never).execute();
      const applicabilityTable = kind === 'category' ? 'catalog_category_kind_applicability' : 'catalog_brand_kind_applicability';
      await executor.insertInto(applicabilityTable).values(input.applicableKinds.map((applicableKind) => ({
        tenant_id: context.tenantId, [idColumn]: input.referenceId, kind: applicableKind,
      })) as never).execute();
      const result = Object.freeze(kind === 'category'
        ? { categoryId: input.referenceId, name: input.name, status: 'ACTIVE' as const, applicableKinds: input.applicableKinds, usageCount: 0, version: 1, createdBy: context.actorDisplayName, createdAt: input.occurredAt.toISOString(), createdInBranchId: context.branchId }
        : { brandId: input.referenceId, name: input.name, status: 'ACTIVE' as const, applicableKinds: input.applicableKinds, usageCount: 0, version: 1, createdBy: context.actorDisplayName, createdAt: input.occurredAt.toISOString(), createdInBranchId: context.branchId });
      await recordCommand(executor, context, input, operation, fp, input.referenceId, null, result, { name: input.name, applicableKinds: input.applicableKinds });
      return result;
    });
  }

  updateCategory(context: CatalogMutationContext, input: UpdateCatalogReferenceInput) {
    return this.updateReference('category', context, input) as Promise<CatalogCategoryRecord>;
  }
  updateBrand(context: CatalogMutationContext, input: UpdateCatalogReferenceInput) {
    return this.updateReference('brand', context, input) as Promise<CatalogBrandRecord>;
  }

  private async updateReference(kind: 'category' | 'brand', context: CatalogMutationContext, input: UpdateCatalogReferenceInput) {
    validateScope(context);
    const operation = `catalog.${kind}.update`;
    const fp = fingerprint({ referenceId: input.referenceId, name: input.name, status: input.status, applicableKinds: input.applicableKinds, expectedVersion: input.expectedVersion });
    return this.transaction(async (executor, tx) => {
      const replay = await commandReplay<CatalogCategoryRecord | CatalogBrandRecord>(executor, context, operation, input.clientRequestId, fp);
      if (replay) return Object.freeze(replay);
      const table = kind === 'category' ? 'catalog_categories' : 'catalog_brands';
      const idColumn = kind === 'category' ? 'category_id' : 'brand_id';
      const current = await executor.selectFrom(table).selectAll().where('tenant_id', '=', context.tenantId).where(idColumn, '=', input.referenceId).forUpdate().executeTakeFirst() as unknown as { version: number; created_at: Date; created_in_branch_id: string | null } | undefined;
      if (!current) throw new CatalogNotFoundError();
      if (current.version !== input.expectedVersion) throw new CatalogConflictError();
      const incompatibleUsage = await executor.selectFrom('catalog_items').select('item_id').where('tenant_id', '=', context.tenantId)
        .where(kind === 'category' ? 'category_id' : 'brand_id', '=', input.referenceId).where('kind', 'not in', input.applicableKinds).executeTakeFirst();
      if (incompatibleUsage) throw new CatalogConflictError();
      if (!await guardsCurrent(context, tx)) throw new CatalogAuthorizationChangedError();
      const nextVersion = current.version + 1;
      await executor.updateTable(table).set({ display_name: input.name, normalized_name: input.normalizedName, status: input.status, version: nextVersion, updated_at: input.occurredAt } as never)
        .where('tenant_id', '=', context.tenantId).where(idColumn, '=', input.referenceId).execute();
      const applicabilityTable = kind === 'category' ? 'catalog_category_kind_applicability' : 'catalog_brand_kind_applicability';
      await executor.deleteFrom(applicabilityTable).where('tenant_id', '=', context.tenantId).where(idColumn, '=', input.referenceId).execute();
      await executor.insertInto(applicabilityTable).values(input.applicableKinds.map((applicableKind) => ({ tenant_id: context.tenantId, [idColumn]: input.referenceId, kind: applicableKind })) as never).execute();
      const result = Object.freeze(kind === 'category'
        ? { categoryId: input.referenceId, name: input.name, status: input.status, applicableKinds: input.applicableKinds, usageCount: 0, version: nextVersion, createdBy: null, createdAt: current.created_at.toISOString(), createdInBranchId: current.created_in_branch_id }
        : { brandId: input.referenceId, name: input.name, status: input.status, applicableKinds: input.applicableKinds, usageCount: 0, version: nextVersion, createdBy: null, createdAt: current.created_at.toISOString(), createdInBranchId: current.created_in_branch_id });
      await recordCommand(executor, context, input, operation, fp, input.referenceId, current.version, result, { name: input.name, status: input.status, applicableKinds: input.applicableKinds });
      return result;
    });
  }

  resolveCategory(context: CatalogMutationContext, input: ResolveCatalogReferenceInput) {
    return this.resolveReference('category', context, input) as Promise<CatalogPendingCategoryRecord>;
  }
  resolveBrand(context: CatalogMutationContext, input: ResolveCatalogReferenceInput) {
    return this.resolveReference('brand', context, input) as Promise<CatalogPendingBrandRecord>;
  }

  private async resolveReference(kind: 'category' | 'brand', context: CatalogMutationContext, input: ResolveCatalogReferenceInput) {
    validateScope(context);
    const createCanonical = input.newReferenceId !== null;
    const operation = `catalog.${kind}_pending.${createCanonical ? 'canonical_created' : 'resolved'}`;
    const fp = fingerprint({ pendingReferenceId: input.pendingReferenceId, targetId: input.targetId, newName: input.newName, applicableKinds: input.applicableKinds, expectedVersion: input.expectedVersion });
    return this.transaction(async (executor, tx) => {
      const replay = await commandReplay<CatalogPendingCategoryRecord | CatalogPendingBrandRecord>(executor, context, operation, input.clientRequestId, fp);
      if (replay) return Object.freeze(replay);
      const pendingTable = kind === 'category' ? 'catalog_category_pending_values' : 'catalog_brand_pending_values';
      const pendingIdColumn = kind === 'category' ? 'pending_category_value_id' : 'pending_brand_value_id';
      const canonicalTable = kind === 'category' ? 'catalog_categories' : 'catalog_brands';
      const canonicalIdColumn = kind === 'category' ? 'category_id' : 'brand_id';
      const canonicalPendingColumn = kind === 'category' ? 'canonical_category_id' : 'canonical_brand_id';
      const itemPendingColumn = kind === 'category' ? 'pending_category_value_id' : 'pending_brand_value_id';
      const itemCanonicalColumn = kind === 'category' ? 'category_id' : 'brand_id';
      const source = await executor.selectFrom(pendingTable).selectAll().where('tenant_id', '=', context.tenantId).where(pendingIdColumn, '=', input.pendingReferenceId).forUpdate().executeTakeFirst() as unknown as {
        raw_label_example: string; normalized_key: string; kind?: CatalogItemKind; resolution_status: 'PENDING' | 'RESOLVED'; canonical_category_id?: string | null; canonical_brand_id?: string | null;
        version: number; first_seen_at: Date; last_seen_at: Date; captured_by_actor_display_name: string; captured_in_branch_id: string;
      } | undefined;
      if (!source) throw new CatalogNotFoundError();
      if (source.version !== input.expectedVersion || source.resolution_status !== 'PENDING') throw new CatalogConflictError();
      const sourceKinds = kind === 'category' ? [source.kind!] : (await executor.selectFrom('catalog_brand_pending_kind_applicability').select('kind').where('tenant_id', '=', context.tenantId).where('pending_brand_value_id', '=', input.pendingReferenceId).orderBy('kind').execute()).map((row) => row.kind);
      let targetId = input.targetId;
      let targetName = input.newName;
      if (createCanonical) {
        if (!input.newReferenceId || !input.newName || !input.newNormalizedName || !input.applicableKinds) throw new CatalogConflictError();
        const suppliedKinds = new Set(input.applicableKinds);
        if (sourceKinds.some((value) => !suppliedKinds.has(value))) throw new CatalogConflictError();
        targetId = input.newReferenceId;
        await executor.insertInto(canonicalTable).values({ tenant_id: context.tenantId, [canonicalIdColumn]: targetId, display_name: input.newName, normalized_name: input.newNormalizedName, status: 'ACTIVE', created_by_actor_id: context.actorUserId, created_in_branch_id: context.branchId, created_in_station_id: context.stationId, created_in_session_id: context.sessionId, version: 1, created_at: input.occurredAt, updated_at: input.occurredAt } as never).execute();
        const applicabilityTable = kind === 'category' ? 'catalog_category_kind_applicability' : 'catalog_brand_kind_applicability';
        await executor.insertInto(applicabilityTable).values(input.applicableKinds.map((value) => ({ tenant_id: context.tenantId, [canonicalIdColumn]: targetId, kind: value })) as never).execute();
      } else {
        if (!targetId) throw new CatalogConflictError();
        const target = await executor.selectFrom(canonicalTable).select(['display_name', 'status']).where('tenant_id', '=', context.tenantId).where(canonicalIdColumn, '=', targetId).where('status', '=', 'ACTIVE').forUpdate().executeTakeFirst() as { display_name: string; status: 'ACTIVE' | 'INACTIVE' } | undefined;
        if (!target) throw new CatalogNotFoundError();
        targetName = target.display_name;
        const applicabilityTable = kind === 'category' ? 'catalog_category_kind_applicability' : 'catalog_brand_kind_applicability';
        const targetKinds = new Set((await executor.selectFrom(applicabilityTable).select('kind').where('tenant_id', '=', context.tenantId).where(canonicalIdColumn, '=', targetId).execute()).map((row) => row.kind));
        if (sourceKinds.some((value) => !targetKinds.has(value))) throw new CatalogConflictError();
      }
      if (!await guardsCurrent(context, tx)) throw new CatalogAuthorizationChangedError();
      const nextVersion = source.version + 1;
      const affected = await executor.updateTable('catalog_items').set((eb) => ({ [itemCanonicalColumn]: targetId, version: eb('version', '+', 1), updated_at: input.occurredAt } as never)).where('tenant_id', '=', context.tenantId).where(itemPendingColumn, '=', input.pendingReferenceId).executeTakeFirst();
      await executor.updateTable(pendingTable).set({ resolution_status: 'RESOLVED', [canonicalPendingColumn]: targetId, resolved_by_actor_id: context.actorUserId, resolved_at: input.occurredAt, version: nextVersion } as never).where('tenant_id', '=', context.tenantId).where(pendingIdColumn, '=', input.pendingReferenceId).execute();
      const result = Object.freeze(kind === 'category'
        ? { pendingCategoryValueId: input.pendingReferenceId, rawLabel: source.raw_label_example, normalizedKey: source.normalized_key, kind: sourceKinds[0]!, resolutionStatus: 'RESOLVED' as const, canonicalCategoryId: targetId!, canonicalName: targetName!, version: nextVersion, usageCount: Number(affected.numUpdatedRows), firstSeenAt: source.first_seen_at.toISOString(), lastSeenAt: source.last_seen_at.toISOString(), capturedBy: source.captured_by_actor_display_name, capturedInBranchId: source.captured_in_branch_id }
        : { pendingBrandValueId: input.pendingReferenceId, rawLabel: source.raw_label_example, normalizedKey: source.normalized_key, applicableKinds: Object.freeze(sourceKinds), resolutionStatus: 'RESOLVED' as const, canonicalBrandId: targetId!, canonicalName: targetName!, version: nextVersion, usageCount: Number(affected.numUpdatedRows), firstSeenAt: source.first_seen_at.toISOString(), lastSeenAt: source.last_seen_at.toISOString(), capturedBy: source.captured_by_actor_display_name, capturedInBranchId: source.captured_in_branch_id });
      await recordCommand(executor, context, input, operation, fp, input.pendingReferenceId, source.version, result, { targetId, canonicalCreated: createCanonical, applicableKinds: sourceKinds, affectedItemCount: Number(affected.numUpdatedRows) });
      return result;
    });
  }

  async createItem(context: CatalogMutationContext, input: CreateCatalogItemInput): Promise<CatalogItemRecord> {
    validateScope(context);
    const operation = 'catalog.item.create';
    const fp = fingerprint({ kind: input.kind, title: input.title, description: input.description, categoryId: input.categoryId, capturedCategory: input.capturedCategory && input.capturedCategory.rawLabel, brandId: input.brandId, capturedBrand: input.capturedBrand && input.capturedBrand.rawLabel, sku: input.sku, barcode: input.barcode, basePrice: input.basePrice.amountMinor, referenceCost: input.referenceCost && { amountMinor: input.referenceCost.amountMinor, sourceType: input.referenceCost.sourceType, sourceLabel: input.referenceCost.sourceLabel }, expectedVersion: input.expectedVersion });
    return this.transaction(async (executor, tx) => {
      const replay = await commandReplay<CatalogItemRecord>(executor, context, operation, input.clientRequestId, fp);
      if (replay) return Object.freeze(replay);
      let categoryId = input.categoryId;
      let pendingCategoryValueId: string | null = null;
      if (input.capturedCategory) {
        const existing = await executor.selectFrom('catalog_category_pending_values').select(['pending_category_value_id', 'canonical_category_id']).where('tenant_id', '=', context.tenantId).where('kind', '=', input.kind).where('normalized_key', '=', input.capturedCategory.normalizedKey).forUpdate().executeTakeFirst();
        if (existing) {
          pendingCategoryValueId = existing.pending_category_value_id; categoryId = existing.canonical_category_id;
          await executor.updateTable('catalog_category_pending_values').set({ last_seen_at: input.occurredAt }).where('tenant_id', '=', context.tenantId).where('pending_category_value_id', '=', pendingCategoryValueId).execute();
        } else {
          pendingCategoryValueId = input.capturedCategory.pendingReferenceId;
          await executor.insertInto('catalog_category_pending_values').values({ tenant_id: context.tenantId, pending_category_value_id: pendingCategoryValueId, raw_label_example: input.capturedCategory.rawLabel, normalized_key: input.capturedCategory.normalizedKey, kind: input.kind, resolution_status: 'PENDING', canonical_category_id: null, version: 1, first_seen_at: input.occurredAt, last_seen_at: input.occurredAt, captured_by_actor_id: context.actorUserId, captured_by_actor_display_name: context.actorDisplayName, captured_in_branch_id: context.branchId, captured_in_station_id: context.stationId, captured_in_session_id: context.sessionId, resolved_by_actor_id: null, resolved_at: null }).execute();
        }
      }
      let brandId = input.brandId;
      let pendingBrandValueId: string | null = null;
      if (input.capturedBrand) {
        const existing = await executor.selectFrom('catalog_brand_pending_values').select(['pending_brand_value_id', 'canonical_brand_id']).where('tenant_id', '=', context.tenantId).where('normalized_key', '=', input.capturedBrand.normalizedKey).forUpdate().executeTakeFirst();
        if (existing) {
          pendingBrandValueId = existing.pending_brand_value_id; brandId = existing.canonical_brand_id;
          await executor.updateTable('catalog_brand_pending_values').set({ last_seen_at: input.occurredAt }).where('tenant_id', '=', context.tenantId).where('pending_brand_value_id', '=', pendingBrandValueId).execute();
        } else {
          pendingBrandValueId = input.capturedBrand.pendingReferenceId;
          await executor.insertInto('catalog_brand_pending_values').values({ tenant_id: context.tenantId, pending_brand_value_id: pendingBrandValueId, raw_label_example: input.capturedBrand.rawLabel, normalized_key: input.capturedBrand.normalizedKey, resolution_status: 'PENDING', canonical_brand_id: null, version: 1, first_seen_at: input.occurredAt, last_seen_at: input.occurredAt, captured_by_actor_id: context.actorUserId, captured_by_actor_display_name: context.actorDisplayName, captured_in_branch_id: context.branchId, captured_in_station_id: context.stationId, captured_in_session_id: context.sessionId, resolved_by_actor_id: null, resolved_at: null }).execute();
        }
        await executor.insertInto('catalog_brand_pending_kind_applicability').values({ tenant_id: context.tenantId, pending_brand_value_id: pendingBrandValueId, kind: input.kind }).onConflict((conflict) => conflict.columns(['tenant_id', 'pending_brand_value_id', 'kind']).doNothing()).execute();
      }
      const categoryRecord = categoryId ? await executor.selectFrom('catalog_categories')
        .innerJoin('catalog_category_kind_applicability', (join) => join.onRef('catalog_category_kind_applicability.tenant_id', '=', 'catalog_categories.tenant_id').onRef('catalog_category_kind_applicability.category_id', '=', 'catalog_categories.category_id'))
        .select('catalog_categories.category_id').where('catalog_categories.tenant_id', '=', context.tenantId)
        .where('catalog_categories.category_id', '=', categoryId).where('catalog_categories.status', '=', 'ACTIVE')
        .where('catalog_category_kind_applicability.kind', '=', input.kind).forShare().executeTakeFirst() : pendingCategoryValueId ? { category_id: null } : null;
      const brandRecord = brandId ? await executor.selectFrom('catalog_brands')
        .innerJoin('catalog_brand_kind_applicability', (join) => join.onRef('catalog_brand_kind_applicability.tenant_id', '=', 'catalog_brands.tenant_id').onRef('catalog_brand_kind_applicability.brand_id', '=', 'catalog_brands.brand_id'))
        .select('catalog_brands.brand_id').where('catalog_brands.tenant_id', '=', context.tenantId)
        .where('catalog_brands.brand_id', '=', brandId).where('catalog_brands.status', '=', 'ACTIVE')
        .where('catalog_brand_kind_applicability.kind', '=', input.kind).forShare().executeTakeFirst() : { brand_id: null };
      if (!categoryRecord || !brandRecord) throw new CatalogNotFoundError();
      if (!await guardsCurrent(context, tx)) throw new CatalogAuthorizationChangedError();
      const capabilities = catalogKindCapabilities[input.kind];
      await executor.insertInto('catalog_items').values({
        tenant_id: context.tenantId, item_id: input.itemId, kind: input.kind, title: input.title,
        normalized_title: input.normalizedTitle, description: input.description, category_id: categoryId,
        brand_id: brandId, pending_category_value_id: pendingCategoryValueId, pending_brand_value_id: pendingBrandValueId, status: 'ACTIVE', sellable: capabilities.sellable,
        stockable: capabilities.stockable, purchasable: capabilities.purchasable,
        applicable_to_repair: capabilities.applicableToRepair, version: 1,
        created_at: input.occurredAt, updated_at: input.occurredAt,
      }).execute();
      const sku = input.sku ?? await this.allocateSku(executor, context.tenantId, input.kind);
      const barcode = input.barcode ?? await this.allocateBarcode(executor, context.tenantId);
      await executor.insertInto('catalog_item_identifiers').values([
        { tenant_id: context.tenantId, identifier_id: randomUUID(), item_id: input.itemId, scheme: 'SKU', normalized_value: sku, display_value: sku, created_at: input.occurredAt },
        { tenant_id: context.tenantId, identifier_id: randomUUID(), item_id: input.itemId, scheme: 'BARCODE', normalized_value: barcode, display_value: barcode, created_at: input.occurredAt },
      ]).execute();
      await executor.insertInto('catalog_base_price_revisions').values({
        tenant_id: context.tenantId, revision_id: input.basePrice.revisionId, item_id: input.itemId,
        amount_minor: String(input.basePrice.amountMinor), currency: input.currency, item_version: 1,
        reason: 'Initial price', actor_user_id: context.actorUserId, correlation_id: input.correlationId,
        effective_from: input.occurredAt,
      }).execute();
      if (input.referenceCost) await executor.insertInto('catalog_reference_cost_revisions').values({
        tenant_id: context.tenantId, revision_id: input.referenceCost.revisionId, item_id: input.itemId,
        amount_minor: String(input.referenceCost.amountMinor), currency: input.currency,
        source_type: input.referenceCost.sourceType, source_label: input.referenceCost.sourceLabel,
        observed_at: input.referenceCost.observedAt, item_version: 1, reason: 'Initial reference cost',
        actor_user_id: context.actorUserId, correlation_id: input.correlationId, effective_from: input.occurredAt,
      }).execute();
      const result = await this.loadItem(executor, context, input.itemId);
      if (!result) throw new CatalogNotFoundError();
      await recordCommand(executor, context, input, operation, fp, input.itemId, null, result, { kind: input.kind, skuGenerated: input.sku === null, barcodeGenerated: input.barcode === null, basePriceAmountMinor: input.basePrice.amountMinor, hasReferenceCost: input.referenceCost !== null, capturedCategory: input.capturedCategory?.rawLabel ?? null, capturedBrand: input.capturedBrand?.rawLabel ?? null });
      return result;
    });
  }

  private async allocateSku(executor: CatalogExecutor, tenantId: string, kind: CreateCatalogItemInput['kind']): Promise<string> {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const row = await executor.insertInto('catalog_sku_sequences')
        .values({ tenant_id: tenantId, kind, next_value: '2' })
        .onConflict((conflict) => conflict.columns(['tenant_id', 'kind']).doUpdateSet((eb) => ({ next_value: eb('catalog_sku_sequences.next_value', '+', '1') })))
        .returning('next_value').executeTakeFirstOrThrow();
      const candidate = `${catalogKindSkuPrefix[kind]}-${String(Number(row.next_value) - 1).padStart(6, '0')}`;
      const exists = await executor.selectFrom('catalog_item_identifiers').select('identifier_id')
        .where('tenant_id', '=', tenantId).where('scheme', '=', 'SKU').where('normalized_value', '=', candidate).executeTakeFirst();
      if (!exists) return candidate;
    }
    throw new CatalogConflictError();
  }

  private async allocateBarcode(executor: CatalogExecutor, tenantId: string): Promise<string> {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const row = await executor.insertInto('catalog_barcode_sequences')
        .values({ tenant_id: tenantId, next_value: '2' })
        .onConflict((conflict) => conflict.column('tenant_id').doUpdateSet((eb) => ({ next_value: eb('catalog_barcode_sequences.next_value', '+', '1') })))
        .returning('next_value').executeTakeFirstOrThrow();
      const candidate = `SR${String(Number(row.next_value) - 1).padStart(8, '0')}`;
      const exists = await executor.selectFrom('catalog_item_identifiers').select('identifier_id')
        .where('tenant_id', '=', tenantId).where('scheme', '=', 'BARCODE').where('normalized_value', '=', candidate).executeTakeFirst();
      if (!exists) return candidate;
    }
    throw new CatalogConflictError();
  }

  async updateItem(context: CatalogMutationContext, input: UpdateCatalogItemInput): Promise<CatalogItemRecord> {
    validateScope(context);
    const operation = 'catalog.item.update';
    const fp = fingerprint({ itemId: input.itemId, title: input.title, description: input.description, categoryId: input.categoryId, brandId: input.brandId, status: input.status, expectedVersion: input.expectedVersion });
    return this.mutateItem(context, input, operation, fp, async (executor, current, nextVersion) => {
      const categoryRecord = await executor.selectFrom('catalog_categories').innerJoin('catalog_category_kind_applicability', (join) => join.onRef('catalog_category_kind_applicability.tenant_id', '=', 'catalog_categories.tenant_id').onRef('catalog_category_kind_applicability.category_id', '=', 'catalog_categories.category_id')).select('catalog_categories.category_id').where('catalog_categories.tenant_id', '=', context.tenantId).where('catalog_categories.category_id', '=', input.categoryId).where('catalog_categories.status', '=', 'ACTIVE').where('catalog_category_kind_applicability.kind', '=', current.kind).executeTakeFirst();
      const brandRecord = input.brandId ? await executor.selectFrom('catalog_brands').innerJoin('catalog_brand_kind_applicability', (join) => join.onRef('catalog_brand_kind_applicability.tenant_id', '=', 'catalog_brands.tenant_id').onRef('catalog_brand_kind_applicability.brand_id', '=', 'catalog_brands.brand_id')).select('catalog_brands.brand_id').where('catalog_brands.tenant_id', '=', context.tenantId).where('catalog_brands.brand_id', '=', input.brandId).where('catalog_brands.status', '=', 'ACTIVE').where('catalog_brand_kind_applicability.kind', '=', current.kind).executeTakeFirst() : { brand_id: null };
      if (!categoryRecord || !brandRecord) throw new CatalogNotFoundError();
      await executor.updateTable('catalog_items').set({ title: input.title, normalized_title: input.normalizedTitle, description: input.description, category_id: input.categoryId, brand_id: input.brandId, status: input.status, version: nextVersion, updated_at: input.occurredAt }).where('tenant_id', '=', context.tenantId).where('item_id', '=', input.itemId).execute();
      return { title: input.title, status: input.status, categoryId: input.categoryId, brandId: input.brandId, previousStatus: current.status };
    });
  }

  changeBasePrice(context: CatalogMutationContext, input: ChangeCatalogMoneyInput): Promise<CatalogItemRecord> {
    const operation = 'catalog.base_price.change';
    const fp = fingerprint({ itemId: input.itemId, amountMinor: input.amountMinor, currency: input.currency, reason: input.reason, expectedVersion: input.expectedVersion });
    return this.mutateItem(context, input, operation, fp, async (executor, _current, nextVersion) => {
      await executor.insertInto('catalog_base_price_revisions').values({ tenant_id: context.tenantId, revision_id: input.revisionId, item_id: input.itemId, amount_minor: String(input.amountMinor), currency: input.currency, item_version: nextVersion, reason: input.reason, actor_user_id: context.actorUserId, correlation_id: input.correlationId, effective_from: input.occurredAt }).execute();
      await executor.updateTable('catalog_items').set({ version: nextVersion, updated_at: input.occurredAt }).where('tenant_id', '=', context.tenantId).where('item_id', '=', input.itemId).execute();
      return { amountMinor: input.amountMinor, currency: input.currency };
    });
  }

  changeReferenceCost(context: CatalogMutationContext, input: ChangeCatalogCostInput): Promise<CatalogItemRecord> {
    const operation = 'catalog.reference_cost.change';
    const fp = fingerprint({ itemId: input.itemId, amountMinor: input.amountMinor, currency: input.currency, sourceType: input.sourceType, sourceLabel: input.sourceLabel, reason: input.reason, expectedVersion: input.expectedVersion });
    return this.mutateItem(context, input, operation, fp, async (executor, _current, nextVersion) => {
      await executor.insertInto('catalog_reference_cost_revisions').values({ tenant_id: context.tenantId, revision_id: input.revisionId, item_id: input.itemId, amount_minor: String(input.amountMinor), currency: input.currency, source_type: input.sourceType, source_label: input.sourceLabel, observed_at: input.observedAt, item_version: nextVersion, reason: input.reason, actor_user_id: context.actorUserId, correlation_id: input.correlationId, effective_from: input.occurredAt }).execute();
      await executor.updateTable('catalog_items').set({ version: nextVersion, updated_at: input.occurredAt }).where('tenant_id', '=', context.tenantId).where('item_id', '=', input.itemId).execute();
      return { amountMinor: input.amountMinor, currency: input.currency, sourceType: input.sourceType };
    });
  }

  changeBranchOverride(context: CatalogMutationContext, input: ChangeCatalogOverrideInput): Promise<CatalogItemRecord> {
    const operation = input.revoke ? 'catalog.branch_override.revoke' : 'catalog.branch_override.set';
    const fp = fingerprint({ itemId: input.itemId, amountMinor: input.amountMinor, currency: input.currency, reason: input.reason, revoke: input.revoke, expectedVersion: input.expectedVersion });
    return this.mutateItem(context, input, operation, fp, async (executor, _current, nextVersion) => {
      if (input.revoke) {
        const currentOverride = await executor.selectFrom('catalog_branch_price_revisions').select('action').where('tenant_id', '=', context.tenantId).where('branch_id', '=', context.branchId).where('item_id', '=', input.itemId).orderBy('effective_from', 'desc').orderBy('revision_id', 'desc').executeTakeFirst();
        if (currentOverride?.action !== 'SET') throw new CatalogConflictError();
      }
      await executor.insertInto('catalog_branch_price_revisions').values({ tenant_id: context.tenantId, branch_id: context.branchId, revision_id: input.revisionId, item_id: input.itemId, action: input.revoke ? 'REVOKE' : 'SET', amount_minor: input.revoke ? null : String(input.amountMinor), currency: input.currency, item_version: nextVersion, reason: input.reason, actor_user_id: context.actorUserId, correlation_id: input.correlationId, effective_from: input.occurredAt }).execute();
      await executor.updateTable('catalog_items').set({ version: nextVersion, updated_at: input.occurredAt }).where('tenant_id', '=', context.tenantId).where('item_id', '=', input.itemId).execute();
      return { action: input.revoke ? 'REVOKE' : 'SET', amountMinor: input.revoke ? null : input.amountMinor, branchId: context.branchId };
    });
  }

  private async mutateItem(
    context: CatalogMutationContext,
    input: Readonly<{ itemId: string; expectedVersion: number; clientRequestId: string; correlationId: string; occurredAt: Date }>,
    operation: string,
    fp: Uint8Array,
    mutate: (executor: CatalogExecutor, current: Readonly<{ version: number; status: 'ACTIVE' | 'INACTIVE'; kind: CatalogItemKind }>, nextVersion: number) => Promise<unknown>,
  ): Promise<CatalogItemRecord> {
    validateScope(context);
    return this.transaction(async (executor, tx) => {
      const replay = await commandReplay<CatalogItemRecord>(executor, context, operation, input.clientRequestId, fp);
      if (replay) return Object.freeze(replay);
      const current = await executor.selectFrom('catalog_items').selectAll().where('tenant_id', '=', context.tenantId).where('item_id', '=', input.itemId).forUpdate().executeTakeFirst();
      if (!current) throw new CatalogNotFoundError();
      if (current.version !== input.expectedVersion) throw new CatalogConflictError();
      if (!await guardsCurrent(context, tx)) throw new CatalogAuthorizationChangedError();
      const nextVersion = current.version + 1;
      const summary = await mutate(executor, current, nextVersion);
      const result = await this.loadItem(executor, context, input.itemId);
      if (!result) throw new CatalogNotFoundError();
      await recordCommand(executor, context, input, operation, fp, input.itemId, current.version, result, summary);
      return result;
    });
  }

  async getItem(scopeValue: CatalogScope, itemId: string): Promise<CatalogItemRecord | null> {
    const scope = validateScope(scopeValue);
    try { return await this.execute((executor) => this.loadItem(executor, scope, itemId)); }
    catch (error: unknown) { throw translate(error); }
  }

  private async loadItem(executor: CatalogExecutor, scope: CatalogScope, itemId: string): Promise<CatalogItemRecord | null> {
    const row = await itemQuery(executor, scope.tenantId).where('catalog_items.item_id', '=', itemId).executeTakeFirst() as ItemProjection | undefined;
    if (!row) return null;
    const identifiers = await loadIdentifiers(executor, scope.tenantId, [itemId]);
    return mapItem(row, identifiers.get(itemId) ?? []);
  }

  async search(scopeValue: CatalogScope, input: Readonly<{ query: string; kind: CatalogItemKind | null; categoryId: string | null; brandId: string | null; page: number; pageSize: number; includeReferenceCost: boolean }>) {
    const scope = validateScope(scopeValue);
    try {
      return await this.execute(async (executor) => {
        const exact = input.query.toUpperCase();
        const tokens = input.query.split(' ').filter(Boolean);
        let query = itemQuery(executor, scope.tenantId).where('catalog_items.status', '=', 'ACTIVE').where('catalog_items.sellable', '=', true);
        let count = executor.selectFrom('catalog_items').select(({ fn }) => fn.countAll<string>().as('count')).where('catalog_items.tenant_id', '=', scope.tenantId).where('catalog_items.status', '=', 'ACTIVE').where('catalog_items.sellable', '=', true);
        if (input.kind) { query = query.where('catalog_items.kind', '=', input.kind); count = count.where('catalog_items.kind', '=', input.kind); }
        if (input.categoryId) { query = query.where('catalog_items.category_id', '=', input.categoryId); count = count.where('catalog_items.category_id', '=', input.categoryId); }
        if (input.brandId) { query = query.where('catalog_items.brand_id', '=', input.brandId); count = count.where('catalog_items.brand_id', '=', input.brandId); }
        let exactItemId: string | undefined;
        if (tokens.length > 0) {
          exactItemId = (await executor.selectFrom('catalog_item_identifiers').innerJoin('catalog_items', (join) => join.onRef('catalog_items.tenant_id', '=', 'catalog_item_identifiers.tenant_id').onRef('catalog_items.item_id', '=', 'catalog_item_identifiers.item_id')).select('catalog_item_identifiers.item_id').where('catalog_item_identifiers.tenant_id', '=', scope.tenantId).where('catalog_item_identifiers.normalized_value', '=', exact).where('catalog_items.status', '=', 'ACTIVE').where('catalog_items.sellable', '=', true).executeTakeFirst())?.item_id;
          if (exactItemId) {
            query = query.where('catalog_items.item_id', '=', exactItemId); count = count.where('catalog_items.item_id', '=', exactItemId);
          } else {
            query = query.where((eb) => eb.and(tokens.map((token) => eb('catalog_items.normalized_title', 'like', `%${token}%`))));
            count = count.where((eb) => eb.and(tokens.map((token) => eb('catalog_items.normalized_title', 'like', `%${token}%`))));
          }
        }
        const [rows, total] = await Promise.all([
          query.orderBy('catalog_items.normalized_title').orderBy('catalog_items.item_id').limit(input.pageSize).offset((input.page - 1) * input.pageSize).execute() as unknown as Promise<ItemProjection[]>,
          count.executeTakeFirstOrThrow(),
        ]);
        const itemIds = rows.map((row) => row.item_id);
        const identifiers = await loadIdentifiers(executor, scope.tenantId, itemIds);
        if (itemIds.length === 0) return Object.freeze({ items: Object.freeze([]), totalCount: Number(total.count) });
        const [baseRows, overrideRows, costRows] = await Promise.all([
          executor.selectFrom('catalog_base_price_revisions').selectAll().where('tenant_id', '=', scope.tenantId).where('item_id', 'in', itemIds).orderBy('effective_from', 'desc').orderBy('revision_id', 'desc').execute(),
          executor.selectFrom('catalog_branch_price_revisions').selectAll().where('tenant_id', '=', scope.tenantId).where('branch_id', '=', scope.branchId).where('item_id', 'in', itemIds).orderBy('effective_from', 'desc').orderBy('revision_id', 'desc').execute(),
          input.includeReferenceCost ? executor.selectFrom('catalog_reference_cost_revisions').selectAll().where('tenant_id', '=', scope.tenantId).where('item_id', 'in', itemIds).orderBy('effective_from', 'desc').orderBy('revision_id', 'desc').execute() : Promise.resolve([]),
        ]);
        const firstByItem = <T extends { item_id: string }>(values: readonly T[]) => { const map = new Map<string, T>(); for (const value of values) if (!map.has(value.item_id)) map.set(value.item_id, value); return map; };
        const bases = firstByItem(baseRows); const overrides = firstByItem(overrideRows); const costs = firstByItem(costRows);
        const items: CatalogPriceListItem[] = rows.map((row) => {
          const item = mapItem(row, identifiers.get(row.item_id) ?? []);
          const override = overrides.get(row.item_id); const base = bases.get(row.item_id);
          const selected = override?.action === 'SET' ? override : base;
          const price = selected ? Object.freeze({ revisionId: selected.revision_id, amountMinor: Number(selected.amount_minor), currency: selected.currency, itemVersion: selected.item_version, effectiveFrom: selected.effective_from.toISOString(), source: override?.action === 'SET' ? 'BRANCH_OVERRIDE' as const : 'TENANT_BASE' as const }) : null;
          const cost = costs.get(row.item_id);
          return Object.freeze({ item, price, ...(cost ? { referenceCost: Object.freeze({ revisionId: cost.revision_id, amountMinor: Number(cost.amount_minor), currency: cost.currency, itemVersion: cost.item_version, effectiveFrom: cost.effective_from.toISOString(), sourceType: cost.source_type, sourceLabel: cost.source_label, observedAt: cost.observed_at.toISOString() }) } : {}) });
        });
        return Object.freeze({ items: Object.freeze(items), totalCount: Number(total.count) });
      });
    } catch (error: unknown) { throw translate(error); }
  }
}

export function createKyselyCatalogRepository(connection: InternalDatabasePersistenceConnection): CatalogRepositoryPort {
  return new KyselyCatalogRepository(connection);
}
