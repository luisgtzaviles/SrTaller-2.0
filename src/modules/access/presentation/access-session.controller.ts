import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  Inject,
  Post,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';

import {
  SESSION_TRANSPORT_POLICY,
} from '../../../infrastructure/runtime/index.js';
import type {
  SessionTransportPolicy,
} from '../../../infrastructure/runtime/index.js';
import { TrustedStationContextError } from '../../stations/index.js';
import type { TrustedStationContextResolver } from '../../stations/index.js';
import { PinInputError } from '../application/pin-input.js';
import { SessionTokenInputError } from '../application/ports/session-token.port.js';
import { PinAuthenticationError } from '../application/use-cases/authenticate-pin.use-case.js';
import type { AuthenticatePinUseCase } from '../application/use-cases/authenticate-pin.use-case.js';
import type { AuthenticateLocalPinOnlyUseCase } from '../application/use-cases/authenticate-local-pin-only.use-case.js';
import { OperationalSessionError } from '../application/use-cases/operational-session.use-cases.js';
import type {
  CreateOperationalSessionUseCase,
  EndOperationalSessionUseCase,
  ListLoginUsersUseCase,
  ResolveOperationalSessionUseCase,
} from '../application/use-cases/operational-session.use-cases.js';
import type { ResolveEffectiveCapabilitiesUseCase } from '../application/use-cases/resolve-effective-capabilities.use-case.js';
import type { ListAccessMatrixUseCase } from '../application/use-cases/list-access-matrix.use-case.js';
import type { CreateAccessRoleUseCase } from '../application/use-cases/create-access-role.use-case.js';
import type { ReplaceAccessRoleCapabilitiesUseCase } from '../application/use-cases/replace-access-role-capabilities.use-case.js';
import type { AssignRoleUseCase } from '../application/use-cases/assign-role.use-case.js';
import type { RevokeRoleAssignmentUseCase } from '../application/use-cases/revoke-role-assignment.use-case.js';
import type { ProvisionPinCredentialUseCase } from '../application/use-cases/provision-pin-credential.use-case.js';
import type { ReplacePinCredentialUseCase } from '../application/use-cases/replace-pin-credential.use-case.js';
import type { SessionTokenPort } from '../application/ports/session-token.port.js';
import {
  OPERATIONAL_SESSION_IDLE_MS,
  assertSessionId,
} from '../domain/operational-session.js';
import {
  expireOperationalSessionCookies,
  OperationalSessionCookieError,
  operationalSessionCsrfHeaderName,
  readOperationalSessionCookies,
  readOperationalSessionLoginCsrfCookie,
  requestIsSameOrigin,
  serializeOperationalSessionCookies,
  serializeOperationalSessionLoginCsrfCookie,
} from './access-session-cookie.js';

export const ACCESS_SESSION_RUNTIME = Symbol('srtaller.access.session-runtime');

export interface AccessSessionRuntime {
  readonly trustedStations: TrustedStationContextResolver;
  readonly authenticatePin: AuthenticatePinUseCase;
  readonly authenticateLocalPinOnly: AuthenticateLocalPinOnlyUseCase | null;
  readonly createSession: CreateOperationalSessionUseCase;
  readonly resolveSession: ResolveOperationalSessionUseCase;
  readonly resolveCapabilities: ResolveEffectiveCapabilitiesUseCase;
  readonly endSession: EndOperationalSessionUseCase;
  readonly listLoginUsers: ListLoginUsersUseCase;
  readonly listAccessMatrix: ListAccessMatrixUseCase;
  readonly createAccessRole: CreateAccessRoleUseCase;
  readonly replaceAccessRoleCapabilities: ReplaceAccessRoleCapabilitiesUseCase;
  readonly assignRole: AssignRoleUseCase;
  readonly revokeRoleAssignment: RevokeRoleAssignmentUseCase;
  readonly provisionPin: ProvisionPinCredentialUseCase;
  readonly replacePin: ReplacePinCredentialUseCase;
  readonly listConfiguredPinUserIds: (scope: unknown) => Promise<readonly string[]>;
  readonly tokens: SessionTokenPort;
}

type HeadersValue = Readonly<Record<string, string | string[] | undefined>>;

class AccessSessionRequestError extends Error {
  constructor() {
    super('Access Session request is invalid.');
    this.name = 'AccessSessionRequestError';
  }
}

function scalar(headers: HeadersValue, name: string): string | undefined {
  const value = headers[name];
  return typeof value === 'string' ? value : undefined;
}

