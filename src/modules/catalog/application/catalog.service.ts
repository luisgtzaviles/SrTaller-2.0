import { randomUUID } from 'node:crypto';

import {
  CatalogInputError,
  catalogKindCapabilities,
  normalizeCatalogIdentifier,
  normalizeCatalogText,
  normalizedSku,
  parseCatalogItemKind,
  parseMinorAmount,
} from '../domain/catalog-item.js';
import type { CatalogItemKind, CatalogLifecycle } from '../domain/catalog-item.js';
import type {
  CatalogBrandRecord,
  CatalogCategoryRecord,
  CatalogMutationContext,
  CatalogPendingBrandRecord,
  CatalogPendingCategoryRecord,
  CatalogRepositoryPort,
  CatalogScope,
} from './ports/catalog-repository.port.js';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

function object(
  value: unknown,
  allowedKeys?: readonly string[],
): Readonly<Record<string, unknown>> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new CatalogInputError('payload');
  const candidate = value as Readonly<Record<string, unknown>>;
  if (allowedKeys && Object.keys(candidate).some((key) => !allowedKeys.includes(key))) {
    throw new CatalogInputError('payload');
  }
  return candidate;
}

function identifier(value: unknown, parameter: string): string {
  if (typeof value !== 'string' || !uuid.test(value)) throw new CatalogInputError(parameter);
  return value;
}

function text(value: unknown, parameter: string, maximum: number, optional = false, multiline = false): string | null {
  if ((value === null || value === undefined || value === '') && optional) return null;
  if (typeof value !== 'string') throw new CatalogInputError(parameter);
  const trimmed = value.trim();
  const forbiddenControls = multiline ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u : /[\u0000-\u001f\u007f]/u;
  if (trimmed.length < 1 || trimmed.length > maximum || forbiddenControls.test(trimmed)) throw new CatalogInputError(parameter);
  return trimmed;
}

function integer(value: unknown, parameter: string, minimum: number): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < minimum) throw new CatalogInputError(parameter);
  return value;
}

function commonMutation(input: Readonly<Record<string, unknown>>, expectedMinimum: number) {
  return Object.freeze({
    expectedVersion: integer(input.expectedVersion, 'expectedVersion', expectedMinimum),
    clientRequestId: identifier(input.clientRequestId, 'clientRequestId'),
    correlationId: randomUUID(),
    occurredAt: new Date(),
  });
}

function referenceSource(value: unknown): 'MANUAL' | 'ESTIMATED' | 'THIRD_PARTY' {
  if (value !== 'MANUAL' && value !== 'ESTIMATED' && value !== 'THIRD_PARTY') throw new CatalogInputError('sourceType');
  return value;
}

function applicableKinds(value: unknown, parameter: string, category: boolean): readonly CatalogItemKind[] {
  if (!Array.isArray(value) || value.length < 1 || (category && value.length !== 1)) throw new CatalogInputError(parameter);
  const parsed = value.map((entry) => parseCatalogItemKind(entry));
  if (new Set(parsed).size !== parsed.length) throw new CatalogInputError(parameter);
  return Object.freeze(parsed);
}

function barcode(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  return normalizeCatalogIdentifier('BARCODE', value);
}

export class CatalogService {
  constructor(
    private readonly repository: CatalogRepositoryPort,
    private readonly readOperatingCurrency: (tenantId: string) => Promise<string | null>,
  ) {}

  listReferences(scope: CatalogScope) { return this.repository.listReferences(scope); }
  async listOperationalReferences(scope: CatalogScope) {
    const references = await this.repository.listReferences(scope);
    const category = ({ categoryId, name, status, applicableKinds, version }: CatalogCategoryRecord) => Object.freeze({ categoryId, name, status, applicableKinds, version });
    const brand = ({ brandId, name, status, applicableKinds, version }: CatalogBrandRecord) => Object.freeze({ brandId, name, status, applicableKinds, version });
    return Object.freeze({
      categories: Object.freeze(references.categories.map(category)),
      brands: Object.freeze(references.brands.map(brand)),
      categoryBrandApplicability: Object.freeze(references.categoryBrandApplicability.map(({ categoryId, brandId, kind }) => Object.freeze({ categoryId, brandId, kind }))),
    });
  }
  getItem(scope: CatalogScope, itemId: unknown) { return this.repository.getItem(scope, identifier(itemId, 'itemId')); }

