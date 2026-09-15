import assert from 'node:assert/strict';
import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';

import { Pool } from 'pg';

import {
  assertCleanupInvocation,
  assertExpectedCounts,
  assertSyntheticItems,
  assertSyntheticListings,
  SYNTHETIC_DEMO_EXPECTED_COUNTS,
  SYNTHETIC_DEMO_SOURCE_ID,
  SYNTHETIC_DEMO_SOURCE_NAME,
  SYNTHETIC_DEMO_TENANT_ID,
} from './lib/local-synthetic-supplier-cleanup.mjs';
import {
  assertLocalTarget,
  databaseEnvironment,
  ensureLocalEnvironment,
  LOCAL_CONTAINER,
  LOCAL_DB_PORT,
  LOCAL_VOLUME,
} from './lib/local-development.mjs';

const execFile = promisify(execFileCallback);
const args = new Set(process.argv.slice(2));
const execute = args.has('--execute');
const valueAfter = (name) => {
  const index = process.argv.indexOf(name);
  return index < 0 ? undefined : process.argv[index + 1];
};
const sourceId = valueAfter('--source-id') ?? SYNTHETIC_DEMO_SOURCE_ID;
const expectedName = valueAfter('--expected-name') ?? SYNTHETIC_DEMO_SOURCE_NAME;

if (args.has('--help')) {
  process.stdout.write('Usage: cleanup-local-synthetic-supplier.mjs [--execute --source-id <uuid> --expected-name "Proveedor Demo"]\n');
  process.exit(0);
}

assertCleanupInvocation({ execute, sourceId, expectedName });

async function assertGovernedLocalContainer(values) {
  assertLocalTarget(values);
  const { stdout } = await execFile('docker', ['inspect', LOCAL_CONTAINER], { encoding: 'utf8' });
  const [inspection] = JSON.parse(stdout);
  assert.equal(inspection?.State?.Running, true, 'Governed local PostgreSQL is not running.');
  assert.equal(inspection?.Config?.Labels?.['io.srtaller.environment'], 'local', 'PostgreSQL is not labeled local.');
  assert.equal(inspection?.Config?.Labels?.['io.srtaller.component'], 'postgres', 'PostgreSQL is not the governed local component.');
  const binding = inspection?.HostConfig?.PortBindings?.['5432/tcp']?.[0];
  assert.equal(binding?.HostIp, '127.0.0.1', 'PostgreSQL is not bound to loopback.');
  assert.equal(binding?.HostPort, String(LOCAL_DB_PORT), 'Unexpected local PostgreSQL port.');
  assert.ok(inspection?.Mounts?.some((mount) => mount.Type === 'volume' && mount.Name === LOCAL_VOLUME), 'Unexpected local PostgreSQL volume.');
}

function poolFor(values) {
  const environment = databaseEnvironment(values, execute ? 'migration' : 'application');
  return new Pool({
    application_name: 'srtaller-local-synthetic-fixture-cleanup',
    connectionTimeoutMillis: Number(environment.SR_DB_CONNECTION_TIMEOUT_MS),
    database: environment.SR_DB_NAME,
    host: environment.SR_DB_HOST,
    idleTimeoutMillis: Number(environment.SR_DB_IDLE_TIMEOUT_MS),
    max: 1,
    password: execute ? values.SR_LOCAL_ADMIN_PASSWORD : environment.SR_DB_PASSWORD,
    port: Number(environment.SR_DB_PORT),
    query_timeout: 15_000,
    ssl: false,
    statement_timeout: 15_000,
    user: execute ? values.SR_LOCAL_ADMIN_USER : environment.SR_DB_USER,
  });
}

const appendOnlyTables = Object.freeze([
  'catalog_retirement_events',
  'catalog_supplier_listing_resolutions',
  'catalog_audit_events',
  'catalog_base_price_revisions',
  'catalog_branch_price_revisions',
  'catalog_reference_cost_revisions',
  'catalog_item_identifiers',
  'catalog_supplier_listings',
  'catalog_supplier_catalog_versions',
]);

