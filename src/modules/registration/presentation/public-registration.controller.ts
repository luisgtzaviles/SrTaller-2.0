import { BadRequestException, Body, Controller, ForbiddenException, Get, Headers, HttpCode, Inject, Ip, Post, Res, ServiceUnavailableException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Response } from 'express';

import { PublicRegistrationError, PublicRegistrationService } from '../application/use-cases/public-registration.use-cases.js';

export const PUBLIC_REGISTRATION_SERVICE = Symbol('srtaller.registration.public-service');

type HeadersValue = Readonly<Record<string, string | string[] | undefined>>;
function scalar(headers: HeadersValue, name: string): string | undefined {
  const value = headers[name];
  return typeof value === 'string' ? value : undefined;
}

function requirePublicMutation(headers: HeadersValue): void {
  const contentType = scalar(headers, 'content-type') ?? '';
  const fetchSite = scalar(headers, 'sec-fetch-site');
  const length = Number(scalar(headers, 'content-length') ?? '0');
  if (!/^application\/json(?:\s*;|$)/iu.test(contentType) ||
      (fetchSite !== undefined && fetchSite !== 'same-origin') ||
      !Number.isSafeInteger(length) || length < 0 || length > 16_384) {
    throw new ForbiddenException({ code: 'PUBLIC_REGISTRATION_DENIED' });
  }
  const origin = scalar(headers, 'origin');
  const host = scalar(headers, 'host');
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) throw new Error('origin mismatch');
    } catch {
      throw new ForbiddenException({ code: 'PUBLIC_REGISTRATION_DENIED' });
    }
  }
}

@Controller('api/public')
export class PublicRegistrationController {
  constructor(@Inject(PUBLIC_REGISTRATION_SERVICE) private readonly service: PublicRegistrationService) {}

  @Get('registration-policy')
  policy(@Res({ passthrough: true }) response: Response) {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Referrer-Policy', 'no-referrer');
    return this.service.policy();
  }

  @Post('registrations')
  @HttpCode(202)
  async register(@Body() body: unknown, @Headers() headers: HeadersValue, @Ip() networkSignal: string, @Res({ passthrough: true }) response: Response) {
    return this.executeMutation(headers, response, (correlationId) => this.service.register(body, correlationId, networkSignal));
  }

  @Post('registrations/resend')
  @HttpCode(202)
  async resend(@Body() body: unknown, @Headers() headers: HeadersValue, @Ip() networkSignal: string, @Res({ passthrough: true }) response: Response) {
    return this.executeMutation(headers, response, (correlationId) => this.service.resend(body, correlationId, networkSignal));
  }

  @Post('registrations/verify')
  async verify(@Body() body: unknown, @Headers() headers: HeadersValue, @Ip() networkSignal: string, @Res({ passthrough: true }) response: Response) {
    return this.executeMutation(headers, response, (correlationId) => this.service.verify(body, correlationId, networkSignal));
  }

  private async executeMutation<Result>(
    headers: HeadersValue,
    response: Response,
    operation: (correlationId: string) => Promise<Result>,
  ): Promise<Result> {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Referrer-Policy', 'no-referrer');
    const correlationId = randomUUID();
    response.setHeader('X-Correlation-ID', correlationId);
    requirePublicMutation(headers);
    try {
      return await operation(correlationId);
    } catch (error: unknown) {
      if (error instanceof PublicRegistrationError) {
        if (error.code === 'REGISTRATION_DISABLED') throw new ServiceUnavailableException({ code: 'REGISTRATION_UNAVAILABLE' });
        throw new BadRequestException({ code: 'REGISTRATION_INPUT_INVALID' });
      }
      throw error;
    }
  }
}
