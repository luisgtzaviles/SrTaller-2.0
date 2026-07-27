import assert from 'node:assert/strict';
import test from 'node:test';

import {
  databasePersistenceCapability,
} from '../dist/infrastructure/database/database-persistence-capability.js';
import {
  StationPersistenceError,
} from '../dist/modules/stations/application/ports/station-persistence.error.js';
import {
  parseStationId,
  parseStationRevision,
} from '../dist/modules/stations/domain/station.js';
import {
  createKyselyStationBindingRepository,
} from '../dist/modules/stations/infrastructure/persistence/kysely-station-binding.repository.js';
import {
  createKyselyStationRepository,
} from '../dist/modules/stations/infrastructure/persistence/kysely-station.repository.js';
import {
  parseBranchId,
  parseTenantId,
} from '../dist/modules/tenancy/index.js';

const tenantA = parseTenantId('10000000-0000-4000-8000-000000000001');
const tenantB = parseTenantId('20000000-0000-4000-8000-000000000002');
const branchA = parseBranchId('30000000-0000-4000-8000-000000000003');
const stationId = parseStationId('50000000-0000-4000-8000-000000000005');
const instant = new Date('2026-07-26T16:00:00.000Z');

function matches(row, conditions) {
  return conditions.every(([column, operator, value]) => {
    if (operator === '=') {
      return row[column] === value;
    }
    if (operator === 'is' && value === null) {
      return row[column] === null;
    }
    throw new Error(`unsupported fake operator ${operator}`);
  });
}

function createExecutor(initialTables) {
  const tables = Object.fromEntries(
    Object.entries(initialTables).map(([name, rows]) => [
      name,
      rows.map((row) => ({ ...row })),
    ]),
  );
  const observations = [];

  function selectFrom(table) {
    const conditions = [];
    const observation = { kind: 'select', table, forUpdate: false };
    observations.push(observation);
    const builder = {
      selectAll() {
        return builder;
      },
      where(column, operator, value) {
        conditions.push([column, operator, value]);
        return builder;
      },
      forUpdate() {
        observation.forUpdate = true;
        return builder;
      },
      limit() {
        return builder;
      },
      orderBy() {
        return builder;
      },
      async executeTakeFirst() {
        return tables[table].find((row) => matches(row, conditions));
      },
      async execute() {
        return tables[table].filter((row) => matches(row, conditions));
      },
    };
    return builder;
  }

  function updateTable(table) {
    const conditions = [];
    let values = {};
    const builder = {
      set(input) {
        values = input;
        return builder;
      },
      where(column, operator, value) {
        conditions.push([column, operator, value]);
        return builder;
      },
      returningAll() {
        return builder;
      },
      async executeTakeFirst() {
        const row = tables[table].find((candidate) =>
          matches(candidate, conditions));
        if (!row) {
          return undefined;
        }
        Object.assign(row, values);
        return row;
      },
    };
    return builder;
  }

  function insertInto(table) {
    let values;
    const builder = {
      values(input) {
        values = input;
        return builder;
      },
      returningAll() {
        return builder;
      },
      async executeTakeFirstOrThrow() {
        const row = { ...values };
        tables[table].push(row);
        return row;
      },
    };
    return builder;
  }

  return {
    executor: { insertInto, selectFrom, updateTable },
    observations,
    tables,
  };
}

function connection(executor) {
  return {
    state: 'ready',
    async verify() {},
    async [databasePersistenceCapability](owner, operation) {
      assert.equal(owner, 'stations');
      return operation(executor);
    },
  };
}

function stationRow(tenantId, revision = 1) {
  return {
    tenant_id: tenantId,
    station_id: stationId,
    status: 'Unlinked',
    revision,
    created_at: instant,
    updated_at: instant,
    revoked_at: null,
  };
}

function bindingRow(tenantId, revision = 2) {
  return {
    tenant_id: tenantId,
    station_id: stationId,
    binding_revision: revision,
    branch_id: branchA,
    linked_at: instant,
    unlinked_at: null,
  };
}

