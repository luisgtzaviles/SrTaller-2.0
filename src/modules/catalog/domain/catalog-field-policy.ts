/** Tenant-wide catalog data-quality policy.  This registry deliberately has no
 * Composer behaviour: later consumers decide how to use its effective values. */
export const catalogFieldPolicySchemaVersion = 1 as const;
export const catalogFieldPolicyLevels = ['REQUIRED', 'ESSENTIAL', 'OPTIONAL'] as const;
export type CatalogFieldPolicyLevel = (typeof catalogFieldPolicyLevels)[number];
export const catalogFieldPolicyKeys = ['kind', 'title', 'description', 'category', 'brand', 'supplierItemCode', 'sku', 'barcode', 'referenceCost', 'basePrice'] as const;
export type CatalogFieldPolicyKey = (typeof catalogFieldPolicyKeys)[number];
export type CatalogFieldPolicyLevelsByKey = Readonly<Record<CatalogFieldPolicyKey, CatalogFieldPolicyLevel>>;

export type CatalogFieldPolicyRegistryEntry = Readonly<{
  key: CatalogFieldPolicyKey;
  label: string;
  allowedLevels: readonly CatalogFieldPolicyLevel[];
  domainFixed: boolean;
  defaultLevel: CatalogFieldPolicyLevel;
  /** Current Composer UI metadata only; no runtime consumer is enabled in this slice. */
  capturePresentation: 'essential' | 'optional';
  referenceCostSensitive: boolean;
}>;

const entry = (key: CatalogFieldPolicyKey, label: string, allowedLevels: readonly CatalogFieldPolicyLevel[], domainFixed: boolean, defaultLevel: CatalogFieldPolicyLevel, capturePresentation: 'essential' | 'optional', referenceCostSensitive = false): CatalogFieldPolicyRegistryEntry => Object.freeze({ key, label, allowedLevels: Object.freeze([...allowedLevels]), domainFixed, defaultLevel, capturePresentation, referenceCostSensitive });

export const catalogFieldPolicyRegistry = Object.freeze([
  entry('kind', 'Tipo', ['REQUIRED'], true, 'REQUIRED', 'essential'),
  entry('title', 'Título', ['REQUIRED'], true, 'REQUIRED', 'essential'),
  entry('description', 'Descripción', catalogFieldPolicyLevels, false, 'OPTIONAL', 'optional'),
  entry('category', 'Categoría', ['REQUIRED'], true, 'REQUIRED', 'optional'),
  entry('brand', 'Marca', catalogFieldPolicyLevels, false, 'OPTIONAL', 'optional'),
  entry('supplierItemCode', 'Código de proveedor', ['OPTIONAL'], true, 'OPTIONAL', 'optional'),
  entry('sku', 'SKU', ['OPTIONAL'], true, 'OPTIONAL', 'optional'),
  entry('barcode', 'Código de barras', ['OPTIONAL'], true, 'OPTIONAL', 'optional'),
  entry('referenceCost', 'Costo de referencia', catalogFieldPolicyLevels, false, 'OPTIONAL', 'essential', true),
  entry('basePrice', 'Precio base', ['REQUIRED'], true, 'REQUIRED', 'essential'),
] as const);

const byKey = new Map<string, CatalogFieldPolicyRegistryEntry>(catalogFieldPolicyRegistry.map((value) => [value.key, value]));

export function productDefaultCatalogFieldPolicyLevels(): CatalogFieldPolicyLevelsByKey {
  return Object.freeze(Object.fromEntries(catalogFieldPolicyRegistry.map((value) => [value.key, value.defaultLevel])) as CatalogFieldPolicyLevelsByKey);
}

export function validateCatalogFieldPolicyLevels(value: unknown): CatalogFieldPolicyLevelsByKey {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new TypeError('Catalog field policy levels are invalid.');
  const input = value as Readonly<Record<string, unknown>>;
  if (Object.keys(input).some((key) => !byKey.has(key))) throw new TypeError('Catalog field policy contains an unknown field.');
  const output: Record<CatalogFieldPolicyKey, CatalogFieldPolicyLevel> = {} as Record<CatalogFieldPolicyKey, CatalogFieldPolicyLevel>;
  for (const definition of catalogFieldPolicyRegistry) {
    const candidate = input[definition.key] ?? definition.defaultLevel;
    if (typeof candidate !== 'string' || !definition.allowedLevels.includes(candidate as CatalogFieldPolicyLevel)) throw new TypeError(`Catalog field policy level is invalid for ${definition.key}.`);
    output[definition.key] = candidate as CatalogFieldPolicyLevel;
  }
  return Object.freeze(output);
}

export function catalogFieldIsEssential(level: CatalogFieldPolicyLevel): boolean { return level === 'REQUIRED' || level === 'ESSENTIAL'; }
