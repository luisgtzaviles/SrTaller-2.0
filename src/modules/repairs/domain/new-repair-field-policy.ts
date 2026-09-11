export const newRepairFieldStates = Object.freeze([
  'fixed', 'required', 'optional', 'hidden', 'conditional',
] as const);

export type NewRepairFieldState = (typeof newRepairFieldStates)[number];
export type NewRepairFieldSection = 'customer' | 'equipment' | 'reception' | 'access' | 'commitment';
export type NewRepairFieldClassification = 'core' | 'configurable' | 'conditional';

export interface NewRepairFieldRegistryEntry {
  readonly key: string;
  readonly label: string;
  readonly section: NewRepairFieldSection;
  readonly classification: NewRepairFieldClassification;
  readonly allowedStates: readonly NewRepairFieldState[];
  readonly systemDefault: NewRepairFieldState;
  readonly condition: string | null;
  readonly available: boolean;
  readonly sensitive: boolean;
  readonly payloadKeys: readonly string[];
}

const configurable = Object.freeze(['required', 'optional', 'hidden'] as const);

function field(entry: NewRepairFieldRegistryEntry): NewRepairFieldRegistryEntry {
  return Object.freeze({ ...entry, allowedStates: Object.freeze([...entry.allowedStates]), payloadKeys: Object.freeze([...entry.payloadKeys]) });
}

/** Product-owned V1 registry. Value catalogs and access secrets are separate. */
export const newRepairFieldRegistry = Object.freeze([
  field({ key: 'customerGivenName', label: 'Nombre', section: 'customer', classification: 'core', allowedStates: ['fixed'], systemDefault: 'fixed', condition: null, available: true, sensitive: false, payloadKeys: ['customerId', 'customerGivenName'] }),
  field({ key: 'customerFamilyName', label: 'Apellido(s)', section: 'customer', classification: 'configurable', allowedStates: configurable, systemDefault: 'optional', condition: null, available: true, sensitive: false, payloadKeys: ['customerFamilyName'] }),
  field({ key: 'customerPhone', label: 'Teléfono de esta reparación', section: 'customer', classification: 'configurable', allowedStates: configurable, systemDefault: 'optional', condition: null, available: true, sensitive: false, payloadKeys: ['customerPhone'] }),
  field({ key: 'deviceType', label: 'Tipo', section: 'equipment', classification: 'configurable', allowedStates: configurable, systemDefault: 'optional', condition: null, available: true, sensitive: false, payloadKeys: ['deviceType'] }),
  field({ key: 'deviceBrand', label: 'Marca', section: 'equipment', classification: 'configurable', allowedStates: configurable, systemDefault: 'required', condition: null, available: true, sensitive: false, payloadKeys: ['deviceBrand'] }),
  field({ key: 'deviceModel', label: 'Modelo', section: 'equipment', classification: 'configurable', allowedStates: configurable, systemDefault: 'required', condition: null, available: true, sensitive: false, payloadKeys: ['deviceModel', 'canonicalModelId'] }),
  field({ key: 'deviceIdentifier', label: 'IMEI / Serie', section: 'equipment', classification: 'configurable', allowedStates: configurable, systemDefault: 'optional', condition: null, available: true, sensitive: false, payloadKeys: ['deviceIdentifier', 'deviceIdentifierUnavailable'] }),
  field({ key: 'deviceColor', label: 'Color', section: 'equipment', classification: 'configurable', allowedStates: configurable, systemDefault: 'optional', condition: null, available: true, sensitive: false, payloadKeys: ['deviceColor'] }),
  field({ key: 'physicalConditionSummary', label: 'Condición física', section: 'equipment', classification: 'configurable', allowedStates: configurable, systemDefault: 'optional', condition: null, available: true, sensitive: false, payloadKeys: ['physicalConditionSummary'] }),
  field({ key: 'simIncluded', label: 'SIM / chip', section: 'equipment', classification: 'configurable', allowedStates: configurable, systemDefault: 'optional', condition: null, available: true, sensitive: false, payloadKeys: ['simIncluded'] }),
  field({ key: 'memoryCardIncluded', label: 'Memoria / tarjeta', section: 'equipment', classification: 'configurable', allowedStates: configurable, systemDefault: 'optional', condition: null, available: true, sensitive: false, payloadKeys: ['memoryCardIncluded'] }),
  field({ key: 'receivedPowerState', label: 'Estado al recibir', section: 'equipment', classification: 'configurable', allowedStates: configurable, systemDefault: 'optional', condition: null, available: true, sensitive: false, payloadKeys: ['receivedPowerState'] }),
  field({ key: 'otherAccessories', label: 'Otros accesorios', section: 'equipment', classification: 'conditional', allowedStates: ['conditional'], systemDefault: 'conditional', condition: 'registerOtherAccessories', available: true, sensitive: false, payloadKeys: ['otherAccessories'] }),
  field({ key: 'reportedIssue', label: 'Problemas reportados', section: 'reception', classification: 'core', allowedStates: ['fixed'], systemDefault: 'fixed', condition: null, available: true, sensitive: false, payloadKeys: ['reportedProblems'] }),
  field({ key: 'customerNarrative', label: 'Relato del cliente', section: 'reception', classification: 'configurable', allowedStates: configurable, systemDefault: 'optional', condition: null, available: true, sensitive: false, payloadKeys: ['customerNarrative'] }),
  field({ key: 'warrantyReviewRequested', label: 'Solicita revisión por garantía', section: 'reception', classification: 'configurable', allowedStates: ['required', 'optional'], systemDefault: 'optional', condition: null, available: true, sensitive: false, payloadKeys: ['warrantyReviewRequested'] }),
  field({ key: 'previousRepairId', label: 'Reparación anterior', section: 'reception', classification: 'conditional', allowedStates: ['conditional'], systemDefault: 'conditional', condition: 'warrantyReviewRequested', available: true, sensitive: false, payloadKeys: ['previousRepairId'] }),
  field({ key: 'differentDeliverer', label: 'Entrega una persona distinta al cliente', section: 'reception', classification: 'configurable', allowedStates: ['required', 'optional'], systemDefault: 'optional', condition: null, available: true, sensitive: false, payloadKeys: ['differentDeliverer'] }),
  field({ key: 'deliveredByName', label: 'Persona que entrega', section: 'reception', classification: 'conditional', allowedStates: ['conditional'], systemDefault: 'conditional', condition: 'differentDeliverer', available: true, sensitive: false, payloadKeys: ['deliveredByName'] }),
  field({ key: 'requiresRiskAcceptance', label: 'Requiere aceptación de riesgos', section: 'reception', classification: 'configurable', allowedStates: ['required', 'optional'], systemDefault: 'optional', condition: null, available: true, sensitive: false, payloadKeys: ['requiresRiskAcceptance'] }),
  field({ key: 'acceptedInterventionRisks', label: 'Riesgos aceptados', section: 'reception', classification: 'conditional', allowedStates: ['conditional'], systemDefault: 'conditional', condition: 'requiresRiskAcceptance', available: true, sensitive: false, payloadKeys: ['acceptedRiskIds', 'documentedRiskSummary'] }),
  field({ key: 'deviceAccessType', label: 'Tipo de bloqueo', section: 'access', classification: 'configurable', allowedStates: configurable, systemDefault: 'optional', condition: null, available: true, sensitive: false, payloadKeys: ['deviceAccessType'] }),
  field({ key: 'estimatedDeliveryLocal', label: 'Estimación de entrega', section: 'commitment', classification: 'configurable', allowedStates: configurable, systemDefault: 'optional', condition: null, available: true, sensitive: false, payloadKeys: ['estimatedDeliveryLocal'] }),
  field({ key: 'initialBudgetAmount', label: 'Presupuesto inicial', section: 'commitment', classification: 'configurable', allowedStates: configurable, systemDefault: 'optional', condition: null, available: true, sensitive: false, payloadKeys: ['initialBudgetAmount'] }),
  field({ key: 'deposit', label: 'Anticipo', section: 'commitment', classification: 'conditional', allowedStates: ['conditional'], systemDefault: 'conditional', condition: 'cashModuleEnabled', available: false, sensitive: false, payloadKeys: [] }),
] satisfies readonly NewRepairFieldRegistryEntry[]);

