import type { TenantId } from '../../../tenancy/index.js';
import type {
  Station,
  StationId,
  StationRevision,
  StationStatus,
} from '../../domain/station.js';

type ScopedTenantId = string & TenantId;
type ScopedStationId = string & StationId;

export interface StationPersistenceScope {
  readonly tenantId: ScopedTenantId;
  readonly stationId: ScopedStationId;
}

export interface CreateStationRecord extends Station {}

export interface StationTransitionRecord {
  readonly expectedRevision: StationRevision;
  readonly expectedStatus: StationStatus;
  readonly nextStatus: StationStatus;
  readonly nextRevision: StationRevision;
  readonly updatedAt: string;
  readonly revokedAt: string | null;
}

export interface StationRepositoryPort {
  createStation(
    scope: StationPersistenceScope,
    record: CreateStationRecord,
  ): Promise<Station>;
  findStation(scope: StationPersistenceScope): Promise<Station | null>;
  lockStation(scope: StationPersistenceScope): Promise<Station | null>;
  transitionStation(
    scope: StationPersistenceScope,
    record: StationTransitionRecord,
  ): Promise<Station | null>;
}
