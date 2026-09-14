import type {
  AuthorizedOperationalContext,
  ContextualAuthorizationExecutor,
  ProtectedOperationRequirement,
  ProtectedRequestEvidence,
} from '../../access/index.js';
import type { TenantWideAuthorizationExecutor } from '../../access/index.js';
import type { CatalogService } from './catalog.service.js';
import type { BulkCatalogService } from './bulk-catalog.service.js';
import type { CatalogMutationContext, CatalogScope } from './ports/catalog-repository.port.js';

const requirement = (capability: ProtectedOperationRequirement['capability'], kind: ProtectedOperationRequirement['kind']) => Object.freeze({ capability, kind });
const priceListRead = requirement('price_list.read', 'read');
const catalogRead = requirement('catalog.manage', 'read');
const catalogManage = requirement('catalog.manage', 'state-change');
const pricesManage = requirement('catalog.prices.manage', 'state-change');
const branchPricesManage = requirement('catalog.branch_prices.manage', 'state-change');
const costRead = requirement('catalog.reference_cost.read', 'read');
const costManage = requirement('catalog.reference_cost.manage', 'state-change');
const importPrepareRead = requirement('catalog.import.prepare', 'read');
const importPrepareWrite = requirement('catalog.import.prepare', 'state-change');
const importPublish = requirement('catalog.import.publish', 'state-change');

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

