import { createHash, randomUUID } from 'node:crypto';

import { CatalogInputError, normalizeCatalogIdentifier } from './catalog-item.js';
import type { CatalogIdentifierScheme, CatalogItemKind } from './catalog-item.js';

export const BULK_CATALOG_REQUIRED_LIMIT = 1_000;
export const BULK_CATALOG_TARGET_LIMIT = 10_000;
export const BULK_CATALOG_REJECT_LIMIT = 10_000;
export const BULK_CATALOG_CHARACTERIZATION_ROWS = 50_000;
export const BULK_CATALOG_RAW_RETENTION_DAYS = 90;

export type BulkCatalogMode = 'FULL' | 'COMPACT';
export type BulkCatalogClassification = 'NEW' | 'UPDATE' | 'REACTIVATE' | 'UNCHANGED' | 'CANDIDATE' | 'PENDING_REFERENCE' | 'AMBIGUOUS' | 'CONFLICT' | 'INVALID';
export type BulkCatalogDecision = 'UNRESOLVED' | 'APPLY' | 'EXCLUDE';
export type BulkCatalogMatchOrigin = 'NONE' | 'INTERNAL_IDENTIFIER' | 'TRUSTED_HISTORY' | 'CANDIDATE' | 'OWNER_SELECTED';

export type BulkCatalogCandidateMatch = Readonly<{
  itemId: string;
  title: string;
  status: 'ACTIVE' | 'INACTIVE';
  expectedItemVersion: number;
  score: number;
  evidence: readonly string[];
  differences: readonly string[];
  contradictions: readonly string[];
}>;

export type BulkCatalogRowInput = Readonly<{
  kind: CatalogItemKind | null;
  supplierObservedTitle: string | null;
  title: string | null;
  description: string | null;
  category: string | null;
  brand: string | null;
  supplierItemCode: string | null;
  sku: string | null;
  barcode: string | null;
  basePriceMinor: number | null;
  referenceCostMinor: number | null;
}>;

const kinds = new Set<CatalogItemKind>(['PART', 'PRODUCT', 'SERVICE', 'SUPPLY']);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

export function requiredText(value: unknown, parameter: string, max: number): string {
  if (typeof value !== 'string') throw new CatalogInputError(parameter);
  const clean = value.replace(/\s+/gu, ' ').trim();
  if (!clean || clean.length > max) throw new CatalogInputError(parameter);
  return clean;
}
export function optionalText(value: unknown, parameter: string, max: number): string | null {
  if (value === null || value === undefined || value === '') return null;
  return requiredText(value, parameter, max);
}
export function optionalObservedText(value: unknown, parameter: string, max: number): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new CatalogInputError(parameter);
  return value;
}
export function requiredUuid(value: unknown, parameter: string): string {
  if (typeof value !== 'string' || !uuid.test(value)) throw new CatalogInputError(parameter);
  return value;
}
export function positiveVersion(value: unknown, parameter = 'expectedVersion'): number {
  if (!Number.isSafeInteger(value) || Number(value) < 1) throw new CatalogInputError(parameter);
  return Number(value);
}
export function catalogKind(value: unknown, nullable = false): CatalogItemKind | null {
  if (nullable && (value === null || value === undefined || value === '')) return null;
  if (typeof value !== 'string' || !kinds.has(value as CatalogItemKind)) throw new CatalogInputError('kind');
  return value as CatalogItemKind;
}
export function normalizeIdentifier(scheme: CatalogIdentifierScheme, value: string | null): string | null {
  if (value === null) return null;
  return normalizeCatalogIdentifier(scheme, value.normalize('NFKC'));
}
export function normalizeReference(value: string | null): string | null {
  return value === null ? null : value.normalize('NFD').replace(/[\u0300-\u036f]/gu, '').toLocaleLowerCase('es-MX').replace(/\s+/gu, ' ').trim();
}
function money(value: unknown, parameter: string): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (!Number.isSafeInteger(value) || Number(value) < 0) throw new CatalogInputError(parameter);
  return Number(value);
}
export function parseBulkRows(value: unknown, mode: BulkCatalogMode): readonly BulkCatalogRowInput[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > BULK_CATALOG_REJECT_LIMIT) throw new CatalogInputError('rows');
  return Object.freeze(value.map((raw, index) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new CatalogInputError(`rows.${index}`);
    const row = raw as Record<string, unknown>;
    const sku = normalizeIdentifier('SKU', optionalText(row.sku, `rows.${index}.sku`, 64));
    const barcode = normalizeIdentifier('BARCODE', optionalText(row.barcode, `rows.${index}.barcode`, 64));
    const parsed = Object.freeze({
      kind: catalogKind(row.kind, mode === 'COMPACT'),
      supplierObservedTitle: optionalObservedText(row.supplierObservedTitle ?? row.title, `rows.${index}.supplierObservedTitle`, 240),
      title: optionalText(row.title, `rows.${index}.title`, 240),
      description: optionalText(row.description, `rows.${index}.description`, 4_000),
      category: optionalText(row.category, `rows.${index}.category`, 160),
      brand: optionalText(row.brand, `rows.${index}.brand`, 160),
      supplierItemCode: optionalText(row.supplierItemCode, `rows.${index}.supplierItemCode`, 160),
      sku, barcode,
      basePriceMinor: money(row.basePriceMinor, `rows.${index}.basePriceMinor`),
      referenceCostMinor: money(row.referenceCostMinor, `rows.${index}.referenceCostMinor`),
    });
    if (!sku && !barcode && !parsed.supplierItemCode && mode === 'COMPACT') throw new CatalogInputError(`rows.${index}.identifier`);
    if (mode === 'FULL' && (!parsed.kind || !parsed.title || !parsed.category || parsed.basePriceMinor === null)) throw new CatalogInputError(`rows.${index}.required`);
    return parsed;
  }));
}

export function sha256(value: unknown): string { return createHash('sha256').update(JSON.stringify(value)).digest('hex'); }
export function newId(): string { return randomUUID(); }
export function retentionDate(now: Date): Date { const value = new Date(now); value.setUTCDate(value.getUTCDate() + BULK_CATALOG_RAW_RETENTION_DAYS); return value; }
