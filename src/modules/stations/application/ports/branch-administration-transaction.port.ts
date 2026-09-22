import type { BranchRepositoryPort } from './branch-repository.port.js';

export interface BranchAdministrationTransactionContext {
  readonly branches: BranchRepositoryPort;
  readonly transactionContext: object;
}

export interface BranchAdministrationTransactionPort {
  execute<Result>(
    operation: (context: BranchAdministrationTransactionContext) => Promise<Result>,
  ): Promise<Result>;
}

export class BranchAdministrationTransactionError extends Error {
  constructor(readonly retryable: boolean) {
    super('The Branch administration transaction failed.');
    this.name = 'BranchAdministrationTransactionError';
  }
}
