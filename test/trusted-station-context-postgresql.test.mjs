import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { sql } from 'kysely';
import { Pool } from 'pg';

const enabled = process.env.SR_STATION_PG_TEST === '1';

const database = enabled
  ? await import('../dist/infrastructure/database/database-connection.js')
  : {};
const migrationProvider = enabled
  ? await import('../dist/infrastructure/database/database-migration-provider.js')
  : {};
const migrationRunner = enabled
  ? await import('../dist/infrastructure/database/migration-runner.js')
  : {};
const transaction = enabled
  ? await import('../dist/infrastructure/database/transaction-runner.js')
  : {};
const persistence = enabled
  ? await import('../dist/infrastructure/database/database-persistence-capability.js')
  : {};
const stationContext = enabled
  ? await import('../dist/modules/stations/application/contracts/trusted-station-context.js')
  : {};
const stationErrors = enabled
  ? await import('../dist/modules/stations/application/station-application.error.js')
  : {};
const stationErrorMapper = enabled
  ? await import('../dist/modules/stations/application/station-error-mapper.js')
  : {};
const linkUseCase = enabled
  ? await import('../dist/modules/stations/application/use-cases/link-station.js')
  : {};
const resolveUseCase = enabled
  ? await import('../dist/modules/stations/application/use-cases/resolve-trusted-station-context.js')
  : {};
const revokeUseCase = enabled
  ? await import('../dist/modules/stations/application/use-cases/revoke-station.js')
  : {};
const guardUseCase = enabled
  ? await import('../dist/modules/stations/application/use-cases/run-with-trusted-station-context.js')
  : {};
const unlinkUseCase = enabled
  ? await import('../dist/modules/stations/application/use-cases/unlink-station.js')
  : {};
const stationDomain = enabled
  ? await import('../dist/modules/stations/domain/station.js')
  : {};
const stationBindingRepository = enabled
  ? await import('../dist/modules/stations/infrastructure/persistence/kysely-station-binding.repository.js')
  : {};
const stationRepository = enabled
  ? await import('../dist/modules/stations/infrastructure/persistence/kysely-station.repository.js')
  : {};
const stationPostgresqlError = enabled
  ? await import('../dist/modules/stations/infrastructure/persistence/station-postgresql-error.js')
  : {};
const stationUnitOfWork = enabled
  ? await import('../dist/modules/stations/infrastructure/persistence/kysely-station-unit-of-work.js')
  : {};
const recognition = enabled
  ? await import('../dist/modules/stations/infrastructure/recognition/fake-station-recognition.js')
  : {};
const tenancy = enabled
  ? await import('../dist/modules/tenancy/index.js')
  : {};
const eligibility = enabled
  ? await import('../dist/modules/tenancy/infrastructure/persistence/kysely-branch-eligibility.js')
  : {};
const branchRepository = enabled
  ? await import('../dist/modules/tenancy/infrastructure/persistence/kysely-branch.repository.js')
  : {};
const tenantRepository = enabled
  ? await import('../dist/modules/tenancy/infrastructure/persistence/kysely-tenant.repository.js')
  : {};

function configuration() {
  return Object.freeze({
    identity: Object.freeze({
      host: process.env.SR_STATION_PG_HOST,
      port: Number(process.env.SR_STATION_PG_PORT),
      database: process.env.SR_STATION_PG_NAME,
      user: process.env.SR_STATION_PG_USER,
      password: process.env.SR_STATION_PG_PASSWORD,
    }),
    transport: Object.freeze({ sslMode: 'disable' }),
    pool: Object.freeze({
      min: 0,
      max: 12,
      idleTimeoutMs: 1_000,
      connectionTimeoutMs: 3_000,
      statementTimeoutMs: 15_000,
      queryTimeoutMs: 15_000,
    }),
    runtime: Object.freeze({
      environment: 'development',
      role: 'migration',
      accessMode: 'read-write',
      migrationsEnabled: true,
      testRunId: null,
    }),
    observability: Object.freeze({
      applicationName: 'srtaller-pbi024-stations-postgresql',
      labels: Object.freeze({
        component: 'stations',
        environment: 'development',
        role: 'migration',
      }),
    }),
  });
}

