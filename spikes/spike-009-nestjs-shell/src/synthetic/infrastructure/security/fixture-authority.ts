import { AuthenticationError, ContextResolutionError } from '../../application/errors.js';
import {
  createOperationalContext,
  WRITE_SYNTHETIC_RECORD,
  type OperationalContext,
} from '../../application/operational-context.js';
import type { AuthenticatedIdentity, OperationalContextAuthority } from '../../application/ports.js';

interface MembershipFixture {
  readonly capabilities: readonly string[];
  readonly allowedBranches: readonly string[];
}

const credentials = new Map<string, AuthenticatedIdentity>([
  ['credential-a', { credentialId: 'credential-a', tenantId: 'tenant-a', userId: 'user-a', sessionId: 'session-a' }],
  ['credential-b', { credentialId: 'credential-b', tenantId: 'tenant-b', userId: 'user-b', sessionId: 'session-b' }],
  ['credential-no-cap', { credentialId: 'credential-no-cap', tenantId: 'tenant-a', userId: 'user-no-cap', sessionId: 'session-no-cap' }],
  ['credential-revocable', { credentialId: 'credential-revocable', tenantId: 'tenant-a', userId: 'user-revocable', sessionId: 'session-revocable' }],
]);

const memberships = new Map<string, MembershipFixture>([
  ['tenant-a:user-a', { capabilities: [WRITE_SYNTHETIC_RECORD], allowedBranches: ['branch-a'] }],
  ['tenant-b:user-b', { capabilities: [WRITE_SYNTHETIC_RECORD], allowedBranches: ['branch-b'] }],
  ['tenant-a:user-no-cap', { capabilities: [], allowedBranches: ['branch-a'] }],
  ['tenant-a:user-revocable', { capabilities: [WRITE_SYNTHETIC_RECORD], allowedBranches: ['branch-a'] }],
]);

const stations = new Map([
  ['station-a', { tenantId: 'tenant-a', branchId: 'branch-a' }],
  ['station-a-other', { tenantId: 'tenant-a', branchId: 'branch-a-other' }],
  ['station-b', { tenantId: 'tenant-b', branchId: 'branch-b' }],
]);

export class FixtureAuthority implements OperationalContextAuthority {
  private readonly revokedSessions = new Set<string>();

  authenticate(credentialId: string | undefined): AuthenticatedIdentity {
    if (!credentialId) throw new AuthenticationError();
    const identity = credentials.get(credentialId);
    if (!identity || this.revokedSessions.has(identity.sessionId)) throw new AuthenticationError();
    return Object.freeze({ ...identity });
  }

  resolveContext(
    identity: AuthenticatedIdentity,
    stationId: string | undefined,
    serverCorrelationId: string,
  ): OperationalContext {
    if (!stationId || this.revokedSessions.has(identity.sessionId)) throw new ContextResolutionError();
    const station = stations.get(stationId);
    const membership = memberships.get(`${identity.tenantId}:${identity.userId}`);
    if (
      !station ||
      !membership ||
      station.tenantId !== identity.tenantId ||
      !membership.allowedBranches.includes(station.branchId)
    ) {
      throw new ContextResolutionError();
    }
    return createOperationalContext({
      tenantId: identity.tenantId,
      branchId: station.branchId,
      stationId,
      userId: identity.userId,
      sessionId: identity.sessionId,
      capabilities: membership.capabilities,
      serverCorrelationId,
    });
  }

  revokeSession(sessionId: string): void {
    this.revokedSessions.add(sessionId);
  }

  restoreSession(sessionId: string): void {
    this.revokedSessions.delete(sessionId);
  }

  reset(): void {
    this.revokedSessions.clear();
  }
}
