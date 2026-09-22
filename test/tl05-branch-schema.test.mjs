import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('TL-05 migration uses only the approved exact legacy mapping and fails closed', async () => {
  const source = await readFile('src/infrastructure/database/migrations/20260921160000_stations_materialize_branch_management.ts', 'utf8');
  assert.match(source, /00000000-0000-4000-8000-000000000101/u);
  assert.match(source, /SR Taller Fixture — Hermosillo/u);
  assert.match(source, /00000000-0000-4000-8000-000000000102/u);
  assert.match(source, /SR Taller Fixture — Tijuana/u);
  assert.match(source, /where display_name is null/u);
  assert.match(source, /requires explicit Owner mapping/u);
  assert.doesNotMatch(source, /coalesce\s*\(\s*display_name/iu);
  assert.doesNotMatch(source, /concat.*time_zone/iu);
});

test('TL-05 Branch V1 preserves stations ownership and separates administrative and admission revisions', async () => {
  const types = await readFile('src/infrastructure/database/database-types.ts', 'utf8');
  const owners = await readFile('src/infrastructure/database/database-persistence-capability.ts', 'utf8');
  const domain = await readFile('src/modules/stations/domain/branch.ts', 'utf8');
  assert.match(types, /interface BranchTable[\s\S]*display_name[\s\S]*time_zone[\s\S]*active[\s\S]*version[\s\S]*admission_revision[\s\S]*created_at[\s\S]*updated_at/u);
  assert.match(owners, /Pick<DatabaseSchema, 'branches' \| 'branch_commands' \| 'branch_audit_events' \| 'stations'/u);
  assert.match(domain, /'ACTIVE' \| 'INACTIVE'/u);
});

test('TL-05 schema removes the implicit timezone default and creates append-only audit', async () => {
  const source = await readFile('src/infrastructure/database/migrations/20260921160000_stations_materialize_branch_management.ts', 'utf8');
  assert.match(source, /alter column time_zone drop default/u);
  assert.match(source, /Branch audit events are append-only/u);
  assert.match(source, /branch_commands_digest_ck/u);
});
