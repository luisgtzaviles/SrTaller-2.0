declare const pinCredentialIdBrand: unique symbol;
declare const pinAuthenticationProofBrand: unique symbol;

export type PinCredentialId = string & {
  readonly [pinCredentialIdBrand]: 'PinCredentialId';
};
export type PinCredentialStatus = 'active' | 'revoked';

export const PIN_KDF_PROFILE = Object.freeze({
  algorithm: 'argon2id' as const,
  memoryKiB: 65_536,
  parallelism: 4,
  passes: 3,
  profileVersion: 1,
  saltLength: 16,
  tagLength: 32,
});

const canonicalUuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const pinPattern = /^[0-9]{6}$/u;

export function parsePinCredentialId(value: string): PinCredentialId {
  if (!canonicalUuid.test(value)) {
    throw new TypeError('PIN credential identifier is invalid.');
  }
  return value as PinCredentialId;
}

export function parsePin(value: unknown): string {
  if (typeof value !== 'string' || !pinPattern.test(value)) {
    throw new TypeError('PIN format is invalid.');
  }
  return value;
}

const authenticationProofs = new WeakSet<object>();

/** Internal ephemeral proof; it is neither a Session nor authorization. */
export interface PinAuthenticationProof {
  readonly tenantId: string;
  readonly branchId: string;
  readonly stationId: string;
  readonly userId: string;
  readonly displayName: string;
  readonly credentialVersion: number;
  readonly authenticatedAt: string;
  readonly [pinAuthenticationProofBrand]: true;
}

export function createPinAuthenticationProof(input: Readonly<{
  context: Readonly<{
    tenantId: string;
    branchId: string;
    stationId: string;
  }>;
  user: Readonly<{
    userId: string;
    displayName: string;
  }>;
  credentialVersion: number;
  authenticatedAt: string;
}>): PinAuthenticationProof {
  const proof = Object.freeze({
    tenantId: input.context.tenantId,
    branchId: input.context.branchId,
    stationId: input.context.stationId,
    userId: input.user.userId,
    displayName: input.user.displayName,
    credentialVersion: input.credentialVersion,
    authenticatedAt: input.authenticatedAt,
  }) as unknown as PinAuthenticationProof;
  authenticationProofs.add(proof);
  return proof;
}

export function isPinAuthenticationProof(
  value: unknown,
): value is PinAuthenticationProof {
  return (
    typeof value === 'object' &&
    value !== null &&
    authenticationProofs.has(value)
  );
}
