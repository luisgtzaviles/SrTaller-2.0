import type { AuthenticationUserReader } from '../../../users/index.js';
import {
  createPinAuthenticationProof,
} from '../../domain/pin-credential.js';
import type { AccessUserId } from '../../domain/role-assignment.js';
import { parseTrustedPinContext } from '../pin-input.js';
import type { PinCredentialRepositoryPort } from '../ports/pin-credential-repository.port.js';
import type { PinSecretHasherPort } from '../ports/pin-secret-hasher.port.js';
import { PinAuthenticationError } from './authenticate-pin.use-case.js';
import type { ListApplicableUsersUseCase } from './list-applicable-users.use-case.js';

const pinPattern = /^[0-9]{4}$/u;

function parsePinOnlyInput(value: unknown): string {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value) ||
    Object.keys(value).length !== 1 ||
    Object.keys(value)[0] !== 'pin'
  ) {
    throw new PinAuthenticationError('PIN_AUTHENTICATION_DENIED');
  }
  const pin = (value as Readonly<Record<string, unknown>>).pin;
  if (typeof pin !== 'string' || !pinPattern.test(pin)) {
    throw new PinAuthenticationError('PIN_AUTHENTICATION_DENIED');
  }
  return pin;
}

/**
 * Canonical PIN-only authentication. The anonymous client never selects or
 * receives a User. A keyed lookup narrows the candidate set inside the trusted
 * Branch and exactly one Argon2 real/dummy verification is performed.
 */
export class AuthenticatePinOnlyUseCase {
  constructor(
    private readonly repository: PinCredentialRepositoryPort,
    private readonly users: AuthenticationUserReader,
    private readonly applicableUsers: ListApplicableUsersUseCase,
    private readonly hasher: PinSecretHasherPort,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(contextValue: unknown, value: unknown) {
    const context = parseTrustedPinContext(contextValue);
    const pin = parsePinOnlyInput(value);
    try {
      const applicableIds = await this.applicableUsers.execute({
        tenantId: context.tenantId,
        branchId: context.branchId,
      });
      const records = await Promise.all(
        applicableIds.map((userId) =>
          this.users.findAuthenticationUser(
            { tenantId: context.tenantId },
            userId,
          )),
      );
      const eligibleUsers = records.filter(
        (user): user is NonNullable<typeof user> => user?.status === 'active',
      );
      const eligibleUserIds = eligibleUsers.map(({ userId }) => userId as AccessUserId);
      const result = await this.repository.authenticatePinOnlyAttempt(
        context,
        {
          eligibleUserIds,
          lookupDigest: this.hasher.lookupDigest({
            tenantId: context.tenantId,
            pin,
          }),
          rateLimitPrincipalId: this.hasher.rateLimitPinPrincipalId({
            tenantId: context.tenantId,
          }),
          occurredAt: this.now().toISOString(),
        },
        (userId, stored) => this.hasher.verify({
          tenantId: context.tenantId,
          userId,
          pin,
          stored,
        }),
      );
      if (result.status !== 'authenticated') {
        throw new PinAuthenticationError('PIN_AUTHENTICATION_DENIED');
      }
      const user = eligibleUsers.find(({ userId }) => userId === result.userId);
      if (!user) throw new PinAuthenticationError('PIN_AUTHENTICATION_DENIED');
      return createPinAuthenticationProof({
        context,
        user,
        credentialVersion: result.credentialVersion,
        authenticatedAt: this.now().toISOString(),
      });
    } catch {
      throw new PinAuthenticationError('PIN_AUTHENTICATION_DENIED');
    }
  }
}
