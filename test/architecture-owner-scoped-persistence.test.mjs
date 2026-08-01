import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const capabilityPath =
  'src/infrastructure/database/database-persistence-capability.ts';
const tenantPortPath =
  'src/modules/tenancy/application/ports/tenant-repository.port.ts';
const tenantAdapterPath =
  'src/modules/tenancy/infrastructure/persistence/kysely-tenant.repository.ts';
const branchPortPath =
  'src/modules/tenancy/application/ports/branch-repository.port.ts';
const branchAdapterPath =
  'src/modules/tenancy/infrastructure/persistence/kysely-branch.repository.ts';
const stationAdapterPath =
  'src/modules/stations/infrastructure/persistence/kysely-station.repository.ts';
const bindingAdapterPath =
  'src/modules/stations/infrastructure/persistence/kysely-station-binding.repository.ts';
const previewAdapterPath =
  'src/modules/preview/infrastructure/persistence/kysely-preview-repair.repository.ts';

test('owner-scoped ports and adapters retain exact ownership registration', async () => {
  const policy = JSON.parse(
    await readFile('architecture/dec-005-policy.json', 'utf8'),
  );
  assert.deepEqual(policy.persistence.ports[tenantPortPath], {
    owner: 'tenancy',
    contract: 'TenantRepositoryPort',
    allowedScopes: ['TenantPersistenceScope'],
    status: 'materialized-owner-port',
  });
  assert.deepEqual(policy.persistence.ports[branchPortPath], {
    owner: 'tenancy',
    contract: 'BranchRepositoryPort',
    allowedScopes: [
      'TenantPersistenceScope',
      'TenantBranchPersistenceScope',
    ],
    status: 'materialized-owner-port',
  });
  assert.deepEqual(policy.persistence.adapters[tenantAdapterPath], {
    owner: 'tenancy',
    port: tenantPortPath,
    composition: 'src/modules/tenancy/tenancy.module.ts',
    status: 'materialized-owner-adapter',
  });
  assert.deepEqual(policy.persistence.adapters[branchAdapterPath], {
    owner: 'tenancy',
    port: branchPortPath,
    composition: 'src/modules/tenancy/tenancy.module.ts',
    status: 'materialized-owner-adapter',
  });
});

test('persistence capability is internal and has only exact adapter consumers', async () => {
  const [policy, source] = await Promise.all([
    readFile('architecture/dec-005-policy.json', 'utf8').then(JSON.parse),
    readFile(capabilityPath, 'utf8'),
  ]);
  assert.deepEqual(policy.persistence.infrastructureFiles[capabilityPath], {
    owner: 'database',
    publicExports: [
      'InternalDatabasePersistenceOwner',
      'InternalDatabasePersistenceExecutor',
      'InternalDatabasePersistenceOperation',
      'databasePersistenceCapability',
      'DatabasePersistenceCapabilityError',
      'InternalDatabasePersistenceConnection',
      'useDatabasePersistenceExecutor',
      'useTransactionalDatabasePersistenceExecutor',
    ],
    consumers: [
      'src/infrastructure/database/database-connection.ts',
      'src/preview-seed.ts',
      previewAdapterPath,
      bindingAdapterPath,
      stationAdapterPath,
      branchAdapterPath,
      tenantAdapterPath,
    ],
    status: 'materialized-owner-internal-capability',
  });
  assert.match(source, /Owner extends 'tenancy'/u);
  assert.match(source, /Owner extends 'stations'/u);
  assert.match(source, /'preview_repair_status_history' \| 'preview_repairs'/u);
  assert.match(source, /'branches' \| 'tenants'/u);
  assert.match(source, /'station_bindings' \| 'stations'/u);
  assert.doesNotMatch(
    await readFile('src/app.module.ts', 'utf8'),
    /database-persistence-capability|KyselyTenant|KyselyBranch/u,
  );
});

test('ports require nominal scopes without leaking database drivers', async () => {
  const [tenantPort, branchPort] = await Promise.all([
    readFile(tenantPortPath, 'utf8'),
    readFile(branchPortPath, 'utf8'),
  ]);
  assert.match(tenantPort, /readonly tenantId: ScopedTenantId/u);
  assert.match(branchPort, /readonly branchId: ScopedBranchId/u);
  assert.match(
    branchPort,
    /findBranchById\(\s*scope: TenantBranchPersistenceScope/u,
  );
  assert.match(
    branchPort,
    /listBranchesByTenant\(\s*scope: TenantPersistenceScope/u,
  );
  assert.doesNotMatch(
    `${tenantPort}\n${branchPort}`,
    /from ['"](?:kysely|pg)['"]|PoolClient|QueryResult|RawBuilder/u,
  );
});

test('adapters expose no dynamic table, global list or cross-owner write', async () => {
  const [tenantAdapter, branchAdapter] = await Promise.all([
    readFile(tenantAdapterPath, 'utf8'),
    readFile(branchAdapterPath, 'utf8'),
  ]);
  assert.match(tenantAdapter, /\.insertInto\('tenants'\)/u);
  assert.match(branchAdapter, /\.insertInto\('branches'\)/u);
  assert.match(branchAdapter, /\.where\('tenant_id'/u);
  assert.match(branchAdapter, /\.where\('branch_id'/u);
  assert.doesNotMatch(tenantAdapter, /['"]branches['"]/u);
  assert.doesNotMatch(branchAdapter, /selectFrom\('tenants'\)/u);
  assert.doesNotMatch(
    `${tenantAdapter}\n${branchAdapter}`,
    /listAll|table:\s*string|BaseRepository|CrudRepository/u,
  );
});
