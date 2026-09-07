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
  'src/modules/stations/application/ports/branch-repository.port.ts';
const branchAdapterPath =
  'src/modules/stations/infrastructure/persistence/kysely-branch.repository.ts';
const userPortPath =
  'src/modules/users/application/ports/user-repository.port.ts';
const userAdapterPath =
  'src/modules/users/infrastructure/persistence/kysely-user.repository.ts';
const accessPortPath =
  'src/modules/access/application/ports/access-repository.port.ts';
const accessAdapterPath =
  'src/modules/access/infrastructure/persistence/kysely-access.repository.ts';

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
    owner: 'stations',
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
    owner: 'stations',
    port: branchPortPath,
    composition: 'src/modules/stations/stations.module.ts',
    status: 'materialized-owner-adapter',
  });
  assert.deepEqual(policy.persistence.ports[userPortPath], {
    owner: 'users',
    contract: 'UserRepositoryPort',
    allowedScopes: ['UserScope'],
    status: 'materialized-owner-port',
  });
  assert.deepEqual(policy.persistence.adapters[userAdapterPath], {
    owner: 'users',
    port: userPortPath,
    composition: 'src/modules/users/users.module.ts',
    status: 'materialized-owner-adapter',
  });
  assert.deepEqual(policy.persistence.ports[accessPortPath], {
    owner: 'access',
    contract: 'AccessRepositoryPort',
    allowedScopes: [
      'AccessTenantScope',
      'AccessBranchScope',
      'AccessPrincipalScope',
    ],
    status: 'materialized-owner-port',
  });
  assert.deepEqual(policy.persistence.adapters[accessAdapterPath], {
    owner: 'access',
    port: accessPortPath,
    composition: 'src/modules/access/access.module.ts',
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
      'src/infrastructure/database/database-runtime.ts',
      branchAdapterPath,
      'src/modules/stations/infrastructure/persistence/kysely-station-credential.verifier.ts',
      tenantAdapterPath,
      userAdapterPath,
      accessAdapterPath,
    ],
    status: 'materialized-owner-internal-capability',
  });
  assert.match(source, /Owner extends 'tenancy'/u);
  assert.match(source, /Owner extends 'database'/u);
  assert.match(source, /Owner extends 'access'/u);
  assert.match(source, /kysely_migration: DatabaseMigrationJournalTable/u);
  assert.match(source, /Pick<DatabaseSchema, 'tenants'>/u);
  assert.match(
    source,
    /Pick<DatabaseSchema, 'branches' \| 'stations' \| 'station_bindings' \| 'station_credentials'>/u,
  );
  assert.match(
    source,
    /Pick<DatabaseSchema, 'users' \| 'user_provisioning_bootstraps' \| 'user_lifecycle_commands'>/u,
  );
  assert.match(
    source,
    /Pick<DatabaseSchema, 'access_capabilities' \| 'access_roles' \| 'access_role_capabilities' \| 'access_role_assignments' \| 'access_role_assignment_commands'>/u,
  );
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
  assert.match(branchPort, /readonly branchId: BranchId/u);
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
