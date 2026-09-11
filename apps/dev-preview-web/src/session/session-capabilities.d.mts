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
