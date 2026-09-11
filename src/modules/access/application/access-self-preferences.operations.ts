import type { ProtectedRequestEvidence } from '../index.js';
import type { AuthenticatedSelfExecutor } from './authenticated-self-executor.js';
import type { UserPreferencesRuntime } from '../../users/index.js';

export class AccessSelfPreferencesOperations {
  constructor(
    private readonly authorization: AuthenticatedSelfExecutor,
    private readonly preferences: UserPreferencesRuntime,
  ) {}

  get(evidence: ProtectedRequestEvidence) {
    return this.authorization.execute(evidence, 'read', (context) =>
      this.preferences.get({
        tenantId: context.tenantId,
        userId: context.userId,
      }),
    );
  }

  update(evidence: ProtectedRequestEvidence, input: unknown) {
    return this.authorization.execute(evidence, 'state-change', (context) =>
      this.preferences.update(
        { tenantId: context.tenantId, userId: context.userId },
        input,
        context.commitGuard,
      ),
    );
  }
}
