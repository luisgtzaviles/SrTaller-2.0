export const OPERATIONAL_CAPABILITY_CATALOG: readonly [
  'users.read',
  'users.manage',
  'access_matrix.read',
  'access_matrix.manage',
  'repairs.read',
  'repairs.add_note',
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
