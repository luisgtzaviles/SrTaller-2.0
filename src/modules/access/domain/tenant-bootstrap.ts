import { inspect } from 'node:util';

import { normalizeAdminEmail } from './admin-identity.js';

const canonicalUuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

export type TenantBootstrapCommand = Readonly<{
  verifiedRegistrationId: string;
  correlationId: string;
}>;

export type TenantBootstrapPasswordVerifier = Readonly<{
  algorithm: string;
  profileVersion: number;
  pepperVersion: number;
  memoryKiB: number;
  passes: number;
  parallelism: number;
  salt: Uint8Array;
  verifier: Uint8Array;
}>;

export type VerifiedRegistrationBootstrapGrant = Readonly<{
  verifiedRegistrationId: string;
  registrationRevision: number;
  approvedInputDigest: Uint8Array;
  tenantId: string;
  firstUserId: string;
  adminIdentityId: string;
  personDisplayName: string;
  workshopDisplayName: string;
  normalizedEmail: string;
  emailDisplay: string;
  verifiedAt: string;
  passwordVerifier: TenantBootstrapPasswordVerifier;
  termsAcceptanceEvidenceId: string;
}>;

export type TenantBootstrapResult = Readonly<{
  verifiedRegistrationId: string;
  tenantId: string;
  tenantStatus: 'ONBOARDING';
  firstUserId: string;
  adminIdentityId: string;
  starterRoleId: string;
  starterRolePolicyVersion: number;
  starterAssignmentId: string;
  completedAt: string;
}>;

export type TenantBootstrapErrorCode =
  | 'TENANT_BOOTSTRAP_INPUT_INVALID'
  | 'TENANT_BOOTSTRAP_GRANT_INVALID'
  | 'TENANT_BOOTSTRAP_GRANT_NOT_VERIFIED'
  | 'TENANT_BOOTSTRAP_IDEMPOTENCY_CONFLICT'
  | 'TENANT_BOOTSTRAP_EMAIL_CONFLICT'
  | 'TENANT_BOOTSTRAP_CONCURRENCY_EXHAUSTED'
  | 'TENANT_BOOTSTRAP_PERSISTENCE_FAILED';

export class TenantBootstrapError extends Error {
  constructor(
    readonly code: TenantBootstrapErrorCode,
    readonly retryable: 'conditional' | 'never' = 'never',
  ) {
    super('Tenant bootstrap could not be completed.');
    this.name = 'TenantBootstrapError';
  }

  toJSON(): Readonly<{
    name: 'TenantBootstrapError';
    code: TenantBootstrapErrorCode;
    retryable: 'conditional' | 'never';
  }> {
    return Object.freeze({
      name: 'TenantBootstrapError' as const,
      code: this.code,
      retryable: this.retryable,
    });
  }

  [inspect.custom](): ReturnType<TenantBootstrapError['toJSON']> {
    return this.toJSON();
  }
}

function requiredText(value: unknown, maximum: number): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().normalize('NFC');
  return normalized.length > 0 && normalized.length <= maximum ? normalized : null;
}

function validVerifier(value: TenantBootstrapPasswordVerifier): boolean {
  return value.algorithm === 'argon2id' &&
    Number.isInteger(value.profileVersion) && value.profileVersion >= 1 &&
    Number.isInteger(value.pepperVersion) && value.pepperVersion >= 1 &&
    Number.isInteger(value.memoryKiB) && value.memoryKiB > 0 &&
    Number.isInteger(value.passes) && value.passes > 0 &&
    Number.isInteger(value.parallelism) && value.parallelism > 0 &&
    value.salt instanceof Uint8Array && value.salt.byteLength >= 16 &&
    value.verifier instanceof Uint8Array && value.verifier.byteLength >= 16;
}

export function parseTenantBootstrapCommand(value: unknown): TenantBootstrapCommand {
  if (typeof value !== 'object' || value === null) {
    throw new TenantBootstrapError('TENANT_BOOTSTRAP_INPUT_INVALID');
  }
  const input = value as Readonly<Record<string, unknown>>;
  if (
    Object.keys(input).some((key) => !['verifiedRegistrationId', 'correlationId'].includes(key)) ||
    typeof input.verifiedRegistrationId !== 'string' ||
    !canonicalUuid.test(input.verifiedRegistrationId) ||
    typeof input.correlationId !== 'string' ||
    !canonicalUuid.test(input.correlationId)
  ) {
    throw new TenantBootstrapError('TENANT_BOOTSTRAP_INPUT_INVALID');
  }
  return Object.freeze({
    verifiedRegistrationId: input.verifiedRegistrationId,
    correlationId: input.correlationId,
  });
}

export function validateVerifiedRegistrationBootstrapGrant(
  value: VerifiedRegistrationBootstrapGrant,
  expectedRegistrationId: string,
): VerifiedRegistrationBootstrapGrant {
  let email;
  try {
    email = normalizeAdminEmail(value.emailDisplay);
  } catch {
    throw new TenantBootstrapError('TENANT_BOOTSTRAP_GRANT_INVALID');
  }
  const timestamp = Date.parse(value.verifiedAt);
  const allowedKeys = [
    'adminIdentityId', 'approvedInputDigest', 'emailDisplay', 'firstUserId',
    'normalizedEmail', 'passwordVerifier', 'personDisplayName',
    'registrationRevision', 'tenantId', 'termsAcceptanceEvidenceId',
    'verifiedAt', 'verifiedRegistrationId', 'workshopDisplayName',
  ];
  if (
    Object.keys(value).some((key) => !allowedKeys.includes(key)) ||
    value.verifiedRegistrationId !== expectedRegistrationId ||
    !canonicalUuid.test(value.verifiedRegistrationId) ||
    !canonicalUuid.test(value.tenantId) ||
    !canonicalUuid.test(value.firstUserId) ||
    !canonicalUuid.test(value.adminIdentityId) ||
    !canonicalUuid.test(value.termsAcceptanceEvidenceId) ||
    !Number.isInteger(value.registrationRevision) || value.registrationRevision < 1 ||
    !(value.approvedInputDigest instanceof Uint8Array) ||
    value.approvedInputDigest.byteLength !== 32 ||
    requiredText(value.personDisplayName, 160) !== value.personDisplayName ||
    requiredText(value.workshopDisplayName, 160) !== value.workshopDisplayName ||
    email.normalized !== value.normalizedEmail ||
    email.display !== value.emailDisplay ||
    !Number.isFinite(timestamp) ||
    !validVerifier(value.passwordVerifier)
  ) {
    throw new TenantBootstrapError('TENANT_BOOTSTRAP_GRANT_INVALID');
  }
  return value;
}

export function tenantBootstrapResultFromJournal(record: Readonly<{
  verifiedRegistrationId: string;
  tenantId: string;
  firstUserId: string;
  adminIdentityId: string;
  starterRoleId: string;
  starterPolicyVersion: number;
  starterAssignmentId: string;
  completedAt: string;
}>): TenantBootstrapResult {
  return Object.freeze({
    verifiedRegistrationId: record.verifiedRegistrationId,
    tenantId: record.tenantId,
    tenantStatus: 'ONBOARDING',
    firstUserId: record.firstUserId,
    adminIdentityId: record.adminIdentityId,
    starterRoleId: record.starterRoleId,
    starterRolePolicyVersion: record.starterPolicyVersion,
    starterAssignmentId: record.starterAssignmentId,
    completedAt: record.completedAt,
  });
}