function prepareRequirements(input: unknown): readonly ProtectedOperationRequirement[] {
  const requirements: ProtectedOperationRequirement[] = [importPrepareWrite];
  const containsCost = containsReferenceCost(input);
  if (requestsReferenceCost(input) || containsCost) requirements.push(costRead);
  if (containsCost) requirements.push(costManage);
  return Object.freeze(requirements);
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

export class CatalogOperationAccessDeniedError extends Error {
  constructor() { super('Catalog operation has no approved authority.'); this.name = 'CatalogOperationAccessDeniedError'; }
}

export class CatalogProtectedOperations {
  constructor(private readonly authorization: ContextualAuthorizationExecutor, private readonly tenantWideAuthorization: TenantWideAuthorizationExecutor, private readonly service: CatalogService, private readonly bulk: BulkCatalogService) {}

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

  listReferences(evidence: ProtectedRequestEvidence) {
    return this.authorization.execute(evidence, priceListRead, (context) => this.service.listOperationalReferences(scope(context)));
  }

  listAdministrationReferences(evidence: ProtectedRequestEvidence) {
    return this.tenantWideAuthorization.execute(evidence, catalogRead, (context) => this.service.listReferences(scope(context)));
  }

  search(evidence: ProtectedRequestEvidence, input: unknown, includeReferenceCost: boolean) {
    const requirements = includeReferenceCost ? [priceListRead, costRead] : [priceListRead];
    return this.executeMany(evidence, requirements, (contexts) => {
      if (!sameContext(contexts)) throw new CatalogOperationAccessDeniedError();
      return this.service.search(scope(contexts[0]!), input, includeReferenceCost);
    });
  }

  getItem(evidence: ProtectedRequestEvidence, itemId: unknown) {
    return this.tenantWideAuthorization.execute(evidence, catalogRead, (context) => this.service.getItem(scope(context), itemId));
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
    return this.executeTenantWideMany(evidence, [catalogManage], (contexts) => this.service.resolveBrand(mutationContext(contexts), pendingBrandValueId, input));
  }
  createItem(evidence: ProtectedRequestEvidence, input: unknown) {
    const hasCost = typeof input === 'object' && input !== null && 'referenceCostAmountMinor' in input && (input as { referenceCostAmountMinor?: unknown }).referenceCostAmountMinor !== null && (input as { referenceCostAmountMinor?: unknown }).referenceCostAmountMinor !== undefined;
    return this.executeTenantWideMany(evidence, hasCost ? [catalogManage, pricesManage, costManage] : [catalogManage, pricesManage], (contexts) => this.service.createItem(mutationContext(contexts), input));
  }
  updateItem(evidence: ProtectedRequestEvidence, itemId: unknown, input: unknown) {
    return this.executeTenantWideMany(evidence, [catalogManage], (contexts) => this.service.updateItem(mutationContext(contexts), itemId, input));
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
  listSupplierSources(evidence: ProtectedRequestEvidence) { return this.tenantWideAuthorization.execute(evidence, importPrepareRead, (context) => this.bulk.listSources(scope(context))); }
  createSupplierSource(evidence: ProtectedRequestEvidence, input: unknown) { return this.executeTenantWideMany(evidence, [importPrepareWrite], (contexts) => this.bulk.createSource(mutationContext(contexts), input)); }
  listSupplierVersions(evidence: ProtectedRequestEvidence, sourceId?: unknown) { return this.tenantWideAuthorization.execute(evidence, importPrepareRead, (context) => this.bulk.listVersions(scope(context), sourceId)); }
  getSupplierVersion(evidence: ProtectedRequestEvidence, versionId: unknown, includeReferenceCost: boolean) { return this.executeTenantWideMany(evidence, includeReferenceCost ? [importPrepareRead, costRead] : [importPrepareRead], (contexts) => this.bulk.getVersion(scope(contexts[0]!), versionId, includeReferenceCost)); }
  createSupplierDraft(evidence: ProtectedRequestEvidence, input: unknown) { return this.executeTenantWideMany(evidence, prepareRequirements(input), (contexts) => this.bulk.createDraft(mutationContext(contexts), input)); }
  replaceSupplierDraft(evidence: ProtectedRequestEvidence, versionId: unknown, input: unknown) { return this.executeTenantWideMany(evidence, prepareRequirements(input), (contexts) => this.bulk.replaceDraft(mutationContext(contexts), versionId, input)); }
  analyzeSupplierVersion(evidence: ProtectedRequestEvidence, versionId: unknown, input: unknown) { return this.executeTenantWideMany(evidence, requestsReferenceCost(input) ? [importPrepareWrite, costRead] : [importPrepareWrite], (contexts) => this.bulk.analyze(mutationContext(contexts), versionId, input)); }
  decideSupplierRow(evidence: ProtectedRequestEvidence, versionId: unknown, rowDecisionId: unknown, input: unknown) { return this.executeTenantWideMany(evidence, requestsReferenceCost(input) ? [importPrepareWrite, costRead] : [importPrepareWrite], (contexts) => this.bulk.decide(mutationContext(contexts), versionId, rowDecisionId, input)); }
  decideSupplierRows(evidence: ProtectedRequestEvidence, versionId: unknown, input: unknown) { return this.executeTenantWideMany(evidence, requestsReferenceCost(input) ? [importPrepareWrite, costRead] : [importPrepareWrite], (contexts) => this.bulk.decideMany(mutationContext(contexts), versionId, input)); }
  publishSupplierVersion(evidence: ProtectedRequestEvidence, versionId: unknown, input: unknown) { const writeCost = typeof input === 'object' && input !== null && (input as { writeReferenceCost?: unknown }).writeReferenceCost === true; const requirements = writeCost ? [importPublish, catalogManage, pricesManage, costManage, costRead] : [importPublish, catalogManage, pricesManage]; return this.executeTenantWideMany(evidence, requirements, (contexts) => this.bulk.publish(mutationContext(contexts), versionId, input, writeCost)); }
  compareSupplierVersions(evidence: ProtectedRequestEvidence, leftVersionId: unknown, rightVersionId: unknown) { return this.tenantWideAuthorization.execute(evidence, importPrepareRead, (context) => this.bulk.compare(scope(context), leftVersionId, rightVersionId)); }
  purgeSupplierRaw(evidence: ProtectedRequestEvidence) { return this.executeTenantWideMany(evidence, [importPrepareWrite], (contexts) => this.bulk.purgeExpiredRaw(mutationContext(contexts))); }
}
