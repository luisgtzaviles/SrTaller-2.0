import type { TenantId } from '../../../tenancy/index.js';
import { revokeStation } from '../../domain/station.js';
import type {
  Station,
  StationId,
  StationRevision,
} from '../../domain/station.js';
import { StationApplicationError } from '../station-application.error.js';
import { mapStationError } from '../station-error-mapper.js';
import type { StationUnitOfWorkPort } from '../ports/station-unit-of-work.port.js';

export interface RevokeStationCommand {
  readonly tenantId: TenantId;
  readonly stationId: StationId;
  readonly expectedRevision: StationRevision;
  readonly revokedAt: string;
}

export class RevokeStation {
  constructor(private readonly unitOfWork: StationUnitOfWorkPort) {}

  async execute(command: RevokeStationCommand): Promise<Station> {
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
        if (current.status === 'Active' && !binding) {
          throw new StationApplicationError(
            'STATION_REFERENCE_INTEGRITY_BROKEN',
          );
        }
        if (current.status === 'Unlinked' && binding) {
          throw new StationApplicationError(
            'STATION_REFERENCE_INTEGRITY_BROKEN',
          );
        }
        const next = revokeStation(
          current,
          command.expectedRevision,
          command.revokedAt,
        );
        if (binding) {
          const closed = await work.bindings.closeOpenBinding(
            scope,
            binding.bindingRevision,
            command.revokedAt,
          );
          if (!closed) {
            throw new StationApplicationError('STATION_CONTEXT_STALE');
          }
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
