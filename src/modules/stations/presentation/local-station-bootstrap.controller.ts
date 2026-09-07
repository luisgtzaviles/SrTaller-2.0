import { Controller, ForbiddenException, Headers, HttpCode, Inject, Post, Res } from '@nestjs/common';
import type { Response } from 'express';

import {
  LOCAL_STATION_BOOTSTRAP_RUNTIME,
} from '../application/ports/local-station-bootstrap-runtime.port.js';
import type {
  LocalStationBootstrapRuntime,
} from '../application/ports/local-station-bootstrap-runtime.port.js';

function scalar(value: string | string[] | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

@Controller('api/stations')
export class LocalStationBootstrapController {
  constructor(
    @Inject(LOCAL_STATION_BOOTSTRAP_RUNTIME)
    private readonly runtime: LocalStationBootstrapRuntime,
  ) {}

  @Post('local-bootstrap')
  @HttpCode(204)
  bootstrap(
    @Headers() headers: Readonly<Record<string, string | string[] | undefined>>,
    @Res({ passthrough: true }) response: Response,
  ): void {
    if (!this.runtime.allowsRequest({
      origin: scalar(headers.origin),
      host: scalar(headers.host),
      fetchSite: scalar(headers['sec-fetch-site']),
    })) {
      throw new ForbiddenException({ code: 'STATION_BOOTSTRAP_DENIED' });
    }
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Set-Cookie', this.runtime.stationCookie());
  }
}