  async createCategory(context: CatalogMutationContext, value: unknown) {
    const input = object(value, ['name', 'applicableKinds', 'expectedVersion', 'clientRequestId']);
    const name = text(input.name, 'name', 120) as string;
    const mutation = commonMutation(input, 0);
    if (mutation.expectedVersion !== 0) throw new CatalogInputError('expectedVersion');
    return this.repository.createCategory(context, {
      referenceId: randomUUID(), name, normalizedName: normalizeCatalogText(name),
      applicableKinds: applicableKinds(input.applicableKinds, 'applicableKinds', true),
      ...mutation, expectedVersion: 0,
    });
  }

  async createBrand(context: CatalogMutationContext, value: unknown) {
    const input = object(value, ['name', 'applicableKinds', 'expectedVersion', 'clientRequestId']);
    const name = text(input.name, 'name', 120) as string;
    const mutation = commonMutation(input, 0);
    if (mutation.expectedVersion !== 0) throw new CatalogInputError('expectedVersion');
    return this.repository.createBrand(context, {
      referenceId: randomUUID(), name, normalizedName: normalizeCatalogText(name),
      applicableKinds: applicableKinds(input.applicableKinds, 'applicableKinds', false),
      ...mutation, expectedVersion: 0,
    });
  }

  updateCategory(context: CatalogMutationContext, referenceId: unknown, value: unknown) {
    return this.updateReference('category', context, referenceId, value) as Promise<CatalogCategoryRecord>;
  }

  updateBrand(context: CatalogMutationContext, referenceId: unknown, value: unknown) {
    return this.updateReference('brand', context, referenceId, value) as Promise<CatalogBrandRecord>;
  }

  deleteCategory(context: CatalogMutationContext, referenceId: unknown, value: unknown) {
    return this.deleteReference('category', context, referenceId, value);
  }

  deleteBrand(context: CatalogMutationContext, referenceId: unknown, value: unknown) {
    return this.deleteReference('brand', context, referenceId, value);
  }

  private deleteReference(kind: 'category' | 'brand', context: CatalogMutationContext, referenceId: unknown, value: unknown) {
    const input = object(value, ['expectedVersion', 'clientRequestId']);
    const parsed = { referenceId: identifier(referenceId, `${kind}Id`), ...commonMutation(input, 1) };
    return kind === 'category' ? this.repository.deleteCategory(context, parsed) : this.repository.deleteBrand(context, parsed);
  }

  private updateReference(kind: 'category' | 'brand', context: CatalogMutationContext, referenceId: unknown, value: unknown) {
    const input = object(value, ['name', 'status', 'applicableKinds', 'expectedVersion', 'clientRequestId']);
    const name = text(input.name, 'name', 120) as string;
    const status: CatalogLifecycle = input.status === 'ACTIVE' || input.status === 'INACTIVE' ? input.status : (() => { throw new CatalogInputError('status'); })();
    const parsed = {
      referenceId: identifier(referenceId, `${kind}Id`), name, normalizedName: normalizeCatalogText(name), status,
      applicableKinds: applicableKinds(input.applicableKinds, 'applicableKinds', kind === 'category'),
      ...commonMutation(input, 1),
    };
    return kind === 'category' ? this.repository.updateCategory(context, parsed) : this.repository.updateBrand(context, parsed);
  }

  resolveCategory(context: CatalogMutationContext, pendingReferenceId: unknown, value: unknown) {
    return this.resolveReference('category', context, pendingReferenceId, value) as Promise<CatalogPendingCategoryRecord>;
  }

  resolveBrand(context: CatalogMutationContext, pendingReferenceId: unknown, value: unknown) {
    return this.resolveReference('brand', context, pendingReferenceId, value) as Promise<CatalogPendingBrandRecord>;
  }

