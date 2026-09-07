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
import { OperationalSessionError } from '../application/use-cases/operational-session.use-cases.js';
import type {
  CreateOperationalSessionUseCase,
  EndOperationalSessionUseCase,
  ListLoginUsersUseCase,
  ResolveOperationalSessionUseCase,
} from '../application/use-cases/operational-session.use-cases.js';
import type { SessionTokenPort } from '../application/ports/session-token.port.js';
import {
  OPERATIONAL_SESSION_IDLE_MS,
} from '../domain/operational-session.js';
import {
  expireOperationalSessionCookies,
  OperationalSessionCookieError,
  operationalSessionCsrfHeaderName,
  readOperationalSessionCookies,
  requestIsSameOrigin,
  serializeOperationalSessionCookies,
  serializeOperationalSessionCsrfCookie,
} from './access-session-cookie.js';

export const ACCESS_SESSION_RUNTIME = Symbol('srtaller.access.session-runtime');

export interface AccessSessionRuntime {
  readonly trustedStations: TrustedStationContextResolver;
  readonly authenticatePin: AuthenticatePinUseCase;
  readonly createSession: CreateOperationalSessionUseCase;
  readonly resolveSession: ResolveOperationalSessionUseCase;
  readonly endSession: EndOperationalSessionUseCase;
  readonly listLoginUsers: ListLoginUsersUseCase;
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
      let csrfToken = cookies.csrf;
      let session = null;
      if (cookies.bearer) {
        if (!csrfToken) throw new Error('Incomplete session cookie.');
        session = sessionResponse(await this.runtime.resolveSession.execute(context, {
          bearer: cookies.bearer,
          csrfCookie: csrfToken,
          touch: false,
        }));
      } else {
        if (csrfToken) this.runtime.tokens.verifyCsrf(csrfToken);
        else {
          csrfToken = this.runtime.tokens.issue().csrf;
          response.setHeader('Set-Cookie', serializeOperationalSessionCsrfCookie(csrfToken, this.secureCookie(headers)));
        }
      }
      return {
        station: { stationId: context.stationId, branchId: context.branchId },
        users,
        csrfToken,
        session,
        revalidateAfterMs: revalidateAfterMs(session),
      };
    } catch (error: unknown) {
      if (!isAuthenticationDenial(error)) throw error;
      const csrfToken = this.runtime.tokens.issue().csrf;
      response.setHeader('Set-Cookie', [
        expireOperationalSessionCookies(this.secureCookie(headers))[0]!,
        serializeOperationalSessionCsrfCookie(csrfToken, this.secureCookie(headers)),
      ]);
      return {
        station: { stationId: context.stationId, branchId: context.branchId },
        users,
        csrfToken,
        session: null,
        revalidateAfterMs: null,
      };
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
      const cookies = readOperationalSessionCookies(scalar(headers, 'cookie'));
      const csrfHeader = scalar(headers, operationalSessionCsrfHeaderName);
      if (!cookies.csrf || !csrfHeader || cookies.csrf !== csrfHeader) {
        throw new AccessSessionRequestError();
      }
      this.runtime.tokens.verifyCsrf(cookies.csrf);
      const context = await this.runtime.trustedStations.resolve(scalar(headers, 'cookie'));
      const users = await this.runtime.listLoginUsers.execute(context);
      const proof = await this.runtime.authenticatePin.execute(context, body);
      const created = await this.runtime.createSession.execute(context, proof);
      response.setHeader('Set-Cookie', serializeOperationalSessionCookies(
        created.tokens.bearer,
        created.tokens.csrf,
        this.secureCookie(headers),
      ));
      return {
        station: { stationId: context.stationId, branchId: context.branchId },
        users,
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
      response.setHeader('Set-Cookie', expireOperationalSessionCookies(this.secureCookie(headers)));
      return;
    }
    response.setHeader('Set-Cookie', expireOperationalSessionCookies(this.secureCookie(headers)));
  }
}
