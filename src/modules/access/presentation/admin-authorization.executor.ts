import type { AdministrationAuthorizationCommitGuardPort } from '../application/ports/administration-authorization-commit-guard.port.js';
import type { TenantId } from '../../tenancy/index.js';
import { AdminAuthenticationError } from '../application/use-cases/admin-session.use-cases.js';
import { adminSessionHasRecentReauthentication } from '../domain/admin-session.js';
import { parseCapabilityCode } from '../domain/capability.js';
import { ContextualAuthorizationError } from '../index.js';
import type {
  AdminAuthorizationExecutor,
  AdminAuthorizationRequirement,
  AuthorizedAdminContext,
  ProtectedRequestEvidence,
} from '../index.js';
import type { AccessSessionRuntime } from './access-session.controller.js';
import { requestIsSameOrigin } from './access-session-cookie.js';
import { AdminSessionCookieError, readAdminSessionCookies } from './admin-session-cookie.js';

const jsonMediaType = /^application\/json(?:\s*;|$)/iu;

function authenticationRequired(): never { throw new ContextualAuthorizationError('AUTHENTICATION_REQUIRED'); }
function accessDenied(): never { throw new ContextualAuthorizationError('ACCESS_DENIED'); }

function requirement(value: AdminAuthorizationRequirement): Readonly<Required<AdminAuthorizationRequirement>> {
  try {
    if (value?.kind !== 'read' && value?.kind !== 'state-change') accessDenied();
    if (value.requiresRecentReauthentication !== undefined && typeof value.requiresRecentReauthentication !== 'boolean') accessDenied();
    return Object.freeze({
      capability: parseCapabilityCode(value.capability),
      kind: value.kind,
      requiresRecentReauthentication: value.requiresRecentReauthentication ?? false,
    });
  } catch (error: unknown) {
    if (error instanceof ContextualAuthorizationError) throw error;
    return accessDenied();
  }
}

function validateTransport(evidence: ProtectedRequestEvidence): void {
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
 * Resolves the Tenant exclusively through the Access-owned Admin Session.
 * Neither Host nor request parameters contribute identity or scope authority.
 */
export class AdminAuthorizationExecutorService implements AdminAuthorizationExecutor {
  constructor(
    private readonly runtime: AccessSessionRuntime,
    private readonly capabilityGuard: AdministrationAuthorizationCommitGuardPort,
  ) {}

  async execute<Result>(
    evidence: ProtectedRequestEvidence,
    requirementValue: AdminAuthorizationRequirement,
    operation: (context: AuthorizedAdminContext) => Promise<Result>,
  ): Promise<Result> {
    const required = requirement(requirementValue);
    if (typeof operation !== 'function') accessDenied();
    if (required.kind === 'state-change') validateTransport(evidence);

    try {
      const cookies = readAdminSessionCookies(evidence.cookieHeader);
      if (!cookies.bearer || !cookies.csrf) authenticationRequired();
      if (required.kind === 'state-change' && evidence.csrfToken !== cookies.csrf) accessDenied();
      const session = required.kind === 'state-change'
        ? await this.runtime.admin.resolve.execute({
          bearer: cookies.bearer,
          csrfCookie: cookies.csrf,
          csrfHeader: evidence.csrfToken as string,
          requireCsrf: true,
          touch: true,
        })
        : await this.runtime.admin.resolve.execute({
          bearer: cookies.bearer,
          csrfCookie: cookies.csrf,
          touch: true,
        });
      const capabilities = await this.runtime.admin.capabilities(session.tenantId, session.userId);
      if (!capabilities.includes(required.capability)) accessDenied();
      if (required.requiresRecentReauthentication && !adminSessionHasRecentReauthentication(session, new Date().toISOString())) accessDenied();

      const context: AuthorizedAdminContext = Object.freeze({
        tenantId: session.tenantId as TenantId,
        sessionId: session.sessionId,
        userId: session.userId,
        adminIdentityId: session.adminIdentityId,
        userDisplayName: session.displayName,
        capability: required.capability,
        reauthenticatedAt: session.reauthenticatedAt,
        commitGuard: Object.freeze({
          confirmCurrent: async (transactionContext: object) =>
            await this.runtime.admin.resolve.confirmCurrentAtCommit(
              session,
              required.requiresRecentReauthentication,
              transactionContext,
            ) && await this.capabilityGuard.confirmCurrent(
              { tenantId: session.tenantId as TenantId, userId: session.userId },
              required.capability,
              transactionContext,
            ),
          confirmEffectiveTenantAdmin: async (transactionContext: object) =>
            this.capabilityGuard.confirmEffectiveTenantAdmin(
              session.tenantId as TenantId,
              transactionContext,
            ),
        }),
      });
      return await operation(context);
    } catch (error: unknown) {
      if (error instanceof ContextualAuthorizationError) throw error;
      if (error instanceof AdminAuthenticationError || error instanceof AdminSessionCookieError) authenticationRequired();
      throw error;
    }
  }
}
