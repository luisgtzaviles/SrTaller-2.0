import {
  Catch,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Response } from 'express';

const publicErrorCode = /^[A-Z][A-Z0-9_]{2,79}$/u;

function safeHttpBody(
  exception: unknown,
  status: number,
): Readonly<{ code: string; parameter?: string } | { status: 'starting' }> {
  if (exception instanceof HttpException) {
    const body = exception.getResponse();
    if (typeof body === 'object' && body !== null && !Array.isArray(body)) {
      const candidate = body as Readonly<Record<string, unknown>>;
      if (
        status === HttpStatus.SERVICE_UNAVAILABLE &&
        candidate.status === 'starting' &&
        Object.keys(candidate).length === 1
      ) {
        return Object.freeze({ status: 'starting' });
      }
      if (typeof candidate.code === 'string' && publicErrorCode.test(candidate.code)) {
        if (
          typeof candidate.parameter === 'string' &&
          /^[A-Za-z][A-Za-z0-9_.-]{0,79}$/u.test(candidate.parameter)
        ) {
          return Object.freeze({ code: candidate.code, parameter: candidate.parameter });
        }
        return Object.freeze({ code: candidate.code });
      }
    }
  }
  return Object.freeze({
    code: status === HttpStatus.BAD_REQUEST
      ? 'REQUEST_INVALID'
      : 'HTTP_REQUEST_FAILED',
  });
}

@Catch()
@Injectable()
export class HttpCorrelationExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const correlationId = randomUUID();
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = safeHttpBody(exception, status);
    const errorCode = 'code' in body ? body.code : 'SERVICE_UNAVAILABLE';

    if (!response.headersSent) {
      response.setHeader('X-Correlation-ID', correlationId);
    }
    process.stderr.write(`${JSON.stringify({
      event: 'http_request_failed',
      correlationId,
      status,
      error: {
        name: exception instanceof Error ? exception.name : 'UnknownError',
        code: errorCode,
      },
    })}\n`);
    if (!response.headersSent) {
      response.status(status).json(body);
    }
  }
}
