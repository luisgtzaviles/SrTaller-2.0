import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module.js';
import { HealthReadiness } from './health/health-readiness.service.js';
import { loadRequiredServerSecrets } from './infrastructure/config/external-configuration.js';
import {
  APPLICATION_DATABASE_CONNECTION,
} from './infrastructure/runtime/index.js';
import {
  applyRuntimeProvenanceHeaders,
  loadRuntimeProvenance,
} from './infrastructure/runtime/runtime-provenance.js';
import type {
  ApplicationDatabaseConnection,
} from './infrastructure/runtime/index.js';
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
  const environment = process.env;
  // The persistence runtime remains the owner of connection parsing. This
  // foundation establishes that its active credential is external and required
  // before startup can proceed, without exposing it to diagnostics or clients.
  void loadRequiredServerSecrets(environment, [
    'SR_DB_PASSWORD',
    'SR_PIN_PEPPER',
    'SR_ADMIN_PASSWORD_PEPPER',
  ]);
  const config = loadStartupConfig(environment);
  let application: NestExpressApplication | null = null;

  try {
    application = await NestFactory.create<NestExpressApplication>(AppModule, {
      abortOnError: false,
      logger: ['error', 'warn'],
    });
    // PBI-041 accepts bounded, server-validated spreadsheet payloads. The
    // parser limit remains finite and the domain rejects more than 50k rows.
    application.useBodyParser('json', { limit: '20mb' });
    const runtimeProvenance = loadRuntimeProvenance(environment);
    application.use((
      _request: unknown,
      response: Readonly<{ setHeader(name: string, value: string): void }>,
      next: () => void,
    ): void => {
      applyRuntimeProvenanceHeaders(response, runtimeProvenance);
      next();
    });
    await configurePreviewStaticFiles(application);
    // Provider lifecycle hooks initialize the application database runtime.
    // `listen()` would normally trigger them, but startup readiness must be
    // proven before opening the listener.
    await application.init();
    const database = application.get<ApplicationDatabaseConnection>(
      APPLICATION_DATABASE_CONNECTION
    );
    const readiness = application.get(HealthReadiness);
    readiness.attachDependency(database);
    // Nest unit tests may compose AppModule without a configured database, but
    // the executable process must never begin listening in that state.
    await database.verify();
    await application.listen(config.port, config.host);
    readiness.markReady();

    let shutdownPromise: Promise<void> | null = null;
    const shutdown = (): Promise<void> => {
      shutdownPromise ??= (async () => {
        readiness.markNotReady();
        await application?.close();
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