async function assertProductTriggersEnabled(client) {
  const result = await client.query(
    `SELECT c.relname AS table_name,count(*)::int AS trigger_count,
            count(*) FILTER (WHERE t.tgenabled='O')::int AS enabled_count
       FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND NOT t.tgisinternal AND c.relname=ANY($1::text[])
      GROUP BY c.relname ORDER BY c.relname`,
    [appendOnlyTables],
  );
  assert.equal(result.rowCount, appendOnlyTables.length, 'Expected product triggers are missing.');
  assert.ok(result.rows.every(({ trigger_count, enabled_count }) => Number(trigger_count) > 0 && Number(trigger_count) === Number(enabled_count)), 'A product history trigger is not enabled.');
}

async function setLocalCleanupTriggerMode(client, enabled) {
  for (const table of appendOnlyTables) {
    await client.query(`ALTER TABLE ${table} ${enabled ? 'ENABLE' : 'DISABLE'} TRIGGER USER`);
  }
}

const count = (result) => Number(result.rows[0]?.count ?? 0);
const rowIds = (rows, key) => rows.map((row) => row[key]);

async function audit(client, { lock = false } = {}) {
  if (lock) {
    await client.query(`LOCK TABLE
      catalog_supplier_sources, catalog_supplier_catalog_versions, catalog_supplier_version_raw_payloads,
      catalog_supplier_listings, catalog_update_batches, catalog_update_row_decisions,
      catalog_supplier_listing_resolutions, catalog_supplier_reconciliation_memory,
      catalog_retirement_plans, catalog_retirement_events, catalog_items, catalog_item_identifiers,
      catalog_base_price_revisions, catalog_branch_price_revisions, catalog_reference_cost_revisions,
      catalog_audit_events, catalog_commands
      IN SHARE ROW EXCLUSIVE MODE`);
  }

  const source = await client.query(
    `SELECT source_id, display_name, normalized_name, status, version, next_version_sequence
       FROM catalog_supplier_sources WHERE tenant_id=$1::uuid AND source_id=$2::uuid`,
    [SYNTHETIC_DEMO_TENANT_ID, sourceId],
  );
  assert.equal(source.rowCount, 1, 'Synthetic Demo SupplierSource is absent or ambiguous.');
  assert.equal(source.rows[0].display_name, expectedName);
  assert.equal(source.rows[0].normalized_name, 'proveedor demo');
  assert.equal(source.rows[0].status, 'ACTIVE');

  const versions = await client.query(
    `SELECT version_id, sequence_number, lifecycle, row_count, supersedes_version_id
       FROM catalog_supplier_catalog_versions WHERE tenant_id=$1::uuid AND source_id=$2::uuid ORDER BY sequence_number`,
    [SYNTHETIC_DEMO_TENANT_ID, sourceId],
  );
  assert.deepEqual(versions.rows.map(({ sequence_number }) => Number(sequence_number)), [1, 2, 3]);
  assert.ok(versions.rows.every(({ lifecycle, row_count, supersedes_version_id }) => lifecycle === 'INGESTED' && Number(row_count) === 1_500 && supersedes_version_id === null));
  const versionIds = rowIds(versions.rows, 'version_id');

  const listings = await client.query(
    `SELECT v.sequence_number, l.row_number, l.item_kind, l.supplier_title, l.supplier_description,
            l.category_label, l.brand_label, l.supplier_item_code, l.supplier_cost_minor
       FROM catalog_supplier_listings l
       JOIN catalog_supplier_catalog_versions v ON v.tenant_id=l.tenant_id AND v.version_id=l.version_id
      WHERE v.tenant_id=$1::uuid AND v.source_id=$2::uuid ORDER BY v.sequence_number,l.row_number`,
    [SYNTHETIC_DEMO_TENANT_ID, sourceId],
  );
  assertSyntheticListings(listings.rows);

  const batches = await client.query(
    `SELECT batch_id, version_id, lifecycle FROM catalog_update_batches
      WHERE tenant_id=$1::uuid AND version_id=ANY($2::uuid[]) ORDER BY created_at`,
    [SYNTHETIC_DEMO_TENANT_ID, versionIds],
  );
  assert.equal(batches.rowCount, 3);
  assert.deepEqual(batches.rows.map(({ lifecycle }) => lifecycle), ['APPLIED', 'RECONCILING', 'RECONCILING']);
  const batchIds = rowIds(batches.rows, 'batch_id');

  const itemRows = await client.query(
    `SELECT DISTINCT i.item_id,i.title,i.description,i.kind,i.status,i.version
       FROM catalog_items i
       JOIN catalog_supplier_listing_resolutions r ON r.tenant_id=i.tenant_id AND r.item_id=i.item_id
      WHERE i.tenant_id=$1::uuid AND r.source_id=$2::uuid AND r.resolution='CREATED'
      ORDER BY i.item_id`,
    [SYNTHETIC_DEMO_TENANT_ID, sourceId],
  );
  assertSyntheticItems(itemRows.rows);
  const itemIds = rowIds(itemRows.rows, 'item_id');

  const counts = {
    sources: source.rowCount,
    versions: versions.rowCount,
    rawPayloads: count(await client.query('SELECT count(*) FROM catalog_supplier_version_raw_payloads WHERE tenant_id=$1::uuid AND version_id=ANY($2::uuid[])', [SYNTHETIC_DEMO_TENANT_ID, versionIds])),
    listings: listings.rowCount,
    batches: batches.rowCount,
    decisions: count(await client.query('SELECT count(*) FROM catalog_update_row_decisions WHERE tenant_id=$1::uuid AND batch_id=ANY($2::uuid[])', [SYNTHETIC_DEMO_TENANT_ID, batchIds])),
    resolutions: count(await client.query('SELECT count(*) FROM catalog_supplier_listing_resolutions WHERE tenant_id=$1::uuid AND source_id=$2::uuid', [SYNTHETIC_DEMO_TENANT_ID, sourceId])),
    memory: count(await client.query('SELECT count(*) FROM catalog_supplier_reconciliation_memory WHERE tenant_id=$1::uuid AND source_id=$2::uuid', [SYNTHETIC_DEMO_TENANT_ID, sourceId])),
    retirementPlans: count(await client.query('SELECT count(*) FROM catalog_retirement_plans WHERE tenant_id=$1::uuid AND batch_id=ANY($2::uuid[])', [SYNTHETIC_DEMO_TENANT_ID, batchIds])),
    retirementEvents: count(await client.query('SELECT count(*) FROM catalog_retirement_events WHERE tenant_id=$1::uuid AND batch_id=ANY($2::uuid[])', [SYNTHETIC_DEMO_TENANT_ID, batchIds])),
    items: itemRows.rowCount,
    identifiers: count(await client.query('SELECT count(*) FROM catalog_item_identifiers WHERE tenant_id=$1::uuid AND item_id=ANY($2::uuid[])', [SYNTHETIC_DEMO_TENANT_ID, itemIds])),
    priceRevisions: count(await client.query('SELECT count(*) FROM catalog_base_price_revisions WHERE tenant_id=$1::uuid AND item_id=ANY($2::uuid[])', [SYNTHETIC_DEMO_TENANT_ID, itemIds])),
    costRevisions: count(await client.query('SELECT count(*) FROM catalog_reference_cost_revisions WHERE tenant_id=$1::uuid AND item_id=ANY($2::uuid[])', [SYNTHETIC_DEMO_TENANT_ID, itemIds])),
    branchPriceRevisions: count(await client.query('SELECT count(*) FROM catalog_branch_price_revisions WHERE tenant_id=$1::uuid AND item_id=ANY($2::uuid[])', [SYNTHETIC_DEMO_TENANT_ID, itemIds])),
    auditEvents: count(await client.query('SELECT count(*) FROM catalog_audit_events WHERE tenant_id=$1::uuid AND resource_id=ANY($2::uuid[])', [SYNTHETIC_DEMO_TENANT_ID, itemIds])),
  };
  assertExpectedCounts(counts);

  const externalReferences = await client.query(
    `WITH other_sources AS (
       SELECT r.item_id FROM catalog_supplier_listing_resolutions r WHERE r.tenant_id=$1::uuid AND r.source_id<>$2::uuid AND r.item_id=ANY($3::uuid[])
       UNION SELECT m.item_id FROM catalog_supplier_reconciliation_memory m WHERE m.tenant_id=$1::uuid AND m.source_id<>$2::uuid AND m.item_id=ANY($3::uuid[])
       UNION SELECT d.target_item_id FROM catalog_update_row_decisions d
         JOIN catalog_update_batches b ON b.tenant_id=d.tenant_id AND b.batch_id=d.batch_id
         JOIN catalog_supplier_catalog_versions v ON v.tenant_id=b.tenant_id AND v.version_id=b.version_id
        WHERE d.tenant_id=$1::uuid AND v.source_id<>$2::uuid AND d.target_item_id=ANY($3::uuid[])
     ) SELECT count(*) FROM other_sources`,
    [SYNTHETIC_DEMO_TENANT_ID, sourceId, itemIds],
  );
  assert.equal(count(externalReferences), 0, 'Another SupplierSource references a Demo CatalogItem.');
  assert.equal(count(await client.query('SELECT count(*) FROM catalog_commands WHERE tenant_id=$1::uuid AND result_item_id=ANY($2::uuid[])', [SYNTHETIC_DEMO_TENANT_ID, itemIds])), 0, 'Catalog command history references a Demo CatalogItem.');

  const auditActions = await client.query(
    `SELECT action,count(*)::int AS count FROM catalog_audit_events
      WHERE tenant_id=$1::uuid AND resource_id=ANY($2::uuid[]) GROUP BY action ORDER BY action`,
    [SYNTHETIC_DEMO_TENANT_ID, itemIds],
  );
  assert.deepEqual(auditActions.rows, [
    { action: 'catalog.batch.created_items.retire', count: 1_500 },
    { action: 'catalog.bulk.publish.row', count: 1_500 },
  ]);

  const retirement = await client.query(
    `SELECT p.scope,p.status,p.active_count,p.already_inactive_count,p.retired_count,
            e.result,e.planned_count,e.retired_count AS event_retired_count
       FROM catalog_retirement_plans p JOIN catalog_retirement_events e ON e.tenant_id=p.tenant_id AND e.plan_id=p.plan_id
      WHERE p.tenant_id=$1::uuid AND p.batch_id=ANY($2::uuid[])`,
    [SYNTHETIC_DEMO_TENANT_ID, batchIds],
  );
  assert.equal(retirement.rowCount, 1);
  assert.deepEqual(retirement.rows[0], {
    scope: 'BATCH_CREATED', status: 'EXECUTED', active_count: 1_500,
    already_inactive_count: 0, retired_count: 1_500, result: 'SUCCEEDED',
    planned_count: 1_500, event_retired_count: 1_500,
  });

  const externalItemForeignKeys = await client.query(
    `SELECT conrelid::regclass::text AS child_table FROM pg_constraint
      WHERE contype='f' AND confrelid='catalog_items'::regclass
        AND conrelid::regclass::text NOT IN (
          'catalog_item_identifiers','catalog_base_price_revisions','catalog_branch_price_revisions',
          'catalog_reference_cost_revisions','catalog_update_row_decisions',
          'catalog_supplier_listing_resolutions','catalog_supplier_reconciliation_memory'
        )`,
  );
  assert.equal(externalItemForeignKeys.rowCount, 0, 'An unknown table now references CatalogItem.');

  const totals = await client.query(
    `SELECT
       (SELECT count(*)::int FROM catalog_items WHERE tenant_id=$1::uuid) AS catalog_items,
       (SELECT count(*)::int FROM catalog_supplier_sources WHERE tenant_id=$1::uuid) AS supplier_sources,
       (SELECT count(*)::int FROM catalog_supplier_catalog_versions WHERE tenant_id=$1::uuid) AS supplier_versions`,
    [SYNTHETIC_DEMO_TENANT_ID],
  );
  assert.deepEqual(totals.rows[0], { catalog_items: 1_539, supplier_sources: 2, supplier_versions: 11 });

  return Object.freeze({ counts, itemIds, versionIds, batchIds, totals: totals.rows[0] });
}

