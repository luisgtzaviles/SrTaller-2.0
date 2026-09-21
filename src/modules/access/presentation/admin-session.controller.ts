import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  Inject,
  Param,
  Post,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Response } from 'express';

import { SESSION_TRANSPORT_POLICY } from '../../../infrastructure/runtime/index.js';
import type { SessionTransportPolicy } from '../../../infrastructure/runtime/index.js';
import { AdminAuthenticationError } from '../application/use-cases/admin-session.use-cases.js';
import { ACCESS_SESSION_RUNTIME } from './access-session.controller.js';
import type { AccessSessionRuntime } from './access-session.controller.js';
import { requestIsSameOrigin } from './access-session-cookie.js';
import {
  AdminSessionCookieError,
  adminSessionCsrfHeaderName,
  expireAdminSessionCookies,
  readAdminSessionCookies,
  readAdminSessionLoginCsrfCookie,
  serializeAdminSessionCookies,
  serializeAdminSessionLoginCsrfCookie,
} from './admin-session-cookie.js';

type HeadersValue = Readonly<Record<string, string | string[] | undefined>>;

class AdminSessionRequestError extends Error {}

function scalar(headers: HeadersValue, name: string): string | undefined {
  const value = headers[name];
  return typeof value === 'string' ? value : undefined;
}

function validateMutationTransport(headers: HeadersValue): void {
  if (
    !requestIsSameOrigin({
      origin: scalar(headers, 'origin'),
      host: scalar(headers, 'host'),
      forwardedProto: scalar(headers, 'x-forwarded-proto'),
      fetchSite: scalar(headers, 'sec-fetch-site'),
    }) ||
    !/^application\/json(?:\s*;|$)/iu.test(scalar(headers, 'content-type') ?? '')
  ) throw new ForbiddenException({ code: 'ADMIN_SESSION_DENIED' });
}

function exactObject(value: unknown, keys: readonly string[]): Readonly<Record<string, unknown>> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new AdminSessionRequestError();
  const input = value as Readonly<Record<string, unknown>>;
  const actual = Object.keys(input).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) throw new AdminSessionRequestError();
  return input;
}

function publicSession(session: Readonly<{
  tenantId: string;
  sessionId: string;
  userId: string;
  displayName: string;
  status: string;
  issuedAt: string;
  lastActivityAt: string;
  expiresAt: string;
  reauthenticatedAt: string | null;
}>) {
  return Object.freeze({
    tenantId: session.tenantId,
    sessionId: session.sessionId,
    userId: session.userId,
    displayName: session.displayName,
    status: session.status,
    issuedAt: session.issuedAt,
    lastActivityAt: session.lastActivityAt,
    expiresAt: session.expiresAt,
    reauthenticatedAt: session.reauthenticatedAt,
  });
}

@Controller('api/admin')
export class AdminSessionController {
  constructor(
    @Inject(ACCESS_SESSION_RUNTIME) private readonly runtime: AccessSessionRuntime,
    @Inject(SESSION_TRANSPORT_POLICY) private readonly transportPolicy: SessionTransportPolicy,
  ) {}

  private secureCookie(headers: HeadersValue): boolean {
    return this.transportPolicy.requiresSecureCookies({ host: scalar(headers, 'host') });
  }

  private loginChallenge(headers: HeadersValue, response: Response): string {
    let csrf: string | null = null;
    try {
      csrf = readAdminSessionLoginCsrfCookie(scalar(headers, 'cookie'));
      if (csrf) this.runtime.admin.tokens.digestCsrf(csrf);
    } catch { csrf = null; }
    if (csrf) return csrf;
    const issued = this.runtime.admin.tokens.issue().csrf;
    response.setHeader('Set-Cookie', serializeAdminSessionLoginCsrfCookie(issued, this.secureCookie(headers)));
    return issued;
  }

  private async resolve(headers: HeadersValue, requireCsrf: boolean) {
    const cookies = readAdminSessionCookies(scalar(headers, 'cookie'));
    const csrfHeader = scalar(headers, adminSessionCsrfHeaderName);
    if (!cookies.bearer || !cookies.csrf || (requireCsrf && csrfHeader !== cookies.csrf)) throw new AdminAuthenticationError();
    return requireCsrf
      ? this.runtime.admin.resolve.execute({
        bearer: cookies.bearer,
        csrfCookie: cookies.csrf,
        csrfHeader: csrfHeader as string,
        requireCsrf: true,
        touch: true,
      })
      : this.runtime.admin.resolve.execute({
        bearer: cookies.bearer,
        csrfCookie: cookies.csrf,
        touch: true,
      });
  }

  private async snapshot(session: Awaited<ReturnType<AdminSessionController['resolve']>>, csrfToken: string) {
    return Object.freeze({
      session: publicSession(session),
      capabilities: await this.runtime.admin.capabilities(session.tenantId, session.userId),
      csrfToken,
    });
  }

