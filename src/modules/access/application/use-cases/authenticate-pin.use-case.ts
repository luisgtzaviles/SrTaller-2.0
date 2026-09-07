import type { AuthenticationUserReader } from '../../../users/index.js';
import {
  createPinAuthenticationProof,
} from '../../domain/pin-credential.js';
import { parseAuthenticatePinInput, parseTrustedPinContext } from '../pin-input.js';
import type { PinCredentialRepositoryPort } from '../ports/pin-credential-repository.port.js';
import type { PinSecretHasherPort } from '../ports/pin-secret-hasher.port.js';

export type PinAuthenticationErrorCode =
  | 'PIN_AUTHENTICATION_DENIED'
  | 'PIN_AUTHENTICATION_TEMPORARILY_UNAVAILABLE';

export class PinAuthenticationError extends Error {
  readonly category = 'Authentication';

  constructor(readonly code: PinAuthenticationErrorCode) {
    super('PIN authentication was not accepted.');
    this.name = 'PinAuthenticationError';
  }

  toJSON(): Readonly<{
    name: string;
    category: 'Authentication';
    code: PinAuthenticationErrorCode;
    message: string;
  }> {
    return Object.freeze({
      name: this.name,
      category: this.category,
      code: this.code,
      message: this.message,
    });
  }
}

export class AuthenticatePinUseCase {
  constructor(
    private readonly repository: PinCredentialRepositoryPort,
    private readonly users: AuthenticationUserReader,
    private readonly hasher: PinSecretHasherPort,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(contextValue: unknown, value: unknown) {
    const context = parseTrustedPinContext(contextValue);
    const input = parseAuthenticatePinInput(value);
    let user;
    try {
      user = await this.users.findAuthenticationUser(
        { tenantId: context.tenantId },
        input.userId,
      );
    } catch {
      throw new PinAuthenticationError(
        'PIN_AUTHENTICATION_TEMPORARILY_UNAVAILABLE',
      );
    }
    const occurredAt = this.now().toISOString();
    const result = await this.repository.authenticateAttempt(
      context,
      {
        userId: input.userId,
        userEligible: user?.status === 'active',
        occurredAt,
      },
      (stored) =>
        this.hasher.verify({
          tenantId: context.tenantId,
          userId: input.userId,
          pin: input.pin,
          stored,
        }),
    );
    if (result.status === 'temporarily-unavailable') {
      throw new PinAuthenticationError(
        'PIN_AUTHENTICATION_TEMPORARILY_UNAVAILABLE',
      );
    }
    if (result.status !== 'authenticated' || user?.status !== 'active') {
      throw new PinAuthenticationError('PIN_AUTHENTICATION_DENIED');
    }
    return createPinAuthenticationProof({
      context,
      user,
      credentialVersion: result.credentialVersion,
      authenticatedAt: occurredAt,
    });
  }
}
