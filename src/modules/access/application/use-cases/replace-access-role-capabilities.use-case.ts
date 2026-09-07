import { parseRoleId } from '../../domain/role.js';
import {
  parseAccessTenantScope,
  parseReplaceAccessRoleCapabilitiesInput,
} from '../access-input.js';
import type { AccessRepositoryPort, AccessRoleRecord } from '../ports/access-repository.port.js';

/** Replaces a reusable role matrix atomically; users never receive direct grants. */
export class ReplaceAccessRoleCapabilitiesUseCase {
  constructor(
    private readonly repository: AccessRepositoryPort,
    private readonly now: () => Date = () => new Date(),
  ) {}

  execute(scope: unknown, roleId: unknown, input: unknown): Promise<AccessRoleRecord> {
    return this.repository.replaceRoleCapabilities(parseAccessTenantScope(scope), {
      ...parseReplaceAccessRoleCapabilitiesInput(input),
      roleId: parseRoleId(roleId),
      occurredAt: this.now().toISOString(),
    });
  }
}
