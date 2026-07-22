import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';
import { SafeHttpExceptionFilter } from '../synthetic/transport/http/safe-http-exception.filter.js';
import { SpikeModule } from './spike.module.js';
import type { OperationalLogger } from '../synthetic/infrastructure/observability/operational-logger.js';
import type { PostgresTimeouts } from '../synthetic/infrastructure/postgres/postgres-pool.js';

export async function createSpikeApplication(
  databaseUrl: string,
  options: {
    readonly enableSignalHooks?: boolean;
    readonly logger?: OperationalLogger;
    readonly postgresTimeouts?: PostgresTimeouts;
  } = {},
): Promise<INestApplication> {
  const app = await NestFactory.create(SpikeModule.register({
    databaseUrl,
    ...(options.logger === undefined ? {} : { logger: options.logger }),
    ...(options.postgresTimeouts === undefined ? {} : { postgresTimeouts: options.postgresTimeouts }),
  }), {
    logger: false,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new SafeHttpExceptionFilter());
  if (options.enableSignalHooks === true) app.enableShutdownHooks();
  await app.init();
  return app;
}
