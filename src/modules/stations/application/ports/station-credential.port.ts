import type { BranchId } from './branch-repository.port.js';
import type { TenantId } from '../../../tenancy/index.js';
import type { StationId } from '../../domain/station.js';

export interface VerifiedStationCredential {
  readonly stationCredentialId: string;
  readonly stationId: StationId;
  readonly tenantId: TenantId;
  readonly branchId: BranchId;
  readonly branchAdmissionRevision: number;
  readonly stationAdmissionRevision: number;
  readonly stationBindingAdmissionRevision: number;
  readonly stationCredentialAdmissionRevision: number;
}

export interface StationCredentialVerifier {
  verify(rawCredential: string): Promise<VerifiedStationCredential | null>;
}
