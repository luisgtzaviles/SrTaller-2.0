export const catalogItemKinds = ['PART', 'PRODUCT', 'SERVICE', 'SUPPLY'] as const;
export type CatalogItemKind = (typeof catalogItemKinds)[number];
export type CatalogLifecycle = 'ACTIVE' | 'INACTIVE';
export type CatalogReferenceReviewStatus = 'APPROVED' | 'PENDING' | 'MERGED';
export type CatalogIdentifierScheme = 'SKU' | 'INTERNAL_BARCODE' | 'GTIN_8' | 'GTIN_12' | 'GTIN_13' | 'GTIN_14';

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

function gtinCheckDigit(value: string): number {
  let sum = 0;
  for (let index = value.length - 1, position = 0; index >= 0; index -= 1, position += 1) {
    sum += Number(value[index]) * (position % 2 === 0 ? 3 : 1);
  }
  return (10 - (sum % 10)) % 10;
}

export function normalizeCatalogIdentifier(scheme: CatalogIdentifierScheme, value: unknown): string {
  if (typeof value !== 'string') throw new CatalogInputError('identifier');
  const normalized = scheme === 'SKU' ? normalizedSku(value) : value.trim();
  if (scheme === 'INTERNAL_BARCODE') {
    if (!/^[A-Z0-9._-]{4,64}$/u.test(normalized.toUpperCase())) throw new CatalogInputError('identifier');
    return normalized.toUpperCase();
  }
  if (scheme !== 'SKU') {
    const length = Number(scheme.slice(5));
    if (!/^\d+$/u.test(normalized) || normalized.length !== length) throw new CatalogInputError('identifier');
    if (gtinCheckDigit(normalized.slice(0, -1)) !== Number(normalized.at(-1))) throw new CatalogInputError('identifier');
  }
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
