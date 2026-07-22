import { CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor } from '@nestjs/common';
import { defer, finalize, type Observable } from 'rxjs';
import type { TechnicalTelemetry } from '../../infrastructure/observability/technical-telemetry.js';
import { createCorrelationIdentifiers } from '../../infrastructure/observability/correlation.js';
import type { OperationalLogger } from '../../infrastructure/observability/operational-logger.js';
import { TOKENS } from '../../../bootstrap/tokens.js';
import { singleHeader, type SyntheticHttpRequest } from './http-types.js';

@Injectable()
export class CorrelationInterceptor implements NestInterceptor {
  constructor(
    @Inject(TOKENS.telemetry) private readonly telemetry: TechnicalTelemetry,
    @Inject(TOKENS.logger) private readonly logger: OperationalLogger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<SyntheticHttpRequest>();
    const response = context.switchToHttp().getResponse<{ setHeader(name: string, value: string): void }>();
    const candidate = singleHeader(request.headers, 'x-correlation-id');
    const identifiers = createCorrelationIdentifiers(candidate);
    request.serverCorrelationId = identifiers.serverCorrelationId;
    if (identifiers.clientCorrelationIdCandidate !== undefined) {
      request.clientCorrelationIdCandidate = identifiers.clientCorrelationIdCandidate;
    }
    response.setHeader('x-correlation-id', identifiers.serverCorrelationId);
    const started = performance.now();
    return defer(() => this.telemetry.run(identifiers.serverCorrelationId, () => next.handle())).pipe(
      finalize(() => {
        const durationMs = performance.now() - started;
        const signal = {
          serverCorrelationId: identifiers.serverCorrelationId,
          ...(identifiers.clientCorrelationIdCandidate === undefined
            ? {}
            : { clientCorrelationIdCandidate: identifiers.clientCorrelationIdCandidate }),
          name: 'http.request',
          durationMs,
        };
        this.telemetry.record(signal);
        this.logger.info('http.request.completed', {
          serverCorrelationId: identifiers.serverCorrelationId,
          ...(identifiers.clientCorrelationIdCandidate === undefined
            ? {}
            : { clientCorrelationIdCandidate: identifiers.clientCorrelationIdCandidate }),
          durationMs,
        });
      }),
    );
  }
}
