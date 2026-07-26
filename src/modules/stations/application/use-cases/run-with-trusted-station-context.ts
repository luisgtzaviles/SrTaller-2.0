import type {
  TrustedStationContext,
} from '../contracts/trusted-station-context.js';
import { isTrustedStationContext } from '../contracts/trusted-station-context.js';
import type { StationUnitOfWork } from '../ports/station-unit-of-work.port.js';
import type { StationUnitOfWorkPort } from '../ports/station-unit-of-work.port.js';
import { StationApplicationError } from '../station-application.error.js';
import { mapStationError } from '../station-error-mapper.js';

export interface RunWithTrustedStationContext {
  execute<Result>(
    context: TrustedStationContext,
    effect: () => Promise<Result>,
  ): Promise<Result>;
}

export class RunWithTrustedStationContextUseCase
implements RunWithTrustedStationContext {
  constructor(private readonly unitOfWork: StationUnitOfWorkPort) {}

  async execute<Result>(
    context: TrustedStationContext,
    effect: () => Promise<Result>,
  ): Promise<Result> {
    return this.executeWithinUnitOfWork(context, async () => effect());
  }

  async executeWithinUnitOfWork<Result>(
    context: TrustedStationContext,
    effect: (work: StationUnitOfWork) => Promise<Result>,
  ): Promise<Result> {
    try {
      if (!isTrustedStationContext(context)) {
        throw new StationApplicationError('STATION_NOT_TRUSTED');
      }
      return await this.unitOfWork.run(async (work) => {
        const scope = {
          tenantId: context.tenantId,
          stationId: context.stationId,
        };
        const station = await work.stations.lockStation(scope);
        if (
          !station ||
          station.status !== 'Active' ||
          station.revision !== context.stationRevision
        ) {
          throw new StationApplicationError('STATION_CONTEXT_STALE');
        }
        const binding = await work.bindings.findOpenBinding(scope);
        if (
          !binding ||
          binding.branchId !== context.branchId ||
          binding.bindingRevision !== context.stationRevision
        ) {
          throw new StationApplicationError('STATION_CONTEXT_STALE');
        }
        const eligible = await work.branches.findEligibleBranch({
          tenantId: context.tenantId,
          branchId: context.branchId,
          transactionContext: work.transactionContext,
        });
        if (!eligible) {
          throw new StationApplicationError(
            'STATION_REFERENCE_INTEGRITY_BROKEN',
          );
        }
        return effect(work);
      });
    } catch (error: unknown) {
      throw mapStationError(error);
    }
  }
}
