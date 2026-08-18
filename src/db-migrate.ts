import {
  createDatabaseConnection,
} from './infrastructure/database/database-connection.js';
import { parseDatabaseConfig } from './infrastructure/database/database-config.js';
import {
  createMigrationRunner,
} from './infrastructure/database/migration-runner.js';
import type {
  DatabaseMigrationRunner,
} from './infrastructure/database/migration-runner.js';

function sanitizedFailure(error: unknown): Readonly<{
  name: string;
  code: string;
  category: string;
}> {
  if (typeof error !== 'object' || error === null) {
    return Object.freeze({
      name: 'Error',
      code: 'DATABASE_MIGRATION_COMMAND_FAILED',
      category: 'Unexpected',
    });
  }
  const candidate = error as Readonly<Record<string, unknown>>;
  return Object.freeze({
    name: typeof candidate.name === 'string' ? candidate.name : 'Error',
    code:
      typeof candidate.code === 'string'
        ? candidate.code
        : 'DATABASE_MIGRATION_COMMAND_FAILED',
    category:
      typeof candidate.category === 'string'
        ? candidate.category
        : 'Unexpected',
  });
}

async function migrate(): Promise<void> {
  const config = parseDatabaseConfig(process.env);
  const connection = createDatabaseConnection(config);
  let discovery: DatabaseMigrationRunner | null = null;
  let runner: DatabaseMigrationRunner | null = null;

  try {
    discovery = createMigrationRunner(connection, {});
    const discovered = await discovery.getMigrationStatus();
    await discovery.destroy();
    discovery = null;

    runner = createMigrationRunner(connection, {
      expectedManifestHash: discovered.manifestHash,
    });
    const before = await runner.getMigrationStatus();
    const execution = await runner.migrateToLatest();
    const after = execution.status;
    if (
      before.manifestVerification !== 'match' ||
      after.manifestVerification !== 'match' ||
      after.migrations.length === 0 ||
      after.migrations.some(({ state }) => state !== 'applied')
    ) {
      throw new Error('migration status is not clean');
    }
    process.stdout.write(
      `${JSON.stringify({
        event: 'database_migration_complete',
        completedAt: new Date().toISOString(),
        operation: execution.operation,
        applied: execution.results.filter(
          ({ direction, status }) =>
            direction === 'Up' && status === 'Success',
        ).length,
        pending: after.migrations.filter(({ state }) => state === 'pending')
          .length,
        manifestHash: after.manifestHash,
      })}\n`,
    );
  } finally {
    await discovery?.destroy().catch(() => undefined);
    await runner?.destroy().catch(() => undefined);
    await connection.close();
  }
}

try {
  await migrate();
} catch (error: unknown) {
  process.stderr.write(
    `${JSON.stringify({
      event: 'database_migration_failed',
      error: sanitizedFailure(error),
    })}\n`,
  );
  process.exitCode = 1;
}
