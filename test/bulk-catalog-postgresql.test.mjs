import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import test from 'node:test';

import { Pool } from 'pg';

const enabled = process.env.SR_PBI041_PG_TEST === '1';
const { createDatabaseConnection } = enabled ? await import('../dist/infrastructure/database/database-connection.js') : {};
const { KyselyBulkCatalogRepository } = enabled ? await import('../dist/modules/catalog/infrastructure/persistence/kysely-bulk-catalog.repository.js') : {};
const { BulkCatalogService } = enabled ? await import('../dist/modules/catalog/application/bulk-catalog.service.js') : {};
const { CatalogConflictError } = enabled ? await import('../dist/modules/catalog/domain/catalog-item.js') : {};

const tenantA = 'a1410000-0000-4000-8000-000000000041';
const tenantB = 'b1410000-0000-4000-8000-000000000041';
const branchA = 'a2410000-0000-4000-8000-000000000041';
const branchB = 'b2410000-0000-4000-8000-000000000041';
const tenantC = 'c1410000-0000-4000-8000-000000000041';
const branchC = 'c2410000-0000-4000-8000-000000000041';

function config() {
  return Object.freeze({
    identity: Object.freeze({ host: process.env.SR_PBI041_PG_HOST, port: Number(process.env.SR_PBI041_PG_PORT), database: process.env.SR_PBI041_PG_NAME, user: process.env.SR_PBI041_PG_USER, password: process.env.SR_PBI041_PG_PASSWORD }),
    transport: Object.freeze({ sslMode: 'disable' }),
    pool: Object.freeze({ min: 0, max: 8, idleTimeoutMs: 1_000, connectionTimeoutMs: 2_000, statementTimeoutMs: 30_000, queryTimeoutMs: 30_000 }),
    runtime: Object.freeze({ environment: 'development', role: 'migration', accessMode: 'read-write', migrationsEnabled: true, testRunId: null }),
    observability: Object.freeze({ applicationName: 'srtaller-pbi041-bulk-catalog-postgresql', labels: Object.freeze({ component: 'catalog', environment: 'development', role: 'application' }) }),
  });
}

function context(tenantId, branchId) {
  return Object.freeze({
    tenantId, branchId, stationId: randomUUID(), sessionId: randomUUID(), actorUserId: randomUUID(), actorDisplayName: 'Owner QA', capability: 'catalog.import.publish',
    commitGuards: Object.freeze([Object.freeze({ async confirmCurrent() { return true; }, async confirmTemporalCurrent() { return true; } })]),
  });
}

function fullRow(index, price = 100_00 + index) {
  return { kind: index % 4 === 0 ? 'SUPPLY' : index % 3 === 0 ? 'SERVICE' : index % 2 === 0 ? 'PRODUCT' : 'PART', title: `Artículo proveedor ${index}`, description: null, category: `Categoría ${index % 5}`, brand: index % 3 === 0 ? null : `Marca ${index % 4}`, supplierItemCode: `SUP-${String(index).padStart(5, '0')}`, sku: null, barcode: null, basePriceMinor: price, referenceCostMinor: index % 2 === 0 ? 50_00 + index : null };
}