function isAuthenticationDenial(error: unknown): boolean {
  return (
    error instanceof OperationalSessionError ||
    error instanceof PinAuthenticationError ||
    error instanceof PinInputError ||
    error instanceof TrustedStationContextError ||
    error instanceof OperationalSessionCookieError ||
    error instanceof SessionTokenInputError ||
    error instanceof AccessSessionRequestError
  );
}

function sameOrigin(headers: HeadersValue): boolean {
  return requestIsSameOrigin({
    origin: scalar(headers, 'origin'),
    host: scalar(headers, 'host'),
    forwardedProto: scalar(headers, 'x-forwarded-proto'),
    fetchSite: scalar(headers, 'sec-fetch-site'),
  });
}

function parseCreateRequest(value: unknown): Readonly<{
  pinInput: Readonly<{ userId: unknown; pin: unknown }>;
  expectedSessionId: string | null;
}> {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value) ||
    Object.keys(value).length !== 3 ||
    Object.keys(value).some((key) => !['expectedSessionId', 'pin', 'userId'].includes(key))
  ) throw new AccessSessionRequestError();
  const input = value as Readonly<Record<string, unknown>>;
  let expectedSessionId: string | null;
  try {
    expectedSessionId = input.expectedSessionId === null
      ? null
      : assertSessionId(input.expectedSessionId as string);
  } catch {
    throw new AccessSessionRequestError();
  }
  return Object.freeze({
    pinInput: Object.freeze({ userId: input.userId, pin: input.pin }),
    expectedSessionId,
  });
}

function parseLocalPinOnlyCreateRequest(value: unknown): Readonly<{
  pin: unknown;
  expectedSessionId: string | null;
}> {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value) ||
    Object.keys(value).length !== 2 ||
    Object.keys(value).some((key) => !['expectedSessionId', 'pin'].includes(key))
  ) throw new AccessSessionRequestError();
  const input = value as Readonly<Record<string, unknown>>;
  try {
    return Object.freeze({
      pin: input.pin,
      expectedSessionId: input.expectedSessionId === null
        ? null
        : assertSessionId(input.expectedSessionId as string),
    });
  } catch {
    throw new AccessSessionRequestError();
  }
}

function sessionResponse(session: Awaited<ReturnType<ResolveOperationalSessionUseCase['execute']>>) {
  return {
    sessionId: session.sessionId,
    tenantId: session.tenantId,
    branchId: session.branchId,
    stationId: session.stationId,
    userId: session.userId,
    displayName: session.displayName,
    issuedAt: session.issuedAt,
    lastActivityAt: session.lastActivityAt,
    expiresAt: session.expiresAt,
    status: session.status,
  };
}

function revalidateAfterMs(
  session: Readonly<{ lastActivityAt: string; expiresAt: string }> | null,
): number | null {
  if (!session) return null;
  const now = Date.now();
  const idleDeadline = Date.parse(session.lastActivityAt) + OPERATIONAL_SESSION_IDLE_MS;
  const absoluteDeadline = Date.parse(session.expiresAt);
  const remaining = Math.min(idleDeadline, absoluteDeadline) - now;
  return Math.max(1_000, Math.min(OPERATIONAL_SESSION_IDLE_MS, remaining));
}

@Controller('api/access/session')
export class AccessSessionController {
  constructor(
    @Inject(ACCESS_SESSION_RUNTIME)
    private readonly runtime: AccessSessionRuntime,
    @Inject(SESSION_TRANSPORT_POLICY)
    private readonly transportPolicy: SessionTransportPolicy,
  ) {}

  private secureCookie(headers: HeadersValue): boolean {
    return this.transportPolicy.requiresSecureCookies({
      host: scalar(headers, 'host'),
    });
  }

  private loginChallenge(headers: HeadersValue, response: Response): string {
    let csrfToken: string | null = null;
    try {
      csrfToken = readOperationalSessionLoginCsrfCookie(scalar(headers, 'cookie'));
      if (csrfToken) this.runtime.tokens.verifyCsrf(csrfToken);
    } catch {
      csrfToken = null;
    }
    if (csrfToken) return csrfToken;
    const issued = this.runtime.tokens.issue().csrf;
    response.setHeader(
      'Set-Cookie',
      serializeOperationalSessionLoginCsrfCookie(issued, this.secureCookie(headers)),
    );
    return issued;
  }

  private unauthenticatedSnapshot(
    context: Awaited<ReturnType<TrustedStationContextResolver['resolve']>>,
    users: Awaited<ReturnType<ListLoginUsersUseCase['execute']>>,
    headers: HeadersValue,
    response: Response,
  ) {
    return {
      station: { stationId: context.stationId, branchId: context.branchId },
      users,
      capabilities: Object.freeze([]),
      csrfToken: this.loginChallenge(headers, response),
      session: null,
      revalidateAfterMs: null,
    };
  }

