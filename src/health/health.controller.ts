import {
  Controller,
  Get,
  ServiceUnavailableException,
} from '@nestjs/common';

import { HealthReadiness } from './health-readiness.service.js';

type HealthResponse = Readonly<{
  status: 'live' | 'ready' | 'starting';
}>;

@Controller()
export class HealthController {
  constructor(private readonly readiness: HealthReadiness) {}

  @Get('livez')
  livez(): HealthResponse {
    return Object.freeze({ status: 'live' });
  }

  @Get('readyz')
  async readyz(): Promise<HealthResponse> {
    if (!(await this.readiness.isReady())) {
      throw new ServiceUnavailableException(
        Object.freeze({ status: 'starting' }),
      );
    }
    return Object.freeze({ status: 'ready' });
  }
}
