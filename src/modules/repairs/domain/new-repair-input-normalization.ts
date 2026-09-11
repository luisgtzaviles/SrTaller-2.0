export type InputNormalizationStrategy =
  | 'person-name'
  | 'catalog-label'
  | 'brand-label'
  | 'model-label'
  | 'problem-label'
  | 'sentence-text'
  | 'identifier'
  | 'phone'
  | 'monetary'
  | 'secret'
  | 'none';

export const newRepairInputNormalization = Object.freeze({
  customerGivenName: 'person-name',
  customerFamilyName: 'person-name',
  customerPhone: 'phone',
  deviceType: 'catalog-label',
  deviceBrand: 'brand-label',
  deviceModel: 'model-label',
  deviceIdentifier: 'identifier',
  deviceIdentifierUnavailable: 'none',
  deviceColor: 'catalog-label',
  distinctiveSigns: 'sentence-text',
  physicalConditionSummary: 'sentence-text',
  simIncluded: 'none',
  memoryCardIncluded: 'none',
  receivedPowerState: 'none',
  otherAccessories: 'sentence-text',
  reportedProblem: 'problem-label',
  customerNarrative: 'sentence-text',
  warrantyReviewRequested: 'none',
  previousRepairId: 'identifier',
  differentDeliverer: 'none',
  deliveredByName: 'person-name',
  requiresRiskAcceptance: 'none',
  acceptedRiskIds: 'none',
  documentedRiskSummary: 'sentence-text',
  deviceAccessType: 'none',
  deviceAccessSecret: 'secret',
  devicePattern: 'secret',
  estimatedDeliveryLocal: 'none',
  initialBudgetAmount: 'monetary',
} satisfies Readonly<Record<string, InputNormalizationStrategy>>);

export const relatedRepairCatalogInputNormalization = Object.freeze({
  risk: 'catalog-label',
  deviceType: 'catalog-label',
  brand: 'brand-label',
  model: 'model-label',
  problemCategory: 'problem-label',
} satisfies Readonly<Record<string, InputNormalizationStrategy>>);

export type NewRepairNormalizedField = keyof typeof newRepairInputNormalization;
export type RelatedRepairCatalogNormalizedField = keyof typeof relatedRepairCatalogInputNormalization;

const deliberateBrandCasing = Object.freeze(new Map<string, string>([
  ['lg', 'LG'],
  ['oppo', 'OPPO'],
  ['vivo', 'vivo'],
  ['realme', 'realme'],
  ['hmd', 'HMD'],
]));

const technicalTokens = Object.freeze([
  'Face ID',
  'Touch ID',
  'USB-C',
  'iPhone',
  'iPad',
  'macOS',
  'Wi-Fi',
  'microSD',
  'eSIM',
  'IMEI',
  'SIM',
  'OLED',
  'LCD',
  'NFC',
  'GPS',
  'HDMI',
  'SSD',
  'USB',
  '5G',
] as const);

export function compactInputWhitespace(value: string): string {
  return value.trim().replace(/\s+/gu, ' ');
}

export function normalizeInputLookupKey(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/\p{Mark}+/gu, '')
    .toLocaleLowerCase('es-MX')
    .replace(/[^\p{Letter}\p{Number}]+/gu, ' ')
    .trim()
    .replace(/\s+/gu, ' ');
}

function hasUniformLetterCase(value: string): boolean {
  return value === value.toLocaleLowerCase('es-MX') || value === value.toLocaleUpperCase('es-MX');
}

function upperCaseFirstLetter(value: string): string {
  return value.replace(/\p{Letter}/u, (letter) => letter.toLocaleUpperCase('es-MX'));
}

function escapeRegularExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

function restoreTechnicalCasing(value: string): string {
  return technicalTokens.reduce((current, token) => current.replace(
    new RegExp(`(^|[^\\p{Letter}\\p{Number}])(${escapeRegularExpression(token)})(?=$|[^\\p{Letter}\\p{Number}])`, 'giu'),
    (_match, prefix: string) => `${prefix}${token}`,
  ), value);
}

export function normalizePersonName(value: string): string {
  return compactInputWhitespace(value)
    .toLocaleLowerCase('es-MX')
    .replace(/(^|[\s'-])(\p{Letter})/gu, (_match, prefix: string, letter: string) => `${prefix}${letter.toLocaleUpperCase('es-MX')}`);
}

export function normalizeCatalogLabel(value: string): string {
  const compacted = compactInputWhitespace(value);
  if (/^#[0-9a-f]{6}$/iu.test(compacted)) return compacted.toLocaleUpperCase('en-US');
  const cased = hasUniformLetterCase(compacted) ? compacted.toLocaleLowerCase('es-MX') : compacted;
  return restoreTechnicalCasing(upperCaseFirstLetter(cased));
}

export function normalizeBrandLabel(value: string): string {
  const compacted = compactInputWhitespace(value);
  const deliberate = deliberateBrandCasing.get(compacted.toLocaleLowerCase('es-MX'));
  if (deliberate) return deliberate;
  if (!hasUniformLetterCase(compacted)) return compacted;
  return upperCaseFirstLetter(compacted.toLocaleLowerCase('es-MX'));
}

export function normalizeModelLabel(value: string): string {
  return compactInputWhitespace(value);
}

export function normalizeProblemLabel(value: string): string {
  return normalizeCatalogLabel(value);
}

export function normalizeSentenceText(value: string): string {
  const compacted = compactInputWhitespace(value);
  const cased = hasUniformLetterCase(compacted) ? compacted.toLocaleLowerCase('es-MX') : compacted;
  return restoreTechnicalCasing(upperCaseFirstLetter(cased));
}

export function normalizeIdentifier(value: string): string {
  return value.trim();
}

export function normalizeInputByStrategy(strategy: InputNormalizationStrategy, value: string): string {
  switch (strategy) {
    case 'person-name': return normalizePersonName(value);
    case 'catalog-label': return normalizeCatalogLabel(value);
    case 'brand-label': return normalizeBrandLabel(value);
    case 'model-label': return normalizeModelLabel(value);
    case 'problem-label': return normalizeProblemLabel(value);
    case 'sentence-text': return normalizeSentenceText(value);
    case 'identifier': return normalizeIdentifier(value);
    case 'phone':
    case 'monetary':
    case 'secret':
    case 'none': return value;
  }
}

export function normalizeNewRepairInput(
  field: NewRepairNormalizedField,
  value: string,
  canonicalLabel?: string | null,
): string {
  if (canonicalLabel !== undefined && canonicalLabel !== null) return canonicalLabel;
  return normalizeInputByStrategy(newRepairInputNormalization[field], value);
}

export function normalizeRelatedRepairCatalogInput(
  field: RelatedRepairCatalogNormalizedField,
  value: string,
): string {
  return normalizeInputByStrategy(relatedRepairCatalogInputNormalization[field], value);
}
