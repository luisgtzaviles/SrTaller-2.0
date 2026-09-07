export const OPERATIONAL_CAPABILITY_CATALOG: readonly [
  'users.read',
  'access_matrix.read',
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
