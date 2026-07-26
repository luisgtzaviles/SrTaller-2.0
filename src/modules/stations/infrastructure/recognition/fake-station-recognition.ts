import type { TenantId } from '../../../tenancy/index.js';
import type {
  StationEvidence,
  StationRecognitionPort,
  StationRecognitionResult,
} from '../../application/ports/station-recognition.port.js';
import type { StationId } from '../../domain/station.js';

export interface SyntheticStationRecognition {
  readonly opaque: string;
  readonly tenantId: TenantId;
  readonly stationId: StationId;
}

export class FakeStationRecognition implements StationRecognitionPort {
  readonly #recognized: ReadonlyMap<string, StationRecognitionResult>;

  constructor(records: readonly SyntheticStationRecognition[]) {
    this.#recognized = new Map(
      records.map((record) => [
        record.opaque,
        Object.freeze({
          kind: 'recognized' as const,
          tenantId: record.tenantId,
          stationId: record.stationId,
        }),
      ]),
    );
  }

  async recognize(
    evidence: StationEvidence,
  ): Promise<StationRecognitionResult> {
    if (evidence.kind !== 'candidate') {
      return Object.freeze({ kind: 'not-recognized' });
    }
    return this.#recognized.get(evidence.opaque) ??
      Object.freeze({ kind: 'not-recognized' });
  }
}

export class RejectingStationRecognition implements StationRecognitionPort {
  async recognize(): Promise<StationRecognitionResult> {
    return Object.freeze({ kind: 'not-recognized' });
  }
}
