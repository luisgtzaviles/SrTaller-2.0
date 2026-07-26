import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { inspect, promisify } from 'node:util';

import {
  databasePersistenceCapability,
} from '../dist/infrastructure/database/database-persistence-capability.js';
import {
  BranchPersistenceError,
} from '../dist/modules/tenancy/application/ports/branch-repository.port.js';
import {
  createKyselyBranchRepository,
} from '../dist/modules/tenancy/infrastructure/persistence/kysely-branch.repository.js';
import {
  TenantPersistenceError,
} from '../dist/modules/tenancy/application/ports/tenant-repository.port.js';
import {
  parseBranchId,
  parseTenantId,
} from '../dist/modules/tenancy/index.js';
import {
  createKyselyTenantRepository,
} from '../dist/modules/tenancy/infrastructure/persistence/kysely-tenant.repository.js';

const execute = promisify(execFile);
const tenantA = parseTenantId('10000000-0000-4000-8000-000000000001');
const tenantB = parseTenantId('20000000-0000-4000-8000-000000000002');
const branchA = parseBranchId('30000000-0000-4000-8000-000000000003');
const createdAt = '2026-07-25T20:00:00.000Z';

function fakeConnection(executor, observed) {
  return {
    state: 'ready',
    async verify() {},
    async [databasePersistenceCapability](owner, operation) {
      observed.push(owner);
      return operation(executor);
    },
  };
}

function insertExecutor(row, failure) {
  return {
    insertInto(table) {
      return {
        values(values) {
          return {
            returning(columns) {
              return {
                async executeTakeFirstOrThrow() {
                  if (failure) {
                    throw failure;
                  }
                  return row ?? {
                    ...values,
                    created_at: values.created_at,
                  };
                },
                columns,
              };
            },
          };
        },
        table,
      };
    },
  };
}

function expectsTenantCode(code) {
  return (error) => {
    assert.ok(error instanceof TenantPersistenceError);
    assert.equal(error.code, code);
    assert.doesNotMatch(
      `${JSON.stringify(error)}\n${inspect(error)}`,
      /postgres:\/\/|private|password|select|insert|23505/iu,
    );
    return true;
  };
}

function expectsBranchCode(code) {
  return (error) => {
    assert.ok(error instanceof BranchPersistenceError);
    assert.equal(error.code, code);
    assert.doesNotMatch(
      `${JSON.stringify(error)}\n${inspect(error)}`,
      /postgres:\/\/|private|password|select|insert|2350[235]/iu,
    );
    return true;
  };
}

test('canonical tenant and branch IDs are validated independently', () => {
  assert.equal(parseTenantId(tenantA), tenantA);
  assert.equal(parseBranchId(branchA), branchA);
  assert.throws(() => parseTenantId(''), TypeError);
  assert.throws(
    () => parseBranchId('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'.toUpperCase()),
    TypeError,
  );
  assert.throws(() => parseTenantId(null), TypeError);
  assert.throws(() => parseBranchId(undefined), TypeError);
});

test('tenant scope fails closed before the persistence capability is used', async () => {
  const observed = [];
  const repository = createKyselyTenantRepository(
    fakeConnection(insertExecutor(), observed),
  );
  await assert.rejects(
    repository.findTenantById({ tenantId: '' }),
    expectsTenantCode('PERSISTENCE_TENANT_SCOPE_REQUIRED'),
  );
  await assert.rejects(
    repository.createTenant(
      { tenantId: tenantA },
      { tenantId: tenantB, createdAt },
    ),
    expectsTenantCode('PERSISTENCE_TENANT_SCOPE_REQUIRED'),
  );
  assert.deepEqual(observed, []);
});

test('branch scope fails closed before query and rejects payload scope drift', async () => {
  const observed = [];
  const repository = createKyselyBranchRepository(
    fakeConnection(insertExecutor(), observed),
  );
  await assert.rejects(
    repository.findBranchById({ tenantId: tenantA, branchId: '' }),
    expectsBranchCode('PERSISTENCE_BRANCH_SCOPE_REQUIRED'),
  );
  await assert.rejects(
    repository.createBranch(
      { tenantId: tenantA, branchId: branchA },
      { tenantId: tenantB, branchId: branchA, createdAt },
    ),
    expectsBranchCode('PERSISTENCE_TENANT_SCOPE_REQUIRED'),
  );
  assert.deepEqual(observed, []);
});

