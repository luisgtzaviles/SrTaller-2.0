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
  UpdateCatalogItemInput,
} from '../../application/ports/catalog-repository.port.js';

type CatalogTables = 'catalog_categories' | 'catalog_brands' | 'catalog_items' |
  'catalog_item_identifiers' | 'catalog_sku_sequences' | 'catalog_base_price_revisions' |
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

function category(row: Readonly<{ category_id: string; category_name: string; category_status: 'ACTIVE' | 'INACTIVE'; category_version: number }>): CatalogCategoryRecord {
  return Object.freeze({ categoryId: row.category_id, name: row.category_name, status: row.category_status, version: row.category_version });
}

function brand(row: Readonly<{ brand_id: string | null; brand_name: string | null; brand_status: 'ACTIVE' | 'INACTIVE' | null; brand_version: number | null }>): CatalogBrandRecord | null {
  return row.brand_id && row.brand_name && row.brand_status && row.brand_version !== null
    ? Object.freeze({ brandId: row.brand_id, name: row.brand_name, status: row.brand_status, version: row.brand_version })
    : null;
}

type ItemProjection = Readonly<{
  item_id: string; kind: CatalogItemKind; title: string; description: string | null;
  status: 'ACTIVE' | 'INACTIVE'; sellable: boolean; stockable: boolean; purchasable: boolean;
  applicable_to_repair: boolean; version: number; created_at: Date; updated_at: Date;
  category_id: string; category_name: string; category_status: 'ACTIVE' | 'INACTIVE'; category_version: number;
  brand_id: string | null; brand_name: string | null; brand_status: 'ACTIVE' | 'INACTIVE' | null; brand_version: number | null;
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
    category: category(row), brand: brand(row), status: row.status,
    capabilities: Object.freeze({ sellable: row.sellable, stockable: row.stockable, purchasable: row.purchasable, applicableToRepair: row.applicable_to_repair }),
    identifiers: Object.freeze([...identifiers]), version: row.version,
    createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString(),
  });
}