test('station lookup never crosses tenant scope', async () => {
  const fake = createExecutor({ stations: [stationRow(tenantB)] });
  const repository = createKyselyStationRepository(
    connection(fake.executor),
  );
  assert.equal(
    await repository.findStation({ tenantId: tenantA, stationId }),
    null,
  );
});

test('binding lookup never crosses tenant scope', async () => {
  const fake = createExecutor({
    station_bindings: [bindingRow(tenantB)],
  });
  const repository = createKyselyStationBindingRepository(
    connection(fake.executor),
  );
  assert.equal(
    await repository.findOpenBinding({ tenantId: tenantA, stationId }),
    null,
  );
});

test('station and binding locks execute FOR UPDATE', async () => {
  const fake = createExecutor({
    stations: [stationRow(tenantA)],
    station_bindings: [bindingRow(tenantA)],
  });
  const databaseConnection = connection(fake.executor);
  await createKyselyStationRepository(databaseConnection).lockStation({
    tenantId: tenantA,
    stationId,
  });
  await createKyselyStationBindingRepository(
    databaseConnection,
  ).lockOpenBinding({ tenantId: tenantA, stationId });
  assert.deepEqual(
    fake.observations.map(({ table, forUpdate }) => ({
      table,
      forUpdate,
    })),
    [
      { table: 'stations', forUpdate: true },
      { table: 'station_bindings', forUpdate: true },
    ],
  );
});

test('closing a binding cannot update another tenant', async () => {
  const fake = createExecutor({
    station_bindings: [bindingRow(tenantB)],
  });
  const closed = await createKyselyStationBindingRepository(
    connection(fake.executor),
  ).closeOpenBinding(
    { tenantId: tenantA, stationId },
    parseStationRevision(2),
    '2026-07-26T16:01:00.000Z',
  );
  assert.equal(closed, null);
  assert.equal(fake.tables.station_bindings[0].unlinked_at, null);
});

test('station transition requires the expected revision', async () => {
  const fake = createExecutor({ stations: [stationRow(tenantA, 2)] });
  const transitioned = await createKyselyStationRepository(
    connection(fake.executor),
  ).transitionStation(
    { tenantId: tenantA, stationId },
    {
      expectedRevision: parseStationRevision(1),
      expectedStatus: 'Unlinked',
      nextStatus: 'Active',
      nextRevision: parseStationRevision(2),
      updatedAt: '2026-07-26T16:01:00.000Z',
      revokedAt: null,
    },
  );
  assert.equal(transitioned, null);
  assert.equal(fake.tables.stations[0].status, 'Unlinked');
});

test('binding creation rejects cross-tenant record ownership', async () => {
  const fake = createExecutor({ station_bindings: [] });
  await assert.rejects(
    createKyselyStationBindingRepository(
      connection(fake.executor),
    ).createOpenBinding(
      { tenantId: tenantA, stationId },
      {
        tenantId: tenantB,
        stationId,
        bindingRevision: parseStationRevision(2),
        branchId: branchA,
        linkedAt: '2026-07-26T16:01:00.000Z',
        unlinkedAt: null,
      },
    ),
    (error) => {
      assert.ok(error instanceof StationPersistenceError);
      assert.equal(error.code, 'PERSISTENCE_BINDING_SCOPE_REQUIRED');
      return true;
    },
  );
  assert.equal(fake.tables.station_bindings.length, 0);
});

test('multiple open bindings fail closed as persisted integrity damage', async () => {
  const fake = createExecutor({
    station_bindings: [
      bindingRow(tenantA, 2),
      bindingRow(tenantA, 4),
    ],
  });
  await assert.rejects(
    createKyselyStationBindingRepository(
      connection(fake.executor),
    ).findOpenBinding({ tenantId: tenantA, stationId }),
    (error) => {
      assert.ok(error instanceof StationPersistenceError);
      assert.equal(error.code, 'STATION_PERSISTENCE_INVARIANT_BROKEN');
      return true;
    },
  );
});
