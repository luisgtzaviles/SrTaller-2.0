import type { UserRecord, UserRepositoryPort } from '../ports/user-repository.port.js';
import { parseUserScope } from '../user-input.js';

/** Read-only directory projection; presentation is intentionally deferred. */
export class ListUsersUseCase {
  constructor(private readonly repository: UserRepositoryPort) {}

  execute(scope: unknown): Promise<readonly UserRecord[]> {
    return this.repository.list(parseUserScope(scope));
  }
}
