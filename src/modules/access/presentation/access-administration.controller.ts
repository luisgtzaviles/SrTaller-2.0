import {
  BadRequestException,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  Header,
  Headers,
  NotFoundException,
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
    pinConfigured: user.pinConfigured,
  };
}

function record(value: unknown): Readonly<Record<string, unknown>> {
  return value as Readonly<Record<string, unknown>>;
}

function roleResponse(value: unknown) {
  const role = record(value);
  return {
    tenantId: role.tenantId,
    roleId: role.roleId,
    roleKey: role.roleKey,
    displayName: role.displayName,
    description: role.description,
    status: role.status,
    version: role.version,
    capabilityCodes: role.capabilityCodes,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
}

function assignmentResponse(value: unknown) {
  const assignment = record(value);
  return {
    tenantId: assignment.tenantId,
    assignmentId: assignment.assignmentId,
    userId: assignment.userId,
    roleId: assignment.roleId,
    assignmentScope: assignment.assignmentScope,
    branchId: assignment.branchId,
    status: assignment.status,
    version: assignment.version,
    assignedAt: assignment.assignedAt,
    revokedAt: assignment.revokedAt,
  };
}

function matrixResponse(value: unknown) {
  const matrix = record(value);
  return {
    capabilities: (matrix.capabilities as readonly unknown[]).map((value) => {
      const capability = record(value);
      return {
        capabilityCode: capability.capabilityCode,
        createdAt: capability.createdAt,
      };
    }),
    roles: (matrix.roles as readonly unknown[]).map(roleResponse),
    assignments: (matrix.assignments as readonly unknown[]).map(assignmentResponse),
  };
}

function errorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return undefined;
  }
  return typeof error.code === 'string' ? error.code : undefined;
}

const badRequestCodes = new Set([
  'ACCESS_INPUT_INVALID',
  'ADMIN_REQUEST_INVALID',
  'PIN_CREDENTIAL_INPUT_INVALID',
  'USER_INPUT_INVALID',
  'BRANCH_PERSISTENCE_TIME_ZONE_INVALID',
]);

const notFoundCodes = new Set([
  'ACCESS_ASSIGNMENT_NOT_FOUND',
  'ACCESS_REFERENCE_NOT_FOUND',
  'ADMIN_RESOURCE_NOT_FOUND',
  'PIN_CREDENTIAL_USER_INVALID',
  'USER_NOT_FOUND',
  'USER_TENANT_NOT_FOUND',
  'BRANCH_PERSISTENCE_NOT_FOUND',
]);

const conflictCodes = new Set([
  'ACCESS_ASSIGNMENT_CONFLICT',
  'ACCESS_ASSIGNMENT_REVOKED',
  'ACCESS_IDEMPOTENCY_CONFLICT',
  'ACCESS_STALE_WRITE',
  'FIRST_USER_ALREADY_PROVISIONED',
  'PIN_CREDENTIAL_EXISTS',
  'PIN_CREDENTIAL_IDEMPOTENCY_CONFLICT',
  'USER_IDEMPOTENCY_CONFLICT',
  'USER_LIFECYCLE_CONFLICT',
  'USER_PERSISTENCE_CONFLICT',
  'USER_STALE_WRITE',
]);

const authorizationChangedCodes = new Set([
  'ACCESS_AUTHORIZATION_CHANGED',
  'PIN_CREDENTIAL_AUTHORIZATION_CHANGED',
  'USER_AUTHORIZATION_CHANGED',
]);

function translateError(error: unknown): never {
  if (error instanceof ContextualAuthorizationError) {
    if (error.code === 'AUTHENTICATION_REQUIRED') {
      throw new UnauthorizedException({ code: 'AUTHENTICATION_REQUIRED' });
    }
    throw new ForbiddenException({ code: 'ACCESS_DENIED' });
  }
  const code = errorCode(error);
  const name = error instanceof Error ? error.name : undefined;
  if (code !== undefined && authorizationChangedCodes.has(code)) {
    throw new ForbiddenException({ code: 'ACCESS_DENIED' });
  }
  if (
    (code !== undefined && badRequestCodes.has(code)) ||
    name === 'AccessInputError' ||
    name === 'PinInputError' ||
    name === 'UserInputError'
  ) {
    throw new BadRequestException({ code: 'ADMIN_REQUEST_INVALID' });
  }
  if (code !== undefined && notFoundCodes.has(code)) {
    throw new NotFoundException({ code: 'ADMIN_RESOURCE_NOT_FOUND' });
  }
  if (code !== undefined && conflictCodes.has(code)) {
    throw new ConflictException({ code: 'ADMIN_CONFLICT' });
  }
  throw error;
}

/** Product administration adapter. Authority is always resolved by Access. */
@Controller('api/access/administration/users')
export class AccessAdministrationController {
  constructor(private readonly operations: AccessAdministrationOperations) {}

  @Get()
  @Header('Cache-Control', 'private, no-store')
  async list(@Headers() headers: RequestHeaders) {
    try {
      const users = await this.operations.listUsers(evidence(headers));
      return { items: users.map(userResponse) };
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
      return matrixResponse(await this.operations.listRoles(evidence(headers)));
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
      return roleResponse(await this.operations.createRole(evidence(headers), body));
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
      return roleResponse(
        await this.operations.replaceRoleCapabilities(evidence(headers), roleId, body),
      );
    } catch (error: unknown) {
      return translateError(error);
    }
  }

  @Post('roles/:roleId')
  @Header('Cache-Control', 'private, no-store')
  async updateRole(
    @Param('roleId') roleId: string,
    @Body() body: unknown,
    @Headers() headers: RequestHeaders,
  ) {
    try {
      return roleResponse(
        await this.operations.updateRole(evidence(headers), roleId, body),
      );
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
      return assignmentResponse(
        await this.operations.assignRole(evidence(headers), userId, body),
      );
    } catch (error: unknown) {
      return translateError(error);
    }
  }

  @Post(':userId/roles/:assignmentId/revoke')
  @Header('Cache-Control', 'private, no-store')
  async revokeRole(
    @Param('userId') userId: string,
    @Param('assignmentId') assignmentId: string,
    @Body() body: unknown,
    @Headers() headers: RequestHeaders,
  ) {
    try {
      return assignmentResponse(
        await this.operations.revokeRole(evidence(headers), userId, assignmentId, body),
      );
    } catch (error: unknown) {
      return translateError(error);
    }
  }

  @Post(':userId/pin')
  @Header('Cache-Control', 'private, no-store')
  async provisionPin(
    @Param('userId') userId: string,
    @Body() body: unknown,
    @Headers() headers: RequestHeaders,
  ) {
    try {
      await this.operations.provisionFourDigitPin(evidence(headers), userId, body);
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
