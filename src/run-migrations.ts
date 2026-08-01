import { fileURLToPath } from 'node:url';

import { parseDatabaseConfig } from './infrastructure/database/database-config.js';
import { createDatabaseConnection } from './infrastructure/database/database-connection.js';
import { inspectMigrationSource } from './infrastructure/database/database-migration-provider.js';
import { createMigrationRunner } from './infrastructure/database/migration-runner.js';

const connection = createDatabaseConnection(parseDatabaseConfig(process.env));
const migrationRoot = fileURLToPath(
  new URL('./infrastructure/database/migrations/', import.meta.url),
);
const source = await inspectMigrationSource(Object.freeze({
  root: migrationRoot,
  authorizedRoot: migrationRoot,
  normalizedRoot: 'src/infrastructure/database/migrations',
  mode: 'compiled',
}));
const runner = createMigrationRunner(connection, {
  expectedManifestHash: source.manifest.aggregateSha256,
});

try {
  const result = await runner.migrateToLatest();
  process.stdout.write(`${JSON.stringify({
    event: 'database_migrations_completed',
    operation: result.operation,
    manifestHash: result.manifestHash,
    migrations: result.results.map(({ name, direction, status }) => ({
      name,
      direction,
      status,
    })),
  })}\n`);
} finally {
  await runner.destroy();
}
