export const OPERATIONAL_CAPABILITY_CATALOG: readonly [
  'users.read',
  'users.manage',
  'access_matrix.read',
  'access_matrix.manage',
  'repairs.read',
  'repairs.add_note',
  'repairs.create',
  'repairs.correct_intake',
  'repairs.classify',
  'repairs.catalogs.read',
  'repairs.catalogs.manage',
  'repairs.configuration.read',
  'repairs.configuration.manage',
  'price_list.read',
  'catalog.manage',
  'catalog.prices.manage',
  'catalog.branch_prices.manage',
  'catalog.reference_cost.read',
  'catalog.reference_cost.manage',
  'catalog.import.prepare',
  'catalog.import.publish',
  'catalog.items.bulk_retire',
  'catalog.suppliers.delete',
];

export type OperationalCapability = typeof OPERATIONAL_CAPABILITY_CATALOG[number];

export class SessionCapabilityContractError extends Error {}

export function parseSessionCapabilities(
  value: unknown,
  authenticated: boolean,
): readonly OperationalCapability[];

export function hasOperationalCapability(
  capabilities: readonly OperationalCapability[],
  required: OperationalCapability,
): boolean;
