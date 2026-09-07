import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Header,
  Headers,
  Post,
  Param,
  Body,
  UnauthorizedException,
} from '@nestjs/common';

import { ContextualAuthorizationError } from '../index.js';
import type { ProtectedRequestEvidence } from '../index.js';
import { AccessAdministrationOperations } from '../application/access-administration-operations.js';

type RequestHeaders = Readonly<Record<string, string | string[] | undefined>>;

function headerValue(headers: RequestHeaders, name: string): string | undefined {
  const direct = headers[name];
  if (typeof direct === 'string') return direct;
  if (direct !== undefined) return undefined;
  const entry = Object.entries(headers).find(([key]) => key.toLowerCase() === name);
  return typeof entry?.[1] === 'string' ? entry[1] : undefined;
}

function evidence(headers: RequestHeaders): ProtectedRequestEvidence {
  return Object.freeze({
    cookieHeader: headerValue(headers, 'cookie'),
    origin: headerValue(headers, 'origin'),
    host: headerValue(headers, 'host'),
    forwardedProto: headerValue(headers, 'x-forwarded-proto'),
    fetchSite: headerValue(headers, 'sec-fetch-site'),
    contentType: headerValue(headers, 'content-type'),
    csrfToken: headerValue(headers, 'x-sr-csrf-token'),
  });
}

function userResponse(user: Awaited<ReturnType<AccessAdministrationOperations['createUser']>>) {
  return {
    userId: user.userId,
    displayName: user.displayName,
    operationalIdentifier: user.operationalIdentifier,
    status: user.status,
    version: user.version,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    pinConfigured: false,
  };
}

function translateError(error: unknown): never {
  if (error instanceof ContextualAuthorizationError) {
    if (error.code === 'AUTHENTICATION_REQUIRED') {
      throw new UnauthorizedException({ code: 'AUTHENTICATION_REQUIRED' });
    }
    throw new ForbiddenException({ code: 'ACCESS_DENIED' });
  }
  throw new BadRequestException({ code: 'USER_OPERATION_REJECTED' });
}

/** Local Product Mode administration adapter. Authority is always resolved by Access. */
@Controller('api/access/administration/users')
export class AccessAdministrationController {
  constructor(private readonly operations: AccessAdministrationOperations) {}

  @Get()
  @Header('Cache-Control', 'private, no-store')
  async list(@Headers() headers: RequestHeaders) {
    try {
      const users = await this.operations.listUsers(evidence(headers));
      return { items: users };
    } catch (error: unknown) {
      return translateError(error);
    }
  }

  @Post()
  @Header('Cache-Control', 'private, no-store')
  async create(
    @Body() body: unknown,
    @Headers() headers: RequestHeaders,
  ) {
    try {
      const user = await this.operations.createUser(evidence(headers), body);
      return userResponse(user);
    } catch (error: unknown) {
      return translateError(error);
    }
  }

  @Get('roles')
  @Header('Cache-Control', 'private, no-store')
  async listRoles(@Headers() headers: RequestHeaders) {
    try {
      return await this.operations.listRoles(evidence(headers));
    } catch (error: unknown) {
      return translateError(error);
    }
  }

  @Post('roles')
  @Header('Cache-Control', 'private, no-store')
  async createRole(
    @Body() body: unknown,
    @Headers() headers: RequestHeaders,
  ) {
    try {
      return await this.operations.createRole(evidence(headers), body);
    } catch (error: unknown) {
      return translateError(error);
    }
  }

  @Post('roles/:roleId/capabilities')
  @Header('Cache-Control', 'private, no-store')
  async replaceRoleCapabilities(
    @Param('roleId') roleId: string,
    @Body() body: unknown,
    @Headers() headers: RequestHeaders,
  ) {
    try {
      return await this.operations.replaceRoleCapabilities(evidence(headers), roleId, body);
    } catch (error: unknown) {
      return translateError(error);
    }
  }

  @Post(':userId/roles')
  @Header('Cache-Control', 'private, no-store')
  async assignRole(
    @Param('userId') userId: string,
    @Body() body: unknown,
    @Headers() headers: RequestHeaders,
  ) {
    try {
      return await this.operations.assignRole(evidence(headers), userId, body);
    } catch (error: unknown) {
      return translateError(error);
    }
  }

  @Post(':userId/roles/:assignmentId/revoke')
  @Header('Cache-Control', 'private, no-store')
  async revokeRole(
    @Param('assignmentId') assignmentId: string,
    @Body() body: unknown,
    @Headers() headers: RequestHeaders,
  ) {
    try {
      return await this.operations.revokeRole(evidence(headers), assignmentId, body);
    } catch (error: unknown) {
      return translateError(error);
    }
  }

  @Post(':userId/pin')
  @Header('Cache-Control', 'private, no-store')
  async provisionLocalPin(
    @Param('userId') userId: string,
    @Body() body: unknown,
    @Headers() headers: RequestHeaders,
  ) {
    try {
      await this.operations.provisionLocalFourDigitPin(evidence(headers), userId, body);
      return { provisioned: true };
    } catch (error: unknown) {
      return translateError(error);
    }
  }

  @Post(':userId/status')
  @Header('Cache-Control', 'private, no-store')
  async transitionUser(
    @Param('userId') userId: string,
    @Body() body: unknown,
    @Headers() headers: RequestHeaders,
  ) {
    try {
      return userResponse(await this.operations.transitionUser(evidence(headers), userId, body));
    } catch (error: unknown) {
      return translateError(error);
    }
  }

  @Post(':userId')
  @Header('Cache-Control', 'private, no-store')
  async update(
    @Param('userId') userId: string,
    @Body() body: unknown,
    @Headers() headers: RequestHeaders,
  ) {
    try {
      return userResponse(await this.operations.updateUser(evidence(headers), userId, body));
    } catch (error: unknown) {
      return translateError(error);
    }
  }
}
