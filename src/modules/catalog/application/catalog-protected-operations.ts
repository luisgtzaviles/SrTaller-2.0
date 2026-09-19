import type {
  AuthorizedOperationalContext,
  ContextualAuthorizationExecutor,
  ProtectedOperationRequirement,
  ProtectedRequestEvidence,
  SensitiveActionLevel2Executor,
} from '../../access/index.js';
import { ContextualAuthorizationError } from '../../access/index.js';
import type { TenantWideAuthorizationExecutor } from '../../access/index.js';
import type { CatalogService } from './catalog.service.js';
import type { BulkCatalogService } from './bulk-catalog.service.js';
import type { CatalogRetirementService } from './catalog-retirement.service.js';
import type { CatalogMutationContext, CatalogScope } from './ports/catalog-repository.port.js';
import type { CatalogFieldPolicyConfigurationContext } from './ports/catalog-field-policy-repository.port.js';
import type { CatalogFieldPolicyProjection, CatalogFieldPolicyService } from './catalog-field-policy.service.js';

const requirement = (capability: ProtectedOperationRequirement['capability'], kind: ProtectedOperationRequirement['kind']) => Object.freeze({ capability, kind });
const priceListRead = requirement('price_list.read', 'read');
const catalogRead = requirement('catalog.manage', 'read');
const catalogManage = requirement('catalog.manage', 'state-change');
const catalogItemCreate = requirement('catalog.items.create', 'state-change');
const catalogItemUpdate = requirement('catalog.items.update', 'state-change');
const catalogItemDeactivate = requirement('catalog.items.deactivate', 'state-change');
const pricesManage = requirement('catalog.prices.manage', 'state-change');
const branchPricesManage = requirement('catalog.branch_prices.manage', 'state-change');
const costRead = requirement('catalog.reference_cost.read', 'read');
const costManage = requirement('catalog.reference_cost.manage', 'state-change');
const importPrepareRead = requirement('catalog.import.prepare', 'read');
const importPrepareWrite = requirement('catalog.import.prepare', 'state-change');
const importRead = requirement('catalog.import.read', 'read');
const importPublish = requirement('catalog.import.publish', 'state-change');
const bulkRetire = requirement('catalog.items.bulk_retire', 'state-change');
const catalogConfigurationRead = requirement('catalog.configuration.read', 'read');
const catalogConfigurationManage = requirement('catalog.configuration.manage', 'state-change');

export type CatalogOperationalFieldPolicyProjection = Readonly<{
  policyVersion: number;
  source: 'product-default' | 'tenant';
  fields: readonly Readonly<{
    key: string;
    label: string;
    level: 'REQUIRED' | 'ESSENTIAL' | 'OPTIONAL';
    domainFixed: boolean;
    referenceCostSensitive: boolean;
  }>[];
}>;

function sameContext(contexts: readonly AuthorizedOperationalContext[]): boolean {
  const first = contexts[0];
  if (!first) return false;
  return contexts.every((context) => context.tenantId === first.tenantId && context.branchId === first.branchId && context.stationId === first.stationId && context.sessionId === first.sessionId && context.userId === first.userId);
}

function scope(context: AuthorizedOperationalContext): CatalogScope {
  return Object.freeze({ tenantId: context.tenantId, branchId: context.branchId });
}

function requestsReferenceCost(input: unknown): boolean {
  return typeof input === 'object' && input !== null && !Array.isArray(input) && (input as { includeReferenceCost?: unknown }).includeReferenceCost === true;
}

function containsReferenceCost(input: unknown): boolean {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return false;
  const rows = (input as { rows?: unknown }).rows;
  return Array.isArray(rows) && rows.some((row) => typeof row === 'object' && row !== null && !Array.isArray(row) && (row as { referenceCostMinor?: unknown }).referenceCostMinor !== null && (row as { referenceCostMinor?: unknown }).referenceCostMinor !== undefined && (row as { referenceCostMinor?: unknown }).referenceCostMinor !== '');
}

