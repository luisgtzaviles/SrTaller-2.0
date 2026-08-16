import 'reflect-metadata';

import { access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module.js';
import { loadPreviewConfig } from './preview-config.js';
import type { PreviewStaticRequest } from './preview-static-routing.js';
import { shouldServePreviewIndex } from './preview-static-routing.js';
import { loadStartupConfig } from './startup-config.js';

interface PreviewResponse {
  sendFile(path: string): void;
}

type PreviewNext = () => void;

async function configurePreviewStaticFiles(
  application: NestExpressApplication,
): Promise<void> {
  if (!loadPreviewConfig(process.env).enabled) {
    return;
  }
  const publicDirectory = resolve(
    dirname(fileURLToPath(import.meta.url)),
    'public',
  );
  const indexFile = resolve(publicDirectory, 'index.html');
  await access(indexFile);
  application.useStaticAssets(publicDirectory, { index: false });
  application.use(
    (
      request: PreviewStaticRequest,
      response: PreviewResponse,
      next: PreviewNext,
    ): void => {
      if (!shouldServePreviewIndex(request)) {
        next();
        return;
      }
      response.sendFile(indexFile);
    },
  );
}

async function bootstrap(): Promise<void> {
  const config = loadStartupConfig(process.env);
  const application = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn'],
  });

  application.enableShutdownHooks(['SIGINT', 'SIGTERM']);
  await configurePreviewStaticFiles(application);
  await application.listen(config.port, config.host);

  process.stdout.write(
    `${JSON.stringify({
      event: 'technical_shell_listening',
      previewEnabled: loadPreviewConfig(process.env).enabled,
    })}\n`,
  );
}

await bootstrap();
