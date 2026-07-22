import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import { TOKENS } from '../../../bootstrap/tokens.js';

interface HealthOperationalLogger {
  info(event: string): void;
  warn(event: string): void;
}

@Controller('health')
export class HealthController {
  constructor(
    @Inject(TOKENS.readiness) private readonly readiness: { ping(): Promise<boolean> },
    @Inject(TOKENS.logger) private readonly logger: HealthOperationalLogger,
  ) {}

  @Get('live')
  live() {
    return { status: 'ok' };
  }

  @Get('ready')
  async ready() {
    if (!(await this.readiness.ping())) {
      this.logger.warn('dependency.postgres.unavailable');
      throw new ServiceUnavailableException();
    }
    this.logger.info('readiness.reached');
    return { status: 'ready' };
  }
}
