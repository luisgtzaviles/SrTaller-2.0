export type AdminPasswordStoredVerifier = Readonly<{
  algorithm: string;
  profileVersion: number;
  pepperVersion: number;
  memoryKiB: number;
  passes: number;
  parallelism: number;
  salt: Uint8Array;
  verifier: Uint8Array;
}>;

export interface AdminPasswordHasherPort {
  principalDigest(normalizedEmail: string): Uint8Array;
  hash(input: Readonly<{
    tenantId: string;
    adminIdentityId: string;
    password: string;
  }>): Promise<AdminPasswordStoredVerifier>;
  verify(input: Readonly<{
    tenantId: string | null;
    adminIdentityId: string | null;
    password: string;
    stored: AdminPasswordStoredVerifier | null;
  }>): Promise<boolean>;
}
