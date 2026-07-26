import type {
  BranchEligibilityCapability,
  BranchEligibilityQuery,
  EligibleBranchSnapshot,
} from '../index.js';
import type { BranchRepositoryPort } from './ports/branch-repository.port.js';

export class BranchEligibilityService implements BranchEligibilityCapability {
  constructor(private readonly repository: BranchRepositoryPort) {}

  async findEligibleBranch(
    query: BranchEligibilityQuery,
  ): Promise<EligibleBranchSnapshot | null> {
    const branch = await this.repository.findBranchById({
      tenantId: query.tenantId,
      branchId: query.branchId,
    });
    if (!branch) {
      return null;
    }
    return Object.freeze({
      tenantId: branch.tenantId,
      branchId: branch.branchId,
      eligible: true,
    });
  }
}