function adminPool() {
  return new Pool({
    host: process.env.SR_STATION_PG_HOST,
    port: Number(process.env.SR_STATION_PG_PORT),
    database: process.env.SR_STATION_PG_NAME,
    user: process.env.SR_STATION_PG_USER,
    password: process.env.SR_STATION_PG_PASSWORD,
    max: 3,
    ssl: false,
  });
}

function authorization(item) {
  return Object.freeze({
    migrationName: item.name,
    expectedHash: item.hash,
    reason: 'verified PBI-024 station schema reversal',
    environment: 'development',
    confirmation: 'REVERT_ONE_MIGRATION',
  });
}

const compiledMigrationRoot = fileURLToPath(
  new URL('../dist/infrastructure/database/migrations/', import.meta.url),
);

function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return Object.freeze({ promise, resolve });
}

function expectsApplicationCode(code) {
  return (error) => {
    assert.ok(error instanceof stationErrors.StationApplicationError);
    assert.equal(error.code, code);
    return true;
  };
}

test(
  'PostgreSQL 18.4 verifies trusted station persistence, isolation and linearization',
  { skip: !enabled, timeout: 180_000 },
  async () => {
    assert.equal(process.version, 'v24.18.0');
    const connection = database.createDatabaseConnection(configuration());
    const concurrentConnection =
      database.createDatabaseConnection(configuration());
    const independentConnection =
      database.createDatabaseConnection(configuration());
    const admin = adminPool();
    let runner;
    try {
      const source = await migrationProvider.inspectMigrationSource(
        Object.freeze({
          root: compiledMigrationRoot,
          authorizedRoot: compiledMigrationRoot,
          normalizedRoot: 'src/infrastructure/database/migrations',
          mode: 'compiled',
        }),
      );
      assert.deepEqual(
        source.manifest.migrations.map(({ migrationName }) => migrationName),
        [
          '20260725183832_database_create_tenants_and_branches',
          '20260726160000_stations_create_stations_and_bindings',
        ],
      );
      runner = migrationRunner.createMigrationRunner(connection, {
        expectedManifestHash: source.manifest.aggregateSha256,
      });
      const applied = await runner.migrateToLatest();
      assert.equal(applied.results.length, 2);

      const schema = await admin.query(
        `select table_name, column_name, is_nullable, udt_name
         from information_schema.columns
         where table_schema = 'public'
           and table_name in ('stations', 'station_bindings')
         order by table_name, ordinal_position`,
      );
      assert.equal(schema.rows.length, 13);
      assert.deepEqual(
        [...new Set(schema.rows.map(({ table_name }) => table_name))],
        ['station_bindings', 'stations'],
      );
      const openIndex = await admin.query(
        `select indexdef
         from pg_indexes
         where schemaname = 'public'
           and indexname = 'station_bindings_one_open_uq'`,
      );
      assert.equal(openIndex.rows.length, 1);
      assert.match(openIndex.rows[0].indexdef, /UNIQUE/iu);
      assert.match(openIndex.rows[0].indexdef, /unlinked_at IS NULL/iu);

      const down = await runner.migrateDown(
        authorization(applied.status.migrations[1]),
      );
      assert.equal(down.results[0].direction, 'Down');
      assert.equal(
        await admin.query(
          `select to_regclass('public.stations') is null as absent`,
        ).then(({ rows }) => rows[0].absent),
        true,
      );
      const reapplied = await runner.migrateToLatest();
      assert.deepEqual(
        reapplied.results.map(({ name }) => name),
        ['20260726160000_stations_create_stations_and_bindings'],
      );

      const tenantA = tenancy.parseTenantId(
        '10000000-0000-4000-8000-000000000001',
      );
      const tenantB = tenancy.parseTenantId(
        '20000000-0000-4000-8000-000000000002',
      );
      const sharedBranch = tenancy.parseBranchId(
        '30000000-0000-4000-8000-000000000003',
      );
      const branchOnlyB = tenancy.parseBranchId(
        '40000000-0000-4000-8000-000000000004',
      );
      const relinkBranch = tenancy.parseBranchId(
        '35000000-0000-4000-8000-000000000005',
      );
      const stationIds = Array.from({ length: 8 }, (_, index) =>
        stationDomain.parseStationId(
          `50000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
        ));
      const createdAt = '2026-07-26T16:00:00.000Z';
      const linkedAt = '2026-07-26T16:01:00.000Z';
      const later = (minute) =>
        `2026-07-26T16:${String(minute).padStart(2, '0')}:00.000Z`;

      const tenants = tenantRepository.createKyselyTenantRepository(connection);
      const branches = branchRepository.createKyselyBranchRepository(connection);
      await tenants.createTenant(
        { tenantId: tenantA },
        { tenantId: tenantA, createdAt },
      );
      await tenants.createTenant(
        { tenantId: tenantB },
        { tenantId: tenantB, createdAt },
      );
      for (const [tenantId, branchId] of [
        [tenantA, sharedBranch],
        [tenantA, relinkBranch],
        [tenantB, sharedBranch],
        [tenantB, branchOnlyB],
      ]) {
        await branches.createBranch(
          { tenantId, branchId },
          { tenantId, branchId, createdAt },
        );
      }

      const stationRepo =
        stationRepository.createKyselyStationRepository(connection);
      for (const tenantId of [tenantA, tenantB]) {
        await stationRepo.createStation(
          { tenantId, stationId: stationIds[0] },
          stationDomain.createStation({
            tenantId,
            stationId: stationIds[0],
            createdAt,
          }),
        );
      }
      for (const stationId of stationIds.slice(1)) {
        await stationRepo.createStation(
          { tenantId: tenantA, stationId },
          stationDomain.createStation({ tenantId: tenantA, stationId, createdAt }),
        );
      }
      assert.equal(
        await stationRepo.findStation({
          tenantId: tenantB,
          stationId: stationIds[1],
        }),
        null,
      );
      assert.equal(
        (
          await stationRepo.findStation({
            tenantId: tenantB,
            stationId: stationIds[0],
          })
        ).tenantId,
        tenantB,
      );

      const branchEligibility =
        eligibility.createKyselyBranchEligibilityCapability(connection);
      assert.equal(
        await branchEligibility.findEligibleBranch({
          tenantId: tenantA,
          branchId: branchOnlyB,
        }),
        null,
      );
      const unitOfWork = stationUnitOfWork.createKyselyStationUnitOfWork(
        connection,
        branchEligibility,
      );
      const concurrentEligibility =
        eligibility.createKyselyBranchEligibilityCapability(
          concurrentConnection,
        );
      const concurrentUnitOfWork =
        stationUnitOfWork.createKyselyStationUnitOfWork(
          concurrentConnection,
          concurrentEligibility,
        );
      const link = new linkUseCase.LinkStation(unitOfWork);
      const unlink = new unlinkUseCase.UnlinkStation(unitOfWork);
      const revoke = new revokeUseCase.RevokeStation(unitOfWork);
      const concurrentRevoke =
        new revokeUseCase.RevokeStation(concurrentUnitOfWork);
      const fakeRecognition = new recognition.FakeStationRecognition(
        stationIds.map((stationId, index) => ({
          opaque: `station-${index}`,
          tenantId: tenantA,
          stationId,
        })),
      );
      const resolver =
        new resolveUseCase.ResolveTrustedStationContextUseCase(
          fakeRecognition,
          unitOfWork,
        );
      const guard =
        new guardUseCase.RunWithTrustedStationContextUseCase(unitOfWork);

      async function activate(index, minute = 1) {
        return link.execute({
          tenantId: tenantA,
          stationId: stationIds[index],
          branchId: sharedBranch,
          expectedRevision: stationDomain.parseStationRevision(1),
          linkedAt: later(minute),
        });
      }

      const station0 = await activate(0);
      const context0 = await resolver.execute({
        kind: 'candidate',
        opaque: 'station-0',
      });
      assert.equal(context0.stationRevision, station0.revision);
      assert.ok(Object.isFrozen(context0));
      await assert.rejects(
        link.execute({
          tenantId: tenantA,
          stationId: stationIds[1],
          branchId: branchOnlyB,
          expectedRevision: stationDomain.parseStationRevision(1),
          linkedAt,
        }),
        expectsApplicationCode('STATION_BRANCH_NOT_ELIGIBLE'),
      );

      const bindings =
        stationBindingRepository.createKyselyStationBindingRepository(connection);

      // Real 23503 errors use operation/constraint allowlists and retain only
      // internal diagnostics.
      const missingTenant = tenancy.parseTenantId(
        '90000000-0000-4000-8000-000000000009',
      );
      await assert.rejects(
        stationRepo.createStation(
          { tenantId: missingTenant, stationId: stationIds[7] },
          stationDomain.createStation({
            tenantId: missingTenant,
            stationId: stationIds[7],
            createdAt,
          }),
        ),
        (error) => {
          assert.equal(
            error.code,
            'STATION_PERSISTENCE_REFERENCE_NOT_FOUND',
          );
          assert.equal(error.category, 'NotFound');
          assert.equal(error.retryable, 'never');
          assert.deepEqual(
            stationPostgresqlError.readStationPostgresqlDiagnostic(error),
            {
              code: '23503',
              constraint: 'stations_tenant_fk',
            },
          );
          assert.doesNotMatch(JSON.stringify(error), /23503|constraint/iu);
          return true;
        },
      );
      await assert.rejects(
        bindings.createOpenBinding(
          { tenantId: tenantA, stationId: stationIds[7] },
          {
            tenantId: tenantA,
            stationId: stationIds[7],
            bindingRevision: stationDomain.parseStationRevision(99),
            branchId: branchOnlyB,
            linkedAt: later(2),
            unlinkedAt: null,
          },
        ),
        (error) => {
          assert.equal(
            error.code,
            'STATION_PERSISTENCE_INVARIANT_BROKEN',
          );
          assert.equal(error.category, 'Unexpected');
          assert.deepEqual(
            stationPostgresqlError.readStationPostgresqlDiagnostic(error),
            {
              code: '23503',
              constraint: 'station_bindings_branch_fk',
            },
          );
          assert.doesNotMatch(JSON.stringify(error), /23503|constraint/iu);
          return true;
        },
      );
      await assert.rejects(
        bindings.createOpenBinding(
          { tenantId: tenantA, stationId: stationIds[0] },
          {
            tenantId: tenantA,
            stationId: stationIds[0],
            bindingRevision: stationDomain.parseStationRevision(99),
            branchId: sharedBranch,
            linkedAt: later(2),
            unlinkedAt: null,
          },
        ),
        (error) => error.code === 'STATION_PERSISTENCE_CONFLICT',
      );

      const unlinked = await unlink.execute({
        tenantId: tenantA,
        stationId: stationIds[0],
        expectedRevision: station0.revision,
        unlinkedAt: later(3),
      });
      const relinked = await link.execute({
        tenantId: tenantA,
        stationId: stationIds[0],
        branchId: sharedBranch,
        expectedRevision: unlinked.revision,
        linkedAt: later(4),
      });
      await assert.rejects(
        guard.execute(context0, async () => 'forbidden'),
        expectsApplicationCode('STATION_CONTEXT_STALE'),
      );
      const bindingHistory = await bindings.listBindings({
        tenantId: tenantA,
        stationId: stationIds[0],
      });
      assert.deepEqual(
        bindingHistory.map(({ bindingRevision, unlinkedAt }) => ({
          bindingRevision,
          unlinkedAt,
        })),
        [
          { bindingRevision: 2, unlinkedAt: later(3) },
          { bindingRevision: 4, unlinkedAt: null },
        ],
      );
      const revoked0 = await revoke.execute({
        tenantId: tenantA,
        stationId: stationIds[0],
        expectedRevision: relinked.revision,
        revokedAt: later(5),
      });
      assert.equal(revoked0.status, 'Revoked');
      assert.equal(
        await bindings.findOpenBinding({
          tenantId: tenantA,
          stationId: stationIds[0],
        }),
        null,
      );
      await assert.rejects(
        resolver.execute({ kind: 'candidate', opaque: 'station-0' }),
        expectsApplicationCode('STATION_NOT_TRUSTED'),
      );

      // 1/6: effect acquires the shared station lock before revoke.
      const active2 = await activate(2, 6);
      const context2 = await resolver.execute({
        kind: 'candidate',
        opaque: 'station-2',
      });
      const effectEntered = deferred();
      const releaseEffect = deferred();
      const events = [];
      const effectFirst = guard.execute(context2, async () => {
        events.push('effect');
        effectEntered.resolve();
        await releaseEffect.promise;
        return 'effect-committed';
      });
      await effectEntered.promise;
      let revokeSettled = false;
      const waitingRevoke = concurrentRevoke.execute({
        tenantId: tenantA,
        stationId: stationIds[2],
        expectedRevision: active2.revision,
        revokedAt: later(7),
      }).finally(() => {
        revokeSettled = true;
        events.push('revoke');
      });
      try {
        await new Promise((resolve) => setTimeout(resolve, 40));
        assert.equal(revokeSettled, false);
      } finally {
        releaseEffect.resolve();
      }
      assert.equal(await effectFirst, 'effect-committed');
      assert.equal((await waitingRevoke).status, 'Revoked');
      assert.deepEqual(events, ['effect', 'revoke']);

      // 2: revoke owns the lock first; the later effect never executes.
      const active3 = await activate(3, 8);
      const context3 = await resolver.execute({
        kind: 'candidate',
        opaque: 'station-3',
      });
      const revokeLocked = deferred();
      const finishRevoke = deferred();
      const manualRevoke = transaction.runInTransaction(
        concurrentConnection,
        { isolationLevel: 'read committed', readOnly: false },
        async (transactionContext) => {
          const stations =
            stationRepository.createTransactionalKyselyStationRepository(
              transactionContext,
            );
          const stationBindings =
            stationBindingRepository
              .createTransactionalKyselyStationBindingRepository(
                transactionContext,
              );
          const scope = { tenantId: tenantA, stationId: stationIds[3] };
          const current = await stations.lockStation(scope);
          const binding = await stationBindings.lockOpenBinding(scope);
          revokeLocked.resolve();
          await finishRevoke.promise;
          const next = stationDomain.revokeStation(
            current,
            current.revision,
            later(9),
          );
          await stationBindings.closeOpenBinding(
            scope,
            binding.bindingRevision,
            later(9),
          );
          await stations.transitionStation(scope, {
            expectedRevision: current.revision,
            expectedStatus: current.status,
            nextStatus: next.status,
            nextRevision: next.revision,
            updatedAt: next.updatedAt,
            revokedAt: next.revokedAt,
          });
        },
      );
      await revokeLocked.promise;
      let effectExecutions = 0;
      const blockedEffect = guard.execute(context3, async () => {
        effectExecutions += 1;
      });
      const blockedEffectRejected = assert.rejects(
        blockedEffect,
        expectsApplicationCode('STATION_CONTEXT_STALE'),
      );
      finishRevoke.resolve();
      await manualRevoke;
      await blockedEffectRejected;
      assert.equal(effectExecutions, 0);
      assert.equal(active3.status, 'Active');

      // 3/5: two physical connections serialize relink and stale the loser.
      async function relinkInTransaction(
        databaseConnection,
        index,
        expectedRevision,
        minute,
        beforeLock,
        afterLock,
      ) {
        return transaction.runInTransaction(
          databaseConnection,
          { isolationLevel: 'read committed', readOnly: false },
          async (transactionContext) => {
            beforeLock?.();
            const identity =
              await persistence.useTransactionalDatabasePersistenceExecutor(
                transactionContext,
                'stations',
                async (executor) => {
                  const result = await sql`
                    select pg_backend_pid() as backend_pid,
                           txid_current()::text as transaction_id
                  `.execute(executor);
                  return Object.freeze(result.rows[0]);
                },
              );
            const transactionalStations =
              stationRepository.createTransactionalKyselyStationRepository(
                transactionContext,
              );
            const transactionalBindings =
              stationBindingRepository
                .createTransactionalKyselyStationBindingRepository(
                  transactionContext,
                );
            const scope = {
              tenantId: tenantA,
              stationId: stationIds[index],
            };
            const current =
              await transactionalStations.lockStation(scope);
            await afterLock?.(identity);
            if (!current || current.revision !== expectedRevision) {
              throw new stationErrors.StationApplicationError(
                'STATION_CONTEXT_STALE',
              );
            }
            const previous =
              await transactionalBindings.lockOpenBinding(scope);
            if (
              current.status !== 'Active' ||
              !previous ||
              previous.bindingRevision !== current.revision
            ) {
              throw new stationErrors.StationApplicationError(
                'STATION_REFERENCE_INTEGRITY_BROKEN',
              );
            }
            const unlinked = stationDomain.unlinkStation(
              current,
              expectedRevision,
              later(minute),
            );
            const closed =
              await transactionalBindings.closeOpenBinding(
                scope,
                previous.bindingRevision,
                later(minute),
              );
            if (!closed) {
              throw new stationErrors.StationApplicationError(
                'STATION_CONTEXT_STALE',
              );
            }
            const persistedUnlinked =
              await transactionalStations.transitionStation(scope, {
                expectedRevision: current.revision,
                expectedStatus: current.status,
                nextStatus: unlinked.status,
                nextRevision: unlinked.revision,
                updatedAt: unlinked.updatedAt,
                revokedAt: unlinked.revokedAt,
              });
            if (!persistedUnlinked) {
              throw new stationErrors.StationApplicationError(
                'STATION_CONTEXT_STALE',
              );
            }
            const relinked = stationDomain.linkStation(
              persistedUnlinked,
              persistedUnlinked.revision,
              later(minute + 1),
            );
            await transactionalBindings.createOpenBinding(scope, {
              tenantId: tenantA,
              stationId: stationIds[index],
              bindingRevision: relinked.revision,
              branchId: relinkBranch,
              linkedAt: later(minute + 1),
              unlinkedAt: null,
            });
            const persistedRelinked =
              await transactionalStations.transitionStation(scope, {
                expectedRevision: persistedUnlinked.revision,
                expectedStatus: persistedUnlinked.status,
                nextStatus: relinked.status,
                nextRevision: relinked.revision,
                updatedAt: relinked.updatedAt,
                revokedAt: relinked.revokedAt,
              });
            if (!persistedRelinked) {
              throw new stationErrors.StationApplicationError(
                'STATION_CONTEXT_STALE',
              );
            }
            return Object.freeze({
              identity,
              station: persistedRelinked,
            });
          },
        );
      }

      async function assertConcurrentRelink(
        index,
        winnerConnection,
        loserConnection,
        minute,
      ) {
        const initial = await activate(index, minute - 1);
        const firstLocked = deferred();
        const releaseFirst = deferred();
        const secondAttempted = deferred();
        let secondSettled = false;

        const first = relinkInTransaction(
          winnerConnection,
          index,
          initial.revision,
          minute,
          undefined,
          async (identity) => {
            firstLocked.resolve(identity);
            await releaseFirst.promise;
          },
        );
        const firstIdentity = await firstLocked.promise;
        const second = relinkInTransaction(
          loserConnection,
          index,
          initial.revision,
          minute,
          () => secondAttempted.resolve(),
        ).finally(() => {
          secondSettled = true;
        });
        const secondRejected = assert.rejects(second, (error) => {
          assert.ok(error instanceof stationErrors.StationApplicationError);
          assert.equal(error.code, 'STATION_CONTEXT_STALE');
          assert.equal(error.category, 'Concurrency');
          assert.equal(error.retryable, 'never');
          assert.notEqual(error.code, 'NESTED_FORBIDDEN');
          assert.doesNotMatch(error.message, /nested/iu);
          return true;
        });
        await secondAttempted.promise;
        try {
          await new Promise((resolve) => setTimeout(resolve, 40));
          assert.equal(secondSettled, false);
        } finally {
          releaseFirst.resolve();
        }

        const winner = await first;
        await secondRejected;

        const finalStation = await stationRepo.findStation({
          tenantId: tenantA,
          stationId: stationIds[index],
        });
        const history = await bindings.listBindings({
          tenantId: tenantA,
          stationId: stationIds[index],
        });
        assert.equal(finalStation.status, 'Active');
        assert.equal(finalStation.revision, initial.revision + 2);
        assert.equal(winner.station.revision, finalStation.revision);
        assert.equal(
          history.filter(({ unlinkedAt }) => unlinkedAt === null).length,
          1,
        );
        assert.equal(history.length, 2);
        assert.equal(history[0].branchId, sharedBranch);
        assert.equal(history[0].unlinkedAt, later(minute));
        assert.equal(history[1].branchId, relinkBranch);
        assert.equal(history[1].bindingRevision, finalStation.revision);
        assert.equal(history[1].unlinkedAt, null);
        assert.equal(winner.identity.backend_pid, firstIdentity.backend_pid);
        assert.equal(
          winner.identity.transaction_id,
          firstIdentity.transaction_id,
        );
        return winner.identity;
      }

      const firstOrderIdentity = await assertConcurrentRelink(
        1,
        connection,
        concurrentConnection,
        10,
      );
      const inverseOrderIdentity = await assertConcurrentRelink(
        6,
        concurrentConnection,
        connection,
        13,
      );
      assert.notEqual(
        firstOrderIdentity.backend_pid,
        inverseOrderIdentity.backend_pid,
      );

      // A real PostgreSQL serialization failure reaches the application
      // contract with retryability preserved end to end.
      const serializableReads = [];
      const bothSerializableReads = deferred();
      const releaseSerializableWinner = deferred();
      const releaseSerializableLoser = deferred();
      async function serializableRevoke(
        databaseConnection,
        release,
        revokedAt,
      ) {
        return transaction.runInTransaction(
          databaseConnection,
          { isolationLevel: 'serializable', readOnly: false },
          async (transactionContext) => {
            const repository =
              stationRepository.createTransactionalKyselyStationRepository(
                transactionContext,
              );
            const scope = {
              tenantId: tenantA,
              stationId: stationIds[7],
            };
            const current = await repository.findStation(scope);
            serializableReads.push(current.revision);
            if (serializableReads.length === 2) {
              bothSerializableReads.resolve();
            }
            await release.promise;
            const next = stationDomain.revokeStation(
              current,
              current.revision,
              revokedAt,
            );
            try {
              const persisted = await repository.transitionStation(scope, {
                expectedRevision: current.revision,
                expectedStatus: current.status,
                nextStatus: next.status,
                nextRevision: next.revision,
                updatedAt: next.updatedAt,
                revokedAt: next.revokedAt,
              });
              if (!persisted) {
                throw new stationErrors.StationApplicationError(
                  'STATION_CONTEXT_STALE',
                );
              }
              return persisted;
            } catch (error) {
              throw stationErrorMapper.mapStationError(error);
            }
          },
        );
      }
      const serializableWinner = serializableRevoke(
        connection,
        releaseSerializableWinner,
        later(16),
      );
      const serializableLoser = serializableRevoke(
        concurrentConnection,
        releaseSerializableLoser,
        later(17),
      );
      const serializableLoserRejected = assert.rejects(
        serializableLoser,
        (error) => {
          assert.ok(error instanceof stationErrors.StationApplicationError);
          assert.equal(error.code, 'STATION_TRANSIENT_CONCURRENCY');
          assert.equal(error.category, 'Concurrency');
          assert.equal(error.retryable, 'conditional');
          assert.deepEqual(stationErrors.toPublicStationError(error), {
            code: 'TRANSIENT_CONCURRENCY_FAILURE',
            status: 503,
            message: 'La operación no está disponible temporalmente.',
          });
          return true;
        },
      );
      await bothSerializableReads.promise;
      assert.deepEqual(serializableReads, [1, 1]);
      releaseSerializableWinner.resolve();
      assert.equal((await serializableWinner).revision, 2);
      releaseSerializableLoser.resolve();
      await serializableLoserRejected;

      // 4: revoke closes the binding atomically (asserted for station 0/2/3).
      for (const index of [0, 2, 3]) {
        assert.equal(
          await bindings.findOpenBinding({
            tenantId: tenantA,
            stationId: stationIds[index],
          }),
          null,
        );
      }

      // 7/10: different stations and same logical ID in another tenant do not
      // wait behind the lock held for tenant A/station 4.
      await activate(4, 11);
      await link.execute({
        tenantId: tenantB,
        stationId: stationIds[0],
        branchId: sharedBranch,
        expectedRevision: stationDomain.parseStationRevision(1),
        linkedAt: later(11),
      });
      const held = deferred();
      const releaseHeld = deferred();
      const holdA = transaction.runInTransaction(
        connection,
        {},
        async (transactionContext) => {
          const repository =
            stationRepository.createTransactionalKyselyStationRepository(
              transactionContext,
            );
          await repository.lockStation({
            tenantId: tenantA,
            stationId: stationIds[4],
          });
          held.resolve();
          await releaseHeld.promise;
        },
      );
      await held.promise;
      const independentLocks = await Promise.all([
        transaction.runInTransaction(
          concurrentConnection,
          {},
          async (context) =>
          stationRepository
            .createTransactionalKyselyStationRepository(context)
            .lockStation({
              tenantId: tenantA,
              stationId: stationIds[5],
            }),
        ),
        transaction.runInTransaction(
          independentConnection,
          {},
          async (context) =>
          stationRepository
            .createTransactionalKyselyStationRepository(context)
            .lockStation({
              tenantId: tenantB,
              stationId: stationIds[0],
            }),
        ),
      ]);
      assert.equal(independentLocks.every(Boolean), true);
      releaseHeld.resolve();
      await holdA;

      // 8: rollback releases the station lock.
      await assert.rejects(
        transaction.runInTransaction(connection, {}, async (context) => {
          await stationRepository
            .createTransactionalKyselyStationRepository(context)
            .lockStation({ tenantId: tenantA, stationId: stationIds[4] });
          throw new Error('controlled rollback');
        }),
        (error) => error.code === 'DATABASE_TRANSACTION_CALLBACK_FAILED',
      );
      assert.ok(
        await transaction.runInTransaction(connection, {}, async (context) =>
          stationRepository
            .createTransactionalKyselyStationRepository(context)
            .lockStation({
              tenantId: tenantA,
              stationId: stationIds[4],
            })),
      );

      // 9: effect failure rolls back binding changes in the same transaction.
      const context4 = await resolver.execute({
        kind: 'candidate',
        opaque: 'station-4',
      });
      await assert.rejects(
        guard.executeWithinUnitOfWork(context4, async (work) => {
          await work.bindings.closeOpenBinding(
            { tenantId: tenantA, stationId: stationIds[4] },
            context4.stationRevision,
            later(12),
          );
          throw new stationErrors.StationApplicationError(
            'STATION_LIFECYCLE_CONFLICT',
          );
        }),
        expectsApplicationCode('STATION_LIFECYCLE_CONFLICT'),
      );
      assert.ok(
        await bindings.findOpenBinding({
          tenantId: tenantA,
          stationId: stationIds[4],
        }),
      );

      const constraintProbe = await admin.query(
        `select conname
         from pg_constraint
         where conrelid in (
           'public.stations'::regclass,
           'public.station_bindings'::regclass
         )
         order by conname`,
      );
      assert.deepEqual(
        constraintProbe.rows.map(({ conname }) => conname),
        [
          'station_bindings_branch_fk',
          'station_bindings_interval_ck',
          'station_bindings_pk',
          'station_bindings_revision_ck',
          'station_bindings_station_fk',
          'station_bindings_tenant_id_not_null',
          'station_bindings_station_id_not_null',
          'station_bindings_binding_revision_not_null',
          'station_bindings_branch_id_not_null',
          'station_bindings_linked_at_not_null',
          'stations_created_at_not_null',
          'stations_pk',
          'stations_revision_ck',
          'stations_revision_not_null',
          'stations_revoked_at_ck',
          'stations_station_id_not_null',
          'stations_status_ck',
          'stations_status_not_null',
          'stations_tenant_fk',
          'stations_tenant_id_not_null',
          'stations_updated_at_ck',
          'stations_updated_at_not_null',
        ].sort(),
      );
    } finally {
      await runner?.destroy().catch(() => undefined);
      await connection.close().catch(() => undefined);
      await concurrentConnection.close().catch(() => undefined);
      await independentConnection.close().catch(() => undefined);
      await admin.end();
    }
  },
);
