import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

test('PBI-033 keeps roles tenant-owned, assignments scoped and capabilities finite', async () => {
  const catalogMigration = await readFile(
    'src/infrastructure/database/migrations/20260906180000_access_create_capability_catalog.ts',
    'utf8',
  );
  const rolesMigration = await readFile(
    'src/infrastructure/database/migrations/20260906181000_access_create_roles.ts',
    'utf8',
  );
  const assignmentsMigration = await readFile(
    'src/infrastructure/database/migrations/20260906182000_access_create_role_assignments.ts',
    'utf8',
  );
  const domain = await readFile(
    'src/modules/access/domain/capability.ts',
    'utf8',
  );
  const repository = await readFile(
    'src/modules/access/infrastructure/persistence/kysely-access.repository.ts',
    'utf8',
  );
  const moduleSource = await readFile(
    'src/modules/access/access.module.ts',
    'utf8',
  );

  assert.match(catalogMigration, /access_capabilities_code_ck/u);
  assert.match(catalogMigration, /repairs\.add_note/u);
  assert.match(rolesMigration, /access_roles_tenant_fk/u);
  assert.match(rolesMigration, /access_roles_tenant_key_uq/u);
  assert.match(rolesMigration, /access_role_capabilities_role_fk/u);
  assert.match(assignmentsMigration, /\['tenant_id', 'user_id'\][\s\S]*'users'[\s\S]*\['tenant_id', 'user_id'\]/u);
  assert.match(assignmentsMigration, /\['tenant_id', 'role_id'\][\s\S]*'access_roles'[\s\S]*\['tenant_id', 'role_id'\]/u);
  assert.match(assignmentsMigration, /\['tenant_id', 'branch_id'\][\s\S]*'branches'[\s\S]*\['tenant_id', 'branch_id'\]/u);
  assert.match(assignmentsMigration, /TENANT_WIDE/u);
  assert.match(assignmentsMigration, /BRANCH_RESTRICTED/u);
  assert.match(assignmentsMigration, /access_role_assignment_commands_pk/u);
  assert.match(assignmentsMigration, /result_version = expected_version \+ 1/u);
  assert.match(domain, /ACCESS_CAPABILITY_CATALOG/u);
  assert.match(repository, /ACCESS_IDEMPOTENCY_CONFLICT/u);
  assert.match(repository, /ACCESS_STALE_WRITE/u);
  assert.match(repository, /where\('tenant_id', '=', trustedScope\.tenantId\)/u);
  assert.doesNotMatch(`${repository}\n${moduleSource}`, /@Controller|@Get|@Post|@Patch|@Delete/u);
  assert.doesNotMatch(repository, /deleteFrom\('access_role_assignments'\)/u);
  assert.doesNotMatch(repository, /role_key.*===|display_name.*===/u);
});