export type NewRepairFieldKey = (typeof newRepairFieldRegistry)[number]['key'];
export type NewRepairFieldStates = Readonly<Record<NewRepairFieldKey, NewRepairFieldState>>;
export const newRepairPolicySchemaVersion = 1;

export function systemNewRepairFieldStates(): NewRepairFieldStates {
  return Object.freeze(Object.fromEntries(newRepairFieldRegistry.map((entry) => [entry.key, entry.systemDefault]))) as NewRepairFieldStates;
}

export function validateNewRepairFieldStates(value: unknown): NewRepairFieldStates {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new TypeError('New Repair field states must be an object.');
  const input = value as Readonly<Record<string, unknown>>;
  const known = new Set(newRepairFieldRegistry.map((entry) => entry.key));
  if (Object.keys(input).some((key) => !known.has(key))) throw new TypeError('New Repair field policy contains an unknown field.');
  const states = { ...systemNewRepairFieldStates() } as Record<string, NewRepairFieldState>;
  for (const entry of newRepairFieldRegistry) {
    const state = input[entry.key] ?? entry.systemDefault;
    if (typeof state !== 'string' || !entry.allowedStates.includes(state as NewRepairFieldState)) throw new TypeError(`New Repair field state is not allowed: ${entry.key}.`);
    if (!entry.available && state !== entry.systemDefault) throw new TypeError(`New Repair field is unavailable: ${entry.key}.`);
    states[entry.key] = state as NewRepairFieldState;
  }
  return Object.freeze(states) as NewRepairFieldStates;
}