async function deleteExactly(client, sql, parameters, expected, label) {
  const result = await client.query(sql, parameters);
  assert.equal(result.rowCount, expected, `${label} delete count drifted; transaction will roll back.`);
  return result.rowCount;
}

async function cleanup(client, snapshot) {
  const tenant = SYNTHETIC_DEMO_TENANT_ID;
  const items = snapshot.itemIds;
  const versions = snapshot.versionIds;
  const batches = snapshot.batchIds;
  const deleted = {};
  deleted.retirementEvents = await deleteExactly(client, 'DELETE FROM catalog_retirement_events WHERE tenant_id=$1::uuid AND batch_id=ANY($2::uuid[])', [tenant, batches], 1, 'RetirementEvent');
  deleted.retirementPlans = await deleteExactly(client, 'DELETE FROM catalog_retirement_plans WHERE tenant_id=$1::uuid AND batch_id=ANY($2::uuid[])', [tenant, batches], 1, 'RetirementPlan');
  deleted.memory = await deleteExactly(client, 'DELETE FROM catalog_supplier_reconciliation_memory WHERE tenant_id=$1::uuid AND source_id=$2::uuid', [tenant, sourceId], 1_800, 'ReconciliationMemory');
  deleted.resolutions = await deleteExactly(client, 'DELETE FROM catalog_supplier_listing_resolutions WHERE tenant_id=$1::uuid AND source_id=$2::uuid', [tenant, sourceId], 1_800, 'Resolution');
  deleted.decisions = await deleteExactly(client, 'DELETE FROM catalog_update_row_decisions WHERE tenant_id=$1::uuid AND batch_id=ANY($2::uuid[])', [tenant, batches], 4_500, 'RowDecision');
  deleted.auditEvents = await deleteExactly(client, 'DELETE FROM catalog_audit_events WHERE tenant_id=$1::uuid AND resource_id=ANY($2::uuid[])', [tenant, items], 3_000, 'CatalogAuditEvent');
  deleted.branchPrices = await deleteExactly(client, 'DELETE FROM catalog_branch_price_revisions WHERE tenant_id=$1::uuid AND item_id=ANY($2::uuid[])', [tenant, items], 0, 'BranchPriceRevision');
  deleted.prices = await deleteExactly(client, 'DELETE FROM catalog_base_price_revisions WHERE tenant_id=$1::uuid AND item_id=ANY($2::uuid[])', [tenant, items], 1_500, 'PriceRevision');
  deleted.costs = await deleteExactly(client, 'DELETE FROM catalog_reference_cost_revisions WHERE tenant_id=$1::uuid AND item_id=ANY($2::uuid[])', [tenant, items], 1_364, 'CostRevision');
  deleted.identifiers = await deleteExactly(client, 'DELETE FROM catalog_item_identifiers WHERE tenant_id=$1::uuid AND item_id=ANY($2::uuid[])', [tenant, items], 3_000, 'ItemIdentifier');
  deleted.items = await deleteExactly(client, 'DELETE FROM catalog_items WHERE tenant_id=$1::uuid AND item_id=ANY($2::uuid[])', [tenant, items], 1_500, 'CatalogItem');
  deleted.listings = await deleteExactly(client, 'DELETE FROM catalog_supplier_listings WHERE tenant_id=$1::uuid AND version_id=ANY($2::uuid[])', [tenant, versions], 4_500, 'SupplierListing');
  deleted.batches = await deleteExactly(client, 'DELETE FROM catalog_update_batches WHERE tenant_id=$1::uuid AND batch_id=ANY($2::uuid[])', [tenant, batches], 3, 'UpdateBatch');
  deleted.rawPayloads = await deleteExactly(client, 'DELETE FROM catalog_supplier_version_raw_payloads WHERE tenant_id=$1::uuid AND version_id=ANY($2::uuid[])', [tenant, versions], 3, 'SupplierRawPayload');
  deleted.versions = await deleteExactly(client, 'DELETE FROM catalog_supplier_catalog_versions WHERE tenant_id=$1::uuid AND source_id=$2::uuid', [tenant, sourceId], 3, 'SupplierCatalogVersion');
  deleted.sources = await deleteExactly(client, 'DELETE FROM catalog_supplier_sources WHERE tenant_id=$1::uuid AND source_id=$2::uuid AND display_name=$3', [tenant, sourceId, expectedName], 1, 'SupplierSource');
  await client.query('SET CONSTRAINTS ALL IMMEDIATE');
  return Object.freeze(deleted);
}

