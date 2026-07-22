import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  HttpException,
  type ExceptionFilter,
} from '@nestjs/common';
import { DomainValidationError } from '../../domain/errors.js';
import {
  AuthenticationError,
  AuthorizationError,
  ContextResolutionError,
  PersistenceError,
  RecordConflictError,
  RecordNotFoundError,
  SyntheticFailureError,
} from '../../application/errors.js';

interface SafeErrorBody {
  readonly error: string;
  readonly message: string;
}

interface HttpResponse {
  status(code: number): HttpResponse;
  json(body: SafeErrorBody): void;
}

@Catch()
export class SafeHttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<HttpResponse>();
    const [status, body] = this.map(exception);
    response.status(status).json(body);
  }

  private map(exception: unknown): readonly [number, SafeErrorBody] {
    if (exception instanceof BadRequestException || exception instanceof DomainValidationError) {
      return [400, { error: 'VALIDATION_ERROR', message: 'Request is invalid.' }];
    }
    if (exception instanceof AuthenticationError) {
      return [401, { error: exception.code, message: 'Authentication is required.' }];
    }
    if (exception instanceof ContextResolutionError || exception instanceof AuthorizationError) {
      return [403, { error: 'OPERATION_DENIED', message: 'Operation is not permitted.' }];
    }
    if (exception instanceof RecordNotFoundError) {
      return [404, { error: exception.code, message: 'Synthetic record was not found.' }];
    }
    if (exception instanceof RecordConflictError) {
      return [409, { error: exception.code, message: 'Synthetic record has changed.' }];
    }
    if (exception instanceof PersistenceError || exception instanceof SyntheticFailureError) {
      return [500, { error: 'INTERNAL_ERROR', message: 'Operation could not be completed.' }];
    }
    if (exception instanceof HttpException && exception.getStatus() === 503) {
      return [503, { error: 'SERVICE_UNAVAILABLE', message: 'Service is not ready.' }];
    }
    return [500, { error: 'INTERNAL_ERROR', message: 'Operation could not be completed.' }];
  }
}
