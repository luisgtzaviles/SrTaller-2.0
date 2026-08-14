import {
  Controller,
  Get,
  HttpCode,
  ServiceUnavailableException,
} from '@nestjs/common';

import { PreviewRuntimeService } from '../../../../preview-runtime.service.js';

const READY_RESPONSE = Object.freeze({ status: 'ok' });
const UNAVAILABLE_RESPONSE = Object.freeze({ status: 'unavailable' });

@Controller()
export class HealthController {
  constructor(private readonly runtime: PreviewRuntimeService) {}

  @Get('healthz')
  @HttpCode(200)
  healthz(): Readonly<{ status: 'ok' }> {
    if (!this.runtime.ready) {
      throw new ServiceUnavailableException(UNAVAILABLE_RESPONSE);
    }
    return READY_RESPONSE;
  }
}
