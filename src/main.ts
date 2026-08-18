import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module.js';
import { HealthReadiness } from './health/health-readiness.service.js';
import { configurePreviewStaticFiles } from './preview-static.js';
import { loadStartupConfig } from './startup-config.js';

async function bootstrap(): Promise<void> {
  const config = loadStartupConfig(process.env);
  const application = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn'],
  });
  const readiness = application.get(HealthReadiness);

  application.enableShutdownHooks(['SIGINT', 'SIGTERM']);
  await configurePreviewStaticFiles(application);
  await application.listen(config.port, config.host);
  readiness.markReady();

  process.stdout.write('{"event":"technical_shell_listening"}\n');
}

await bootstrap();