test('adapters map immutable records and invoke only their registered owner', async () => {
  const tenantOwners = [];
  const tenantRepository = createKyselyTenantRepository(
    fakeConnection(
      insertExecutor({
        tenant_id: tenantA,
        created_at: new Date(createdAt),
      }),
      tenantOwners,
    ),
  );
  const tenant = await tenantRepository.createTenant(
    { tenantId: tenantA },
    { tenantId: tenantA, createdAt },
  );
  assert.deepEqual(tenant, { tenantId: tenantA, createdAt });
  assert.ok(Object.isFrozen(tenant));
  assert.deepEqual(tenantOwners, ['tenancy']);

  const branchOwners = [];
  const branchRepository = createKyselyBranchRepository(
    fakeConnection(
      insertExecutor({
        tenant_id: tenantA,
        branch_id: branchA,
        created_at: new Date(createdAt),
      }),
      branchOwners,
    ),
  );
  const branch = await branchRepository.createBranch(
    { tenantId: tenantA, branchId: branchA },
    { tenantId: tenantA, branchId: branchA, createdAt },
  );
  assert.deepEqual(branch, {
    tenantId: tenantA,
    branchId: branchA,
    createdAt,
  });
  assert.ok(Object.isFrozen(branch));
  assert.deepEqual(branchOwners, ['tenancy']);
});

test('driver failures map to stable sanitized owner errors', async () => {
  for (const code of ['40001', '40P01', '57014']) {
    const tenantRepository = createKyselyTenantRepository(
      fakeConnection(
        insertExecutor(undefined, {
          code,
          message: 'private SQL select * from tenants password=private',
        }),
        [],
      ),
    );
    await assert.rejects(
      tenantRepository.createTenant(
        { tenantId: tenantA },
        { tenantId: tenantA, createdAt },
      ),
      (error) => {
        assert.ok(expectsTenantCode('TENANT_PERSISTENCE_FAILED')(error));
        assert.equal(error.retryable, 'conditional');
        return true;
      },
    );
  }

  const duplicate = createKyselyBranchRepository(
    fakeConnection(
      insertExecutor(undefined, {
        code: '23505',
        detail: 'private tenant and branch values',
      }),
      [],
    ),
  );
  await assert.rejects(
    duplicate.createBranch(
      { tenantId: tenantA, branchId: branchA },
      { tenantId: tenantA, branchId: branchA, createdAt },
    ),
    expectsBranchCode('BRANCH_PERSISTENCE_CONFLICT'),
  );

  const missingTenant = createKyselyBranchRepository(
    fakeConnection(insertExecutor(undefined, { code: '23503' }), []),
  );
  await assert.rejects(
    missingTenant.createBranch(
      { tenantId: tenantA, branchId: branchA },
      { tenantId: tenantA, branchId: branchA, createdAt },
    ),
    expectsBranchCode('BRANCH_PERSISTENCE_TENANT_NOT_FOUND'),
  );
});

test('source contracts expose no global branch lookup or dynamic table API', async () => {
  const [branchSource, tenantSource] = await Promise.all([
    readFile(
      new URL(
        '../src/modules/tenancy/infrastructure/persistence/kysely-branch.repository.ts',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/modules/tenancy/infrastructure/persistence/kysely-tenant.repository.ts',
        import.meta.url,
      ),
      'utf8',
    ),
  ]);
  assert.match(branchSource, /\.where\('tenant_id'/u);
  assert.match(branchSource, /\.where\('branch_id'/u);
  assert.doesNotMatch(branchSource, /listAllBranches|table:\s*string/iu);
  assert.doesNotMatch(tenantSource, /branches|table:\s*string/iu);
  assert.doesNotMatch(branchSource, /selectFrom\('tenants'\)/u);
});

test('TypeScript rejects accidental TenantId and BranchId interchange', async () => {
  await execute(
    process.execPath,
    [
      'node_modules/typescript/bin/tsc',
      '--ignoreConfig',
      '--noEmit',
      '--strict',
      '--module',
      'NodeNext',
      '--moduleResolution',
      'NodeNext',
      '--target',
      'ES2024',
      '--types',
      'node',
      'test/owner-scoped-persistence.types.ts',
    ],
    {
      cwd: new URL('..', import.meta.url),
      encoding: 'utf8',
      maxBuffer: 5 * 1024 * 1024,
    },
  );
});
