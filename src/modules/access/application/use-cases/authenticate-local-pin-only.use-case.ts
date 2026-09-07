import { parseTrustedPinContext } from '../pin-input.js';
import type { AuthenticatePinUseCase } from './authenticate-pin.use-case.js';
import { PinAuthenticationError } from './authenticate-pin.use-case.js';
import type { ListLoginUsersUseCase } from './operational-session.use-cases.js';
import type { LocalPinOnlyCredentialResolver } from '../ports/local-pin-only-credential-resolver.port.js';

const localPinPattern = /^[0-9]{4}$/u;

function parseLocalPin(value: unknown): string {
  const input = value as Readonly<Record<string, unknown>> | null;
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value) ||
    Object.keys(value).length !== 1 ||
    Object.keys(value)[0] !== 'pin' ||
    typeof input?.pin !== 'string' ||
    !localPinPattern.test(input.pin)
  ) {
    throw new PinAuthenticationError('PIN_AUTHENTICATION_DENIED');
  }
  return input.pin;
}

/** Local-only adapter for the Owner-approved daily PIN-only product iteration. */
export class AuthenticateLocalPinOnlyUseCase {
  constructor(
    private readonly enabled: boolean,
    private readonly credentialResolver: LocalPinOnlyCredentialResolver,
    private readonly users: ListLoginUsersUseCase,
    private readonly authenticatePin: AuthenticatePinUseCase,
    private readonly allowProvisionedLocalPins = false,
  ) {}

  async execute(contextValue: unknown, value: unknown) {
    if (!this.enabled) throw new PinAuthenticationError('PIN_AUTHENTICATION_DENIED');
    const context = parseTrustedPinContext(contextValue);
    const pin = parseLocalPin(value);
    try {
      const eligibleUsers = await this.users.execute(context);
      const binding = this.credentialResolver.resolve(
        pin,
        eligibleUsers.map(({ userId }) => userId),
      );
      if (binding) {
        return await this.authenticatePin.execute(context, {
          userId: binding.userId,
          pin: binding.credentialPin,
        });
      }

      if (!this.allowProvisionedLocalPins) {
        throw new PinAuthenticationError('PIN_AUTHENTICATION_DENIED');
      }
      // Product-mode users receive a four-digit local PIN through the
      // administration boundary. The persisted credential remains the
      // canonical six-digit PIN value and no four-digit secret is stored or
      // indexed. A single unambiguous active credential may authenticate.
      const attempts = await Promise.allSettled(eligibleUsers.map(({ userId }) =>
        this.authenticatePin.execute(context, { userId, pin: `00${pin}` }),
      ));
      const accepted = attempts
        .filter((attempt): attempt is PromiseFulfilledResult<Awaited<ReturnType<AuthenticatePinUseCase['execute']>>> => attempt.status === 'fulfilled')
        .map((attempt) => attempt.value);
      if (accepted.length !== 1) throw new PinAuthenticationError('PIN_AUTHENTICATION_DENIED');
      return accepted[0] as Awaited<ReturnType<AuthenticatePinUseCase['execute']>>;
    } catch {
      throw new PinAuthenticationError('PIN_AUTHENTICATION_DENIED');
    }
  }
}
