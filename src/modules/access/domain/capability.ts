export const ACCESS_CAPABILITY_CATALOG = Object.freeze([
  'users.read',
  'users.manage',
  'access_matrix.read',
  'access_matrix.manage',
  'tenant.profile.read',
  'tenant.profile.manage',
  'branches.read',
  'branches.manage',
  'branches.deactivate',
  'stations.read',
  'stations.manage',
  'stations.enrollment.issue',
  'stations.enrollment.cancel',
  'stations.revoke',
  'stations.relink',
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
  'catalog.items.create',
  'catalog.items.update',
  'catalog.items.deactivate',
  'catalog.prices.manage',
  'catalog.branch_prices.manage',
  'catalog.reference_cost.read',
  'catalog.reference_cost.manage',
  'catalog.configuration.read',
  'catalog.configuration.manage',
  'catalog.import.read',
  'catalog.import.prepare',
  'catalog.import.publish',
  'catalog.items.bulk_retire',
  'catalog.suppliers.delete',
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
