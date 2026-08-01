import { parseDatabaseConfig } from './infrastructure/database/database-config.js';
import { createDatabaseConnection } from './infrastructure/database/database-connection.js';
import { useTransactionalDatabasePersistenceExecutor } from './infrastructure/database/database-persistence-capability.js';
import { runInTransaction } from './infrastructure/database/transaction-runner.js';
import { loadPreviewConfig } from './preview-config.js';

const config = loadPreviewConfig(process.env);

if (!config.enabled) {
  throw new Error('Preview seed requires SR_PREVIEW_ENABLED=true.');
}

const connection = createDatabaseConnection(parseDatabaseConfig(process.env));
const now = new Date();

try {
  await connection.verify();
  await runInTransaction(
    connection,
    { isolationLevel: 'serializable', readOnly: false },
    async (transaction) => {
      await useTransactionalDatabasePersistenceExecutor(
        transaction,
        'tenancy',
        async (executor) => {
          await executor
            .insertInto('tenants')
            .values({ tenant_id: config.tenantId, created_at: now })
            .onConflict((conflict) => conflict.column('tenant_id').doNothing())
            .executeTakeFirst();
          await executor
            .insertInto('branches')
            .values({
              tenant_id: config.tenantId,
              branch_id: config.branchId,
              created_at: now,
            })
            .onConflict((conflict) =>
              conflict.columns(['tenant_id', 'branch_id']).doNothing())
            .executeTakeFirst();
        },
      );
      await useTransactionalDatabasePersistenceExecutor(
        transaction,
        'stations',
        async (executor) => {
          await executor
            .insertInto('stations')
            .values({
              tenant_id: config.tenantId,
              station_id: config.stationId,
              status: 'Active',
              revision: 1,
              created_at: now,
              updated_at: now,
              revoked_at: null,
            })
            .onConflict((conflict) =>
              conflict.columns(['tenant_id', 'station_id']).doNothing())
            .executeTakeFirst();
          const binding = await executor
            .selectFrom('station_bindings')
            .select(['branch_id', 'binding_revision'])
            .where('tenant_id', '=', config.tenantId)
            .where('station_id', '=', config.stationId)
            .where('unlinked_at', 'is', null)
            .executeTakeFirst();
          if (!binding) {
            await executor
              .insertInto('station_bindings')
              .values({
                tenant_id: config.tenantId,
                station_id: config.stationId,
                binding_revision: 1,
                branch_id: config.branchId,
                linked_at: now,
                unlinked_at: null,
              })
              .executeTakeFirstOrThrow();
          } else if (
            binding.branch_id !== config.branchId ||
            binding.binding_revision !== 1
          ) {
            throw new Error('Existing preview station binding does not match configuration.');
          }
        },
      );
    },
  );
  process.stdout.write(`${JSON.stringify({
    event: 'preview_synthetic_context_seeded',
    environment: 'DEV_PREVIEW',
    scope: 'server-configured',
  })}\n`);
} finally {
  if (connection.state !== 'closed') {
    await connection.close();
  }
}