async function postCleanup(client, snapshot) {
  const result = await client.query(
    `SELECT
       (SELECT count(*)::int FROM catalog_supplier_sources WHERE tenant_id=$1::uuid AND source_id=$2::uuid) AS demo_sources,
       (SELECT count(*)::int FROM catalog_supplier_catalog_versions WHERE tenant_id=$1::uuid AND source_id=$2::uuid) AS demo_versions,
       (SELECT count(*)::int FROM catalog_items WHERE tenant_id=$1::uuid AND item_id=ANY($3::uuid[])) AS demo_items,
       (SELECT count(*)::int FROM catalog_items WHERE tenant_id=$1::uuid) AS catalog_items,
       (SELECT count(*)::int FROM catalog_supplier_sources WHERE tenant_id=$1::uuid AND normalized_name='ag') AS ag_sources,
       (SELECT count(*)::int FROM catalog_supplier_catalog_versions v JOIN catalog_supplier_sources s ON s.tenant_id=v.tenant_id AND s.source_id=v.source_id WHERE s.tenant_id=$1::uuid AND s.normalized_name='ag') AS ag_versions`,
    [SYNTHETIC_DEMO_TENANT_ID, sourceId, snapshot.itemIds],
  );
  assert.deepEqual(result.rows[0], { demo_sources: 0, demo_versions: 0, demo_items: 0, catalog_items: 39, ag_sources: 1, ag_versions: 8 });
  return result.rows[0];
}

