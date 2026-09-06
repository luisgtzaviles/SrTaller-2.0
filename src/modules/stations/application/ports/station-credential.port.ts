import type { BranchId } from './branch-repository.port.js';
import type { TenantId } from '../../../tenancy/index.js';
import type { StationId } from '../../domain/station.js';

export interface VerifiedStationCredential {
  readonly stationId: StationId;
  readonly tenantId: TenantId;
  readonly branchId: BranchId;
}

export interface StationCredentialVerifier {
  verify(rawCredential: string): Promise<VerifiedStationCredential | null>;
}
