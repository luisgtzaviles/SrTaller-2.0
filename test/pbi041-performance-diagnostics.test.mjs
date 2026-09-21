import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  PBI041_PUBLISH_HARD_LIMIT_MS,
  PBI041_TRANSACTION_CAPACITY_TARGET_EXCEEDED,
  PBI041_TRANSACTION_P95_TARGET_MS,
  assessPbi041PublishPerformance,
  classifyPostgresqlQuery,
  createPhaseRecorder,
  formatPbi041TransactionCapacityDiagnostic,
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

test('PBI-041 recurring gate keeps publish blocking and transaction p95 diagnostic', async () => {
  const runner = await readFile('scripts/test-pbi041-postgresql.mjs', 'utf8');
  const material = await readFile('test/bulk-catalog-postgresql.test.mjs', 'utf8');
  assert.match(runner, /amd64: postgresqlImage/u);
  assert.match(runner, /arm64: 'postgres@sha256:[a-f0-9]{64}'/u);
  assert.match(runner, /'--platform', `linux\/\$\{dockerArchitecture\}`/u);
  assert.match(material, /measurePostgresqlQueries\(\(\) => service\.publish/u);
  assert.match(material, /assessPbi041PublishPerformance/u);
  assert.match(material, /transaction capacity/u);
  assert.match(material, /publishWithinHardLimit/u);
  assert.doesNotMatch(material, /transactionMs <= 15_000/u);
  assert.doesNotMatch(material, /publish exceeded HTTP budget/u);
});

test('PBI-041 performance assessment preserves the approved single-run contract', () => {
  assert.equal(PBI041_PUBLISH_HARD_LIMIT_MS, 30_000);
  assert.equal(PBI041_TRANSACTION_P95_TARGET_MS, 15_000);

  const withinBoth = assessPbi041PublishPerformance({ publishMs: 12_000, transactionMs: 8_000 });
  assert.equal(withinBoth.publishWithinHardLimit, true);
  assert.equal(withinBoth.transactionCapacityTargetExceeded, false);
  assert.equal(withinBoth.transactionDiagnostic.historicalTarget, 'transaction p95 <=15s');
  assert.equal(withinBoth.transactionDiagnostic.currentSingleObservationMs, 8_000);
  assert.equal(withinBoth.transactionDiagnostic.enforcement, 'diagnostic pending calibrated p95 contract');
  assert.equal('code' in withinBoth.transactionDiagnostic, false);

  const transactionMiss = assessPbi041PublishPerformance({ publishMs: 20_534, transactionMs: 20_533.8 });
  assert.equal(transactionMiss.publishWithinHardLimit, true);
  assert.equal(transactionMiss.transactionCapacityTargetExceeded, true);
  assert.equal(transactionMiss.transactionDiagnostic.code, PBI041_TRANSACTION_CAPACITY_TARGET_EXCEEDED);
  assert.equal(transactionMiss.transactionDiagnostic.currentSingleObservationMs, 20_533.8);
  assert.equal(
    formatPbi041TransactionCapacityDiagnostic(transactionMiss.transactionDiagnostic),
    'TRANSACTION_CAPACITY_TARGET_EXCEEDED; Historical target: transaction p95 <=15s; Current single observation: 20533.8 ms; Enforcement: diagnostic pending calibrated p95 contract',
  );

  const publishMiss = assessPbi041PublishPerformance({ publishMs: 30_000.1, transactionMs: 14_000 });
  assert.equal(publishMiss.publishWithinHardLimit, false);
  assert.equal(publishMiss.transactionCapacityTargetExceeded, false);
});

test('PBI-041 performance assessment rejects missing or unsafe timing values', () => {
  assert.throws(
    () => assessPbi041PublishPerformance({ publishMs: Number.NaN, transactionMs: 1 }),
    /publishMs must be a finite non-negative duration/u,
  );
  assert.throws(
    () => assessPbi041PublishPerformance({ publishMs: 1, transactionMs: -1 }),
    /transactionMs must be a finite non-negative duration/u,
  );
});

test('PBI-041 phase recorder reports bounded named phases', async () => {
  let now = 100;
  const recorder = createPhaseRecorder(() => now);
  const value = await recorder.measure('fixture', async () => { now += 12.345; return 41; });
  now += 7;
  assert.equal(value, 41);
  assert.deepEqual(recorder.snapshot(), { totalMs: 19.3, phases: [{ name: 'fixture', durationMs: 12.3 }] });
});
