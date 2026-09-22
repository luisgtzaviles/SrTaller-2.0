import { randomUUID } from 'node:crypto';

import { BadRequestException, Body, ConflictException, Controller, ForbiddenException, Get, Header, Headers, Inject, Param, Patch, Post, UnauthorizedException } from '@nestjs/common';

import { ContextualAuthorizationError } from '../index.js';
import type { ProtectedRequestEvidence } from '../index.js';
import { AdminUsersRolesOperations } from '../application/admin-users-roles.operations.js';
import { ADMIN_INVITATION_SERVICE, AdminInvitationError, AdminInvitationService } from '../application/use-cases/admin-invitation.use-cases.js';
import { AdminPasswordInputError } from '../domain/admin-password.js';

type RequestHeaders = Readonly<Record<string, string | string[] | undefined>>;
function scalar(headers: RequestHeaders, name: string): string | undefined { const value = Object.entries(headers).find(([key]) => key.toLowerCase() === name)?.[1]; return typeof value === 'string' ? value : undefined; }
function evidence(headers: RequestHeaders): ProtectedRequestEvidence { return Object.freeze({ cookieHeader: scalar(headers, 'cookie'), origin: scalar(headers, 'origin'), host: scalar(headers, 'host'), forwardedProto: scalar(headers, 'x-forwarded-proto'), fetchSite: scalar(headers, 'sec-fetch-site'), contentType: scalar(headers, 'content-type'), csrfToken: scalar(headers, 'x-sr-admin-csrf-token') }); }
function object(value: unknown): Readonly<Record<string, unknown>> { if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new BadRequestException({ code: 'ADMIN_INPUT_INVALID' }); return value as Readonly<Record<string, unknown>>; }
function translate(error: unknown): never {
  if (error instanceof AdminPasswordInputError) throw new BadRequestException({ code: error.code });
  if (error instanceof ContextualAuthorizationError) { if (error.code === 'AUTHENTICATION_REQUIRED') throw new UnauthorizedException({ code: error.code }); throw new ForbiddenException({ code: 'ACCESS_DENIED' }); }
  if (error instanceof AdminInvitationError) { if (error.code === 'ADMIN_INVITATION_NOT_FOUND') throw new ConflictException({ code: error.code }); if (error.code === 'ADMIN_INVITATION_AUTHORITY_CHANGED') throw new ForbiddenException({ code: 'ACCESS_DENIED' }); throw new ConflictException({ code: error.code }); }
  throw error;
}

