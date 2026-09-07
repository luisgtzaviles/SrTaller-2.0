export const OPERATIONAL_CAPABILITY_CATALOG = Object.freeze([
  'users.read',
  'users.manage',
  'access_matrix.read',
  'access_matrix.manage',
  'repairs.read',
  'repairs.add_note',
]);

const capabilityPosition = new Map(
  OPERATIONAL_CAPABILITY_CATALOG.map((capability, index) => [capability, index]),
);

export class SessionCapabilityContractError extends Error {
  constructor() {
    super('Operational Session capabilities did not match the public contract.');
    this.name = 'SessionCapabilityContractError';
  }
}

export function parseSessionCapabilities(value, authenticated) {
  if (!Array.isArray(value)) throw new SessionCapabilityContractError();
  let previousPosition = -1;
  const parsed = value.map((capability) => {
    if (typeof capability !== 'string') throw new SessionCapabilityContractError();
    const position = capabilityPosition.get(capability);
    if (position === undefined || position <= previousPosition) {
      throw new SessionCapabilityContractError();
    }
    previousPosition = position;
    return capability;
  });
  if (!authenticated && parsed.length !== 0) throw new SessionCapabilityContractError();
  return Object.freeze(parsed);
}

export function hasOperationalCapability(capabilities, required) {
  return capabilities.includes(required);
}