function requestedItemStatus(input: unknown): 'ACTIVE' | 'INACTIVE' | null {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return null;
  const status = (input as { status?: unknown }).status;
  return status === 'ACTIVE' || status === 'INACTIVE' ? status : null;
}

function prepareRequirements(input: unknown): readonly ProtectedOperationRequirement[] {
  const requirements: ProtectedOperationRequirement[] = [importPrepareWrite];
  const containsCost = containsReferenceCost(input);
  if (requestsReferenceCost(input) || containsCost) requirements.push(costRead);
  if (containsCost) requirements.push(costManage);
  return Object.freeze(requirements);
}

function publishEffectRequirements(version: Awaited<ReturnType<BulkCatalogService['getVersion']>>, writeCost: boolean): readonly ProtectedOperationRequirement[] {
  const actionable = version.rows.filter((row) => row.decision === 'APPLY');
  const requirements: ProtectedOperationRequirement[] = [importPublish];
  if (actionable.some((row) => row.classification === 'NEW')) requirements.push(catalogItemCreate);
  if (actionable.some((row) => row.classification === 'UPDATE' || row.titleDecision === 'ADOPT_OBSERVED')) requirements.push(catalogItemUpdate);
  if (actionable.some((row) => row.classification === 'REACTIVATE')) requirements.push(catalogItemDeactivate);
  if (actionable.some((row) => row.proposal.basePriceMinor !== null && row.proposal.basePriceMinor !== undefined)) requirements.push(pricesManage);
  if (writeCost && actionable.some((row) => row.proposal.referenceCostMinor !== null && row.proposal.referenceCostMinor !== undefined)) requirements.push(costManage, costRead);
  return Object.freeze(requirements);
}

function bindPublishSnapshot(input: unknown, expectedBatchVersion: number): unknown {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return input;
  return Object.freeze({ ...input, expectedBatchVersion });
}

function mutationContext(contexts: readonly AuthorizedOperationalContext[]): CatalogMutationContext {
  if (!sameContext(contexts) || contexts.length === 0) throw new CatalogOperationAccessDeniedError();
  const first = contexts[0]!;
  return Object.freeze({
    tenantId: first.tenantId, branchId: first.branchId, stationId: first.stationId,
    sessionId: first.sessionId, actorUserId: first.userId, actorDisplayName: first.userDisplayName,
    capability: contexts.map((context) => context.capability).join('+'),
    commitGuards: Object.freeze(contexts.map((context) => context.commitGuard)),
  });
}
function fieldPolicyContext(contexts: readonly AuthorizedOperationalContext[]): CatalogFieldPolicyConfigurationContext {
  if (!sameContext(contexts) || contexts.length === 0) throw new CatalogOperationAccessDeniedError();
  const first = contexts[0]!;
  return Object.freeze({ tenantId: first.tenantId, branchId: first.branchId, stationId: first.stationId, sessionId: first.sessionId, actorUserId: first.userId, actorDisplayName: first.userDisplayName, capability: 'catalog.configuration.manage', commitGuards: Object.freeze(contexts.map((context) => context.commitGuard)) });
}

function operationalFieldPolicy(value: CatalogFieldPolicyProjection, mayReadReferenceCost: boolean): CatalogOperationalFieldPolicyProjection {
  return Object.freeze({
    policyVersion: value.policyVersion,
    source: value.source,
    fields: Object.freeze(value.registry
      .filter((field) => mayReadReferenceCost || !field.referenceCostSensitive)
      .map((field) => Object.freeze({
        key: field.key,
        label: field.label,
        level: value.fieldLevels[field.key],
        domainFixed: field.domainFixed,
        referenceCostSensitive: field.referenceCostSensitive,
      }))),
  });
}

export class CatalogOperationAccessDeniedError extends Error {
  constructor() { super('Catalog operation has no approved authority.'); this.name = 'CatalogOperationAccessDeniedError'; }
}