@Controller('api/admin')
export class AdminUsersRolesController {
  constructor(private readonly operations: AdminUsersRolesOperations) {}
  @Get('users') @Header('Cache-Control', 'private, no-store') async users(@Headers() h: RequestHeaders) { try { return await this.operations.listUsers(evidence(h)); } catch (e) { translate(e); } }
  @Get('roles') @Header('Cache-Control', 'private, no-store') async roles(@Headers() h: RequestHeaders) { try { return await this.operations.listRoles(evidence(h)); } catch (e) { translate(e); } }
  @Post('roles') @Header('Cache-Control', 'private, no-store') async createRole(@Body() b: unknown, @Headers() h: RequestHeaders) { try { return { item: await this.operations.createRole(evidence(h), object(b)) }; } catch (e) { translate(e); } }
  @Patch('roles/:roleId') @Header('Cache-Control', 'private, no-store') async updateRole(@Param('roleId') id: string, @Body() b: unknown, @Headers() h: RequestHeaders) { try { return { item: await this.operations.updateRole(evidence(h), id, object(b)) }; } catch (e) { translate(e); } }
  @Post('roles/:roleId/capabilities') @Header('Cache-Control', 'private, no-store') async capabilities(@Param('roleId') id: string, @Body() b: unknown, @Headers() h: RequestHeaders) { try { return { item: await this.operations.replaceRoleCapabilities(evidence(h), id, object(b)) }; } catch (e) { translate(e); } }
  @Post('roles/:roleId/deactivation') @Header('Cache-Control', 'private, no-store') async deactivateRole(@Param('roleId') id: string, @Body() b: unknown, @Headers() h: RequestHeaders) { try { return { item: await this.operations.transitionRole(evidence(h), id, object(b), false) }; } catch (e) { translate(e); } }
  @Post('roles/:roleId/reactivation') @Header('Cache-Control', 'private, no-store') async reactivateRole(@Param('roleId') id: string, @Body() b: unknown, @Headers() h: RequestHeaders) { try { return { item: await this.operations.transitionRole(evidence(h), id, object(b), true) }; } catch (e) { translate(e); } }
  @Post('role-assignments') @Header('Cache-Control', 'private, no-store') async assign(@Body() b: unknown, @Headers() h: RequestHeaders) { try { return { item: await this.operations.assignRole(evidence(h), object(b)) }; } catch (e) { translate(e); } }
  @Post('role-assignments/revocation') @Header('Cache-Control', 'private, no-store') async revoke(@Body() b: unknown, @Headers() h: RequestHeaders) { try { return { item: await this.operations.revokeRole(evidence(h), object(b)) }; } catch (e) { translate(e); } }
  @Post('invitations') @Header('Cache-Control', 'private, no-store') async invite(@Body() b: unknown, @Headers() h: RequestHeaders) { try { return { item: await this.operations.issueInvitation(evidence(h), object(b)) }; } catch (e) { translate(e); } }
  @Post('invitations/:invitationId/resend') @Header('Cache-Control', 'private, no-store') async resend(@Param('invitationId') id: string, @Body() b: unknown, @Headers() h: RequestHeaders) { try { return { item: await this.operations.resendInvitation(evidence(h), id, object(b)) }; } catch (e) { translate(e); } }
  @Post('invitations/:invitationId/revocation') @Header('Cache-Control', 'private, no-store') async revokeInvite(@Param('invitationId') id: string, @Body() b: unknown, @Headers() h: RequestHeaders) { try { return { item: await this.operations.revokeInvitation(evidence(h), id, object(b)) }; } catch (e) { translate(e); } }
  @Post('users/:userId/deactivation') @Header('Cache-Control', 'private, no-store') async deactivateUser(@Param('userId') id: string, @Body() b: unknown, @Headers() h: RequestHeaders) { try { return { item: await this.operations.transitionUser(evidence(h), id, object(b), false) }; } catch (e) { translate(e); } }
  @Post('users/:userId/reactivation') @Header('Cache-Control', 'private, no-store') async reactivateUser(@Param('userId') id: string, @Body() b: unknown, @Headers() h: RequestHeaders) { try { return { item: await this.operations.transitionUser(evidence(h), id, object(b), true) }; } catch (e) { translate(e); } }
  @Post('users/:userId/admin-identities/:identityId/revocation') @Header('Cache-Control', 'private, no-store') async revokeIdentity(@Param('userId') userId: string, @Param('identityId') identityId: string, @Body() b: unknown, @Headers() h: RequestHeaders) { try { await this.operations.revokeAdminIdentity(evidence(h), userId, identityId, object(b)); return { status: 'REVOKED' }; } catch (e) { translate(e); } }
  @Post('users/:userId/pin') @Header('Cache-Control', 'private, no-store') async replacePin(@Param('userId') userId: string, @Body() b: unknown, @Headers() h: RequestHeaders) { try { return { item: await this.operations.replaceOperationalPin(evidence(h), userId, object(b)) }; } catch (e) { translate(e); } }
}

@Controller('api/public/admin-invitations')
export class PublicAdminInvitationController {
  constructor(@Inject(ADMIN_INVITATION_SERVICE) private readonly invitations: AdminInvitationService) {}
  @Post('acceptance') @Header('Cache-Control', 'no-store') async accept(@Body() body: unknown) { try { const b = object(body); const item = await this.invitations.accept({ token: b.token, password: b.password, clientRequestId: String(b.clientRequestId), correlationId: randomUUID() }); return { status: item.status }; } catch (error) { translate(error); } }
}
