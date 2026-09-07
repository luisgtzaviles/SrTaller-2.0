import type { TenantId } from '../../../tenancy/index.js';
import type { AccessUserId } from '../../domain/role-assignment.js';

export type PinSecretMaterial = Readonly<{
  algorithm: 'argon2id';
  profileVersion: 1;
  pepperVersion: 1;
  memoryKiB: 65_536;
  passes: 3;
  parallelism: 4;
  salt: Uint8Array;
  verifier: Uint8Array;
  requestFingerprint: Uint8Array;
}>;

export type PinStoredVerifier = Readonly<{
  algorithm: string;
  profileVersion: number;
  pepperVersion: number;
  memoryKiB: number;
  passes: number;
  parallelism: number;
  salt: Uint8Array;
  verifier: Uint8Array;
}>;

export interface PinSecretHasherPort {
  hash(input: Readonly<{
    tenantId: TenantId;
    userId: AccessUserId;
    clientRequestId: string;
    pin: string;
  }>): Promise<PinSecretMaterial>;
  verify(input: Readonly<{
    tenantId: TenantId;
    userId: AccessUserId;
    pin: string;
    stored: PinStoredVerifier | null;
  }>): Promise<boolean>;
}
