import { createSpikeApplication } from './create-application.js';
import { OperationalLogger } from '../synthetic/infrastructure/observability/operational-logger.js';

const logger = new OperationalLogger();

async function bootstrap(): Promise<void> {
  logger.info('process.start');
  const databaseUrl = process.env.SPIKE_DATABASE_URL;
  if (!databaseUrl) throw new Error('MissingDatabaseConfiguration');
  const app = await createSpikeApplication(databaseUrl, { enableSignalHooks: true, logger });
  const port = Number(process.env.PORT ?? 3099);
  await app.listen(port, '127.0.0.1');
  logger.info('application.ready');
}

try {
  await bootstrap();
} catch (error) {
  logger.error('bootstrap.unexpected_error', {
    errorName: error instanceof Error ? error.name : 'UnknownError',
  });
  process.exitCode = 1;
}