  @Get('session')
  async getSession(@Headers() headers: HeadersValue, @Res({ passthrough: true }) response: Response) {
    response.setHeader('Cache-Control', 'no-store');
    try {
      const cookies = readAdminSessionCookies(scalar(headers, 'cookie'));
      if (!cookies.bearer || !cookies.csrf) throw new AdminAuthenticationError();
      return await this.snapshot(await this.resolve(headers, false), cookies.csrf);
    } catch (error: unknown) {
      if (!(error instanceof AdminAuthenticationError || error instanceof AdminSessionCookieError)) throw error;
      return Object.freeze({ session: null, capabilities: Object.freeze([]), csrfToken: this.loginChallenge(headers, response) });
    }
  }

  @Post('session')
  async login(@Body() body: unknown, @Headers() headers: HeadersValue, @Res({ passthrough: true }) response: Response) {
    response.setHeader('Cache-Control', 'no-store');
    validateMutationTransport(headers);
    try {
      const input = exactObject(body, ['email', 'password']);
      const csrfCookie = readAdminSessionLoginCsrfCookie(scalar(headers, 'cookie'));
      const csrfHeader = scalar(headers, adminSessionCsrfHeaderName);
      if (!csrfCookie || csrfCookie !== csrfHeader) throw new AdminSessionRequestError();
      this.runtime.admin.tokens.digestCsrf(csrfCookie);
      const created = await this.runtime.admin.login.execute({ email: input.email, password: input.password, correlationId: randomUUID() });
      response.setHeader('Set-Cookie', serializeAdminSessionCookies(created.tokens.bearer, created.tokens.csrf, this.secureCookie(headers)));
      return await this.snapshot(created.session, created.tokens.csrf);
    } catch (error: unknown) {
      if (error instanceof AdminAuthenticationError || error instanceof AdminSessionCookieError || error instanceof AdminSessionRequestError) throw new UnauthorizedException({ code: 'ADMIN_SESSION_DENIED' });
      throw error;
    }
  }

  @Delete('session')
  @HttpCode(204)
  async logout(@Headers() headers: HeadersValue, @Res({ passthrough: true }) response: Response): Promise<void> {
    response.setHeader('Cache-Control', 'no-store');
    validateMutationTransport(headers);
    try { await this.runtime.admin.sessions.logout(await this.resolve(headers, true), randomUUID()); } catch (error: unknown) {
      if (!(error instanceof AdminAuthenticationError || error instanceof AdminSessionCookieError)) throw error;
    }
    response.setHeader('Set-Cookie', expireAdminSessionCookies(this.secureCookie(headers)));
  }

  @Post('session/reauthentication')
  async reauthenticate(@Body() body: unknown, @Headers() headers: HeadersValue, @Res({ passthrough: true }) response: Response) {
    response.setHeader('Cache-Control', 'no-store');
    validateMutationTransport(headers);
    try {
      const input = exactObject(body, ['password']);
      const context = await this.resolve(headers, true);
      const reauthenticated = await this.runtime.admin.sessions.reauthenticate(context, input.password, randomUUID());
      return Object.freeze({ reauthenticatedAt: reauthenticated.reauthenticatedAt });
    } catch (error: unknown) {
      if (error instanceof AdminAuthenticationError || error instanceof AdminSessionCookieError || error instanceof AdminSessionRequestError) throw new UnauthorizedException({ code: 'ADMIN_SESSION_DENIED' });
      throw error;
    }
  }

  @Get('sessions')
  async listSessions(@Headers() headers: HeadersValue, @Res({ passthrough: true }) response: Response) {
    response.setHeader('Cache-Control', 'no-store');
    const current = await this.resolveOrDeny(headers, false);
    const sessions = await this.runtime.admin.sessions.list(current);
    return Object.freeze({ currentSessionId: current.sessionId, sessions: sessions.map((session) => publicSession({ ...session, displayName: current.displayName })) });
  }

  @Delete('sessions/:sessionId')
  @HttpCode(204)
  async revokeOne(@Param('sessionId') sessionId: string, @Headers() headers: HeadersValue, @Res({ passthrough: true }) response: Response): Promise<void> {
    response.setHeader('Cache-Control', 'no-store');
    validateMutationTransport(headers);
    await this.runtime.admin.sessions.revokeOne(await this.resolveOrDeny(headers, true), sessionId, randomUUID()).catch(() => { throw new UnauthorizedException({ code: 'ADMIN_SESSION_DENIED' }); });
  }

  @Delete('sessions')
  @HttpCode(204)
  async revokeAll(@Headers() headers: HeadersValue, @Res({ passthrough: true }) response: Response): Promise<void> {
    response.setHeader('Cache-Control', 'no-store');
    validateMutationTransport(headers);
    await this.runtime.admin.sessions.revokeAll(await this.resolveOrDeny(headers, true), randomUUID()).catch(() => { throw new UnauthorizedException({ code: 'ADMIN_SESSION_DENIED' }); });
    response.setHeader('Set-Cookie', expireAdminSessionCookies(this.secureCookie(headers)));
  }

  private async resolveOrDeny(headers: HeadersValue, requireCsrf: boolean) {
    try { return await this.resolve(headers, requireCsrf); } catch (error: unknown) {
      if (error instanceof AdminAuthenticationError || error instanceof AdminSessionCookieError) throw new UnauthorizedException({ code: 'ADMIN_SESSION_DENIED' });
      throw error;
    }
  }
}
