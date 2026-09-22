import { BadRequestException, Body, ConflictException, Controller, ForbiddenException, Get, Header, Headers, Inject, NotFoundException, Param, Patch, Post, UnauthorizedException } from '@nestjs/common';

import { BRANCH_ADMINISTRATION_RUNTIME } from '../../stations/index.js';
import type { BranchAdministrationRuntime } from '../../stations/index.js';
import { ADMIN_AUTHORIZATION_EXECUTOR, ContextualAuthorizationError } from '../index.js';
import type { AdminAuthorizationExecutor, ProtectedRequestEvidence } from '../index.js';

type RequestHeaders = Readonly<Record<string, string | string[] | undefined>>;
function scalar(headers: RequestHeaders, name: string): string | undefined {
  const value = Object.entries(headers).find(([key]) => key.toLowerCase() === name)?.[1];
  return typeof value === 'string' ? value : undefined;
}
function evidence(headers: RequestHeaders): ProtectedRequestEvidence {
  return Object.freeze({ cookieHeader: scalar(headers, 'cookie'), origin: scalar(headers, 'origin'), host: scalar(headers, 'host'), forwardedProto: scalar(headers, 'x-forwarded-proto'), fetchSite: scalar(headers, 'sec-fetch-site'), contentType: scalar(headers, 'content-type'), csrfToken: scalar(headers, 'x-sr-csrf-token') });
}
function translate(error: unknown): never {
  if (error instanceof ContextualAuthorizationError) {
    if (error.code === 'AUTHENTICATION_REQUIRED') throw new UnauthorizedException({ code: 'AUTHENTICATION_REQUIRED' });
    throw new ForbiddenException({ code: 'ACCESS_DENIED' });
  }
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
  if (code === 'BRANCH_NOT_FOUND') throw new NotFoundException({ code });
  if (code === 'BRANCH_INVALID_INPUT') throw new BadRequestException({ code });
  if (['BRANCH_VERSION_CONFLICT', 'BRANCH_IDEMPOTENCY_CONFLICT', 'BRANCH_INVALID_TRANSITION', 'LAST_ACTIVE_BRANCH_REQUIRED', 'BRANCH_CONCURRENCY_CONFLICT'].includes(code)) throw new ConflictException({ code });
  if (code === 'BRANCH_AUTHORITY_CHANGED') throw new ForbiddenException({ code: 'ACCESS_DENIED' });
  throw error;
}

@Controller('api/admin/branches')
export class AdminBranchesController {
  constructor(
    @Inject(ADMIN_AUTHORIZATION_EXECUTOR) private readonly authorization: AdminAuthorizationExecutor,
    @Inject(BRANCH_ADMINISTRATION_RUNTIME) private readonly branches: BranchAdministrationRuntime,
  ) {}

  @Get()
  @Header('Cache-Control', 'private, no-store')
  async list(@Headers() headers: RequestHeaders) { try { return await this.authorization.execute(evidence(headers), { capability: 'branches.read', kind: 'read' }, async (context) => ({ items: await this.branches.list(context) })); } catch (error: unknown) { translate(error); } }

  @Get(':branchId')
  @Header('Cache-Control', 'private, no-store')
  async read(@Param('branchId') branchId: string, @Headers() headers: RequestHeaders) { try { return await this.authorization.execute(evidence(headers), { capability: 'branches.read', kind: 'read' }, async (context) => ({ item: await this.branches.read(context, branchId) })); } catch (error: unknown) { translate(error); } }

  @Post()
  @Header('Cache-Control', 'private, no-store')
  async create(@Body() body: unknown, @Headers() headers: RequestHeaders) { try { return await this.authorization.execute(evidence(headers), { capability: 'branches.manage', kind: 'state-change' }, async (context) => ({ item: await this.branches.create(context, body) })); } catch (error: unknown) { translate(error); } }

  @Patch(':branchId')
  @Header('Cache-Control', 'private, no-store')
  async update(@Param('branchId') branchId: string, @Body() body: unknown, @Headers() headers: RequestHeaders) { try { return await this.authorization.execute(evidence(headers), { capability: 'branches.manage', kind: 'state-change' }, async (context) => ({ item: await this.branches.update(context, branchId, body) })); } catch (error: unknown) { translate(error); } }

  @Post(':branchId/deactivation')
  @Header('Cache-Control', 'private, no-store')
  async deactivate(@Param('branchId') branchId: string, @Body() body: unknown, @Headers() headers: RequestHeaders) { try { return await this.authorization.execute(evidence(headers), { capability: 'branches.deactivate', kind: 'state-change', requiresRecentReauthentication: true }, async (context) => ({ item: await this.branches.deactivate(context, branchId, body) })); } catch (error: unknown) { translate(error); } }

  @Post(':branchId/reactivation')
  @Header('Cache-Control', 'private, no-store')
  async reactivate(@Param('branchId') branchId: string, @Body() body: unknown, @Headers() headers: RequestHeaders) { try { return await this.authorization.execute(evidence(headers), { capability: 'branches.deactivate', kind: 'state-change', requiresRecentReauthentication: true }, async (context) => ({ item: await this.branches.reactivate(context, branchId, body) })); } catch (error: unknown) { translate(error); } }
}
