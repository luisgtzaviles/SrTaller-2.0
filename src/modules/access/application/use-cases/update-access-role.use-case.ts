import { parseRoleId } from '../../domain/role.js';
import {
  parseAccessTenantScope,
  parseUpdateAccessRoleInput,
} from '../access-input.js';
import type {
  AccessMutationCommitGuard,
  AccessRepositoryPort,
  AccessRoleRecord,
} from '../ports/access-repository.port.js';

/** Updates human-facing Role metadata without changing its reusable grants. */
export class UpdateAccessRoleUseCase {
  constructor(
    private readonly repository: AccessRepositoryPort,
    private readonly now: () => Date = () => new Date(),
  ) {}

  execute(
    scope: unknown,
    roleId: unknown,
    input: unknown,
    guard?: AccessMutationCommitGuard,
  ): Promise<AccessRoleRecord> {
    return this.repository.updateRole(parseAccessTenantScope(scope), {
      ...parseUpdateAccessRoleInput(input),
      roleId: parseRoleId(roleId),
      occurredAt: this.now().toISOString(),
    }, guard);
  }
}
