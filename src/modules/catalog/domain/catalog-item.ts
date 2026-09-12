export const catalogItemKinds = ['PART', 'PRODUCT', 'SERVICE', 'SUPPLY'] as const;
export type CatalogItemKind = (typeof catalogItemKinds)[number];
export type CatalogLifecycle = 'ACTIVE' | 'INACTIVE';
export type CatalogReferenceReviewStatus = 'APPROVED' | 'PENDING' | 'MERGED';
/** The barcode value is internal; Code 128 is only a future rendering. */
export type CatalogIdentifierScheme = 'SKU' | 'BARCODE';

export const catalogKindCapabilities = Object.freeze({
  PART: Object.freeze({ sellable: true, stockable: true, purchasable: true, applicableToRepair: true }),
  PRODUCT: Object.freeze({ sellable: true, stockable: true, purchasable: true, applicableToRepair: false }),
  SERVICE: Object.freeze({ sellable: true, stockable: false, purchasable: false, applicableToRepair: true }),
  SUPPLY: Object.freeze({ sellable: false, stockable: true, purchasable: true, applicableToRepair: false }),
});

export const catalogKindSkuPrefix = Object.freeze({
  PART: 'REF', PRODUCT: 'PRO', SERVICE: 'SER', SUPPLY: 'INS',
});

export function parseCatalogItemKind(value: unknown): CatalogItemKind {
  if (typeof value !== 'string' || !catalogItemKinds.includes(value as CatalogItemKind)) {
    throw new CatalogInputError('kind');
  }
  return value as CatalogItemKind;
}

export function normalizeCatalogText(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/gu, '').toLocaleLowerCase('es-MX')
    .replace(/\s+/gu, ' ').trim();
}

export function normalizedSku(value: unknown): string {
  if (typeof value !== 'string') throw new CatalogInputError('sku');
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z0-9._-]{1,64}$/u.test(normalized)) throw new CatalogInputError('sku');
  return normalized;
}

export function normalizeCatalogIdentifier(scheme: CatalogIdentifierScheme, value: unknown): string {
  if (typeof value !== 'string') throw new CatalogInputError('identifier');
  if (scheme === 'SKU') return normalizedSku(value);
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z0-9._-]{4,64}$/u.test(normalized)) throw new CatalogInputError('identifier');
  return normalized;
}

export function parseMinorAmount(value: unknown, parameter: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new CatalogInputError(parameter);
  }
  return value;
}

export class CatalogInputError extends Error {
  readonly code = 'CATALOG_INPUT_INVALID';
  constructor(readonly parameter: string) {
    super('Catalog input is invalid.');
    this.name = 'CatalogInputError';
  }
}

export class CatalogNotFoundError extends Error {
  readonly code = 'CATALOG_NOT_FOUND';
  constructor() { super('Catalog resource was not found.'); this.name = 'CatalogNotFoundError'; }
}

export class CatalogConflictError extends Error {
  readonly code = 'CATALOG_CONFLICT';
  constructor() { super('Catalog command conflicts with current state.'); this.name = 'CatalogConflictError'; }
}

export class CatalogAuthorizationChangedError extends Error {
  readonly code = 'CATALOG_AUTHORIZATION_CHANGED';
  constructor() { super('Catalog authorization changed before commit.'); this.name = 'CatalogAuthorizationChangedError'; }
}

export class CatalogUnavailableError extends Error {
  readonly code = 'CATALOG_UNAVAILABLE';
  constructor() { super('Catalog is temporarily unavailable.'); this.name = 'CatalogUnavailableError'; }
}
