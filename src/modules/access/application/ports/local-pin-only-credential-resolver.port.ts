/**
 * Resolves a development-only PIN alias after the trusted Station has limited
 * the candidate Users to the current Branch.
 */
export interface LocalPinOnlyCredentialResolver {
  resolve(
    pin: string,
    eligibleUserIds: readonly string[],
  ): Readonly<{ userId: string; credentialPin: string }> | null;
}
