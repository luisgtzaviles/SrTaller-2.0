import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createTrustedStationContext,
} from '../dist/modules/stations/application/contracts/trusted-station-context.js';
import {
  StationApplicationError,
  toPublicStationError,
} from '../dist/modules/stations/application/station-application.error.js';
import { LinkStation } from '../dist/modules/stations/application/use-cases/link-station.js';
import { ResolveTrustedStationContextUseCase } from '../dist/modules/stations/application/use-cases/resolve-trusted-station-context.js';
import { RevokeStation } from '../dist/modules/stations/application/use-cases/revoke-station.js';
import { RunWithTrustedStationContextUseCase } from '../dist/modules/stations/application/use-cases/run-with-trusted-station-context.js';
import { UnlinkStation } from '../dist/modules/stations/application/use-cases/unlink-station.js';
import {
  createStation,
  linkStation as activateStation,
  parseStationId,
  parseStationRevision,
} from '../dist/modules/stations/domain/station.js';
import { FakeStationRecognition } from '../dist/modules/stations/infrastructure/recognition/fake-station-recognition.js';
import {
  parseBranchId,
  parseTenantId,
} from '../dist/modules/tenancy/index.js';
import { createStationsComposition } from '../dist/modules/stations/stations.module.js';

const tenantA = parseTenantId('10000000-0000-4000-8000-000000000001');
const tenantB = parseTenantId('20000000-0000-4000-8000-000000000002');
const branchA = parseBranchId('30000000-0000-4000-8000-000000000003');
const branchB = parseBranchId('40000000-0000-4000-8000-000000000004');
const stationId = parseStationId('50000000-0000-4000-8000-000000000005');
const stationB = parseStationId('60000000-0000-4000-8000-000000000006');
const t1 = '2026-07-26T16:00:00.000Z';
const t2 = '2026-07-26T16:01:00.000Z';
const t3 = '2026-07-26T16:02:00.000Z';
const t4 = '2026-07-26T16:03:00.000Z';
const t5 = '2026-07-26T16:04:00.000Z';

function key(tenantId, id) {
  return `${tenantId}:${id}`;
}

function cloneState(state) {
  return {
    branches: new Set(state.branches),
    stations: new Map(state.stations),
    bindings: state.bindings.map((binding) => ({ ...binding })),
  };
}

function createMemoryUnitOfWork(initial) {
  let state = cloneState(initial);
  return {
    snapshot() {
      return cloneState(state);
    },
    async run(operation) {
      const next = cloneState(state);
      const work = {
        transactionContext: Object.freeze({ test: 'transaction' }),
        branches: {
          async findEligibleBranch(query) {
            const candidate = `${query.tenantId}:${query.branchId}`;
            return next.branches.has(candidate)
              ? Object.freeze({
                  tenantId: query.tenantId,
                  branchId: query.branchId,
                  eligible: true,
                })
              : null;
          },
        },
        stations: {
          async createStation(scope, record) {
            const stationKey = key(scope.tenantId, scope.stationId);
            if (next.stations.has(stationKey)) {
              throw new Error('duplicate station');
            }
            next.stations.set(stationKey, record);
            return record;
          },
          async findStation(scope) {
            return next.stations.get(key(scope.tenantId, scope.stationId)) ?? null;
          },
          async lockStation(scope) {
            return next.stations.get(key(scope.tenantId, scope.stationId)) ?? null;
          },
          async transitionStation(scope, transition) {
            const stationKey = key(scope.tenantId, scope.stationId);
            const current = next.stations.get(stationKey);
            if (
              !current ||
              current.revision !== transition.expectedRevision ||
              current.status !== transition.expectedStatus
            ) {
              return null;
            }
            const updated = Object.freeze({
              ...current,
              status: transition.nextStatus,
              revision: transition.nextRevision,
              updatedAt: transition.updatedAt,
              revokedAt: transition.revokedAt,
            });
            next.stations.set(stationKey, updated);
            return updated;
          },
        },
        bindings: {
          async createOpenBinding(scope, record) {
            if (
              next.bindings.some(
                (binding) =>
                  binding.tenantId === scope.tenantId &&
                  binding.stationId === scope.stationId &&
                  binding.unlinkedAt === null,
              )
            ) {
              throw new Error('duplicate open binding');
            }
            const stored = Object.freeze({ ...record });
            next.bindings.push(stored);
            return stored;
          },
          async findOpenBinding(scope) {
            return next.bindings.find(
              (binding) =>
                binding.tenantId === scope.tenantId &&
                binding.stationId === scope.stationId &&
                binding.unlinkedAt === null,
            ) ?? null;
          },
          async lockOpenBinding(scope) {
            return this.findOpenBinding(scope);
          },
          async closeOpenBinding(scope, revision, unlinkedAt) {
            const index = next.bindings.findIndex(
              (binding) =>
                binding.tenantId === scope.tenantId &&
                binding.stationId === scope.stationId &&
                binding.bindingRevision === revision &&
                binding.unlinkedAt === null,
            );
            if (index === -1) {
              return null;
            }
            const closed = Object.freeze({
              ...next.bindings[index],
              unlinkedAt,
            });
            next.bindings[index] = closed;
            return closed;
          },
          async listBindings(scope) {
            return next.bindings.filter(
              (binding) =>
                binding.tenantId === scope.tenantId &&
                binding.stationId === scope.stationId,
            );
          },
        },
      };
      const result = await operation(work);
      state = next;
      return result;
    },
  };
}

