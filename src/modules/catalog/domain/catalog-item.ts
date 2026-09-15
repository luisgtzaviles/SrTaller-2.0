export const catalogItemKinds = ['PART', 'PRODUCT', 'SERVICE', 'SUPPLY'] as const;
export type CatalogItemKind = (typeof catalogItemKinds)[number];
export type CatalogLifecycle = 'ACTIVE' | 'INACTIVE';
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
  readonly code: string = 'CATALOG_CONFLICT';
  constructor() { super('Catalog command conflicts with current state.'); this.name = 'CatalogConflictError'; }
}

export class CatalogReferenceAlreadyExistsError extends CatalogConflictError {
  override readonly code = 'CATALOG_REFERENCE_ALREADY_EXISTS';
  constructor(
    readonly referenceKind: 'category' | 'brand',
    readonly displayName: string,
  ) {
    super();
    this.name = 'CatalogReferenceAlreadyExistsError';
  }
}

export class CatalogSupplierVersionAlreadyExistsError extends CatalogConflictError {
  override readonly code = 'CATALOG_SUPPLIER_VERSION_ALREADY_EXISTS';
  constructor() {
    super();
    this.name = 'CatalogSupplierVersionAlreadyExistsError';
  }
}

export class CatalogSupplierDeleteNotAllowedError extends CatalogConflictError {
  override readonly code = 'CATALOG_SUPPLIER_DELETE_NOT_ALLOWED';
  constructor(readonly reason: 'PUBLISHED_HISTORY' | 'DEPENDENT_HISTORY' | 'SOURCE_CHANGED') {
    super();
    this.name = 'CatalogSupplierDeleteNotAllowedError';
  }
}

export class CatalogReferenceInactiveError extends CatalogConflictError {
  override readonly code = 'CATALOG_REFERENCE_INACTIVE';
  constructor(readonly referenceKind: 'category' | 'brand') {
    super();
    this.name = 'CatalogReferenceInactiveError';
  }
}

export class CatalogReferenceInUseError extends Error {
  readonly code = 'CATALOG_REFERENCE_IN_USE';
  constructor() { super('Catalog reference has canonical or reconciliation dependencies.'); this.name = 'CatalogReferenceInUseError'; }
}

export class CatalogAuthorizationChangedError extends Error {
  readonly code = 'CATALOG_AUTHORIZATION_CHANGED';
  constructor() { super('Catalog authorization changed before commit.'); this.name = 'CatalogAuthorizationChangedError'; }
}

export class CatalogUnavailableError extends Error {
  readonly code = 'CATALOG_UNAVAILABLE';
  constructor() { super('Catalog is temporarily unavailable.'); this.name = 'CatalogUnavailableError'; }
}
