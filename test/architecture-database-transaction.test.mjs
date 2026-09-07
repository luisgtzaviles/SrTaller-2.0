import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const runnerPath =
  'src/infrastructure/database/transaction-runner.ts';
const capabilityPath =
  'src/infrastructure/database/database-transaction-capability.ts';
const connectionPath =
  'src/infrastructure/database/database-connection.ts';
const persistenceCapabilityPath =
  'src/infrastructure/database/database-persistence-capability.ts';

test('transaction runner and internal capability retain exact registered ownership', async () => {
  const policy = JSON.parse(
    await readFile('architecture/dec-005-policy.json', 'utf8'),
  );

  assert.deepEqual(policy.persistence.infrastructureFiles[runnerPath], {
    owner: 'database',
    publicExports: [
      'DatabaseTransactionOptions',
      'DatabaseTransactionContext',
      'DatabaseTransactionError',
      'runInTransaction',
    ],
    consumers: [
      'src/modules/repairs/infrastructure/persistence/kysely-repair.repository.ts',
      'src/modules/stations/infrastructure/persistence/kysely-branch.repository.ts',
      'src/modules/tenancy/infrastructure/persistence/kysely-tenant.repository.ts',
    ],
    consumerRequirement: 'deferred-until-adapter-composition',
    status: 'materialized-transaction-runner',
  });
  assert.deepEqual(policy.persistence.transactionBoundary, {
    runner: runnerPath,
    capability: capabilityPath,
    allowedCapabilityConsumers: [
      connectionPath,
      'src/infrastructure/database/database-runtime.ts',
      persistenceCapabilityPath,
      runnerPath,
      'src/infrastructure/runtime/application-database-runtime.provider.ts',
      'src/infrastructure/runtime/index.ts',
      'src/modules/repairs/infrastructure/persistence/repair-database-connection.ts',
      'src/modules/access/infrastructure/persistence/kysely-operational-session.repository.ts',
    ],
    forbiddenContextPackages: ['async_hooks', 'node:async_hooks'],
    forbiddenManualMethods: [
      'commit',
      'releaseSavepoint',
      'rollback',
      'rollbackToSavepoint',
      'savepoint',
      'startTransaction',
    ],
  });
});

test('public transaction API is explicit, narrow and driver-free', async () => {
  const source = await readFile(runnerPath, 'utf8');

  for (const publicName of [
    'DatabaseTransactionOptions',
    'DatabaseTransactionContext',
    'DatabaseTransactionError',
    'runInTransaction',
  ]) {
    assert.match(source, new RegExp(`export (?:type |class |async function )${publicName}\\b`, 'u'));
  }
  assert.doesNotMatch(
    source,
    /\b(?:PoolClient|Transaction|Kysely)\s*<|pg\.Client|\bquery\b|connectionString/u,
  );
  assert.doesNotMatch(
    source,
    /\.startTransaction\s*\(|\.commit\s*\(|\.rollback\s*\(|savepoint/iu,
  );
  assert.doesNotMatch(source, /AsyncLocalStorage|async_hooks/u);
  assert.match(source, /Object\.freeze\(\{\s*attempt: 1,/u);
  assert.doesNotMatch(source, /\bretry\s*\(/u);
});

test('driver capability stays owner-internal behind connection, runner and persistence bridge', async () => {
  const [capability, connection, persistence, runner, startup] = await Promise.all([
    readFile(capabilityPath, 'utf8'),
    readFile(connectionPath, 'utf8'),
    readFile(persistenceCapabilityPath, 'utf8'),
    readFile(runnerPath, 'utf8'),
    Promise.all(
      ['src/main.ts', 'src/app.module.ts'].map((path) =>
        readFile(path, 'utf8'),
      ),
    ).then((sources) => sources.join('\n')),
  ]);

  assert.match(capability, /import type \{ Transaction \} from 'kysely'/u);
  assert.match(connection, /databaseTransactionCapability/u);
  assert.match(persistence, /useDatabaseTransactionExecutor/u);
  assert.match(runner, /databaseTransactionCapability/u);
  assert.doesNotMatch(startup, /transaction-runner|transaction-capability/u);
  assert.doesNotMatch(capability, /AsyncLocalStorage|async_hooks/u);
  assert.doesNotMatch(
    `${connection}\n${persistence}\n${runner}`,
    /\.startTransaction\s*\(|\.commit\s*\(|\.rollback\s*\(|savepoint/iu,
  );
});

test('transaction step creates no migration, product schema, repository or Nest composition', async () => {
  const files = [
    'src/app.module.ts',
    'src/main.ts',
    runnerPath,
    capabilityPath,
    connectionPath,
  ];
  const combined = (
    await Promise.all(files.map((path) => readFile(path, 'utf8')))
  ).join('\n');
  const withoutAuthorizedHealthController = combined.replaceAll(
    'HealthController',
    '',
  );

  assert.doesNotMatch(
    withoutAuthorizedHealthController,
    /transaction_probe|CREATE TABLE|FileMigrationProvider|Migrator|Repository|Controller/u,
  );
  assert.doesNotMatch(
    `${await readFile(runnerPath, 'utf8')}\n${await readFile(capabilityPath, 'utf8')}`,
    /@Module/u,
  );
  assert.doesNotMatch(
    await readFile('src/app.module.ts', 'utf8'),
    /database|transaction/iu,
  );
});