  @Get()
  async get(
    @Headers() headers: HeadersValue,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.setHeader('Cache-Control', 'no-store');
    let context;
    let users;
    try {
      context = await this.runtime.trustedStations.resolve(scalar(headers, 'cookie'));
      users = await this.runtime.listLoginUsers.execute(context);
    } catch (error: unknown) {
      if (error instanceof TrustedStationContextError) {
        throw new UnauthorizedException({ code: 'ACCESS_SESSION_DENIED' });
      }
      throw error;
    }
    try {
      const cookies = readOperationalSessionCookies(scalar(headers, 'cookie'));
      if (!cookies.bearer || !cookies.csrf) {
        return this.unauthenticatedSnapshot(context, users, headers, response);
      }
      const resolvedSession = await this.runtime.resolveSession.execute(context, {
        bearer: cookies.bearer,
        csrfCookie: cookies.csrf,
        touch: false,
      });
      const session = sessionResponse(resolvedSession);
      const capabilities = await this.runtime.resolveCapabilities.execute({
        tenantId: context.tenantId,
        branchId: context.branchId,
        userId: resolvedSession.userId,
      });
      return {
        station: { stationId: context.stationId, branchId: context.branchId },
        users,
        capabilities,
        csrfToken: cookies.csrf,
        session,
        revalidateAfterMs: revalidateAfterMs(session),
      };
    } catch (error: unknown) {
      if (!isAuthenticationDenial(error)) throw error;
      // GET never mutates authoritative Session cookies. A delayed read may
      // only issue the disjoint login challenge and therefore cannot erase or
      // rotate a newer login/switch response in the browser cookie jar.
      return this.unauthenticatedSnapshot(context, users, headers, response);
    }
  }

