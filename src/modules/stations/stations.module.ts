import { Module } from '@nestjs/common';

import type { DatabaseConnection } from '../../infrastructure/database/database-connection.js';
import type { BranchEligibilityCapability } from '../tenancy/index.js';
import type { StationRecognitionPort } from './application/ports/station-recognition.port.js';
import { LinkStation } from './application/use-cases/link-station.js';
import { ResolveTrustedStationContextUseCase } from './application/use-cases/resolve-trusted-station-context.js';
import { RevokeStation } from './application/use-cases/revoke-station.js';
import { RunWithTrustedStationContextUseCase } from './application/use-cases/run-with-trusted-station-context.js';
import { UnlinkStation } from './application/use-cases/unlink-station.js';
import type { KyselyStationBindingRepositoryFactory } from './infrastructure/persistence/kysely-station-binding.repository.js';
import type { KyselyStationRepositoryFactory } from './infrastructure/persistence/kysely-station.repository.js';
import { createKyselyStationUnitOfWork } from './infrastructure/persistence/kysely-station-unit-of-work.js';
import type { KyselyStationUnitOfWorkFactory } from './infrastructure/persistence/kysely-station-unit-of-work.js';

type RegisteredStationsPersistenceAdapter =
  | KyselyStationBindingRepositoryFactory
  | KyselyStationRepositoryFactory
  | KyselyStationUnitOfWorkFactory;

export interface StationsComposition {
  readonly linkStation: LinkStation;
  readonly unlinkStation: UnlinkStation;
  readonly revokeStation: RevokeStation;
  readonly resolveTrustedStationContext: ResolveTrustedStationContextUseCase;
  readonly runWithTrustedStationContext: RunWithTrustedStationContextUseCase;
}

export function createStationsComposition(
  connection: DatabaseConnection,
  branches: BranchEligibilityCapability,
  recognition: StationRecognitionPort,
): StationsComposition {
  const unitOfWork = createKyselyStationUnitOfWork(connection, branches);
  return Object.freeze({
    linkStation: new LinkStation(unitOfWork),
    unlinkStation: new UnlinkStation(unitOfWork),
    revokeStation: new RevokeStation(unitOfWork),
    resolveTrustedStationContext:
      new ResolveTrustedStationContextUseCase(recognition, unitOfWork),
    runWithTrustedStationContext:
      new RunWithTrustedStationContextUseCase(unitOfWork),
  });
}

@Module({})
export class StationsModule {
  declare private readonly persistenceAdapter: RegisteredStationsPersistenceAdapter;
  declare private readonly composition: StationsComposition;
}