function itemQuery(executor: CatalogExecutor, tenantId: string) {
  return executor.selectFrom('catalog_items')
    .innerJoin('catalog_categories', (join) => join
      .onRef('catalog_categories.tenant_id', '=', 'catalog_items.tenant_id')
      .onRef('catalog_categories.category_id', '=', 'catalog_items.category_id'))
    .leftJoin('catalog_brands', (join) => join
      .onRef('catalog_brands.tenant_id', '=', 'catalog_items.tenant_id')
      .onRef('catalog_brands.brand_id', '=', 'catalog_items.brand_id'))
    .select([
      'catalog_items.item_id', 'catalog_items.kind', 'catalog_items.title', 'catalog_items.description', 'catalog_items.status', 'catalog_items.sellable',
      'catalog_items.stockable', 'catalog_items.purchasable', 'catalog_items.applicable_to_repair', 'catalog_items.version', 'catalog_items.created_at', 'catalog_items.updated_at',
      'catalog_categories.category_id', 'catalog_categories.display_name as category_name', 'catalog_categories.status as category_status', 'catalog_categories.version as category_version',
      'catalog_brands.brand_id', 'catalog_brands.display_name as brand_name', 'catalog_brands.status as brand_status', 'catalog_brands.version as brand_version',
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
        const [categories, brands] = await Promise.all([
          executor.selectFrom('catalog_categories').selectAll().where('tenant_id', '=', scope.tenantId).orderBy('normalized_name').orderBy('category_id').execute(),
          executor.selectFrom('catalog_brands').selectAll().where('tenant_id', '=', scope.tenantId).orderBy('normalized_name').orderBy('brand_id').execute(),
        ]);
        return Object.freeze({
          categories: Object.freeze(categories.map((row) => Object.freeze({ categoryId: row.category_id, name: row.display_name, status: row.status, version: row.version }))),
          brands: Object.freeze(brands.map((row) => Object.freeze({ brandId: row.brand_id, name: row.display_name, status: row.status, version: row.version }))),
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
    const fp = fingerprint({ name: input.name, expectedVersion: input.expectedVersion });
    return this.transaction(async (executor, tx) => {
      const replay = await commandReplay<CatalogCategoryRecord | CatalogBrandRecord>(executor, context, operation, input.clientRequestId, fp);
      if (replay) return Object.freeze(replay);
      if (!await guardsCurrent(context, tx)) throw new CatalogAuthorizationChangedError();
      const table = kind === 'category' ? 'catalog_categories' : 'catalog_brands';
      const idColumn = kind === 'category' ? 'category_id' : 'brand_id';
      await executor.insertInto(table).values({
        tenant_id: context.tenantId, [idColumn]: input.referenceId,
        display_name: input.name, normalized_name: input.normalizedName,
        status: 'ACTIVE', version: 1, created_at: input.occurredAt, updated_at: input.occurredAt,
      } as never).execute();
      const result = Object.freeze(kind === 'category'
        ? { categoryId: input.referenceId, name: input.name, status: 'ACTIVE' as const, version: 1 }
        : { brandId: input.referenceId, name: input.name, status: 'ACTIVE' as const, version: 1 });
      await recordCommand(executor, context, input, operation, fp, input.referenceId, null, result, { name: input.name });
      return result;
    });
  }

  async createItem(context: CatalogMutationContext, input: CreateCatalogItemInput): Promise<CatalogItemRecord> {
    validateScope(context);
    const operation = 'catalog.item.create';
    const fp = fingerprint({ kind: input.kind, title: input.title, description: input.description, categoryId: input.categoryId, brandId: input.brandId, sku: input.sku, identifiers: input.identifiers.map(({ scheme, normalizedValue }) => ({ scheme, normalizedValue })), basePrice: input.basePrice.amountMinor, referenceCost: input.referenceCost && { amountMinor: input.referenceCost.amountMinor, sourceType: input.referenceCost.sourceType, sourceLabel: input.referenceCost.sourceLabel }, expectedVersion: input.expectedVersion });
    return this.transaction(async (executor, tx) => {
      const replay = await commandReplay<CatalogItemRecord>(executor, context, operation, input.clientRequestId, fp);
      if (replay) return Object.freeze(replay);
      const categoryRecord = await executor.selectFrom('catalog_categories').select('category_id')
        .where('tenant_id', '=', context.tenantId).where('category_id', '=', input.categoryId).where('status', '=', 'ACTIVE').forShare().executeTakeFirst();
      const brandRecord = input.brandId ? await executor.selectFrom('catalog_brands').select('brand_id')
        .where('tenant_id', '=', context.tenantId).where('brand_id', '=', input.brandId).where('status', '=', 'ACTIVE').forShare().executeTakeFirst() : { brand_id: null };
      if (!categoryRecord || !brandRecord) throw new CatalogNotFoundError();
      if (!await guardsCurrent(context, tx)) throw new CatalogAuthorizationChangedError();
      const capabilities = catalogKindCapabilities[input.kind];
      await executor.insertInto('catalog_items').values({
        tenant_id: context.tenantId, item_id: input.itemId, kind: input.kind, title: input.title,
        normalized_title: input.normalizedTitle, description: input.description, category_id: input.categoryId,
        brand_id: input.brandId, status: 'ACTIVE', sellable: capabilities.sellable,
        stockable: capabilities.stockable, purchasable: capabilities.purchasable,
        applicable_to_repair: capabilities.applicableToRepair, version: 1,
        created_at: input.occurredAt, updated_at: input.occurredAt,
      }).execute();
      const sku = input.sku ?? await this.allocateSku(executor, context.tenantId, input.kind);
      await executor.insertInto('catalog_item_identifiers').values([
        { tenant_id: context.tenantId, identifier_id: randomUUID(), item_id: input.itemId, scheme: 'SKU', normalized_value: sku, display_value: sku, created_at: input.occurredAt },
        ...input.identifiers.map((identifier) => ({ tenant_id: context.tenantId, identifier_id: identifier.identifierId, item_id: input.itemId, scheme: identifier.scheme, normalized_value: identifier.normalizedValue, display_value: identifier.displayValue, created_at: input.occurredAt })),
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
      await recordCommand(executor, context, input, operation, fp, input.itemId, null, result, { kind: input.kind, skuGenerated: input.sku === null, basePriceAmountMinor: input.basePrice.amountMinor, hasReferenceCost: input.referenceCost !== null });
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

  async updateItem(context: CatalogMutationContext, input: UpdateCatalogItemInput): Promise<CatalogItemRecord> {
    validateScope(context);
    const operation = 'catalog.item.update';
    const fp = fingerprint({ itemId: input.itemId, title: input.title, description: input.description, categoryId: input.categoryId, brandId: input.brandId, status: input.status, expectedVersion: input.expectedVersion });
    return this.mutateItem(context, input, operation, fp, async (executor, current, nextVersion) => {
      const categoryRecord = await executor.selectFrom('catalog_categories').select('category_id').where('tenant_id', '=', context.tenantId).where('category_id', '=', input.categoryId).where('status', '=', 'ACTIVE').executeTakeFirst();
      const brandRecord = input.brandId ? await executor.selectFrom('catalog_brands').select('brand_id').where('tenant_id', '=', context.tenantId).where('brand_id', '=', input.brandId).where('status', '=', 'ACTIVE').executeTakeFirst() : { brand_id: null };
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
    mutate: (executor: CatalogExecutor, current: Readonly<{ version: number; status: 'ACTIVE' | 'INACTIVE' }>, nextVersion: number) => Promise<unknown>,
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

  async search(scopeValue: CatalogScope, input: Readonly<{ query: string; categoryId: string | null; brandId: string | null; page: number; pageSize: number; includeReferenceCost: boolean }>) {
    const scope = validateScope(scopeValue);
    try {
      return await this.execute(async (executor) => {
        const exact = input.query.toUpperCase();
        const tokens = input.query.split(' ').filter(Boolean);
        let query = itemQuery(executor, scope.tenantId).where('catalog_items.status', '=', 'ACTIVE').where('catalog_items.sellable', '=', true);
        let count = executor.selectFrom('catalog_items').select(({ fn }) => fn.countAll<string>().as('count')).where('catalog_items.tenant_id', '=', scope.tenantId).where('catalog_items.status', '=', 'ACTIVE').where('catalog_items.sellable', '=', true);
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