const values = await ensureLocalEnvironment({ create: false });
await assertGovernedLocalContainer(values);
const pool = poolFor(values);
const client = await pool.connect();
try {
  if (!execute) {
    const snapshot = await audit(client);
    process.stdout.write(`${JSON.stringify({ event: 'local_synthetic_supplier_cleanup_audit', execute: false, sourceId, sourceName: expectedName, counts: snapshot.counts, totals: snapshot.totals })}\n`);
  } else {
    await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
    await assertProductTriggersEnabled(client);
    const snapshot = await audit(client, { lock: true });
    process.stdout.write(`${JSON.stringify({ event: 'local_synthetic_supplier_cleanup_audit', execute: true, sourceId, sourceName: expectedName, counts: snapshot.counts, totals: snapshot.totals })}\n`);
    await setLocalCleanupTriggerMode(client, false);
    const deleted = await cleanup(client, snapshot);
    await setLocalCleanupTriggerMode(client, true);
    await assertProductTriggersEnabled(client);
    const after = await postCleanup(client, snapshot);
    await client.query('COMMIT');
    process.stdout.write(`${JSON.stringify({ event: 'local_synthetic_supplier_cleanup_complete', environment: 'local', sourceId, sourceName: expectedName, deleted, after })}\n`);
  }
} catch (error) {
  if (execute) await client.query('ROLLBACK').catch(() => undefined);
  process.stderr.write(`${JSON.stringify({ event: 'local_synthetic_supplier_cleanup_refused', environment: 'local', error: error instanceof Error ? error.message : 'unexpected failure' })}\n`);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
