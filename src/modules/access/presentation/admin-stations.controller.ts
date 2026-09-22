import {
  BadRequestException, Body, ConflictException, Controller, ForbiddenException,
  Get, Header, Headers, Inject, NotFoundException, Param, Patch, Post,
  UnauthorizedException,
} from '@nestjs/common';

import { STATION_ADMINISTRATION_RUNTIME } from '../../stations/index.js';
import type { StationAdministrationContext, StationAdministrationRuntime } from '../../stations/index.js';
import { ADMIN_AUTHORIZATION_EXECUTOR, ContextualAuthorizationError } from '../index.js';
import type { AdminAuthorizationExecutor, AuthorizedAdminContext, ProtectedRequestEvidence } from '../index.js';
import { ACCESS_SESSION_RUNTIME } from './access-session.controller.js';
import type { AccessSessionRuntime } from './access-session.controller.js';

type RequestHeaders = Readonly<Record<string, string | string[] | undefined>>;
function scalar(headers: RequestHeaders, name: string): string | undefined { const value = Object.entries(headers).find(([key]) => key.toLowerCase() === name)?.[1]; return typeof value === 'string' ? value : undefined; }
function evidence(headers: RequestHeaders): ProtectedRequestEvidence { return Object.freeze({ cookieHeader: scalar(headers, 'cookie'), origin: scalar(headers, 'origin'), host: scalar(headers, 'host'), forwardedProto: scalar(headers, 'x-forwarded-proto'), fetchSite: scalar(headers, 'sec-fetch-site'), contentType: scalar(headers, 'content-type'), csrfToken: scalar(headers, 'x-sr-admin-csrf-token') }); }
function branchIds(body: unknown): readonly string[] { if (typeof body !== 'object' || body === null || Array.isArray(body)) return Object.freeze([]); const branchId = (body as Record<string, unknown>).branchId; return typeof branchId === 'string' ? Object.freeze([branchId]) : Object.freeze([]); }
function translate(error: unknown): never {
  if (error instanceof ContextualAuthorizationError) { if (error.code === 'AUTHENTICATION_REQUIRED') throw new UnauthorizedException({ code: 'AUTHENTICATION_REQUIRED' }); throw new ForbiddenException({ code: 'ACCESS_DENIED' }); }
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
  if (code === 'STATION_NOT_FOUND' || code === 'STATION_ENROLLMENT_NOT_FOUND') throw new NotFoundException({ code });
  if (code === 'STATION_INVALID_INPUT') throw new BadRequestException({ code });
  if (code === 'STATION_ACCESS_DENIED' || code === 'STATION_AUTHORITY_CHANGED') throw new ForbiddenException({ code: 'ACCESS_DENIED' });
  if (['STATION_VERSION_CONFLICT', 'STATION_IDEMPOTENCY_CONFLICT', 'STATION_INVALID_TRANSITION', 'STATION_BRANCH_INACTIVE', 'STATION_CONCURRENCY_CONFLICT'].includes(code)) throw new ConflictException({ code });
  throw error;
}

@Controller('api/admin/stations')
export class AdminStationsController {
  constructor(
    @Inject(ADMIN_AUTHORIZATION_EXECUTOR) private readonly authorization: AdminAuthorizationExecutor,
    @Inject(STATION_ADMINISTRATION_RUNTIME) private readonly stations: StationAdministrationRuntime,
    @Inject(ACCESS_SESSION_RUNTIME) private readonly access: AccessSessionRuntime,
  ) {}

  @Get() @Header('Cache-Control', 'private, no-store')
  async list(@Headers() headers: RequestHeaders) { try { return await this.authorization.execute(evidence(headers), { capability: 'stations.read', kind: 'read', allowBranchRestricted: true }, async (context) => ({ items: await this.stations.list(this.context(context)) })); } catch (error: unknown) { translate(error); } }

