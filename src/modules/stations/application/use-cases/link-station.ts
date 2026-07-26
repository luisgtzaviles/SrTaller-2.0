import type { BranchId, TenantId } from '../../../tenancy/index.js';
import {
  linkStation,
} from '../../domain/station.js';
import type {
  Station,
  StationId,
  StationRevision,
} from '../../domain/station.js';
import { StationApplicationError } from '../station-application.error.js';
import { mapStationError } from '../station-error-mapper.js';
import type { StationUnitOfWorkPort } from '../ports/station-unit-of-work.port.js';

export interface LinkStationCommand {
  readonly tenantId: TenantId;
  readonly stationId: StationId;
  readonly branchId: BranchId;
  readonly expectedRevision: StationRevision;
  readonly linkedAt: string;
}

export class LinkStation {
  constructor(private readonly unitOfWork: StationUnitOfWorkPort) {}

  async execute(command: LinkStationCommand): Promise<Station> {
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
        const eligible = await work.branches.findEligibleBranch({
          tenantId: command.tenantId,
          branchId: command.branchId,
          transactionContext: work.transactionContext,
        });
        if (!eligible) {
          throw new StationApplicationError(
            'STATION_BRANCH_NOT_ELIGIBLE',
          );
        }
        if (await work.bindings.lockOpenBinding(scope)) {
          throw new StationApplicationError(
            'STATION_REFERENCE_INTEGRITY_BROKEN',
          );
        }
        const next = linkStation(
          current,
          command.expectedRevision,
          command.linkedAt,
        );
        await work.bindings.createOpenBinding(scope, {
          tenantId: command.tenantId,
          stationId: command.stationId,
          bindingRevision: next.revision,
          branchId: command.branchId,
          linkedAt: command.linkedAt,
          unlinkedAt: null,
        });
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