function baseState({ active = true } = {}) {
  const created = createStation({ tenantId: tenantA, stationId, createdAt: t1 });
  const station = active
    ? activateStation(created, created.revision, t2)
    : created;
  return {
    branches: new Set([
      `${tenantA}:${branchA}`,
      `${tenantB}:${branchB}`,
    ]),
    stations: new Map([
      [key(tenantA, stationId), station],
      [
        key(tenantB, stationB),
        createStation({ tenantId: tenantB, stationId: stationB, createdAt: t1 }),
      ],
    ]),
    bindings: active
      ? [
          Object.freeze({
            tenantId: tenantA,
            stationId,
            branchId: branchA,
            bindingRevision: station.revision,
            linkedAt: t2,
            unlinkedAt: null,
          }),
        ]
      : [],
  };
}

function resolver(unitOfWork) {
  return new ResolveTrustedStationContextUseCase(
    new FakeStationRecognition([
      { opaque: 'trusted-a', tenantId: tenantA, stationId },
      { opaque: 'trusted-b', tenantId: tenantB, stationId: stationB },
    ]),
    unitOfWork,
  );
}

function expectsApplicationCode(code) {
  return (error) => {
    assert.ok(error instanceof StationApplicationError);
    assert.equal(error.code, code);
    return true;
  };
}

test('stations composition wires the complete trusted-context application surface', () => {
  const composition = createStationsComposition(
    {},
    { async findEligibleBranch() { return null; } },
    new FakeStationRecognition([]),
  );

  assert.ok(Object.isFrozen(composition));
  assert.ok(composition.linkStation instanceof LinkStation);
  assert.ok(composition.unlinkStation instanceof UnlinkStation);
  assert.ok(composition.revokeStation instanceof RevokeStation);
  assert.ok(
    composition.resolveTrustedStationContext
      instanceof ResolveTrustedStationContextUseCase,
  );
  assert.ok(
    composition.runWithTrustedStationContext
      instanceof RunWithTrustedStationContextUseCase,
  );
});

test('resolver builds only a server-issued context from recognized active state', async () => {
  const unitOfWork = createMemoryUnitOfWork(baseState());
  const context = await resolver(unitOfWork).execute({
    kind: 'candidate',
    opaque: 'trusted-a',
  });
  assert.deepEqual(context, {
    tenantId: tenantA,
    branchId: branchA,
    stationId,
    stationRevision: 2,
    source: 'server-verified-station',
  });
  assert.ok(Object.isFrozen(context));
});

test('evidence categories are deterministic and unknown states anti-enumerate', async () => {
  const activeResolver = resolver(createMemoryUnitOfWork(baseState()));
  await assert.rejects(
    activeResolver.execute({ kind: 'absent' }),
    expectsApplicationCode('STATION_EVIDENCE_REQUIRED'),
  );
  await assert.rejects(
    activeResolver.execute({ kind: 'malformed' }),
    expectsApplicationCode('STATION_EVIDENCE_MALFORMED'),
  );
  await assert.rejects(
    activeResolver.execute({ kind: 'candidate', opaque: 'unknown' }),
    expectsApplicationCode('STATION_EVIDENCE_REJECTED'),
  );

  const unlinkedResolver = resolver(
    createMemoryUnitOfWork(baseState({ active: false })),
  );
  const errors = [];
  for (const [candidateResolver, opaque] of [
    [activeResolver, 'unknown'],
    [unlinkedResolver, 'trusted-a'],
    [activeResolver, 'trusted-b'],
  ]) {
    await assert.rejects(
      candidateResolver.execute({ kind: 'candidate', opaque }),
      (error) => {
        errors.push(toPublicStationError(error));
        return true;
      },
    );
  }
  assert.deepEqual(errors[0], errors[1]);
  assert.deepEqual(errors[1], errors[2]);
});

