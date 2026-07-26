import type { DatabaseConnection } from '../../../../infrastructure/database/database-connection.js';
import type { DatabaseTransactionContext } from '../../../../infrastructure/database/transaction-runner.js';
import { BranchEligibilityService } from '../../application/branch-eligibility.service.js';
import type {
  BranchEligibilityCapability,
  BranchEligibilityQuery,
  EligibleBranchSnapshot,
} from '../../index.js';
import {
  createKyselyBranchRepository,
  createTransactionalKyselyBranchRepository,
} from './kysely-branch.repository.js';

class KyselyBranchEligibilityCapability
implements BranchEligibilityCapability {
  constructor(private readonly connection: DatabaseConnection) {}

  async findEligibleBranch(
    query: BranchEligibilityQuery,
  ): Promise<EligibleBranchSnapshot | null> {
    const repository = query.transactionContext
      ? createTransactionalKyselyBranchRepository(
          query.transactionContext as DatabaseTransactionContext,
        )
      : createKyselyBranchRepository(this.connection);
    return new BranchEligibilityService(repository).findEligibleBranch(query);
  }
}

export function createKyselyBranchEligibilityCapability(
  connection: DatabaseConnection,
): BranchEligibilityCapability {
  return new KyselyBranchEligibilityCapability(connection);
}

export type KyselyBranchEligibilityCapabilityFactory =
  typeof createKyselyBranchEligibilityCapability;