  @Post()
  async create(
    @Body() body: unknown,
    @Headers() headers: HeadersValue,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.setHeader('Cache-Control', 'no-store');
    if (!sameOrigin(headers) || !/^application\/json(?:\s*;|$)/iu.test(scalar(headers, 'content-type') ?? '')) {
      throw new ForbiddenException({ code: 'ACCESS_SESSION_DENIED' });
    }
    try {
      const request = parseCreateRequest(body);
      const csrfHeader = scalar(headers, operationalSessionCsrfHeaderName);
      let csrfCookie: string | null;
      let bearerCookie: string | null = null;
      if (request.expectedSessionId === null) {
        // Initial authentication is deliberately independent from stale or
        // malformed authoritative cookies. PostgreSQL still admits it only
        // when the Station has no active Session.
        csrfCookie = readOperationalSessionLoginCsrfCookie(scalar(headers, 'cookie'));
      } else {
        const cookies = readOperationalSessionCookies(scalar(headers, 'cookie'));
        bearerCookie = cookies.bearer;
        csrfCookie = bearerCookie ? cookies.csrf : null;
      }
      if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
        throw new AccessSessionRequestError();
      }
      this.runtime.tokens.verifyCsrf(csrfCookie);
      const context = await this.runtime.trustedStations.resolve(scalar(headers, 'cookie'));
      if (request.expectedSessionId !== null) {
        if (!bearerCookie) throw new AccessSessionRequestError();
        const active = await this.runtime.resolveSession.execute(context, {
          bearer: bearerCookie,
          csrfCookie,
          csrfHeader,
          requireCsrf: true,
          touch: false,
        });
        if (active.sessionId !== request.expectedSessionId) {
          throw new AccessSessionRequestError();
        }
      }
      const users = await this.runtime.listLoginUsers.execute(context);
      const proof = await this.runtime.authenticatePin.execute(context, request.pinInput);
      // The capability snapshot is advisory UI data. Resolve it before the
      // authoritative Session replacement so a projection failure cannot
      // strand the Station with a Session whose credentials were never
      // delivered to the browser. Every protected request still re-evaluates
      // capabilities after resolving the active Session.
      const capabilities = await this.runtime.resolveCapabilities.execute({
        tenantId: context.tenantId,
        branchId: context.branchId,
        userId: proof.userId,
      });
      const created = await this.runtime.createSession.execute(
        context,
        proof,
        request.expectedSessionId,
      );
      response.setHeader('Set-Cookie', serializeOperationalSessionCookies(
        created.tokens.bearer,
        created.tokens.csrf,
        this.secureCookie(headers),
      ));
      return {
        station: { stationId: context.stationId, branchId: context.branchId },
        users,
        capabilities,
        csrfToken: created.tokens.csrf,
        session: sessionResponse(created.session),
        revalidateAfterMs: revalidateAfterMs(created.session),
      };
    } catch (error: unknown) {
      if (isAuthenticationDenial(error)) {
        throw new UnauthorizedException({ code: 'ACCESS_SESSION_DENIED' });
      }
      throw error;
    }
  }

  /** Development-local daily-login experiment; canonical PIN login remains POST /. */
  @Post('local-pin')
  async createFromLocalPinOnly(
    @Body() body: unknown,
    @Headers() headers: HeadersValue,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.setHeader('Cache-Control', 'no-store');
    if (
      !this.runtime.authenticateLocalPinOnly ||
      !this.transportPolicy.isExplicitLocalRequest({ host: scalar(headers, 'host') }) ||
      !sameOrigin(headers) ||
      !/^application\/json(?:\s*;|$)/iu.test(scalar(headers, 'content-type') ?? '')
    ) {
      throw new ForbiddenException({ code: 'ACCESS_SESSION_DENIED' });
    }
    try {
      const request = parseLocalPinOnlyCreateRequest(body);
      const csrfHeader = scalar(headers, operationalSessionCsrfHeaderName);
      let csrfCookie: string | null;
      let bearerCookie: string | null = null;
      if (request.expectedSessionId === null) {
        csrfCookie = readOperationalSessionLoginCsrfCookie(scalar(headers, 'cookie'));
      } else {
        const cookies = readOperationalSessionCookies(scalar(headers, 'cookie'));
        bearerCookie = cookies.bearer;
        csrfCookie = bearerCookie ? cookies.csrf : null;
      }
      if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
        throw new AccessSessionRequestError();
      }
      this.runtime.tokens.verifyCsrf(csrfCookie);
      const context = await this.runtime.trustedStations.resolve(scalar(headers, 'cookie'));
      if (request.expectedSessionId !== null) {
        if (!bearerCookie) throw new AccessSessionRequestError();
        const active = await this.runtime.resolveSession.execute(context, {
          bearer: bearerCookie,
          csrfCookie,
          csrfHeader,
          requireCsrf: true,
          touch: false,
        });
        if (active.sessionId !== request.expectedSessionId) {
          throw new AccessSessionRequestError();
        }
      }
      const proof = await this.runtime.authenticateLocalPinOnly.execute(context, { pin: request.pin });
      const capabilities = await this.runtime.resolveCapabilities.execute({
        tenantId: context.tenantId,
        branchId: context.branchId,
        userId: proof.userId,
      });
      const created = await this.runtime.createSession.execute(
        context,
        proof,
        request.expectedSessionId,
      );
      const users = await this.runtime.listLoginUsers.execute(context);
      response.setHeader('Set-Cookie', serializeOperationalSessionCookies(
        created.tokens.bearer,
        created.tokens.csrf,
        this.secureCookie(headers),
      ));
      return {
        station: { stationId: context.stationId, branchId: context.branchId },
        users,
        capabilities,
        csrfToken: created.tokens.csrf,
        session: sessionResponse(created.session),
        revalidateAfterMs: revalidateAfterMs(created.session),
      };
    } catch (error: unknown) {
      if (isAuthenticationDenial(error)) {
        throw new UnauthorizedException({ code: 'ACCESS_SESSION_DENIED' });
      }
      throw error;
    }
  }

  @Delete()
  @HttpCode(204)
  async end(
    @Headers() headers: HeadersValue,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    response.setHeader('Cache-Control', 'no-store');
    if (!sameOrigin(headers) || !/^application\/json(?:\s*;|$)/iu.test(scalar(headers, 'content-type') ?? '')) {
      throw new ForbiddenException({ code: 'ACCESS_SESSION_DENIED' });
    }
    let cookies;
    try {
      cookies = readOperationalSessionCookies(scalar(headers, 'cookie'));
    } catch {
      throw new UnauthorizedException({ code: 'ACCESS_SESSION_DENIED' });
    }
    const csrfHeader = scalar(headers, operationalSessionCsrfHeaderName);
    if (!cookies.bearer || !cookies.csrf || !csrfHeader || cookies.csrf !== csrfHeader) {
      throw new UnauthorizedException({ code: 'ACCESS_SESSION_DENIED' });
    }
    try {
      const context = await this.runtime.trustedStations.resolve(scalar(headers, 'cookie'));
      await this.runtime.endSession.execute(context, {
        bearer: cookies.bearer,
        csrfCookie: cookies.csrf,
        csrfHeader,
      });
    } catch (error: unknown) {
      if (!isAuthenticationDenial(error)) throw error;
      return;
    }
    response.setHeader('Set-Cookie', expireOperationalSessionCookies(this.secureCookie(headers)));
  }
}
