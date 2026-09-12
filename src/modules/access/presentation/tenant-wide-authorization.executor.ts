import type { AdministrationAuthorizationCommitGuardPort } from '../application/ports/administration-authorization-commit-guard.port.js';
import type { AccessSessionRuntime } from './access-session.controller.js';
import { ContextualAuthorizationError } from '../index.js';
import type {
  AuthorizedOperationalContext, ContextualAuthorizationExecutor, ProtectedOperationRequirement,
  ProtectedRequestEvidence, TenantWideAuthorizationExecutor,
} from '../index.js';

export class TenantWideAuthorizationExecutorService implements TenantWideAuthorizationExecutor {
  constructor(
    private readonly contextual: ContextualAuthorizationExecutor,
    private readonly runtime: AccessSessionRuntime,
    private readonly commitGuard: AdministrationAuthorizationCommitGuardPort,
  ) {}

  execute<Result>(evidence: ProtectedRequestEvidence, requirement: ProtectedOperationRequirement, operation: (context: AuthorizedOperationalContext) => Promise<Result>): Promise<Result> {
    return this.contextual.execute(evidence, requirement, async (context) => {
      const matrix = await this.runtime.listAccessMatrix.execute({ tenantId: context.tenantId });
      const roles = new Set(matrix.roles.filter((role) => role.status === 'active' && role.capabilityCodes.includes(requirement.capability)).map((role) => role.roleId));
      const granted = matrix.assignments.some((assignment) => assignment.userId === context.userId && assignment.status === 'active' && assignment.assignmentScope === 'TENANT_WIDE' && assignment.branchId === null && roles.has(assignment.roleId));
      if (!granted) throw new ContextualAuthorizationError('ACCESS_DENIED');
      const tenantWideContext: AuthorizedOperationalContext = Object.freeze({
        ...context,
        commitGuard: Object.freeze({
          confirmCurrent: async (transactionContext: object) => await context.commitGuard.confirmCurrent(transactionContext) && await this.commitGuard.confirmCurrent({ tenantId: context.tenantId, userId: context.userId }, requirement.capability, transactionContext),
          confirmTemporalCurrent: (transactionContext: object) => context.commitGuard.confirmTemporalCurrent(transactionContext),
        }),
      });
      return operation(tenantWideContext);
    });
  }
}