test('PBI-041 persists immutable supplier versions and publishes one tenant-wide atomic batch', { skip: !enabled, timeout: 90_000 }, async () => {
  assert.equal(process.version, 'v24.18.0');
  const admin = new Pool({ host: process.env.SR_PBI041_PG_HOST, port: Number(process.env.SR_PBI041_PG_PORT), database: process.env.SR_PBI041_PG_NAME, user: process.env.SR_PBI041_PG_USER, password: process.env.SR_PBI041_PG_PASSWORD, max: 2 });
  const connection = createDatabaseConnection(config());
  const repository = new KyselyBulkCatalogRepository(connection);
  const service = new BulkCatalogService(repository, async (tenantId) => tenantId === tenantA || tenantId === tenantC ? 'MXN' : tenantId === tenantB ? 'USD' : null);
  const ctxA = context(tenantA, branchA); const ctxB = context(tenantB, branchB); const ctxC = context(tenantC, branchC);
  try {
    await admin.query(`insert into tenants (tenant_id, operating_currency, created_at) values ($1, 'MXN', now()), ($2, 'USD', now()), ($3, 'MXN', now())`, [tenantA, tenantB, tenantC]);
    await admin.query(`insert into branches (tenant_id, branch_id, time_zone, active, created_at) values ($1, $2, 'America/Hermosillo', true, now()), ($3, $4, 'America/Phoenix', true, now()), ($5, $6, 'America/Hermosillo', true, now())`, [tenantA, branchA, tenantB, branchB, tenantC, branchC]);

    const source = await service.createSource(ctxA, { name: 'Proveedor PostgreSQL' });
    const rows = [fullRow(1), fullRow(2), fullRow(3), fullRow(5)];
    const draft = await service.createDraft(ctxA, { sourceId: source.sourceId, sourceRevision: 'V1', mode: 'FULL', columnSignature: 'a'.repeat(64), rawPayload: 'synthetic-v1', rows });
    assert.equal(draft.rows.every((row) => row.proposal.referenceCostMinor === null), true);
    const costVisibleDraft = await service.getVersion({ tenantId: tenantA, branchId: branchA }, draft.versionId, true);
    assert.equal(costVisibleDraft.rows.some((row) => row.proposal.referenceCostMinor !== null), true);
    assert.equal(draft.lifecycle, 'DRAFT');
    assert.equal((await service.getVersion({ tenantId: tenantB, branchId: branchB }, draft.versionId, true).catch(() => null)), null);

    const analyzed = await service.analyze(ctxA, draft.versionId, { expectedVersion: draft.version });
    assert.equal(analyzed.rows.every((row) => row.proposal.referenceCostMinor === null), true);
    assert.equal(analyzed.lifecycle, 'INGESTED');
    assert.equal(analyzed.batch.counts.PENDING_REFERENCE, 4);
    assert.equal(analyzed.batch.lifecycle, 'RECONCILING');
    await assert.rejects(admin.query(`update catalog_supplier_listings set supplier_title = 'Mutación' where tenant_id = $1 and version_id = $2`, [tenantA, draft.versionId]));
    await assert.rejects(admin.query(`delete from catalog_supplier_catalog_versions where tenant_id = $1 and version_id = $2`, [tenantA, draft.versionId]));

    const ready = await service.decideMany(ctxA, draft.versionId, { expectedBatchVersion: analyzed.batch.version, classifications: ['PENDING_REFERENCE'], decision: 'APPLY' });
    assert.equal(ready.batch.lifecycle, 'READY');
    const clientRequestId = randomUUID();
    const applied = await service.publish(ctxA, draft.versionId, { expectedVersion: ready.version, clientRequestId }, true);
    assert.equal(applied.batch.lifecycle, 'APPLIED');
    const retry = await service.publish(ctxA, draft.versionId, { expectedVersion: ready.version, clientRequestId }, true);
    assert.equal(retry.batch.publishedAt, applied.batch.publishedAt);
    await assert.rejects(service.publish(ctxA, draft.versionId, { expectedVersion: ready.version + 1, clientRequestId }, true), CatalogConflictError);

    const state = await admin.query(`select
      (select count(*)::int from catalog_items where tenant_id = $1) as items,
      (select count(*)::int from catalog_item_identifiers where tenant_id = $1) as identifiers,
      (select count(*)::int from catalog_supplier_listing_resolutions where tenant_id = $1) as resolutions,
      (select count(*)::int from catalog_branch_price_revisions where tenant_id = $1) as overrides`, [tenantA]);
    assert.deepEqual(state.rows[0], { items: 4, identifiers: 8, resolutions: 4, overrides: 0 });
    const redacted = await service.getVersion({ tenantId: tenantA, branchId: branchA }, draft.versionId, false);
    assert.equal(redacted.rows.every((row) => row.proposal.referenceCostMinor === null), true);

    const v2 = await service.createDraft(ctxA, { sourceId: source.sourceId, sourceRevision: 'V2', mode: 'FULL', columnSignature: 'a'.repeat(64), rawPayload: 'synthetic-v2', rows: rows.map((row, index) => ({ ...row, basePriceMinor: index === 0 ? row.basePriceMinor + 100 : row.basePriceMinor })) });
    assert.equal(v2.supersedesVersionId, draft.versionId);
    const v2Analyzed = await service.analyze(ctxA, v2.versionId, { expectedVersion: v2.version });
    assert.equal(v2Analyzed.batch.counts.UPDATE, 1);
    assert.equal(v2Analyzed.batch.counts.UNCHANGED, 3);
    assert.equal(v2Analyzed.rows.every((row) => row.preselectedByMemory && row.decision === 'UNRESOLVED'), true);
    const comparison = await service.compare({ tenantId: tenantA, branchId: branchA }, draft.versionId, v2.versionId);
    assert.deepEqual({ mapped: comparison.mapped, changed: comparison.changed, added: comparison.added, disappeared: comparison.disappeared, ambiguous: comparison.ambiguous }, { mapped: 4, changed: 1, added: 0, disappeared: 0, ambiguous: 0 });

    const v2Ready = await service.decideMany(ctxA, v2.versionId, { expectedBatchVersion: v2Analyzed.batch.version, classifications: ['UPDATE', 'UNCHANGED'], decision: 'APPLY' });
    await service.publish(ctxA, v2.versionId, { expectedVersion: v2Ready.version, clientRequestId: randomUUID() }, true);
    const alternatePart = await admin.query(`select item_id from catalog_supplier_reconciliation_memory where tenant_id = $1 and source_id = $2 and identifier_scheme = 'SUPPLIER_CODE' and normalized_identifier = 'sup-00005'`, [tenantA, source.sourceId]);
    const correction = await service.createDraft(ctxA, { sourceId: source.sourceId, sourceRevision: 'V3 correction', mode: 'FULL', columnSignature: 'a'.repeat(64), rawPayload: 'synthetic-correction', rows: [rows[0]] });
    assert.equal(correction.supersedesVersionId, v2.versionId);
    const correctionAnalyzed = await service.analyze(ctxA, correction.versionId, { expectedVersion: correction.version });
    const corrected = await service.decide(ctxA, correction.versionId, correctionAnalyzed.rows[0].rowDecisionId, { expectedRowVersion: correctionAnalyzed.rows[0].version, decision: 'APPLY', targetItemId: alternatePart.rows[0].item_id });
    await service.publish(ctxA, correction.versionId, { expectedVersion: corrected.version, clientRequestId: randomUUID() }, true);
    const memoryAfterCorrection = await admin.query(`select consistency_state, correction_count from catalog_supplier_reconciliation_memory where tenant_id = $1 and source_id = $2 and identifier_scheme = 'SUPPLIER_CODE' and normalized_identifier = 'sup-00001'`, [tenantA, source.sourceId]);
    assert.deepEqual(memoryAfterCorrection.rows[0], { consistency_state: 'CONFLICTED', correction_count: 1 });
    const inconsistent = await service.createDraft(ctxA, { sourceId: source.sourceId, sourceRevision: 'V4 inconsistent history', mode: 'FULL', columnSignature: 'a'.repeat(64), rawPayload: 'synthetic-inconsistent', rows: [rows[0]] });
    const inconsistentAnalyzed = await service.analyze(ctxA, inconsistent.versionId, { expectedVersion: inconsistent.version });
    assert.equal(inconsistentAnalyzed.batch.counts.AMBIGUOUS, 1);
    assert.equal(inconsistentAnalyzed.rows[0].errors.includes('AMBIGUOUS_HISTORY'), true);
    assert.equal(inconsistentAnalyzed.rows[0].preselectedByMemory, false);

    await admin.query(`update catalog_supplier_version_raw_payloads set retained_until = now() - interval '1 day' where tenant_id = $1`, [tenantA]);
    assert.equal(await service.purgeExpiredRaw(ctxA), 4);
    const raw = await admin.query(`select count(*) filter (where payload_text is not null)::int as retained from catalog_supplier_version_raw_payloads where tenant_id = $1`, [tenantA]);
    assert.equal(raw.rows[0].retained, 0);
    assert.deepEqual(await service.listSources({ tenantId: tenantB, branchId: branchB }), []);
    assert.equal(await admin.query(`select count(*)::int as count from catalog_items where tenant_id = $1`, [tenantB]).then((result) => result.rows[0].count), 0);

    const benchmarkRows = Array.from({ length: 10_000 }, (_, index) => ({ kind: 'PART', title: `Benchmark ${index + 1}`, description: null, category: 'Benchmark', brand: null, supplierItemCode: `BENCH-${String(index + 1).padStart(5, '0')}`, sku: null, barcode: null, basePriceMinor: 100_00 + index, referenceCostMinor: null }));
    const benchmarkSource = await service.createSource(ctxC, { name: 'Proveedor Benchmark' });
    const heapBefore = process.memoryUsage().heapUsed; let started = performance.now();
    const benchmarkDraft = await service.createDraft(ctxC, { sourceId: benchmarkSource.sourceId, sourceRevision: '10K', mode: 'FULL', columnSignature: 'b'.repeat(64), rawPayload: 'synthetic-10k', rows: benchmarkRows });
    const ingestMs = performance.now() - started; started = performance.now();
    const benchmarkAnalyzed = await service.analyze(ctxC, benchmarkDraft.versionId, { expectedVersion: benchmarkDraft.version });
    const analyzeMs = performance.now() - started; assert.equal(benchmarkAnalyzed.batch.counts.PENDING_REFERENCE, 10_000); assert.ok(analyzeMs <= 30_000, `10k analysis exceeded budget: ${analyzeMs}ms`);
    const benchmarkReady = await service.decideMany(ctxC, benchmarkDraft.versionId, { expectedBatchVersion: benchmarkAnalyzed.batch.version, classifications: ['PENDING_REFERENCE'], decision: 'APPLY' });
    started = performance.now(); const benchmarkApplied = await service.publish(ctxC, benchmarkDraft.versionId, { expectedVersion: benchmarkReady.version, clientRequestId: randomUUID() }, false); const publishMs = performance.now() - started;
    assert.equal(benchmarkApplied.batch.lifecycle, 'APPLIED'); assert.ok(publishMs <= 30_000, `10k publish exceeded HTTP budget: ${publishMs}ms`);
    started = performance.now(); const preview = await service.getVersion({ tenantId: tenantC, branchId: branchC }, benchmarkDraft.versionId, false); const previewMs = performance.now() - started;
    assert.equal(preview.rows.length, 10_000); assert.ok(previewMs <= 2_000, `10k preview read exceeded budget: ${previewMs}ms`);
    const heapDeltaMiB = Math.max(0, process.memoryUsage().heapUsed - heapBefore) / 1024 / 1024; assert.ok(heapDeltaMiB <= 250, `10k heap delta exceeded budget: ${heapDeltaMiB}MiB`);
    process.stdout.write(`PBI-041 10k benchmark: ingest=${ingestMs.toFixed(1)}ms analyze=${analyzeMs.toFixed(1)}ms preview=${previewMs.toFixed(1)}ms publish=${publishMs.toFixed(1)}ms heapDelta=${heapDeltaMiB.toFixed(1)}MiB\n`);
  } finally {
    await connection.close().catch(() => undefined);
    await admin.end().catch(() => undefined);
  }
});
