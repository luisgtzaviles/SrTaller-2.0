import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Header,
  Headers,
  NotFoundException,
  Patch,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

import { ContextualAuthorizationError } from '../index.js';
import type { ProtectedRequestEvidence } from '../index.js';
import { AccessSelfPreferencesOperations } from '../application/access-self-preferences.operations.js';

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

function response(value: Readonly<{ newRepairFormMode: string; priceListShowReferenceCost: boolean }>) {
  return { newRepairFormMode: value.newRepairFormMode, priceListShowReferenceCost: value.priceListShowReferenceCost };
}

function translateError(error: unknown): never {
  if (error instanceof ContextualAuthorizationError) {
    if (error.code === 'AUTHENTICATION_REQUIRED') {
      throw new UnauthorizedException({ code: 'AUTHENTICATION_REQUIRED' });
    }
    throw new ForbiddenException({ code: 'ACCESS_DENIED' });
  }
  const code = typeof error === 'object' && error !== null && 'code' in error &&
      typeof error.code === 'string'
    ? error.code
    : undefined;
  if (code === 'USER_PREFERENCES_INVALID') {
    throw new BadRequestException({ code });
  }
  if (code?.startsWith('USER_PREFERENCES_')) {
    if (code === 'USER_PREFERENCES_AUTHENTICATION_CHANGED') {
      throw new ForbiddenException({ code: 'ACCESS_DENIED' });
    }
    if (code === 'USER_PREFERENCES_USER_NOT_FOUND') {
      throw new NotFoundException({ code });
    }
    if (code === 'USER_PREFERENCES_INPUT_INVALID') {
      throw new BadRequestException({ code: 'USER_PREFERENCES_INVALID' });
    }
    throw new ServiceUnavailableException({
      code: 'USER_PREFERENCES_UNAVAILABLE',
    });
  }
  throw error;
}

@Controller('api/users/me/preferences')
export class UserPreferencesController {
  constructor(private readonly operations: AccessSelfPreferencesOperations) {}

  @Get()
  @Header('Cache-Control', 'private, no-store')
  async get(@Headers() headers: RequestHeaders) {
    try {
      return response(await this.operations.get(evidence(headers)));
    } catch (error: unknown) {
      return translateError(error);
    }
  }

  @Patch()
  @Header('Cache-Control', 'private, no-store')
  async update(@Body() body: unknown, @Headers() headers: RequestHeaders) {
    try {
      return response(await this.operations.update(evidence(headers), body));
    } catch (error: unknown) {
      return translateError(error);
    }
  }
}
