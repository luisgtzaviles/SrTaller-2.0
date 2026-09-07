import type {
  AccessRepositoryPort,
  AccessRoleAssignmentRecord,
} from '../ports/access-repository.port.js';
import {
  parseAccessTenantScope,
  parseRevokeRoleAssignmentInput,
} from '../access-input.js';

/** Revocation is retained as history; productive administration remains unavailable. */
export class RevokeRoleAssignmentUseCase {
  constructor(
    private readonly repository: AccessRepositoryPort,
    private readonly now: () => Date = () => new Date(),
  ) {}

  execute(scope: unknown, input: unknown): Promise<AccessRoleAssignmentRecord> {
    return this.repository.revokeRoleAssignment(
      parseAccessTenantScope(scope),
      {
        ...parseRevokeRoleAssignmentInput(input),
        occurredAt: this.now().toISOString(),
      },
    );
  }
}
