import { randomUUID } from 'node:crypto';

import { parseRoleAssignmentId } from '../../domain/role-assignment.js';
import type {
  AccessMutationCommitGuard,
  AccessRepositoryPort,
  AccessRoleAssignmentRecord,
} from '../ports/access-repository.port.js';
import {
  parseAccessTenantScope,
  parseAssignRoleInput,
} from '../access-input.js';

/** Server-only command in PBI-033; no HTTP/admin controller is registered. */
export class AssignRoleUseCase {
  constructor(
    private readonly repository: AccessRepositoryPort,
    private readonly createId: () => string = randomUUID,
    private readonly now: () => Date = () => new Date(),
  ) {}

  execute(scope: unknown, input: unknown, guard?: AccessMutationCommitGuard): Promise<AccessRoleAssignmentRecord> {
    return this.repository.assignRole(parseAccessTenantScope(scope), {
      ...parseAssignRoleInput(input),
      assignmentId: parseRoleAssignmentId(this.createId()),
      occurredAt: this.now().toISOString(),
    }, guard);
  }
}