test('resolver fails closed on an impossible persisted branch reference', async () => {
  const state = baseState();
  state.branches.delete(`${tenantA}:${branchA}`);
  await assert.rejects(
    resolver(createMemoryUnitOfWork(state)).execute({
      kind: 'candidate',
      opaque: 'trusted-a',
    }),
    expectsApplicationCode('STATION_REFERENCE_INTEGRITY_BROKEN'),
  );
});

test('link, unlink, relink and revoke preserve history and close the active binding', async () => {
  const unitOfWork = createMemoryUnitOfWork(baseState({ active: false }));
  const link = new LinkStation(unitOfWork);
  const unlink = new UnlinkStation(unitOfWork);
  const revoke = new RevokeStation(unitOfWork);

  const linked = await link.execute({
    tenantId: tenantA,
    stationId,
    branchId: branchA,
    expectedRevision: parseStationRevision(1),
    linkedAt: t2,
  });
  const unlinked = await unlink.execute({
    tenantId: tenantA,
    stationId,
    expectedRevision: linked.revision,
    unlinkedAt: t3,
  });
  const relinked = await link.execute({
    tenantId: tenantA,
    stationId,
    branchId: branchA,
    expectedRevision: unlinked.revision,
    linkedAt: t4,
  });
  const revoked = await revoke.execute({
    tenantId: tenantA,
    stationId,
    expectedRevision: relinked.revision,
    revokedAt: t5,
  });

  const snapshot = unitOfWork.snapshot();
  assert.deepEqual(
    [linked.status, unlinked.status, relinked.status, revoked.status],
    ['Active', 'Unlinked', 'Active', 'Revoked'],
  );
  assert.deepEqual(
    snapshot.bindings.map(({ bindingRevision, unlinkedAt }) => ({
      bindingRevision,
      unlinkedAt,
    })),
    [
      { bindingRevision: 2, unlinkedAt: t3 },
      { bindingRevision: 4, unlinkedAt: t5 },
    ],
  );
  assert.equal(revoked.revision, 5);
});

test('link denies a missing or cross-tenant branch with the AD-05 contract', async () => {
  const unitOfWork = createMemoryUnitOfWork(baseState({ active: false }));
  await assert.rejects(
    new LinkStation(unitOfWork).execute({
      tenantId: tenantA,
      stationId,
      branchId: branchB,
      expectedRevision: parseStationRevision(1),
      linkedAt: t2,
    }),
    expectsApplicationCode('STATION_BRANCH_NOT_ELIGIBLE'),
  );
  assert.equal(unitOfWork.snapshot().bindings.length, 0);
});

test('trusted guard revalidates revision and rolls back a failed effect', async () => {
  const unitOfWork = createMemoryUnitOfWork(baseState());
  const valid = await resolver(unitOfWork).execute({
    kind: 'candidate',
    opaque: 'trusted-a',
  });
  const runner = new RunWithTrustedStationContextUseCase(unitOfWork);
  let executions = 0;
  assert.equal(
    await runner.execute(valid, async () => {
      executions += 1;
      return 'committed';
    }),
    'committed',
  );
  assert.equal(executions, 1);

  const stale = createTrustedStationContext({
    tenantId: tenantA,
    branchId: branchA,
    stationId,
    stationRevision: parseStationRevision(1),
  });
  await assert.rejects(
    runner.execute(stale, async () => {
      executions += 1;
    }),
    expectsApplicationCode('STATION_CONTEXT_STALE'),
  );
  assert.equal(executions, 1);

  const before = unitOfWork.snapshot();
  await assert.rejects(
    runner.executeWithinUnitOfWork(valid, async (work) => {
      await work.bindings.closeOpenBinding(
        { tenantId: tenantA, stationId },
        valid.stationRevision,
        t3,
      );
      throw new StationApplicationError('STATION_LIFECYCLE_CONFLICT');
    }),
    expectsApplicationCode('STATION_LIFECYCLE_CONFLICT'),
  );
  assert.deepEqual(unitOfWork.snapshot(), before);
});

test('a forged context cannot bypass the resolver', async () => {
  const unitOfWork = createMemoryUnitOfWork(baseState());
  const forged = Object.freeze({
    tenantId: tenantA,
    branchId: branchA,
    stationId,
    stationRevision: parseStationRevision(2),
    source: 'server-verified-station',
  });
  await assert.rejects(
    new RunWithTrustedStationContextUseCase(unitOfWork).execute(
      forged,
      async () => 'should-not-run',
    ),
    expectsApplicationCode('STATION_NOT_TRUSTED'),
  );
});