export class CatalogProtectedOperations {
  constructor(private readonly authorization: ContextualAuthorizationExecutor, private readonly tenantWideAuthorization: TenantWideAuthorizationExecutor, private readonly sensitiveLevel2: SensitiveActionLevel2Executor, private readonly service: CatalogService, private readonly bulk: BulkCatalogService, private readonly retirement: CatalogRetirementService, private readonly fieldPolicy: CatalogFieldPolicyService) {}

  private executeMany<Result>(evidence: ProtectedRequestEvidence, requirements: readonly ProtectedOperationRequirement[], operation: (contexts: readonly AuthorizedOperationalContext[]) => Promise<Result>): Promise<Result> {
    const contexts: AuthorizedOperationalContext[] = [];
    const visit = (index: number): Promise<Result> => {
      const current = requirements[index];
      if (!current) return operation(Object.freeze([...contexts]));
      return this.authorization.execute(evidence, current, async (context) => { contexts.push(context); return visit(index + 1); });
    };
    return visit(0);
  }

  private executeTenantWideMany<Result>(evidence: ProtectedRequestEvidence, requirements: readonly ProtectedOperationRequirement[], operation: (contexts: readonly AuthorizedOperationalContext[]) => Promise<Result>): Promise<Result> {
    const contexts: AuthorizedOperationalContext[] = [];
    const visit = (index: number): Promise<Result> => {
      const current = requirements[index];
      if (!current) return operation(Object.freeze([...contexts]));
      return this.tenantWideAuthorization.execute(evidence, current, async (context) => { contexts.push(context); return visit(index + 1); });
    };
    return visit(0);
  }

  private executeTenantWideEither<Result>(evidence: ProtectedRequestEvidence, requirements: readonly ProtectedOperationRequirement[], operation: (context: AuthorizedOperationalContext) => Promise<Result>): Promise<Result> {
    const visit = (index: number): Promise<Result> => {
      const current = requirements[index];
      if (!current) return Promise.reject(new CatalogOperationAccessDeniedError());
      return this.tenantWideAuthorization.execute(evidence, current, operation).catch((error: unknown) => {
        if (error instanceof ContextualAuthorizationError && error.code === 'ACCESS_DENIED') return visit(index + 1);
        throw error;
      });
    };
    return visit(0);
  }

  private executeTenantWideWithLegacyItemCompatibility<Result>(evidence: ProtectedRequestEvidence, capability: ProtectedOperationRequirement, operation: (context: AuthorizedOperationalContext) => Promise<Result>): Promise<Result> {
    return this.executeTenantWideEither(evidence, [capability, catalogManage], operation);
  }

  private executeTenantWideBulkRead<Result>(evidence: ProtectedRequestEvidence, operation: (context: AuthorizedOperationalContext) => Promise<Result>): Promise<Result> {
    return this.executeTenantWideEither(evidence, [importRead, importPrepareRead], operation);
  }

  listReferences(evidence: ProtectedRequestEvidence) {
    return this.authorization.execute(evidence, priceListRead, (context) => this.service.listOperationalReferences(scope(context)));
  }

