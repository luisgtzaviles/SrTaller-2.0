import { PinAuthenticationError } from '../application/use-cases/authenticate-pin.use-case.js';
import { consumePinAuthenticationProof } from '../domain/pin-credential.js';
import {
  ContextualAuthorizationError,
  SensitiveActionReauthenticationError,
} from '../index.js';
import type {
  ProtectedRequestEvidence,
  ReauthenticatedOperationalContext,
  SensitiveActionLevel2Code,
  SensitiveActionLevel2Executor,
  TenantWideAuthorizationExecutor,
} from '../index.js';
import type { AccessSessionRuntime } from './access-session.controller.js';

const policy = Object.freeze({
  'catalog.items.bulk-retire': 'catalog.items.bulk_retire',
} as const);

/**
 * Access-owned ADR-013 level-2 boundary. The policy is selected by the server,
 * the PIN proof is same-actor and single-use, and ordinary authority remains
 * subject to the consumer's transactional commit guard.
 */
export class SensitiveActionLevel2ExecutorService implements SensitiveActionLevel2Executor {
  constructor(
    private readonly tenantWide: TenantWideAuthorizationExecutor,
    private readonly runtime: AccessSessionRuntime,
  ) {}

  execute<Result>(
    evidence: ProtectedRequestEvidence,
    action: SensitiveActionLevel2Code,
    reauthentication: Readonly<{ pin: unknown }>,
    operation: (context: ReauthenticatedOperationalContext) => Promise<Result>,
  ): Promise<Result> {
    const capability = policy[action];
    if (!capability || typeof operation !== 'function') {
      throw new ContextualAuthorizationError('ACCESS_DENIED');
    }
    return this.tenantWide.execute(evidence, { capability, kind: 'state-change' }, async (context) => {
      try {
        const station = await this.runtime.trustedStations.resolve(evidence.cookieHeader);
        const proof = await this.runtime.authenticatePinOnly.execute(station, { pin: reauthentication.pin });
        const matchesActor = proof.tenantId === context.tenantId &&
          proof.branchId === context.branchId &&
          proof.stationId === context.stationId &&
          proof.userId === context.userId;
        const unusedProof = consumePinAuthenticationProof(proof);
        if (!matchesActor || !unusedProof) {
          throw new SensitiveActionReauthenticationError();
        }
        return await operation(Object.freeze({
          ...context,
          sensitiveAction: action,
          sensitivityLevel: 2 as const,
          reauthenticatedAt: proof.authenticatedAt,
        }));
      } catch (error: unknown) {
        if (error instanceof ContextualAuthorizationError || error instanceof SensitiveActionReauthenticationError) throw error;
        if (error instanceof PinAuthenticationError) {
          throw new SensitiveActionReauthenticationError();
        }
        throw error;
      }
    });
  }
}
