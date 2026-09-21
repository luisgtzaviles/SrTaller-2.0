import type { VerifiedRegistrationBootstrapGrant } from '../../domain/tenant-bootstrap.js';

export interface VerifiedRegistrationBootstrapGrantSourcePort {
  loadVerifiedGrant(
    verifiedRegistrationId: string,
  ): Promise<VerifiedRegistrationBootstrapGrant | null>;
}