  @Get('enrollments') @Header('Cache-Control', 'private, no-store')
  async enrollments(@Headers() headers: RequestHeaders) { try { return await this.authorization.execute(evidence(headers), { capability: 'stations.read', kind: 'read', allowBranchRestricted: true }, async (context) => ({ items: await this.stations.listEnrollments(this.context(context)) })); } catch (error: unknown) { translate(error); } }

  @Get(':stationId') @Header('Cache-Control', 'private, no-store')
  async read(@Param('stationId') stationId: string, @Headers() headers: RequestHeaders) { try { return await this.authorization.execute(evidence(headers), { capability: 'stations.read', kind: 'read', allowBranchRestricted: true }, async (context) => ({ item: await this.stations.read(this.context(context), stationId) })); } catch (error: unknown) { translate(error); } }

  @Patch(':stationId/name') @Header('Cache-Control', 'private, no-store')
  async rename(@Param('stationId') stationId: string, @Body() body: unknown, @Headers() headers: RequestHeaders) { try { return await this.authorization.execute(evidence(headers), { capability: 'stations.manage', kind: 'state-change', allowBranchRestricted: true }, async (context) => ({ item: await this.stations.rename(this.context(context), stationId, body) })); } catch (error: unknown) { translate(error); } }

  @Post('enrollments') @Header('Cache-Control', 'private, no-store')
  async issue(@Body() body: unknown, @Headers() headers: RequestHeaders) { try { return await this.authorization.execute(evidence(headers), { capability: 'stations.enrollment.issue', kind: 'state-change', requiresRecentReauthentication: true, branchIds: branchIds(body) }, async (context) => await this.stations.issueEnrollment(this.context(context), body)); } catch (error: unknown) { translate(error); } }

  @Post('enrollments/:challengeId/cancellation') @Header('Cache-Control', 'private, no-store')
  async cancel(@Param('challengeId') challengeId: string, @Body() body: unknown, @Headers() headers: RequestHeaders) { try { return await this.authorization.execute(evidence(headers), { capability: 'stations.enrollment.cancel', kind: 'state-change', allowBranchRestricted: true }, async (context) => ({ item: await this.stations.cancelEnrollment(this.context(context), challengeId, body) })); } catch (error: unknown) { translate(error); } }

  @Post(':stationId/unlink') @Header('Cache-Control', 'private, no-store')
  async unlink(@Param('stationId') stationId: string, @Body() body: unknown, @Headers() headers: RequestHeaders) { try { return await this.authorization.execute(evidence(headers), { capability: 'stations.relink', kind: 'state-change', requiresRecentReauthentication: true, allowBranchRestricted: true }, async (context) => ({ item: await this.stations.unlink(this.context(context), stationId, body) })); } catch (error: unknown) { translate(error); } }

  @Post(':stationId/relink') @Header('Cache-Control', 'private, no-store')
  async relink(@Param('stationId') stationId: string, @Body() body: unknown, @Headers() headers: RequestHeaders) { try { return await this.authorization.execute(evidence(headers), { capability: 'stations.relink', kind: 'state-change', requiresRecentReauthentication: true, branchIds: branchIds(body), allowBranchRestricted: true }, async (context) => await this.stations.initiateRelink(this.context(context), stationId, body)); } catch (error: unknown) { translate(error); } }

  @Post(':stationId/revocation') @Header('Cache-Control', 'private, no-store')
  async revoke(@Param('stationId') stationId: string, @Body() body: unknown, @Headers() headers: RequestHeaders) { try { return await this.authorization.execute(evidence(headers), { capability: 'stations.revoke', kind: 'state-change', requiresRecentReauthentication: true, allowBranchRestricted: true }, async (context) => ({ item: await this.stations.revoke(this.context(context), stationId, body) })); } catch (error: unknown) { translate(error); } }

  private context(context: AuthorizedAdminContext): StationAdministrationContext {
    return Object.freeze({ ...context, invalidateOperationalSessions: (stationId: string, occurredAt: string, transactionContext: object) => this.access.invalidateStationSessionsAtCommit(context.tenantId, stationId, occurredAt, transactionContext) });
  }
}
