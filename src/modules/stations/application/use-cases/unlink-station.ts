import type { TenantId } from '../../../tenancy/index.js';
import { unlinkStation } from '../../domain/station.js';
import type {
  Station,
  StationId,
  StationRevision,
} from '../../domain/station.js';
import { StationApplicationError } from '../station-application.error.js';
import { mapStationError } from '../station-error-mapper.js';
import type { StationUnitOfWorkPort } from '../ports/station-unit-of-work.port.js';

export interface UnlinkStationCommand {
  readonly tenantId: TenantId;
  readonly stationId: StationId;
  readonly expectedRevision: StationRevision;
  readonly unlinkedAt: string;
}

export class UnlinkStation {
  constructor(private readonly unitOfWork: StationUnitOfWorkPort) {}

  async execute(command: UnlinkStationCommand): Promise<Station> {
    try {
      return await this.unitOfWork.run(async (work) => {
        const scope = {
          tenantId: command.tenantId,
          stationId: command.stationId,
        };
        const current = await work.stations.lockStation(scope);
        if (!current) {
          throw new StationApplicationError('STATION_REFERENCE_NOT_FOUND');
        }
        const binding = await work.bindings.lockOpenBinding(scope);
        if (!binding) {
          throw new StationApplicationError(
            'STATION_REFERENCE_INTEGRITY_BROKEN',
          );
        }
        const next = unlinkStation(
          current,
          command.expectedRevision,
          command.unlinkedAt,
        );
        const closed = await work.bindings.closeOpenBinding(
          scope,
          binding.bindingRevision,
          command.unlinkedAt,
        );
        if (!closed) {
          throw new StationApplicationError('STATION_CONTEXT_STALE');
        }
        const persisted = await work.stations.transitionStation(scope, {
          expectedRevision: current.revision,
          expectedStatus: current.status,
          nextStatus: next.status,
          nextRevision: next.revision,
          updatedAt: next.updatedAt,
          revokedAt: next.revokedAt,
        });
        if (!persisted) {
          throw new StationApplicationError('STATION_CONTEXT_STALE');
        }
        return persisted;
      });
    } catch (error: unknown) {
      throw mapStationError(error);
    }
  }
}