  private resolveReference(kind: 'category' | 'brand', context: CatalogMutationContext, pendingReferenceId: unknown, value: unknown) {
    const targetKey = kind === 'category' ? 'canonicalCategoryId' : 'canonicalBrandId';
    const input = object(value, [targetKey, 'canonicalName', 'applicableKinds', 'expectedVersion', 'clientRequestId']);
    const hasExisting = input[targetKey] !== undefined && input[targetKey] !== null && input[targetKey] !== '';
    const hasNew = input.canonicalName !== undefined && input.canonicalName !== null && input.canonicalName !== '';
    if (hasExisting === hasNew) throw new CatalogInputError('resolution');
    const newName = hasNew ? text(input.canonicalName, 'canonicalName', 120) as string : null;
    const parsed = {
      pendingReferenceId: identifier(pendingReferenceId, kind === 'category' ? 'pendingCategoryValueId' : 'pendingBrandValueId'),
      targetId: hasExisting ? identifier(input[targetKey], targetKey) : null,
      newReferenceId: hasNew ? randomUUID() : null,
      newName,
      newNormalizedName: newName ? normalizeCatalogText(newName) : null,
      applicableKinds: hasNew ? applicableKinds(input.applicableKinds, 'applicableKinds', kind === 'category') : null,
      ...commonMutation(input, 1),
    } as const;
    return kind === 'category' ? this.repository.resolveCategory(context, parsed) : this.repository.resolveBrand(context, parsed);
  }

  async createItem(context: CatalogMutationContext, value: unknown) {
    const input = object(value, [
      'kind', 'title', 'description', 'categoryId', 'categoryCapturedValue', 'brandId', 'brandCapturedValue', 'sku', 'barcode',
      'basePriceAmountMinor', 'referenceCostAmountMinor',
      'referenceCostSourceType', 'referenceCostSourceLabel',
      'expectedVersion', 'clientRequestId',
    ]);
    const kind = parseCatalogItemKind(input.kind);
    const title = text(input.title, 'title', 200) as string;
    const sku = input.sku === null || input.sku === undefined || input.sku === '' ? null : normalizedSku(input.sku);
    const barcodeValue = barcode(input.barcode);
    const currency = await this.currency(context.tenantId);
    const mutation = commonMutation(input, 0);
    if (mutation.expectedVersion !== 0) throw new CatalogInputError('expectedVersion');
    const categoryId = input.categoryId === null || input.categoryId === undefined || input.categoryId === '' ? null : identifier(input.categoryId, 'categoryId');
    const categoryCapturedValue = text(input.categoryCapturedValue, 'categoryCapturedValue', 120, true);
    if ((categoryId === null) === (categoryCapturedValue === null)) throw new CatalogInputError('category');
    const brandId = input.brandId === null || input.brandId === undefined || input.brandId === '' ? null : identifier(input.brandId, 'brandId');
    const brandCapturedValue = text(input.brandCapturedValue, 'brandCapturedValue', 120, true);
    if (brandId !== null && brandCapturedValue !== null) throw new CatalogInputError('brand');
    const referenceCostAmount = input.referenceCostAmountMinor === null || input.referenceCostAmountMinor === undefined
      ? null : parseMinorAmount(input.referenceCostAmountMinor, 'referenceCostAmountMinor');
    const referenceCost = referenceCostAmount === null ? null : Object.freeze({
      revisionId: randomUUID(), amountMinor: referenceCostAmount,
      sourceType: referenceSource(input.referenceCostSourceType ?? 'MANUAL'),
      sourceLabel: text(input.referenceCostSourceLabel, 'referenceCostSourceLabel', 160, true),
      observedAt: new Date(),
    });
    return this.repository.createItem(context, {
      itemId: randomUUID(), kind, title, normalizedTitle: normalizeCatalogText(title),
      description: text(input.description, 'description', 2000, true, true),
      categoryId, brandId,
      capturedCategory: categoryCapturedValue ? { pendingReferenceId: randomUUID(), rawLabel: categoryCapturedValue, normalizedKey: normalizeCatalogText(categoryCapturedValue) } : null,
      capturedBrand: brandCapturedValue ? { pendingReferenceId: randomUUID(), rawLabel: brandCapturedValue, normalizedKey: normalizeCatalogText(brandCapturedValue) } : null,
      sku, barcode: barcodeValue,
      basePrice: { revisionId: randomUUID(), amountMinor: parseMinorAmount(input.basePriceAmountMinor, 'basePriceAmountMinor') },
      referenceCost,
      currency,
      ...mutation,
      expectedVersion: 0,
    });
  }

