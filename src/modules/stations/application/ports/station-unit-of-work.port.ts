import type { BranchEligibilityCapability } from '../../../tenancy/index.js';
import type { StationBindingRepositoryPort } from './station-binding-repository.port.js';
import type { StationRepositoryPort } from './station-repository.port.js';

export interface StationUnitOfWork {
  readonly transactionContext: object;
  readonly stations: StationRepositoryPort;
  readonly bindings: StationBindingRepositoryPort;
  readonly branches: BranchEligibilityCapability;
}

export interface StationUnitOfWorkPort {
  run<Result>(
    operation: (unitOfWork: StationUnitOfWork) => Promise<Result>,
  ): Promise<Result>;
}
