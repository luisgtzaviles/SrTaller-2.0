import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  classifyPostgresqlQuery,
  createPhaseRecorder,
  measurePostgresqlQueries,
} from '../scripts/lib/performance-diagnostics.mjs';

test('PBI-041 diagnostics classify queries without retaining SQL or values', () => {
  assert.equal(classifyPostgresqlQuery('insert into "catalog_items" (tenant_id) values ($1)'), 'insert:catalog_items');
  assert.equal(classifyPostgresqlQuery({ text: 'SELECT * FROM catalog_update_batches WHERE tenant_id = $1' }), 'select:catalog_update_batches');
  assert.equal(classifyPostgresqlQuery('start transaction isolation level serializable read write'), 'transaction:begin');
  assert.equal(classifyPostgresqlQuery('COMMIT'), 'transaction:commit');
});

test('PBI-041 diagnostics preserve results and restore the query implementation', async () => {
  const clientPrototype = { async query() { return Object.freeze({ rowCount: 1 }); } };
  const originalQuery = clientPrototype.query;
  const result = await measurePostgresqlQueries(async () => {
    await clientPrototype.query({ sql: 'begin isolation level serializable' });
    await clientPrototype.query('select 1 from catalog_items');
    await clientPrototype.query('update catalog_items set title = $1 where item_id = $2');
    await clientPrototype.query('commit');
    return 'complete';
  }, { clientPrototype });

  assert.equal(result.value, 'complete');
  assert.equal(result.diagnostics.queryCount, 4);
  assert.deepEqual(result.diagnostics.breakdown.map(({ label, count }) => ({ label, count })).sort((left, right) => left.label.localeCompare(right.label)), [
    { label: 'select:catalog_items', count: 1 },
    { label: 'transaction:begin', count: 1 },
    { label: 'transaction:commit', count: 1 },
    { label: 'update:catalog_items', count: 1 },
  ]);
  assert.equal(typeof result.diagnostics.transactionMs, 'number');
  assert.equal(clientPrototype.query, originalQuery);
});

test('PBI-041 runner selects a pinned native PostgreSQL image and keeps both budgets', async () => {
  const runner = await readFile('scripts/test-pbi041-postgresql.mjs', 'utf8');
  const material = await readFile('test/bulk-catalog-postgresql.test.mjs', 'utf8');
  assert.match(runner, /amd64: postgresqlImage/u);
  assert.match(runner, /arm64: 'postgres@sha256:[a-f0-9]{64}'/u);
  assert.match(runner, /'--platform', `linux\/\$\{dockerArchitecture\}`/u);
  assert.match(material, /transactionMs <= 15_000/u);
  assert.match(material, /publishMs <= 30_000/u);
  assert.doesNotMatch(material, /publish exceeded HTTP budget/u);
});

test('PBI-041 phase recorder reports bounded named phases', async () => {
  let now = 100;
  const recorder = createPhaseRecorder(() => now);
  const value = await recorder.measure('fixture', async () => { now += 12.345; return 41; });
  now += 7;
  assert.equal(value, 41);
  assert.deepEqual(recorder.snapshot(), { totalMs: 19.3, phases: [{ name: 'fixture', durationMs: 12.3 }] });
});