  updateItem(context: CatalogMutationContext, itemId: unknown, value: unknown) {
    const input = object(value, [
      'title', 'description', 'categoryId', 'brandId', 'status',
      'expectedVersion', 'clientRequestId',
    ]);
    const title = text(input.title, 'title', 200) as string;
    const status: CatalogLifecycle = input.status === 'ACTIVE' || input.status === 'INACTIVE' ? input.status : (() => { throw new CatalogInputError('status'); })();
    return this.repository.updateItem(context, {
      itemId: identifier(itemId, 'itemId'), title, normalizedTitle: normalizeCatalogText(title),
      description: text(input.description, 'description', 2000, true, true),
      categoryId: identifier(input.categoryId, 'categoryId'),
      brandId: input.brandId === null || input.brandId === undefined || input.brandId === '' ? null : identifier(input.brandId, 'brandId'),
      status,
      ...commonMutation(input, 1),
    });
  }

  async changeBasePrice(context: CatalogMutationContext, itemId: unknown, value: unknown) {
    const input = object(value, ['amountMinor', 'reason', 'expectedVersion', 'clientRequestId']);
    return this.repository.changeBasePrice(context, {
      itemId: identifier(itemId, 'itemId'), revisionId: randomUUID(),
      amountMinor: parseMinorAmount(input.amountMinor, 'amountMinor'),
      currency: await this.currency(context.tenantId), reason: text(input.reason, 'reason', 500, true),
      ...commonMutation(input, 1),
    });
  }

  async changeReferenceCost(context: CatalogMutationContext, itemId: unknown, value: unknown) {
    const input = object(value, [
      'amountMinor', 'sourceType', 'sourceLabel', 'reason',
      'expectedVersion', 'clientRequestId',
    ]);
    return this.repository.changeReferenceCost(context, {
      itemId: identifier(itemId, 'itemId'), revisionId: randomUUID(),
      amountMinor: parseMinorAmount(input.amountMinor, 'amountMinor'),
      currency: await this.currency(context.tenantId), reason: text(input.reason, 'reason', 500, true),
      sourceType: referenceSource(input.sourceType ?? 'MANUAL'),
      sourceLabel: text(input.sourceLabel, 'sourceLabel', 160, true), observedAt: new Date(),
      ...commonMutation(input, 1),
    });
  }

  async changeBranchOverride(context: CatalogMutationContext, itemId: unknown, value: unknown, revoke: boolean) {
    const input = object(value, revoke
      ? ['reason', 'expectedVersion', 'clientRequestId']
      : ['amountMinor', 'reason', 'expectedVersion', 'clientRequestId']);
    return this.repository.changeBranchOverride(context, {
      itemId: identifier(itemId, 'itemId'), revisionId: randomUUID(), revoke,
      amountMinor: revoke ? 0 : parseMinorAmount(input.amountMinor, 'amountMinor'),
      currency: await this.currency(context.tenantId), reason: text(input.reason, 'reason', 500, true),
      ...commonMutation(input, 1),
    });
  }

  search(scope: CatalogScope, value: unknown, includeReferenceCost: boolean) {
    const input = object(value, ['query', 'kind', 'categoryId', 'brandId', 'page', 'pageSize']);
    if (input.query !== undefined && typeof input.query !== 'string') throw new CatalogInputError('query');
    const rawQuery = typeof input.query === 'string' ? input.query : '';
    if (rawQuery.length > 120 || /[\u0000-\u001f\u007f]/u.test(rawQuery)) throw new CatalogInputError('query');
    const query = normalizeCatalogText(rawQuery).replace(/[%_]/gu, ' ').replace(/\s+/gu, ' ').trim();
    const kind = input.kind === null || input.kind === undefined || input.kind === '' ? null : parseCatalogItemKind(input.kind);
    if (kind === 'SUPPLY') throw new CatalogInputError('kind');
    return this.repository.search(scope, {
      query,
      kind,
      categoryId: input.categoryId ? identifier(input.categoryId, 'categoryId') : null,
      brandId: input.brandId ? identifier(input.brandId, 'brandId') : null,
      page: input.page === undefined ? 1 : integer(input.page, 'page', 1),
      pageSize: input.pageSize === undefined ? 25 : Math.min(integer(input.pageSize, 'pageSize', 1), 50),
      includeReferenceCost,
    });
  }

  private async currency(tenantId: string): Promise<string> {
    const currency = await this.readOperatingCurrency(tenantId);
    if (!currency) throw new CatalogInputError('tenantCurrency');
    return currency;
  }
}

export { catalogKindCapabilities };
