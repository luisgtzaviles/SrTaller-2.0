/**
 * Derives a human-readable proposal from an observed Brand without changing
 * its raw supplier provenance or its normalized identity. A canonical exact
 * match always wins; otherwise only uniform human-readable casing is adjusted.
 * Short all-uppercase values remain intact because they are often acronyms.
 */
export function normalizeBrandDisplay(value, canonicalBrands = []) {
  const normalized = String(value ?? '').normalize('NFKC').trim().replace(/\s+/gu, ' ');
  if (!normalized) return '';
  const key = normalized.normalize('NFD').replace(/[\u0300-\u036f]/gu, '').toLocaleLowerCase('es-MX');
  const canonical = canonicalBrands.find((name) => String(name ?? '').normalize('NFKC').trim().replace(/\s+/gu, ' ').normalize('NFD').replace(/[\u0300-\u036f]/gu, '').toLocaleLowerCase('es-MX') === key);
  if (canonical) return String(canonical).normalize('NFKC').trim().replace(/\s+/gu, ' ');
  if (!/^[\p{L}\p{M}][\p{L}\p{M}'’-]*(?:[ -][\p{L}\p{M}][\p{L}\p{M}'’-]*)*$/u.test(normalized)) return normalized;
  const letters = normalized.replace(/[^\p{L}\p{M}]/gu, '');
  if (!letters) return normalized;
  const allUpper = letters === letters.toLocaleUpperCase('es-MX');
  const allLower = letters === letters.toLocaleLowerCase('es-MX');
  if (!allUpper && !allLower) return normalized;
  if (allUpper && !/[ -]/u.test(normalized) && letters.length <= 3) return normalized;
  return normalized.split(/([ -])/u).map((part) => part === ' ' || part === '-' ? part : `${part.slice(0, 1).toLocaleUpperCase('es-MX')}${part.slice(1).toLocaleLowerCase('es-MX')}`).join('');
}
