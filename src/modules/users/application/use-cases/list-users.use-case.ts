import type { UserRecord, UserRepositoryPort, UserScope } from '../ports/user-repository.port.js';

/** Read-only directory projection; presentation is intentionally deferred. */
export class ListUsersUseCase {
  constructor(private readonly repository: UserRepositoryPort) {}

  execute(scope: UserScope): Promise<readonly UserRecord[]> {
    return this.repository.list(scope);
  }
}
