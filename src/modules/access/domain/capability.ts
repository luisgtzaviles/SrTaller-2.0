export const ACCESS_CAPABILITY_CATALOG = Object.freeze([
  'users.read',
  'users.manage',
  'access_matrix.read',
  'access_matrix.manage',
  'repairs.read',
  'repairs.add_note',
] as const);

export type CapabilityCode = (typeof ACCESS_CAPABILITY_CATALOG)[number];

const capabilityCodes = new Set<string>(ACCESS_CAPABILITY_CATALOG);

export function parseCapabilityCode(value: unknown): CapabilityCode {
  if (typeof value !== 'string' || !capabilityCodes.has(value)) {
    throw new TypeError('Capability code is invalid.');
  }
  return value as CapabilityCode;
}

/**
 * Effective capabilities are a set. Returning them in catalog order keeps the
 * projection deterministic without treating a role name as authority.
 */
export function composeEffectiveCapabilities(
  capabilities: readonly CapabilityCode[],
): readonly CapabilityCode[] {
  const effective = new Set(capabilities);
  return Object.freeze(
    ACCESS_CAPABILITY_CATALOG.filter((capability) => effective.has(capability)),
  );
}
