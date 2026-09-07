import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

test('PBI-032 keeps identity tenant-scoped and lifecycle fail-closed', async () => {
  const migration = await readFile('src/infrastructure/database/migrations/20260906170000_users_create_directory.ts', 'utf8');
  const domain = await readFile('src/modules/users/domain/user.ts', 'utf8');
  const repository = await readFile('src/modules/users/infrastructure/persistence/kysely-user.repository.ts', 'utf8');
  const lifecycleMigration = await readFile('src/infrastructure/database/migrations/20260906172000_users_create_lifecycle_commands.ts', 'utf8');
  const module = await readFile('src/modules/users/users.module.ts', 'utf8');
  const provisioning = await readFile('scripts/provision-first-user.mjs', 'utf8');
  const packageManifest = JSON.parse(await readFile('package.json', 'utf8'));
  assert.match(migration, /addPrimaryKeyConstraint\('users_pk', \['tenant_id', 'user_id'\]\)/u);
  assert.match(migration, /users_status_ck/u);
  assert.match(domain, /from === 'inactive' && \(to === 'active' \|\| to === 'revoked'\)/u);
  assert.doesNotMatch(domain, /revoked'.*active/u);
  assert.match(repository, /FIRST_USER_ALREADY_PROVISIONED/u);
  assert.match(repository, /where\('tenant_id', '=', trustedScope\.tenantId\)/u);
  assert.match(repository, /USER_STALE_WRITE/u);
  assert.match(repository, /USER_IDEMPOTENCY_CONFLICT/u);
  assert.match(repository, /findById/u);
  assert.match(lifecycleMigration, /user_lifecycle_commands_pk/u);
  assert.match(lifecycleMigration, /result_version = expected_version \+ 1/u);
  assert.match(module, /KyselyUserRepositoryFactory/u);
  assert.doesNotMatch(`${repository}\n${module}`, /@Controller|@Get|@Post|@Patch|@Delete/u);
  assert.doesNotMatch(repository, /deleteFrom\('users'\)/u);
  assert.match(provisioning, /ProvisionFirstUserUseCase/u);
  assert.match(provisioning, /assertLocalUserBootstrapAuthority/u);
  assert.doesNotMatch(provisioning, /\bPool\b|pool\.query|insert into users/iu);
  assert.ok(
    provisioning.indexOf('assertLocalUserBootstrapAuthority(') <
      provisioning.indexOf("await import("),
  );
  assert.match(packageManifest.scripts['users:provision-first'], /pnpm run build/u);
});
