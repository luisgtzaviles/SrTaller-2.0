import type { CatalogItemKind } from './catalog-item.js';
import { normalizeReference } from './bulk-catalog.js';
import type { BulkCatalogCandidateMatch, BulkCatalogRowInput } from './bulk-catalog.js';

export const BULK_CATALOG_MATCH_ALGORITHM_VERSION = 1;
export const BULK_CATALOG_MAX_CANDIDATES = 3;
export const BULK_CATALOG_MAX_CANDIDATE_POOL = 200;

export type SupplierHistoryCandidate = Readonly<{
  itemId: string;
  title: string;
  observedTitle: string;
  kind: CatalogItemKind;
  categoryIdentity: string | null;
  brandIdentity: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  version: number;
}>;

type MatchResult = Readonly<{
  candidates: readonly BulkCatalogCandidateMatch[];
  contradictory: boolean;
}>;

const protectedWords = new Set([
  'pro', 'plus', 'max', 'mini', 'ultra', 'oled', 'incell', 'amoled', 'lcd',
  'original', 'calidad', 'negro', 'negra', 'blanco', 'blanca', 'azul', 'rojo',
  'roja', 'rosa', 'verde', 'morado', 'morada', 'dorado', 'dorada', 'gris',
  'silver', 'gold', 'black', 'white', 'blue', 'red', 'pink', 'green', 'purple',
]);

function tokens(value: string | null): readonly string[] {
  return Object.freeze((normalizeReference(value) ?? '')
    .replace(/[^a-z0-9]+/gu, ' ')
    .split(' ')
    .filter(Boolean));
}

function identityTokens(values: readonly string[]): Set<string> {
  return new Set(values.filter((value) => protectedWords.has(value) || /^\d+(?:\.\d+)?(?:gb|tb|mb|mm|cm|in)?$/u.test(value)));
}

function uniqueDifferences(left: readonly string[], right: readonly string[]): readonly string[] {
  const other = new Set(right);
  return Object.freeze([...new Set(left.filter((value) => !other.has(value)))]);
}

function structuralIdentity(kind: CatalogItemKind | null, category: string | null, brand: string | null): string {
  return `${kind ?? ''}:${category ?? ''}:${brand ?? ''}`;
}

export function buildSupplierHistoryTokenIndex(history: readonly SupplierHistoryCandidate[]): ReadonlyMap<string, readonly SupplierHistoryCandidate[]> {
  const mutable = new Map<string, SupplierHistoryCandidate[]>();
  for (const candidate of history) {
    for (const token of new Set(tokens(candidate.observedTitle))) {
      const bucket = mutable.get(token) ?? [];
      bucket.push(candidate);
      mutable.set(token, bucket);
    }
  }
  return new Map([...mutable].map(([token, values]) => [token, Object.freeze(values)]));
}

export function matchSupplierHistoryCandidates(
  proposal: BulkCatalogRowInput,
  categoryIdentity: string | null,
  brandIdentity: string | null,
  index: ReadonlyMap<string, readonly SupplierHistoryCandidate[]>,
): MatchResult {
  const observedTokens = tokens(proposal.supplierObservedTitle ?? proposal.title);
  if (observedTokens.length < 2 || !proposal.kind) return Object.freeze({ candidates: Object.freeze([]), contradictory: false });
  const pool = new Map<string, SupplierHistoryCandidate[]>();
  const boundedBuckets = [...new Set(observedTokens)].map((token) => index.get(token) ?? []).filter((bucket) => bucket.length > 0).sort((left, right) => left.length - right.length).slice(0, 4);
  for (const bucket of boundedBuckets) for (const candidate of bucket) {
    if (!pool.has(candidate.itemId) && pool.size >= BULK_CATALOG_MAX_CANDIDATE_POOL) continue;
    const values = pool.get(candidate.itemId) ?? []; values.push(candidate); pool.set(candidate.itemId, values);
  }
  const observedIdentity = identityTokens(observedTokens);
  const accepted: BulkCatalogCandidateMatch[] = [];
  let contradictory = false;
  for (const observations of pool.values()) {
    let best: BulkCatalogCandidateMatch | null = null;
    for (const candidate of observations) {
      const candidateTokens = tokens(candidate.observedTitle);
      const observedSet = new Set(observedTokens); const candidateSet = new Set(candidateTokens);
      const common = [...observedSet].filter((value) => candidateSet.has(value));
      const union = new Set([...observedSet, ...candidateSet]);
      const score = union.size === 0 ? 0 : common.length / union.size;
      if (score < 0.6) continue;
      const candidateIdentity = identityTokens(candidateTokens);
      const protectedDifferences = [...new Set([...identityTokens([...observedIdentity]), ...candidateIdentity])]
        .filter((value) => observedIdentity.has(value) !== candidateIdentity.has(value));
      const structuralContradictions = [
        ...(candidate.kind !== proposal.kind ? ['TYPE'] : []),
        ...(candidate.categoryIdentity !== categoryIdentity ? ['CATEGORY'] : []),
        ...(candidate.brandIdentity !== brandIdentity ? ['BRAND'] : []),
      ];
      const contradictions = [...structuralContradictions, ...protectedDifferences.map((value) => `IDENTITY_TOKEN:${value}`)];
      if (contradictions.length > 0) { contradictory = true; continue; }
      const evidence = [`SAME_SUPPLIER_SOURCE`, `SHARED_TOKENS:${common.join('|')}`, `STRUCTURE:${structuralIdentity(candidate.kind, candidate.categoryIdentity, candidate.brandIdentity)}`];
      const differences = [
        ...uniqueDifferences(observedTokens, candidateTokens).map((value) => `OBSERVED_ONLY:${value}`),
        ...uniqueDifferences(candidateTokens, observedTokens).map((value) => `HISTORY_ONLY:${value}`),
      ];
      const match = Object.freeze({ itemId: candidate.itemId, title: candidate.title, status: candidate.status, expectedItemVersion: candidate.version, score: Number(score.toFixed(4)), evidence: Object.freeze(evidence), differences: Object.freeze(differences), contradictions: Object.freeze([]) });
      if (!best || match.score > best.score) best = match;
    }
    if (best) accepted.push(best);
  }
  accepted.sort((left, right) => right.score - left.score || left.itemId.localeCompare(right.itemId));
  return Object.freeze({ candidates: Object.freeze(accepted.slice(0, BULK_CATALOG_MAX_CANDIDATES)), contradictory });
}
