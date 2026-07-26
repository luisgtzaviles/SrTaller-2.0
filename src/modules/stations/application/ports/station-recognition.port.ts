import type { TenantId } from '../../../tenancy/index.js';
import type { StationId } from '../../domain/station.js';

export type StationEvidence =
  | Readonly<{ kind: 'absent' }>
  | Readonly<{ kind: 'malformed' }>
  | Readonly<{ kind: 'candidate'; opaque: string }>;

export type StationRecognitionResult =
  | Readonly<{ kind: 'recognized'; tenantId: TenantId; stationId: StationId }>
  | Readonly<{ kind: 'tenant-not-recognized' }>
  | Readonly<{ kind: 'not-recognized' }>;

export interface StationRecognitionPort {
  recognize(evidence: StationEvidence): Promise<StationRecognitionResult>;
}
