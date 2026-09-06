import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

test('PBI-032 keeps identity tenant-scoped and lifecycle fail-closed', async () => {
  const migration = await readFile('src/infrastructure/database/migrations/20260906170000_users_create_directory.ts', 'utf8');
  const domain = await readFile('src/modules/users/domain/user.ts', 'utf8');
  const repository = await readFile('src/modules/users/infrastructure/persistence/kysely-user.repository.ts', 'utf8');
  assert.match(migration, /addPrimaryKeyConstraint\('users_pk', \['tenant_id', 'user_id'\]\)/u);
  assert.match(migration, /users_status_ck/u);
  assert.match(domain, /from === 'inactive' && \(to === 'active' \|\| to === 'revoked'\)/u);
  assert.doesNotMatch(domain, /revoked'.*active/u);
  assert.match(repository, /FIRST_USER_ALREADY_PROVISIONED/u);
  assert.match(repository, /where\('tenant_id', '=', scope\.tenantId\)/u);
  assert.match(repository, /USER_STALE_WRITE/u);
});
