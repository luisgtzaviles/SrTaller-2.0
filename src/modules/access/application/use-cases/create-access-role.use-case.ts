import { randomUUID } from 'node:crypto';

import { parseRoleId } from '../../domain/role.js';
import { parseAccessTenantScope, parseCreateAccessRoleInput } from '../access-input.js';
import type { AccessRepositoryPort, AccessRoleRecord } from '../ports/access-repository.port.js';

/** Local Product Mode command; the role and its capability matrix are one write. */
export class CreateAccessRoleUseCase {
  constructor(
    private readonly repository: AccessRepositoryPort,
    private readonly createId: () => string = randomUUID,
    private readonly now: () => Date = () => new Date(),
  ) {}

  execute(scope: unknown, input: unknown): Promise<AccessRoleRecord> {
    return this.repository.createRole(parseAccessTenantScope(scope), {
      ...parseCreateAccessRoleInput(input),
      roleId: parseRoleId(this.createId()),
      occurredAt: this.now().toISOString(),
    });
  }
}
