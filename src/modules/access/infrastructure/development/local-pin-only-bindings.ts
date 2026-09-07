import { timingSafeEqual } from 'node:crypto';

import type { LocalPinOnlyCredentialResolver } from '../../application/ports/local-pin-only-credential-resolver.port.js';

const localPinPattern = /^[0-9]{4}$/u;
const fixturePinPattern = /^[0-9]{6}$/u;

const fixtureDefinitions = Object.freeze([
  Object.freeze({ userId: '00000000-0000-4000-8000-000000000501', environmentKey: 'SR_LOCAL_PIN_JORGE' }),
  Object.freeze({ userId: '00000000-0000-4000-8000-000000000502', environmentKey: 'SR_LOCAL_PIN_MARIA' }),
  Object.freeze({ userId: '00000000-0000-4000-8000-000000000503', environmentKey: 'SR_LOCAL_PIN_CARLOS' }),
]);

type LocalPinOnlyBinding = Readonly<{
  userId: string;
  localPin: string;
  credentialPin: string;
}>;

/**
 * Local product iteration only: four displayed digits select a fixture-bound
 * six-digit credential, which is still verified by the canonical PIN hasher.
 */
export function createLocalPinOnlyBindings(
  environment: Readonly<Record<string, string | undefined>>,
): LocalPinOnlyCredentialResolver {
  if (environment.NODE_ENV !== 'development' || environment.SR_DB_ENVIRONMENT !== 'development') {
    throw new Error('Local PIN-only login is unavailable outside development.');
  }
  const bindings: LocalPinOnlyBinding[] = fixtureDefinitions.map((definition) => {
    const credentialPin = environment[definition.environmentKey];
    if (typeof credentialPin !== 'string' || !fixturePinPattern.test(credentialPin)) {
      throw new Error('Local PIN-only fixture configuration is invalid.');
    }
    return Object.freeze({
      userId: definition.userId,
      localPin: credentialPin.slice(-4),
      credentialPin,
    });
  });
  const localLuisPin = environment.SR_LOCAL_PIN_LUIS;
  const localLuisUserId = environment.SR_LOCAL_USER_LUIS_ID;
  if (localLuisPin !== undefined || localLuisUserId !== undefined) {
    if (
      typeof localLuisUserId !== 'string' ||
      !/^[0-9a-f-]{36}$/u.test(localLuisUserId) ||
      typeof localLuisPin !== 'string' ||
      !fixturePinPattern.test(localLuisPin)
    ) {
      throw new Error('Local admin PIN-only configuration is invalid.');
    }
    bindings.push(Object.freeze({
      userId: localLuisUserId,
      localPin: localLuisPin.slice(-4),
      credentialPin: localLuisPin,
    }));
  }
  if (new Set(bindings.map(({ localPin }) => localPin)).size !== bindings.length) {
    throw new Error('Local PIN-only fixture collision is not allowed.');
  }
  return Object.freeze({
    resolve: (pin: string, eligibleUserIds: readonly string[]) =>
      resolveLocalPinOnlyBinding(bindings, pin, eligibleUserIds),
  });
}

function resolveLocalPinOnlyBinding(
  bindings: readonly LocalPinOnlyBinding[],
  pin: string,
  eligibleUserIds: readonly string[],
): LocalPinOnlyBinding | null {
  if (!localPinPattern.test(pin)) return null;
  const eligible = new Set(eligibleUserIds);
  const matches = bindings.filter((binding) => {
    const expected = Buffer.from(binding.localPin, 'utf8');
    const presented = Buffer.from(pin, 'utf8');
    try {
      return eligible.has(binding.userId) && expected.length === presented.length && timingSafeEqual(expected, presented);
    } finally {
      expected.fill(0);
      presented.fill(0);
    }
  });
  return matches.length === 1 ? matches[0] ?? null : null;
}
