import type { DatabaseConnection } from '../../../../infrastructure/database/database-connection.js';
import { runInTransaction } from '../../../../infrastructure/database/transaction-runner.js';
import type { BranchEligibilityCapability } from '../../../tenancy/index.js';
import type {
  StationUnitOfWork,
  StationUnitOfWorkPort,
} from '../../application/ports/station-unit-of-work.port.js';
import { mapStationError } from '../../application/station-error-mapper.js';
import { createTransactionalKyselyStationBindingRepository } from './kysely-station-binding.repository.js';
import { createTransactionalKyselyStationRepository } from './kysely-station.repository.js';

class KyselyStationUnitOfWork implements StationUnitOfWorkPort {
  constructor(
    private readonly connection: DatabaseConnection,
    private readonly branches: BranchEligibilityCapability,
  ) {}

  run<Result>(
    operation: (unitOfWork: StationUnitOfWork) => Promise<Result>,
  ): Promise<Result> {
    return runInTransaction(
      this.connection,
      { isolationLevel: 'read committed', readOnly: false },
      async (transactionContext) => {
        try {
          return await operation(Object.freeze({
            transactionContext,
            stations:
              createTransactionalKyselyStationRepository(
                transactionContext,
              ),
            bindings:
              createTransactionalKyselyStationBindingRepository(
                transactionContext,
              ),
            branches: this.branches,
          }));
        } catch (error: unknown) {
          throw mapStationError(error);
        }
      },
    );
  }
}

export function createKyselyStationUnitOfWork(
  connection: DatabaseConnection,
  branches: BranchEligibilityCapability,
): StationUnitOfWorkPort {
  return new KyselyStationUnitOfWork(connection, branches);
}

export type KyselyStationUnitOfWorkFactory =
  typeof createKyselyStationUnitOfWork;
