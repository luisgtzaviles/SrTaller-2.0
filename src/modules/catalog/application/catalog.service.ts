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
import type { CatalogIdentifierScheme, CatalogLifecycle } from '../domain/catalog-item.js';
import type {
  CatalogMutationContext,
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

function barcode(value: unknown): Readonly<{ identifierId: string; scheme: CatalogIdentifierScheme; normalizedValue: string; displayValue: string }> | null {
  if (value === null || value === undefined) return null;
  const candidate = object(value, ['scheme', 'value']);
  const scheme = candidate.scheme;
  if (scheme !== 'INTERNAL_BARCODE' && scheme !== 'GTIN_8' && scheme !== 'GTIN_12' && scheme !== 'GTIN_13' && scheme !== 'GTIN_14') throw new CatalogInputError('barcode.scheme');
  const normalizedValue = normalizeCatalogIdentifier(scheme, candidate.value);
  return Object.freeze({ identifierId: randomUUID(), scheme, normalizedValue, displayValue: normalizedValue });
}

export class CatalogService {
  constructor(
    private readonly repository: CatalogRepositoryPort,
    private readonly readOperatingCurrency: (tenantId: string) => Promise<string | null>,
  ) {}

  listReferences(scope: CatalogScope) { return this.repository.listReferences(scope); }
  getItem(scope: CatalogScope, itemId: unknown) { return this.repository.getItem(scope, identifier(itemId, 'itemId')); }

  async createCategory(context: CatalogMutationContext, value: unknown) {
    const input = object(value, ['name', 'expectedVersion', 'clientRequestId']);
    const name = text(input.name, 'name', 120) as string;
    const mutation = commonMutation(input, 0);
    if (mutation.expectedVersion !== 0) throw new CatalogInputError('expectedVersion');
    return this.repository.createCategory(context, {
      referenceId: randomUUID(), name, normalizedName: normalizeCatalogText(name), ...mutation, expectedVersion: 0,
    });
  }

  async createBrand(context: CatalogMutationContext, value: unknown) {
    const input = object(value, ['name', 'expectedVersion', 'clientRequestId']);
    const name = text(input.name, 'name', 120) as string;
    const mutation = commonMutation(input, 0);
    if (mutation.expectedVersion !== 0) throw new CatalogInputError('expectedVersion');
    return this.repository.createBrand(context, {
      referenceId: randomUUID(), name, normalizedName: normalizeCatalogText(name), ...mutation, expectedVersion: 0,
    });
  }

  async createItem(context: CatalogMutationContext, value: unknown) {
    const input = object(value, [
      'kind', 'title', 'description', 'categoryId', 'brandId', 'sku', 'barcode',
      'basePriceAmountMinor', 'referenceCostAmountMinor',
      'referenceCostSourceType', 'referenceCostSourceLabel',
      'expectedVersion', 'clientRequestId',
    ]);
    const kind = parseCatalogItemKind(input.kind);
    const title = text(input.title, 'title', 200) as string;
    const sku = input.sku === null || input.sku === undefined || input.sku === '' ? null : normalizedSku(input.sku);
    const optionalBarcode = barcode(input.barcode);
    const currency = await this.currency(context.tenantId);
    const mutation = commonMutation(input, 0);
    if (mutation.expectedVersion !== 0) throw new CatalogInputError('expectedVersion');
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
      categoryId: identifier(input.categoryId, 'categoryId'),
      brandId: input.brandId === null || input.brandId === undefined || input.brandId === '' ? null : identifier(input.brandId, 'brandId'),
      sku,
      identifiers: optionalBarcode ? [optionalBarcode] : [],
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
    const input = object(value, ['query', 'categoryId', 'brandId', 'page', 'pageSize']);
    if (input.query !== undefined && typeof input.query !== 'string') throw new CatalogInputError('query');
    const rawQuery = typeof input.query === 'string' ? input.query : '';
    if (rawQuery.length > 120 || /[\u0000-\u001f\u007f]/u.test(rawQuery)) throw new CatalogInputError('query');
    const query = normalizeCatalogText(rawQuery).replace(/[%_]/gu, ' ').replace(/\s+/gu, ' ').trim();
    return this.repository.search(scope, {
      query,
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
