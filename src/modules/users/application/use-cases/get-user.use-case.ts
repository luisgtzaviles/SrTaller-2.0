import type { UserRecord, UserRepositoryPort } from '../ports/user-repository.port.js';
import { parseUserLookup, parseUserScope } from '../user-input.js';

/** Tenant-scoped User lookup. A cross-tenant identity is indistinguishable from absent. */
export class GetUserUseCase {
  constructor(private readonly repository: UserRepositoryPort) {}

  execute(scope: unknown, userId: unknown): Promise<UserRecord | null> {
    return this.repository.findById(
      parseUserScope(scope),
      parseUserLookup(userId),
    );
  }
}