  listAdministrationReferences(evidence: ProtectedRequestEvidence) {
    return this.executeTenantWideEither(evidence, [catalogConfigurationRead, catalogRead], (context) => this.service.listReferences(scope(context)));
  }
  getFieldPolicy(evidence: ProtectedRequestEvidence) { return this.executeTenantWideMany(evidence, [catalogConfigurationRead, costRead], (contexts) => this.fieldPolicy.effective({ tenantId: contexts[0]!.tenantId })); }
  async getBulkFieldPolicy(evidence: ProtectedRequestEvidence): Promise<CatalogOperationalFieldPolicyProjection> {
    return await this.tenantWideAuthorization.execute(evidence, importPrepareRead, async (context) => {
      let mayReadReferenceCost = false;
      try {
        await this.tenantWideAuthorization.execute(evidence, costRead, async () => { mayReadReferenceCost = true; });
      } catch (error: unknown) {
        if (!(error instanceof ContextualAuthorizationError) || error.code !== 'ACCESS_DENIED') throw error;
      }
      return operationalFieldPolicy(await this.fieldPolicy.effective({ tenantId: context.tenantId }), mayReadReferenceCost);
    });
  }
  updateFieldPolicy(evidence: ProtectedRequestEvidence, input: unknown) { return this.executeTenantWideMany(evidence, [catalogConfigurationManage, costManage], (contexts) => this.fieldPolicy.update(fieldPolicyContext(contexts), input)); }
  resetFieldPolicy(evidence: ProtectedRequestEvidence, input: unknown) { return this.executeTenantWideMany(evidence, [catalogConfigurationManage, costManage], (contexts) => this.fieldPolicy.reset(fieldPolicyContext(contexts), input)); }

  search(evidence: ProtectedRequestEvidence, input: unknown, includeReferenceCost: boolean) {
    const requirements = includeReferenceCost ? [priceListRead, costRead] : [priceListRead];
    return this.executeMany(evidence, requirements, (contexts) => {
      if (!sameContext(contexts)) throw new CatalogOperationAccessDeniedError();
      return this.service.search(scope(contexts[0]!), input, includeReferenceCost);
    });
  }

  getItem(evidence: ProtectedRequestEvidence, itemId: unknown) {
    // The item projection contains ordinary commercial identity only.  It is
    // therefore safe for a Price List reader; sensitive price/cost operations
    // continue to be protected independently below.
    return this.authorization.execute(evidence, priceListRead, (context) => this.service.getItem(scope(context), itemId));
  }

