import { TrustedStationContextError } from '../../stations/index.js';
import { ContextualAuthorizationError } from '../index.js';
import type { ProtectedOperationKind, ProtectedRequestEvidence } from '../index.js';
import type {
  AuthenticatedSelfContext,
  AuthenticatedSelfExecutor,
} from '../application/authenticated-self-executor.js';
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

function validateKind(kind: ProtectedOperationKind): ProtectedOperationKind {
  if (kind !== 'read' && kind !== 'state-change') accessDenied();
  return kind;
}

function validateStateChangeTransport(evidence: ProtectedRequestEvidence): void {
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
 * Access-owned authentication boundary for self-service operations. It proves
 * the current user from the trusted station session and never evaluates an
 * administrative capability.
 */
export class AuthenticatedSelfExecutorService implements AuthenticatedSelfExecutor {
  constructor(private readonly runtime: AccessSessionRuntime) {}

  async execute<Result>(
    evidence: ProtectedRequestEvidence,
    kindValue: ProtectedOperationKind,
    operation: (context: AuthenticatedSelfContext) => Promise<Result>,
  ): Promise<Result> {
    const kind = validateKind(kindValue);
    if (typeof operation !== 'function') accessDenied();
    if (kind === 'state-change') validateStateChangeTransport(evidence);

    let context: AuthenticatedSelfContext;
    try {
      const cookies = readOperationalSessionCookies(evidence.cookieHeader);
      if (!cookies.bearer || !cookies.csrf) authenticationRequired();
      if (kind === 'state-change' && evidence.csrfToken !== cookies.csrf) {
        accessDenied();
      }

      const station = await this.runtime.trustedStations.resolve(evidence.cookieHeader);
      const session = await this.runtime.resolveSession.execute(station, {
        bearer: cookies.bearer,
        csrfCookie: cookies.csrf,
        ...(kind === 'state-change'
          ? { csrfHeader: evidence.csrfToken, requireCsrf: true }
          : {}),
        touch: true,
      });
      context = Object.freeze({
        tenantId: station.tenantId,
        userId: session.userId,
        commitGuard: Object.freeze({
          confirmCurrent: (transactionContext: object) =>
            this.runtime.resolveSession.confirmTemporalAtCommit(
              station,
              session,
              transactionContext,
            ),
        }),
      });
    } catch (error: unknown) {
      if (error instanceof ContextualAuthorizationError) throw error;
      if (
        error instanceof TrustedStationContextError ||
        error instanceof OperationalSessionError ||
        error instanceof OperationalSessionCookieError
      ) authenticationRequired();
      throw error;
    }

    return await operation(context);
  }
}
