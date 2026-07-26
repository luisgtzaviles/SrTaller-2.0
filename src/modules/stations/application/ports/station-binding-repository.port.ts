import type { BranchId, TenantId } from '../../../tenancy/index.js';
import type {
  StationId,
  StationRevision,
} from '../../domain/station.js';

type ScopedTenantId = string & TenantId;
type ScopedStationId = string & StationId;

export interface StationBindingScope {
  readonly tenantId: ScopedTenantId;
  readonly stationId: ScopedStationId;
}

export interface StationBindingRecord {
  readonly tenantId: TenantId;
  readonly stationId: StationId;
  readonly bindingRevision: StationRevision;
  readonly branchId: BranchId;
  readonly linkedAt: string;
  readonly unlinkedAt: string | null;
}

export interface CreateStationBindingRecord extends StationBindingRecord {
  readonly unlinkedAt: null;
}

export interface StationBindingRepositoryPort {
  createOpenBinding(
    scope: StationBindingScope,
    record: CreateStationBindingRecord,
  ): Promise<StationBindingRecord>;
  findOpenBinding(
    scope: StationBindingScope,
  ): Promise<StationBindingRecord | null>;
  lockOpenBinding(
    scope: StationBindingScope,
  ): Promise<StationBindingRecord | null>;
  closeOpenBinding(
    scope: StationBindingScope,
    bindingRevision: StationRevision,
    unlinkedAt: string,
  ): Promise<StationBindingRecord | null>;
  listBindings(
    scope: StationBindingScope,
  ): Promise<readonly StationBindingRecord[]>;
}
