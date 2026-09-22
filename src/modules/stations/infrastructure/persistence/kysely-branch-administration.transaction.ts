import type { DatabaseConnection } from '../../../../infrastructure/database/database-connection.js';
import { DatabaseTransactionError, runInTransaction } from '../../../../infrastructure/database/transaction-runner.js';
import {
  BranchAdministrationTransactionError,
} from '../../application/ports/branch-administration-transaction.port.js';
import type {
  BranchAdministrationTransactionContext,
  BranchAdministrationTransactionPort,
} from '../../application/ports/branch-administration-transaction.port.js';
import { createTransactionalKyselyBranchRepository } from './kysely-branch.repository.js';

export class KyselyBranchAdministrationTransaction
implements BranchAdministrationTransactionPort {
  constructor(private readonly connection: DatabaseConnection) {}

  async execute<Result>(
    operation: (
      context: BranchAdministrationTransactionContext,
    ) => Promise<Result>,
  ): Promise<Result> {
    try {
      return await runInTransaction(
        this.connection,
        { isolationLevel: 'serializable' },
        async (transactionContext): Promise<Result> => operation(Object.freeze({
          branches: createTransactionalKyselyBranchRepository(transactionContext),
          transactionContext,
        })),
      );
    } catch (error: unknown) {
      if (error instanceof DatabaseTransactionError) {
        throw new BranchAdministrationTransactionError(
          error.code === 'DATABASE_TRANSACTION_SERIALIZATION_FAILURE' ||
          error.retryable === 'conditional',
        );
      }
      throw error;
    }
  }
}