  createCategory(evidence: ProtectedRequestEvidence, input: unknown) {
    return this.executeTenantWideMany(evidence, [catalogManage], (contexts) => this.service.createCategory(mutationContext(contexts), input));
  }
  createBrand(evidence: ProtectedRequestEvidence, input: unknown) {
    return this.executeTenantWideMany(evidence, [catalogManage], (contexts) => this.service.createBrand(mutationContext(contexts), input));
  }
  updateCategory(evidence: ProtectedRequestEvidence, categoryId: unknown, input: unknown) {
    return this.executeTenantWideMany(evidence, [catalogManage], (contexts) => this.service.updateCategory(mutationContext(contexts), categoryId, input));
  }
  updateBrand(evidence: ProtectedRequestEvidence, brandId: unknown, input: unknown) {
    return this.executeTenantWideMany(evidence, [catalogManage], (contexts) => this.service.updateBrand(mutationContext(contexts), brandId, input));
  }
  deleteCategory(evidence: ProtectedRequestEvidence, categoryId: unknown, input: unknown) {
    return this.executeTenantWideMany(evidence, [catalogManage], (contexts) => this.service.deleteCategory(mutationContext(contexts), categoryId, input));
  }
  deleteBrand(evidence: ProtectedRequestEvidence, brandId: unknown, input: unknown) {
    return this.executeTenantWideMany(evidence, [catalogManage], (contexts) => this.service.deleteBrand(mutationContext(contexts), brandId, input));
  }
  mergeCategories(evidence: ProtectedRequestEvidence, input: unknown) {
    return this.executeTenantWideMany(evidence, [catalogManage], (contexts) => this.service.mergeCategories(mutationContext(contexts), input));
  }
  mergeBrands(evidence: ProtectedRequestEvidence, input: unknown) {
    return this.executeTenantWideMany(evidence, [catalogManage], (contexts) => this.service.mergeBrands(mutationContext(contexts), input));
  }
  resolveCategory(evidence: ProtectedRequestEvidence, pendingCategoryValueId: unknown, input: unknown) {
    return this.executeTenantWideMany(evidence, [catalogManage], (contexts) => this.service.resolveCategory(mutationContext(contexts), pendingCategoryValueId, input));
  }
  resolveBrand(evidence: ProtectedRequestEvidence, pendingBrandValueId: unknown, input: unknown) {
    return this.executeTenantWideMany(evidence, [catalogConfigurationManage], (contexts) => this.service.resolveBrand(mutationContext(contexts), pendingBrandValueId, input));
  }
  createItem(evidence: ProtectedRequestEvidence, input: unknown) {
    const hasCost = typeof input === 'object' && input !== null && 'referenceCostAmountMinor' in input && (input as { referenceCostAmountMinor?: unknown }).referenceCostAmountMinor !== null && (input as { referenceCostAmountMinor?: unknown }).referenceCostAmountMinor !== undefined;
    return this.executeTenantWideWithLegacyItemCompatibility(evidence, catalogItemCreate, (itemContext) => this.executeTenantWideMany(evidence, hasCost ? [pricesManage, costManage] : [pricesManage], (effectContexts) => this.service.createItem(mutationContext([itemContext, ...effectContexts]), input)));
  }
  async updateItem(evidence: ProtectedRequestEvidence, itemId: unknown, input: unknown) {
    return await this.executeTenantWideEither(evidence, [catalogItemUpdate, catalogItemDeactivate, catalogManage], async (inspectionContext) => {
      const existing = await this.service.getItem(scope(inspectionContext), itemId);
      const lifecycleChange = existing !== null && requestedItemStatus(input) !== null && existing.status !== requestedItemStatus(input);
      const required = lifecycleChange ? catalogItemDeactivate : catalogItemUpdate;
      return await this.executeTenantWideWithLegacyItemCompatibility(evidence, required, (mutationContextValue) => this.service.updateItem(mutationContext([mutationContextValue]), itemId, input));
    });
  }
  changeBasePrice(evidence: ProtectedRequestEvidence, itemId: unknown, input: unknown) {
    return this.executeTenantWideMany(evidence, [pricesManage], (contexts) => this.service.changeBasePrice(mutationContext(contexts), itemId, input));
  }
  changeReferenceCost(evidence: ProtectedRequestEvidence, itemId: unknown, input: unknown) {
    return this.executeTenantWideMany(evidence, [costManage], (contexts) => this.service.changeReferenceCost(mutationContext(contexts), itemId, input));
  }
  changeBranchOverride(evidence: ProtectedRequestEvidence, itemId: unknown, input: unknown, revoke: boolean) {
    return this.executeMany(evidence, [branchPricesManage], (contexts) => this.service.changeBranchOverride(mutationContext(contexts), itemId, input, revoke));
  }
  listSupplierSources(evidence: ProtectedRequestEvidence) { return this.executeTenantWideBulkRead(evidence, (context) => this.bulk.listSources(scope(context))); }
  createSupplierSource(evidence: ProtectedRequestEvidence, input: unknown) { return this.executeTenantWideMany(evidence, [importPrepareWrite], (contexts) => this.bulk.createSource(mutationContext(contexts), input)); }
  listSupplierVersions(evidence: ProtectedRequestEvidence, sourceId?: unknown) { return this.executeTenantWideBulkRead(evidence, (context) => this.bulk.listVersions(scope(context), sourceId)); }
  getSupplierVersion(evidence: ProtectedRequestEvidence, versionId: unknown, includeReferenceCost: boolean) { return this.executeTenantWideBulkRead(evidence, (readContext) => this.executeTenantWideMany(evidence, includeReferenceCost ? [costRead] : [], (contexts) => this.bulk.getVersion(scope(contexts[0] ?? readContext), versionId, includeReferenceCost))); }
  createSupplierDraft(evidence: ProtectedRequestEvidence, input: unknown) { return this.executeTenantWideMany(evidence, prepareRequirements(input), (contexts) => this.bulk.createDraft(mutationContext(contexts), input)); }
  replaceSupplierDraft(evidence: ProtectedRequestEvidence, versionId: unknown, input: unknown) { return this.executeTenantWideMany(evidence, prepareRequirements(input), (contexts) => this.bulk.replaceDraft(mutationContext(contexts), versionId, input)); }
  analyzeSupplierVersion(evidence: ProtectedRequestEvidence, versionId: unknown, input: unknown) { return this.executeTenantWideMany(evidence, requestsReferenceCost(input) ? [importPrepareWrite, costRead] : [importPrepareWrite], (contexts) => this.bulk.analyze(mutationContext(contexts), versionId, input)); }
  decideSupplierRow(evidence: ProtectedRequestEvidence, versionId: unknown, rowDecisionId: unknown, input: unknown) { return this.executeTenantWideMany(evidence, requestsReferenceCost(input) ? [importPrepareWrite, costRead] : [importPrepareWrite], (contexts) => this.bulk.decide(mutationContext(contexts), versionId, rowDecisionId, input)); }
  decideSupplierRows(evidence: ProtectedRequestEvidence, versionId: unknown, input: unknown) { return this.executeTenantWideMany(evidence, requestsReferenceCost(input) ? [importPrepareWrite, costRead] : [importPrepareWrite], (contexts) => this.bulk.decideMany(mutationContext(contexts), versionId, input)); }
  async publishSupplierVersion(evidence: ProtectedRequestEvidence, versionId: unknown, input: unknown) {
    const writeCost = typeof input === 'object' && input !== null && (input as { writeReferenceCost?: unknown }).writeReferenceCost === true;
    // A publisher must be able to inspect the authoritative READY batch. The
    // temporary prepare -> read compatibility remains only for legacy roles.
    return await this.executeTenantWideBulkRead(evidence, async (readContext) => {
      return await this.executeTenantWideMany(evidence, writeCost ? [costRead] : [], async (costContexts) => {
        const version = await this.bulk.getVersion(scope(costContexts[0] ?? readContext), versionId, writeCost);
        const requirements = publishEffectRequirements(version, writeCost);
        const boundInput = bindPublishSnapshot(input, version.batch.version);
        return await this.executeTenantWideMany(evidence, requirements, (contexts) => this.bulk.publish(mutationContext(contexts), versionId, boundInput, writeCost));
      });
    });
  }
  compareSupplierVersions(evidence: ProtectedRequestEvidence, leftVersionId: unknown, rightVersionId: unknown) { return this.executeTenantWideBulkRead(evidence, (context) => this.bulk.compare(scope(context), leftVersionId, rightVersionId)); }
  purgeSupplierRaw(evidence: ProtectedRequestEvidence) { return this.executeTenantWideMany(evidence, [importPrepareWrite], (contexts) => this.bulk.purgeExpiredRaw(mutationContext(contexts))); }
  deleteSupplierSource(evidence: ProtectedRequestEvidence, sourceId: unknown, input: unknown) {
    const pin = typeof input === 'object' && input !== null && !Array.isArray(input) ? (input as { pin?: unknown }).pin : undefined;
    return this.sensitiveLevel2.execute(evidence, 'catalog.suppliers-delete', { pin }, (context) => this.bulk.deleteSource(mutationContext([context]), sourceId, input, context.reauthenticatedAt));
  }
  createRetirementPlan(evidence: ProtectedRequestEvidence, input: unknown) { return this.executeTenantWideMany(evidence, [bulkRetire], (contexts) => this.retirement.createPlan(mutationContext(contexts), input)); }
  executeRetirementPlan(evidence: ProtectedRequestEvidence, input: unknown) {
    const pin = typeof input === 'object' && input !== null && !Array.isArray(input) ? (input as { pin?: unknown }).pin : undefined;
    return this.sensitiveLevel2.execute(evidence, 'catalog.items.bulk-retire', { pin }, (context) => this.retirement.executePlan(mutationContext([context]), input, context.reauthenticatedAt));
  }
}
