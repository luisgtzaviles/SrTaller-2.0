import { TrustedStationContextError } from '../../stations/index.js';
import {
  ContextualAuthorizationError,
} from '../index.js';
import type {
  AuthorizedOperationalContext,
  ContextualAuthorizationExecutor,
  ProtectedOperationRequirement,
  ProtectedRequestEvidence,
} from '../index.js';
import { parseCapabilityCode } from '../domain/capability.js';
import { OperationalSessionError } from '../application/use-cases/operational-session.use-cases.js';
import type { AccessSessionRuntime } from './access-session.controller.js';
import {
  OperationalSessionCookieError,
  readOperationalSessionCookies,
  requestIsSameOrigin,
} from './access-session-cookie.js';

const jsonMediaType = /^application\/json(?:\s*;|$)/iu;

function authenticationRequired(): never {
  throw new ContextualAuthorizationError('AUTHENTICATION_REQUIRED');
}

function accessDenied(): never {
  throw new ContextualAuthorizationError('ACCESS_DENIED');
}

function isAuthenticationDenial(error: unknown): boolean {
  return error instanceof TrustedStationContextError ||
    error instanceof OperationalSessionError ||
    error instanceof OperationalSessionCookieError;
}

function validateRequirement(
  requirement: ProtectedOperationRequirement,
): Readonly<ProtectedOperationRequirement> {
  try {
    if (
      requirement?.kind !== 'read' &&
      requirement?.kind !== 'state-change'
    ) accessDenied();
    return Object.freeze({
      capability: parseCapabilityCode(requirement.capability),
      kind: requirement.kind,
    });
  } catch (error: unknown) {
    if (error instanceof ContextualAuthorizationError) throw error;
    return accessDenied();
  }
}

function validateStateChangeTransport(
  evidence: ProtectedRequestEvidence,
): void {
  if (
    !requestIsSameOrigin({
      origin: evidence.origin,
      host: evidence.host,
      forwardedProto: evidence.forwardedProto,
      fetchSite: evidence.fetchSite,
    }) ||
    !jsonMediaType.test(evidence.contentType ?? '')
  ) accessDenied();
}

/**
 * Access-owned composition boundary for one protected operation. Resolution is
 * deliberately performed on every invocation so role and assignment
 * revocation take effect at the next authorization decision.
 */
export class ContextualAuthorizationExecutorService
implements ContextualAuthorizationExecutor {
  constructor(private readonly runtime: AccessSessionRuntime) {}

  async execute<Result>(
    evidence: ProtectedRequestEvidence,
    requirementValue: ProtectedOperationRequirement,
    operation: (
      context: AuthorizedOperationalContext,
    ) => Promise<Result>,
  ): Promise<Result> {
    const requirement = validateRequirement(requirementValue);
    if (typeof operation !== 'function') accessDenied();
    if (requirement.kind === 'state-change') {
      validateStateChangeTransport(evidence);
    }

    let authorizedContext: AuthorizedOperationalContext;
    try {
      const cookies = readOperationalSessionCookies(evidence.cookieHeader);
      if (!cookies.bearer || !cookies.csrf) authenticationRequired();
      if (
        requirement.kind === 'state-change' &&
        evidence.csrfToken !== cookies.csrf
      ) accessDenied();

      const station = await this.runtime.trustedStations.resolve(
        evidence.cookieHeader,
      );
      const session = await this.runtime.resolveSession.execute(station, {
        bearer: cookies.bearer,
        csrfCookie: cookies.csrf,
        ...(requirement.kind === 'state-change'
          ? {
              csrfHeader: evidence.csrfToken,
              requireCsrf: true,
            }
          : {}),
        touch: true,
      });
      const capabilities = await this.runtime.resolveCapabilities.execute({
        tenantId: station.tenantId,
        branchId: station.branchId,
        userId: session.userId,
      });
      if (!capabilities.includes(requirement.capability)) accessDenied();

      authorizedContext = Object.freeze({
        tenantId: station.tenantId,
        branchId: station.branchId,
        stationId: station.stationId,
        sessionId: session.sessionId,
        userId: session.userId,
        userDisplayName: session.displayName,
        capability: requirement.capability,
        commitGuard: Object.freeze({
          confirmCurrent: (transactionContext: object) =>
            this.runtime.resolveSession.confirmAuthorizedAtCommit(
              station,
              session,
              requirement.capability,
              transactionContext,
            ),
          confirmTemporalCurrent: (transactionContext: object) =>
            this.runtime.resolveSession.confirmTemporalAtCommit(
              station,
              session,
              transactionContext,
            ),
        }),
      });
    } catch (error: unknown) {
      if (error instanceof ContextualAuthorizationError) throw error;
      if (isAuthenticationDenial(error)) authenticationRequired();
      throw error;
    }
    // Consumer failures preserve their owning module's error semantics.
    return await operation(authorizedContext);
  }
}
