import type {
  TrustedStationContext,
} from '../contracts/trusted-station-context.js';
import { createTrustedStationContext } from '../contracts/trusted-station-context.js';
import type {
  StationEvidence,
  StationRecognitionPort,
} from '../ports/station-recognition.port.js';
import type { StationUnitOfWorkPort } from '../ports/station-unit-of-work.port.js';
import { StationApplicationError } from '../station-application.error.js';
import { mapStationError } from '../station-error-mapper.js';

export interface ResolveTrustedStationContext {
  execute(evidence: StationEvidence): Promise<TrustedStationContext>;
}

export class ResolveTrustedStationContextUseCase
implements ResolveTrustedStationContext {
  constructor(
    private readonly recognition: StationRecognitionPort,
    private readonly unitOfWork: StationUnitOfWorkPort,
  ) {}

  async execute(evidence: StationEvidence): Promise<TrustedStationContext> {
    try {
      if (evidence.kind === 'absent') {
        throw new StationApplicationError('STATION_EVIDENCE_REQUIRED');
      }
      if (evidence.kind === 'malformed') {
        throw new StationApplicationError('STATION_EVIDENCE_MALFORMED');
      }
      const recognition = await this.recognition.recognize(evidence);
      if (recognition.kind === 'tenant-not-recognized') {
        throw new StationApplicationError(
          'STATION_TENANT_NOT_RECOGNIZED',
        );
      }
      if (recognition.kind !== 'recognized') {
        throw new StationApplicationError('STATION_EVIDENCE_REJECTED');
      }
      return await this.unitOfWork.run(async (work) => {
        const scope = {
          tenantId: recognition.tenantId,
          stationId: recognition.stationId,
        };
        const station = await work.stations.findStation(scope);
        if (!station || station.status !== 'Active') {
          throw new StationApplicationError('STATION_NOT_TRUSTED');
        }
        const binding = await work.bindings.findOpenBinding(scope);
        if (!binding) {
          throw new StationApplicationError(
            'STATION_REFERENCE_INTEGRITY_BROKEN',
          );
        }
        const eligible = await work.branches.findEligibleBranch({
          tenantId: recognition.tenantId,
          branchId: binding.branchId,
          transactionContext: work.transactionContext,
        });
        if (!eligible) {
          throw new StationApplicationError(
            'STATION_REFERENCE_INTEGRITY_BROKEN',
          );
        }
        return createTrustedStationContext({
          tenantId: recognition.tenantId,
          branchId: binding.branchId,
          stationId: station.stationId,
          stationRevision: station.revision,
        });
      });
    } catch (error: unknown) {
      throw mapStationError(error);
    }
  }
}
