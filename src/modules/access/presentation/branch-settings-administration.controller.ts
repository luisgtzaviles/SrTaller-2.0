import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Header,
  Headers,
  NotFoundException,
  Post,
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

function translateError(error: unknown): never {
  if (error instanceof ContextualAuthorizationError) {
    if (error.code === 'AUTHENTICATION_REQUIRED') {
      throw new UnauthorizedException({ code: 'AUTHENTICATION_REQUIRED' });
    }
    throw new ForbiddenException({ code: 'ACCESS_DENIED' });
  }
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'BRANCH_PERSISTENCE_TIME_ZONE_INVALID'
  ) {
    throw new BadRequestException({ code: 'ADMIN_REQUEST_INVALID' });
  }
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'BRANCH_PERSISTENCE_NOT_FOUND'
  ) {
    throw new NotFoundException({ code: 'ADMIN_RESOURCE_NOT_FOUND' });
  }
  throw error;
}

/** Branch settings remain behind Access so Station scope comes from the server. */
@Controller('api/access/administration/branch')
export class BranchSettingsAdministrationController {
  constructor(private readonly operations: AccessAdministrationOperations) {}

  @Get()
  @Header('Cache-Control', 'private, no-store')
  async read(@Headers() headers: RequestHeaders) {
    try {
      const settings = await this.operations.readBranchSettings(evidence(headers));
      return { timeZone: settings.timeZone };
    } catch (error: unknown) {
      return translateError(error);
    }
  }

  @Post()
  @Header('Cache-Control', 'private, no-store')
  async update(@Body() body: unknown, @Headers() headers: RequestHeaders) {
    try {
      const settings = await this.operations.updateBranchSettings(evidence(headers), body);
      return { timeZone: settings.timeZone };
    } catch (error: unknown) {
      return translateError(error);
    }
  }
}
