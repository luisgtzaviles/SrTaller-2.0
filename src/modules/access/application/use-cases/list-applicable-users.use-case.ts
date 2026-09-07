import type { AccessUserId } from '../../domain/role-assignment.js';
import type { AccessRepositoryPort } from '../ports/access-repository.port.js';
import { parseAccessBranchScope } from '../access-input.js';

/** Assignment applicability only; User lifecycle eligibility remains separately owned. */
export class ListApplicableUsersUseCase {
  constructor(private readonly repository: AccessRepositoryPort) {}

  execute(scope: unknown): Promise<readonly AccessUserId[]> {
    return this.repository.listApplicableUserIds(
      parseAccessBranchScope(scope),
    );
  }
}
