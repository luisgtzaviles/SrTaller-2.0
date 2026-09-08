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
const authenticationUserPortPath =
  'src/modules/users/application/ports/authentication-user-reader.port.ts';
const authenticationUserAdapterPath =
  'src/modules/users/infrastructure/persistence/kysely-authentication-user.reader.ts';
const accessPortPath =
  'src/modules/access/application/ports/access-repository.port.ts';
const accessAdapterPath =
  'src/modules/access/infrastructure/persistence/kysely-access.repository.ts';
const pinCredentialPortPath =
  'src/modules/access/application/ports/pin-credential-repository.port.ts';
const pinCredentialAdapterPath =
  'src/modules/access/infrastructure/persistence/kysely-pin-credential.repository.ts';
const operationalSessionPortPath =
  'src/modules/access/application/ports/operational-session-repository.port.ts';
const operationalSessionAdapterPath =
  'src/modules/access/infrastructure/persistence/kysely-operational-session.repository.ts';

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
  assert.deepEqual(policy.persistence.ports[pinCredentialPortPath], {
    owner: 'access',
    contract: 'PinCredentialRepositoryPort',
    allowedScopes: ['PinCredentialTenantScope', 'PinCredentialStationScope'],
    status: 'materialized-owner-port',
  });
  assert.deepEqual(policy.persistence.adapters[pinCredentialAdapterPath], {
    owner: 'access',
    port: pinCredentialPortPath,
    composition: 'src/modules/access/access.module.ts',
    status: 'materialized-owner-adapter',
  });
  assert.deepEqual(policy.persistence.ports[authenticationUserPortPath], {
    owner: 'users',
    contract: 'AuthenticationUserReaderPort',
    allowedScopes: ['AuthenticationUserPersistenceScope'],
    status: 'materialized-owner-port',
  });
  assert.deepEqual(policy.persistence.adapters[authenticationUserAdapterPath], {
    owner: 'users',
    port: authenticationUserPortPath,
    composition: 'src/modules/users/users.module.ts',
    status: 'materialized-owner-adapter',
  });
  assert.deepEqual(policy.persistence.ports[operationalSessionPortPath], {
    owner: 'access',
    contract: 'OperationalSessionRepositoryPort',
    allowedScopes: ['OperationalSessionPersistenceScope'],
    status: 'materialized-owner-port',
  });
  assert.deepEqual(policy.persistence.adapters[operationalSessionAdapterPath], {
    owner: 'access',
    port: operationalSessionPortPath,
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
      'src/infrastructure/runtime/application-database-runtime.provider.ts',
      'src/infrastructure/runtime/index.ts',
      branchAdapterPath,
      'src/modules/stations/infrastructure/persistence/kysely-station-credential.verifier.ts',
      tenantAdapterPath,
      userAdapterPath,
      authenticationUserAdapterPath,
      accessAdapterPath,
      pinCredentialAdapterPath,
      'src/modules/access/infrastructure/persistence/kysely-administration-authorization-commit.guard.ts',
      'src/modules/access/infrastructure/persistence/kysely-operational-authorization-commit.guard.ts',
      operationalSessionAdapterPath,
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
    /Pick<DatabaseSchema, 'users' \| 'user_provisioning_bootstraps' \| 'user_lifecycle_commands' \| 'user_profile_update_commands'>/u,
  );
  assert.match(
    source,
    /Pick<DatabaseSchema, 'access_capabilities' \| 'access_roles' \| 'access_role_commands' \| 'access_role_capabilities' \| 'access_role_assignments' \| 'access_role_assignment_commands' \| 'access_pin_credentials' \| 'access_pin_credential_commands' \| 'access_pin_eligibility_tenant_guards' \| 'access_pin_attempt_station_guards' \| 'access_pin_attempt_limits' \| 'access_operational_session_station_guards' \| 'access_operational_sessions'>/u,
  );
  assert.doesNotMatch(
    await readFile('src/app.module.ts', 'utf8'),
    /database-persistence-capability|KyselyTenant|KyselyBranch/u,
  );
});

test('ports require nominal scopes without leaking database drivers', async () => {
  const [tenantPort, branchPort, pinCredentialPort, authenticationUserPort] =
    await Promise.all([
      readFile(tenantPortPath, 'utf8'),
      readFile(branchPortPath, 'utf8'),
      readFile(pinCredentialPortPath, 'utf8'),
      readFile(authenticationUserPortPath, 'utf8'),
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
  assert.match(
    pinCredentialPort,
    /type PinCredentialScopedTenantId = string & TenantId/u,
  );
  assert.match(
    pinCredentialPort,
    /authenticateAttempt\(\s*context: PinCredentialStationScope/u,
  );
  assert.match(
    authenticationUserPort,
    /type AuthenticationUserScopedTenantId = string & TenantId/u,
  );
  assert.match(
    authenticationUserPort,
    /findAuthenticationUser\(\s*scope: AuthenticationUserPersistenceScope/u,
  );
  assert.doesNotMatch(
    `${tenantPort}\n${branchPort}\n${pinCredentialPort}\n${authenticationUserPort}`,
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
