import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module.js';
import { HealthReadiness } from './health/health-readiness.service.js';
import { createDatabaseRuntime } from './infrastructure/database/database-runtime.js';
import type { DatabaseRuntime } from './infrastructure/database/database-runtime.js';
import { loadRequiredServerSecrets } from './infrastructure/config/external-configuration.js';
import { configurePreviewStaticFiles } from './preview-static.js';
import { loadStartupConfig } from './startup-config.js';

function sanitizedStartupFailure(error: unknown): Readonly<{
  name: string;
  code: string;
  category: string;
}> {
  if (typeof error !== 'object' || error === null) {
    return Object.freeze({
      name: 'Error',
      code: 'STARTUP_FAILED',
      category: 'Unexpected',
    });
  }
  const candidate = error as Readonly<Record<string, unknown>>;
  return Object.freeze({
    name: typeof candidate.name === 'string' ? candidate.name : 'Error',
    code:
      typeof candidate.code === 'string' ? candidate.code : 'STARTUP_FAILED',
    category:
      typeof candidate.category === 'string'
        ? candidate.category
        : 'Unexpected',
  });
}

async function bootstrap(): Promise<void> {
  // The persistence runtime remains the owner of connection parsing. This
  // foundation establishes that its active credential is external and required
  // before startup can proceed, without exposing it to diagnostics or clients.
  void loadRequiredServerSecrets(process.env, ['SR_DB_PASSWORD']);
  const config = loadStartupConfig(process.env);
  const database = createDatabaseRuntime(process.env);
  let application: NestExpressApplication | null = null;

  try {
    await database.initialize();
    application = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: ['error', 'warn'],
    });
    const readiness = application.get(HealthReadiness);
    readiness.attachDependency(database);
    await configurePreviewStaticFiles(application);
    await application.listen(config.port, config.host);
    readiness.markReady();

    let shutdownPromise: Promise<void> | null = null;
    const shutdown = (): Promise<void> => {
      shutdownPromise ??= (async () => {
        readiness.markNotReady();
        await application?.close();
        await database.close();
      })();
      return shutdownPromise;
    };
    for (const signal of ['SIGINT', 'SIGTERM'] as const) {
      process.once(signal, () => {
        void shutdown().catch((error: unknown) => {
          process.stderr.write(
            `${JSON.stringify({
              event: 'technical_shell_shutdown_failed',
              error: sanitizedStartupFailure(error),
            })}\n`,
          );
          process.exitCode = 1;
        });
      });
    }

    process.stdout.write('{"event":"technical_shell_listening"}\n');
  } catch (error: unknown) {
    await application?.close().catch(() => undefined);
    await database.close().catch(() => undefined);
    throw error;
  }
}

try {
  await bootstrap();
} catch (error: unknown) {
  process.stderr.write(
    `${JSON.stringify({
      event: 'technical_shell_startup_failed',
      error: sanitizedStartupFailure(error),
    })}\n`,
  );
  process.exitCode = 1;
}
