import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import test from 'node:test';

import { Pool } from 'pg';

const enabled = process.env.SR_PBI041_PG_TEST === '1';
const { createDatabaseConnection } = enabled ? await import('../dist/infrastructure/database/database-connection.js') : {};
const { KyselyBulkCatalogRepository } = enabled ? await import('../dist/modules/catalog/infrastructure/persistence/kysely-bulk-catalog.repository.js') : {};
const { KyselyCatalogRetirementRepository } = enabled ? await import('../dist/modules/catalog/infrastructure/persistence/kysely-catalog-retirement.repository.js') : {};
const { BulkCatalogService } = enabled ? await import('../dist/modules/catalog/application/bulk-catalog.service.js') : {};
const { CatalogRetirementService } = enabled ? await import('../dist/modules/catalog/application/catalog-retirement.service.js') : {};
const { CatalogConflictError, CatalogNotFoundError, CatalogSupplierDeleteNotAllowedError } = enabled ? await import('../dist/modules/catalog/domain/catalog-item.js') : {};

const tenantA = 'a1410000-0000-4000-8000-000000000041';
const tenantB = 'b1410000-0000-4000-8000-000000000041';
const branchA = 'a2410000-0000-4000-8000-000000000041';
const branchB = 'b2410000-0000-4000-8000-000000000041';
const tenantC = 'c1410000-0000-4000-8000-000000000041';
const branchC = 'c2410000-0000-4000-8000-000000000041';
const virginCategoryId = 'b3410000-0000-4000-8000-000000000041';
const virginBrandId = 'b4410000-0000-4000-8000-000000000041';

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
  const concurrentConnection = createDatabaseConnection(config());
  const repository = new KyselyBulkCatalogRepository(connection);
  const service = new BulkCatalogService(repository, async (tenantId) => tenantId === tenantA || tenantId === tenantC ? 'MXN' : tenantId === tenantB ? 'USD' : null);
  const concurrentService = new BulkCatalogService(new KyselyBulkCatalogRepository(concurrentConnection), async (tenantId) => tenantId === tenantA || tenantId === tenantC ? 'MXN' : tenantId === tenantB ? 'USD' : null);
  const retirement = new CatalogRetirementService(new KyselyCatalogRetirementRepository(connection));
  const ctxA = context(tenantA, branchA); const ctxB = context(tenantB, branchB); const ctxC = context(tenantC, branchC);
  try {
    await admin.query(`insert into tenants (tenant_id, operating_currency, created_at) values ($1, 'MXN', now()), ($2, 'USD', now()), ($3, 'MXN', now())`, [tenantA, tenantB, tenantC]);
    await admin.query(`insert into branches (tenant_id, branch_id, time_zone, active, created_at) values ($1, $2, 'America/Hermosillo', true, now()), ($3, $4, 'America/Phoenix', true, now()), ($5, $6, 'America/Hermosillo', true, now())`, [tenantA, branchA, tenantB, branchB, tenantC, branchC]);
    await admin.query(`insert into catalog_categories (tenant_id, category_id, kind, display_name, normalized_name, status, version, created_at, updated_at)
      values ($1, $2, 'PART', 'Pantallas', 'pantallas', 'ACTIVE', 1, now(), now())`, [tenantB, virginCategoryId]);
    await admin.query(`insert into catalog_brands (tenant_id, brand_id, display_name, normalized_name, status, version, created_at, updated_at)
      values ($1, $2, 'Apple', 'apple', 'ACTIVE', 1, now(), now())`, [tenantB, virginBrandId]);
    await admin.query(`insert into catalog_category_kind_applicability (tenant_id, category_id, kind) values ($1, $2, 'PART')`, [tenantB, virginCategoryId]);
    await admin.query(`insert into catalog_brand_kind_applicability (tenant_id, brand_id, kind) values ($1, $2, 'PART')`, [tenantB, virginBrandId]);

    const source = await service.createSource(ctxA, { name: 'Proveedor PostgreSQL' });
    const rows = [{ ...fullRow(1), supplierObservedTitle: 'PANTALLA IPHONE 11 OLED GX >>I', title: 'Pantalla iPhone 11 OLED GX >>I' }, fullRow(2), fullRow(3), fullRow(5)];
    const createV1Request = randomUUID();
    const v1Input = { sourceId: source.sourceId, description: 'Primera lista', clientRequestId: createV1Request, mode: 'FULL', columnSignature: 'a'.repeat(64), rawPayload: 'synthetic-v1', rows };
    const draft = await service.createDraft(ctxA, v1Input);
    const replay = await service.createDraft(ctxA, v1Input);
    assert.equal(replay.versionId, draft.versionId);
    await assert.rejects(service.createDraft(ctxA, { ...v1Input, rawPayload: 'synthetic-conflicting-retry' }), CatalogConflictError);
    assert.deepEqual([draft.sequenceNumber, draft.sourceRevision, draft.description], [1, 'v1', 'Primera lista']);

    const sequencingSource = await service.createSource(ctxA, { name: 'Proveedor Secuencial' });
    const [concurrentLeft, concurrentRight] = await Promise.all([
      service.createDraft(ctxA, { sourceId: sequencingSource.sourceId, description: 'Misma fecha A', clientRequestId: randomUUID(), mode: 'FULL', columnSignature: 'd'.repeat(64), rawPayload: 'concurrent-a', rows: [fullRow(801)] }),
      concurrentService.createDraft(ctxA, { sourceId: sequencingSource.sourceId, description: 'Misma fecha B', clientRequestId: randomUUID(), mode: 'FULL', columnSignature: 'd'.repeat(64), rawPayload: 'concurrent-b', rows: [fullRow(802)] }),
    ]);
    assert.deepEqual([concurrentLeft.sequenceNumber, concurrentRight.sequenceNumber].sort((left, right) => left - right), [1, 2]);
    assert.equal(new Set([concurrentLeft.sourceRevision, concurrentRight.sourceRevision]).size, 2);

    const safeSource = await service.createSource(ctxA, { name: 'Proveedor Borrador Eliminable' });
    const safeDraft = await service.createDraft(ctxA, { sourceId: safeSource.sourceId, description: 'Sólo borrador sintético', clientRequestId: randomUUID(), mode: 'FULL', columnSignature: 'e'.repeat(64), rawPayload: 'safe-draft', rows: [fullRow(901)] });
    const safeSnapshot = (await service.listSources({ tenantId: tenantA, branchId: branchA })).find(({ sourceId }) => sourceId === safeSource.sourceId);
    assert.equal(safeSnapshot?.deletionEligibility.allowed, true);
    await assert.rejects(service.deleteSource(ctxB, safeSource.sourceId, { expectedVersion: safeSnapshot.version, confirmation: 'DELETE_SUPPLIER_SOURCE', clientRequestId: randomUUID() }, new Date().toISOString()), CatalogNotFoundError);
    const catalogItemsBeforeDelete = Number((await admin.query(`select count(*)::int as count from catalog_items where tenant_id = $1`, [tenantA])).rows[0].count);
    const deleteRequestId = randomUUID();
    const deletionInput = { expectedVersion: safeSnapshot.version, confirmation: 'DELETE_SUPPLIER_SOURCE', clientRequestId: deleteRequestId };
    const deleted = await service.deleteSource(ctxA, safeSource.sourceId, deletionInput, new Date().toISOString());
    assert.deepEqual([deleted.deletedVersionCount, deleted.deletedListingCount], [1, 1]);
    assert.equal((await service.getVersion({ tenantId: tenantA, branchId: branchA }, safeDraft.versionId, false).catch(() => null)), null);
    assert.equal((await service.deleteSource(ctxA, safeSource.sourceId, deletionInput, new Date().toISOString())).deletedAt, deleted.deletedAt);
    assert.equal(Number((await admin.query(`select count(*)::int as count from catalog_items where tenant_id = $1`, [tenantA])).rows[0].count), catalogItemsBeforeDelete);
    assert.equal(Number((await admin.query(`select count(*)::int as count from catalog_supplier_source_deletion_events where tenant_id = $1 and source_id = $2`, [tenantA, safeSource.sourceId])).rows[0].count), 1);
    assert.equal(draft.rows.every((row) => row.proposal.referenceCostMinor === null), true);
    const costVisibleDraft = await service.getVersion({ tenantId: tenantA, branchId: branchA }, draft.versionId, true);
    assert.equal(costVisibleDraft.rows.some((row) => row.proposal.referenceCostMinor !== null), true);
    assert.equal(costVisibleDraft.rows[0].supplierObservedTitle, 'PANTALLA IPHONE 11 OLED GX >>I');
    assert.equal(costVisibleDraft.rows[0].proposal.title, 'Pantalla iPhone 11 OLED GX >>I');
    const observedTitle = await admin.query(`select supplier_title, source_observation->>'title' as observed_title from catalog_supplier_listings where tenant_id = $1 and version_id = $2 and row_number = 1`, [tenantA, draft.versionId]);
    assert.deepEqual(observedTitle.rows[0], { supplier_title: 'PANTALLA IPHONE 11 OLED GX >>I', observed_title: 'PANTALLA IPHONE 11 OLED GX >>I' });
    assert.equal(draft.lifecycle, 'DRAFT');
    assert.equal((await service.getVersion({ tenantId: tenantB, branchId: branchB }, draft.versionId, true).catch(() => null)), null);

    const analyzed = await service.analyze(ctxA, draft.versionId, { expectedVersion: draft.version });
    assert.equal(analyzed.rows.every((row) => row.proposal.referenceCostMinor === null), true);
    assert.equal(analyzed.lifecycle, 'INGESTED');
    assert.equal(analyzed.batch.counts.PENDING_REFERENCE, 4);
    assert.equal(analyzed.batch.lifecycle, 'RECONCILING');
    const publishedSourceSnapshot = (await service.listSources({ tenantId: tenantA, branchId: branchA })).find(({ sourceId }) => sourceId === source.sourceId);
    assert.equal(publishedSourceSnapshot?.deletionEligibility.reason, 'PUBLISHED_HISTORY');
    await assert.rejects(service.deleteSource(ctxA, source.sourceId, { expectedVersion: publishedSourceSnapshot.version, confirmation: 'DELETE_SUPPLIER_SOURCE', clientRequestId: randomUUID() }, new Date().toISOString()), CatalogSupplierDeleteNotAllowedError);
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

    const v2 = await service.createDraft(ctxA, { sourceId: source.sourceId, description: 'Segunda lista', clientRequestId: randomUUID(), mode: 'FULL', columnSignature: 'a'.repeat(64), rawPayload: 'synthetic-v2', rows: rows.map((row, index) => ({ ...row, basePriceMinor: index === 0 ? row.basePriceMinor + 100 : row.basePriceMinor })) });
    assert.equal(v2.supersedesVersionId, draft.versionId);
    const v2Analyzed = await service.analyze(ctxA, v2.versionId, { expectedVersion: v2.version });
    assert.equal(v2Analyzed.batch.counts.UPDATE, 1);
    assert.equal(v2Analyzed.batch.counts.UNCHANGED, 3);
    assert.equal(v2Analyzed.rows.every((row) => row.preselectedByMemory && row.matchOrigin === 'TRUSTED_HISTORY' && row.decision === 'APPLY'), true);
    assert.equal(v2Analyzed.batch.lifecycle, 'READY');
    const comparison = await service.compare({ tenantId: tenantA, branchId: branchA }, draft.versionId, v2.versionId);
    assert.deepEqual({ mapped: comparison.mapped, changed: comparison.changed, added: comparison.added, disappeared: comparison.disappeared, ambiguous: comparison.ambiguous }, { mapped: 4, changed: 1, added: 0, disappeared: 0, ambiguous: 0 });

    const v2Ready = v2Analyzed;
    await service.publish(ctxA, v2.versionId, { expectedVersion: v2Ready.version, clientRequestId: randomUUID() }, true);
    const alternatePart = await admin.query(`select item_id from catalog_supplier_reconciliation_memory where tenant_id = $1 and source_id = $2 and identifier_scheme = 'SUPPLIER_CODE' and normalized_identifier = 'sup-00005'`, [tenantA, source.sourceId]);
    const correction = await service.createDraft(ctxA, { sourceId: source.sourceId, description: 'Corrección', clientRequestId: randomUUID(), mode: 'FULL', columnSignature: 'a'.repeat(64), rawPayload: 'synthetic-correction', rows: [rows[0]] });
    assert.equal(correction.supersedesVersionId, v2.versionId);
    const correctionAnalyzed = await service.analyze(ctxA, correction.versionId, { expectedVersion: correction.version });
    const corrected = await service.decide(ctxA, correction.versionId, correctionAnalyzed.rows[0].rowDecisionId, { expectedRowVersion: correctionAnalyzed.rows[0].version, decision: 'APPLY', targetItemId: alternatePart.rows[0].item_id });
    await service.publish(ctxA, correction.versionId, { expectedVersion: corrected.version, clientRequestId: randomUUID() }, true);
    const memoryAfterCorrection = await admin.query(`select consistency_state, correction_count from catalog_supplier_reconciliation_memory where tenant_id = $1 and source_id = $2 and identifier_scheme = 'SUPPLIER_CODE' and normalized_identifier = 'sup-00001'`, [tenantA, source.sourceId]);
    assert.deepEqual(memoryAfterCorrection.rows[0], { consistency_state: 'CONFLICTED', correction_count: 1 });
    const inconsistent = await service.createDraft(ctxA, { sourceId: source.sourceId, description: 'Historia inconsistente', clientRequestId: randomUUID(), mode: 'FULL', columnSignature: 'a'.repeat(64), rawPayload: 'synthetic-inconsistent', rows: [rows[0]] });
    const inconsistentAnalyzed = await service.analyze(ctxA, inconsistent.versionId, { expectedVersion: inconsistent.version });
    assert.equal(inconsistentAnalyzed.batch.counts.AMBIGUOUS, 1);
    assert.equal(inconsistentAnalyzed.rows[0].errors.includes('AMBIGUOUS_HISTORY'), true);
    assert.equal(inconsistentAnalyzed.rows[0].preselectedByMemory, false);

    const historyBeforeRetirement = await admin.query(`select
      (select count(*)::int from catalog_supplier_listings where tenant_id = $1) as listings,
      (select count(*)::int from catalog_supplier_listing_resolutions where tenant_id = $1) as resolutions,
      (select count(*)::int from catalog_supplier_reconciliation_memory where tenant_id = $1) as mappings`, [tenantA]);
    const contextChangedPlan = await retirement.createPlan({ ...ctxA, capability: 'catalog.items.bulk_retire' }, { scope: 'ACTIVE_CATALOG' });
    await assert.rejects(
      retirement.executePlan({ ...ctxA, sessionId: randomUUID(), capability: 'catalog.items.bulk_retire' }, { planId: contextChangedPlan.planId, confirmation: 'RETIRE_ACTIVE_CATALOG', clientRequestId: randomUUID() }, new Date().toISOString()),
      CatalogConflictError,
    );
    const contextChangedEvidence = await admin.query(`select
      (select status from catalog_retirement_plans where tenant_id = $1 and plan_id = $2) as plan_status,
      (select rejection_reason from catalog_retirement_events where tenant_id = $1 and plan_id = $2 and result = 'REJECTED') as rejection_reason`, [tenantA, contextChangedPlan.planId]);
    assert.deepEqual(contextChangedEvidence.rows[0], { plan_status: 'STALE', rejection_reason: 'PLAN_CONTEXT_CHANGED' });
    const stalePlan = await retirement.createPlan({ ...ctxA, capability: 'catalog.items.bulk_retire' }, { scope: 'ACTIVE_CATALOG' });
    await assert.rejects(
      retirement.executePlan({ ...ctxB, capability: 'catalog.items.bulk_retire' }, { planId: stalePlan.planId, confirmation: 'RETIRE_ACTIVE_CATALOG', clientRequestId: randomUUID() }, new Date().toISOString()),
      CatalogNotFoundError,
    );
    await admin.query(`update catalog_items set version = version + 1 where tenant_id = $1 and item_id = (
      select item_id from catalog_items where tenant_id = $1 and status = 'ACTIVE' order by item_id limit 1
    )`, [tenantA]);
    await assert.rejects(
      retirement.executePlan({ ...ctxA, capability: 'catalog.items.bulk_retire' }, { planId: stalePlan.planId, confirmation: 'RETIRE_ACTIVE_CATALOG', clientRequestId: randomUUID() }, new Date().toISOString()),
      CatalogConflictError,
    );
    const rejectedPlanEvidence = await admin.query(`select
      (select status from catalog_retirement_plans where tenant_id = $1 and plan_id = $2) as plan_status,
      (select rejection_reason from catalog_retirement_events where tenant_id = $1 and plan_id = $2 and result = 'REJECTED') as rejection_reason,
      (select count(*)::int from catalog_items where tenant_id = $1 and status = 'ACTIVE') as active_items`, [tenantA, stalePlan.planId]);
    assert.deepEqual(rejectedPlanEvidence.rows[0], { plan_status: 'STALE', rejection_reason: 'PLAN_STALE', active_items: 4 });
    const globalPlan = await retirement.createPlan({ ...ctxA, capability: 'catalog.items.bulk_retire' }, { scope: 'ACTIVE_CATALOG' });
    assert.equal(globalPlan.activeCount, 4);
    const globalRetired = await retirement.executePlan({ ...ctxA, capability: 'catalog.items.bulk_retire' }, { planId: globalPlan.planId, confirmation: 'RETIRE_ACTIVE_CATALOG', clientRequestId: randomUUID() }, new Date().toISOString());
    assert.equal(globalRetired.activeCatalogCount, 0);
    assert.equal(globalRetired.retiredCount, 4);
    const historyAfterRetirement = await admin.query(`select
      (select count(*)::int from catalog_supplier_listings where tenant_id = $1) as listings,
      (select count(*)::int from catalog_supplier_listing_resolutions where tenant_id = $1) as resolutions,
      (select count(*)::int from catalog_supplier_reconciliation_memory where tenant_id = $1) as mappings`, [tenantA]);
    assert.deepEqual(historyAfterRetirement.rows[0], historyBeforeRetirement.rows[0]);
    const reactivationRow = { ...rows[1], basePriceMinor: rows[1].basePriceMinor + 500, referenceCostMinor: rows[1].referenceCostMinor + 500 };
    const retiredHistory = await service.createDraft(ctxA, { sourceId: source.sourceId, description: 'Identidad histórica retirada', clientRequestId: randomUUID(), mode: 'FULL', columnSignature: 'a'.repeat(64), rawPayload: 'synthetic-retired-history', rows: [reactivationRow] });
    const retiredHistoryAnalyzed = await service.analyze(ctxA, retiredHistory.versionId, { expectedVersion: retiredHistory.version });
    assert.equal(retiredHistoryAnalyzed.batch.counts.NEW, 0);
    assert.equal(retiredHistoryAnalyzed.batch.counts.REACTIVATE, 1);
    assert.equal(retiredHistoryAnalyzed.batch.counts.CONFLICT, 0);
    assert.equal(retiredHistoryAnalyzed.rows[0].classification, 'REACTIVATE');
    assert.equal(retiredHistoryAnalyzed.rows[0].before.status, 'INACTIVE');
    assert.equal(retiredHistoryAnalyzed.rows[0].errors.length, 0);
    assert.ok(retiredHistoryAnalyzed.rows[0].targetItemId);
    assert.equal((await service.getVersion({ tenantId: tenantB, branchId: branchB }, retiredHistory.versionId, true).catch(() => null)), null);
    const reactivationTargetId = retiredHistoryAnalyzed.rows[0].targetItemId;
    const reactivationBefore = await admin.query(`select i.item_id, i.status, i.version,
      max(ci.display_value) filter (where ci.scheme = 'SKU') as sku,
      max(ci.display_value) filter (where ci.scheme = 'BARCODE') as barcode,
      (select count(*)::int from catalog_base_price_revisions p where p.tenant_id = i.tenant_id and p.item_id = i.item_id) as price_revisions,
      (select count(*)::int from catalog_reference_cost_revisions c where c.tenant_id = i.tenant_id and c.item_id = i.item_id) as cost_revisions
      from catalog_items i join catalog_item_identifiers ci using (tenant_id, item_id)
      where i.tenant_id = $1 and i.item_id = $2 group by i.tenant_id, i.item_id`, [tenantA, reactivationTargetId]);
    assert.equal(retiredHistoryAnalyzed.rows[0].matchOrigin, 'TRUSTED_HISTORY');
    assert.equal(retiredHistoryAnalyzed.rows[0].decision, 'APPLY');
    const retiredHistoryReady = retiredHistoryAnalyzed;
    const reactivationRequestId = randomUUID();
    const reactivationApplied = await service.publish(ctxA, retiredHistory.versionId, { expectedVersion: retiredHistoryReady.version, clientRequestId: reactivationRequestId }, true);
    assert.equal(reactivationApplied.batch.lifecycle, 'APPLIED');
    const reactivationAfter = await admin.query(`select i.item_id, i.status, i.version,
      max(ci.display_value) filter (where ci.scheme = 'SKU') as sku,
      max(ci.display_value) filter (where ci.scheme = 'BARCODE') as barcode,
      (select count(*)::int from catalog_base_price_revisions p where p.tenant_id = i.tenant_id and p.item_id = i.item_id) as price_revisions,
      (select count(*)::int from catalog_reference_cost_revisions c where c.tenant_id = i.tenant_id and c.item_id = i.item_id) as cost_revisions,
      (select count(*)::int from catalog_supplier_listing_resolutions r where r.tenant_id = i.tenant_id and r.version_id = $3 and r.item_id = i.item_id and r.resolution = 'MATCHED') as matched,
      (select count(*)::int from catalog_audit_events a where a.tenant_id = i.tenant_id and a.resource_id = i.item_id and a.change_summary->>'classification' = 'REACTIVATE') as reactivation_audits
      from catalog_items i join catalog_item_identifiers ci using (tenant_id, item_id)
      where i.tenant_id = $1 and i.item_id = $2 group by i.tenant_id, i.item_id`, [tenantA, reactivationTargetId, retiredHistory.versionId]);
    assert.deepEqual({ ...reactivationAfter.rows[0], version: Number(reactivationAfter.rows[0].version) }, {
      ...reactivationBefore.rows[0], status: 'ACTIVE', version: Number(reactivationBefore.rows[0].version) + 1,
      price_revisions: reactivationBefore.rows[0].price_revisions + 1,
      cost_revisions: reactivationBefore.rows[0].cost_revisions + 1,
      matched: 1, reactivation_audits: 1,
    });
    await service.publish(ctxA, retiredHistory.versionId, { expectedVersion: retiredHistoryReady.version, clientRequestId: reactivationRequestId }, true);
    const noDuplicateRevisions = await admin.query(`select
      (select count(*)::int from catalog_base_price_revisions where tenant_id = $1 and item_id = $2) as price_revisions,
      (select count(*)::int from catalog_reference_cost_revisions where tenant_id = $1 and item_id = $2) as cost_revisions,
      (select count(*)::int from catalog_supplier_listing_resolutions where tenant_id = $1 and version_id = $3 and item_id = $2) as resolutions`, [tenantA, reactivationTargetId, retiredHistory.versionId]);
    assert.deepEqual(noDuplicateRevisions.rows[0], { price_revisions: reactivationBefore.rows[0].price_revisions + 1, cost_revisions: reactivationBefore.rows[0].cost_revisions + 1, resolutions: 1 });
    await assert.rejects(service.analyze(ctxA, retiredHistory.versionId, { expectedVersion: reactivationApplied.version }), CatalogConflictError);
    const alreadyActive = await service.createDraft(ctxA, { sourceId: source.sourceId, description: 'Identidad histórica activa', clientRequestId: randomUUID(), mode: 'FULL', columnSignature: 'a'.repeat(64), rawPayload: 'synthetic-active-history', rows: [reactivationRow] });
    const alreadyActiveAnalyzed = await service.analyze(ctxA, alreadyActive.versionId, { expectedVersion: alreadyActive.version });
    assert.equal(alreadyActiveAnalyzed.batch.counts.UNCHANGED, 1);
    const incompatible = await service.createDraft(ctxA, { sourceId: source.sourceId, description: 'Identidad histórica incompatible', clientRequestId: randomUUID(), mode: 'FULL', columnSignature: 'a'.repeat(64), rawPayload: 'synthetic-incompatible-history', rows: [{ ...reactivationRow, kind: 'SERVICE' }] });
    const incompatibleAnalyzed = await service.analyze(ctxA, incompatible.versionId, { expectedVersion: incompatible.version });
    assert.equal(incompatibleAnalyzed.batch.counts.CONFLICT, 1);
    assert.equal(incompatibleAnalyzed.rows[0].errors.includes('TYPE_CONTRADICTION'), true);

    const batchSource = await service.createSource(ctxB, { name: 'Proveedor Batch Created' });
    const batchRows = Array.from({ length: 36 }, (_, index) => ({ ...fullRow(index + 20), kind: 'PART', title: `Pantalla AG ${index + 1}`, category: 'Pantallas', brand: 'Apple', supplierItemCode: `AG-${String(index + 1).padStart(4, '0')}`, referenceCostMinor: 50_000 + index }));
    const batchDraft = await service.createDraft(ctxB, { sourceId: batchSource.sourceId, description: 'Primer lote', clientRequestId: randomUUID(), mode: 'FULL', columnSignature: 'c'.repeat(64), rawPayload: 'synthetic-batch-created', rows: batchRows });
    const batchAnalyzed = await service.analyze(ctxB, batchDraft.versionId, { expectedVersion: batchDraft.version });
    assert.equal(batchAnalyzed.batch.counts.NEW, 36);
    assert.equal(batchAnalyzed.batch.lifecycle, 'READY');
    await service.publish(ctxB, batchDraft.versionId, { expectedVersion: batchAnalyzed.version, clientRequestId: randomUUID() }, true);
    const nextBatchRows = [
      ...batchRows.map((row, index) => ({ ...row, basePriceMinor: index === 0 ? row.basePriceMinor + 1_000 : row.basePriceMinor })),
      { ...fullRow(200), kind: 'PART', title: 'Pantalla AG 37', category: 'Pantallas', brand: 'Apple', supplierItemCode: 'AG-0037' },
    ];
    const nextBatchDraft = await service.createDraft(ctxB, { sourceId: batchSource.sourceId, description: 'Segundo lote', clientRequestId: randomUUID(), mode: 'FULL', columnSignature: 'c'.repeat(64), rawPayload: 'synthetic-batch-mixed', rows: nextBatchRows });
    const nextBatchAnalyzed = await service.analyze(ctxB, nextBatchDraft.versionId, { expectedVersion: nextBatchDraft.version });
    assert.equal(nextBatchAnalyzed.batch.counts.UPDATE, 1);
    assert.equal(nextBatchAnalyzed.batch.counts.UNCHANGED, 35);
    assert.equal(nextBatchAnalyzed.batch.counts.NEW, 1);
    const nextBatchReady = nextBatchAnalyzed;
    await service.publish(ctxB, nextBatchDraft.versionId, { expectedVersion: nextBatchReady.version, clientRequestId: randomUUID() }, true);
    const batchPlan = await retirement.createPlan({ ...ctxB, capability: 'catalog.items.bulk_retire' }, { scope: 'BATCH_CREATED', sourceVersionId: nextBatchDraft.versionId });
    assert.equal(batchPlan.activeCount, 1);
    const batchRetired = await retirement.executePlan({ ...ctxB, capability: 'catalog.items.bulk_retire' }, { planId: batchPlan.planId, confirmation: 'RETIRE_BATCH_CREATED_ITEMS', clientRequestId: randomUUID() }, new Date().toISOString());
    assert.equal(batchRetired.retiredCount, 1);
    assert.equal(batchRetired.activeCatalogCount, 36);
    const batchEvidence = await admin.query(`select
      (select count(*)::int from catalog_items where tenant_id = $1 and status = 'ACTIVE') as active,
      (select count(*)::int from catalog_items where tenant_id = $1 and status = 'INACTIVE') as inactive,
      (select count(distinct listing_id)::int from catalog_supplier_listing_resolutions where tenant_id = $1 and version_id = $2 and resolution = 'CREATED') as created_rows,
      (select count(distinct listing_id)::int from catalog_supplier_listing_resolutions where tenant_id = $1 and version_id = $2 and resolution = 'MATCHED') as matched_rows,
      (select retired_count from catalog_retirement_events where tenant_id = $1 and plan_id = $3 and result = 'SUCCEEDED') as retired_by_batch`, [tenantB, nextBatchDraft.versionId, batchPlan.planId]);
    assert.deepEqual(batchEvidence.rows[0], { active: 36, inactive: 1, created_rows: 1, matched_rows: 36, retired_by_batch: 1 });

    const historicalIdentities = await admin.query(`select i.item_id,
      max(ci.display_value) filter (where ci.scheme = 'SKU') as sku,
      max(ci.display_value) filter (where ci.scheme = 'BARCODE') as barcode
      from catalog_items i join catalog_item_identifiers ci using (tenant_id, item_id)
      where i.tenant_id = $1 and i.status = 'ACTIVE'
      group by i.item_id order by i.item_id`, [tenantB]);
    assert.equal(historicalIdentities.rowCount, 36);
    const retireHistorical = await retirement.createPlan({ ...ctxB, capability: 'catalog.items.bulk_retire' }, { scope: 'ACTIVE_CATALOG' });
    await retirement.executePlan({ ...ctxB, capability: 'catalog.items.bulk_retire' }, { planId: retireHistorical.planId, confirmation: 'RETIRE_ACTIVE_CATALOG', clientRequestId: randomUUID() }, new Date().toISOString());
    const beforeReactivation = await admin.query(`select
      count(*) filter (where status = 'ACTIVE')::int as active,
      count(*) filter (where status = 'INACTIVE')::int as inactive,
      (select count(*)::int from catalog_items where tenant_id = $1) as items,
      (select count(*)::int from catalog_base_price_revisions where tenant_id = $1) as price_revisions,
      (select count(*)::int from catalog_reference_cost_revisions where tenant_id = $1) as cost_revisions,
      (select count(*)::int from catalog_supplier_reconciliation_memory where tenant_id = $1) as mappings
      from catalog_items where tenant_id = $1`, [tenantB]);
    assert.deepEqual(beforeReactivation.rows[0], { active: 0, inactive: 37, items: 37, price_revisions: 38, cost_revisions: 37, mappings: 37 });
    const reactivationRows = batchRows.map((row, index) => ({ ...row, basePriceMinor: row.basePriceMinor + (index === 0 ? 2_000 : 1_000), referenceCostMinor: row.referenceCostMinor + 1_000 }));
    const reactivation36Draft = await service.createDraft(ctxB, { sourceId: batchSource.sourceId, description: 'Reactivación histórica', clientRequestId: randomUUID(), mode: 'FULL', columnSignature: 'c'.repeat(64), rawPayload: 'synthetic-batch-reactivation', rows: reactivationRows });
    const reactivation36Analyzed = await service.analyze(ctxB, reactivation36Draft.versionId, { expectedVersion: reactivation36Draft.version });
    assert.deepEqual(reactivation36Analyzed.batch.counts, { NEW: 0, UPDATE: 0, REACTIVATE: 36, UNCHANGED: 0, CANDIDATE: 0, PENDING_REFERENCE: 0, AMBIGUOUS: 0, CONFLICT: 0, INVALID: 0 });
    assert.equal(reactivation36Analyzed.rows.every((row) => row.before.status === 'INACTIVE' && row.decision === 'APPLY' && row.matchOrigin === 'TRUSTED_HISTORY' && row.targetItemId), true);
    const reactivation36Ready = reactivation36Analyzed;
    await admin.query(`update catalog_items set version = version + 1 where tenant_id = $1 and item_id = $2`, [tenantB, reactivation36Analyzed.rows[0].targetItemId]);
    await assert.rejects(service.publish(ctxB, reactivation36Draft.versionId, { expectedVersion: reactivation36Ready.version, clientRequestId: randomUUID() }, true), CatalogConflictError);
    const failedAtomicPublish = await admin.query(`select
      count(*) filter (where status = 'ACTIVE')::int as active,
      (select count(*)::int from catalog_base_price_revisions where tenant_id = $1) as price_revisions,
      (select count(*)::int from catalog_reference_cost_revisions where tenant_id = $1) as cost_revisions
      from catalog_items where tenant_id = $1`, [tenantB]);
    assert.deepEqual(failedAtomicPublish.rows[0], { active: 0, price_revisions: 38, cost_revisions: 37 });
    const reanalyzed36 = await service.analyze(ctxB, reactivation36Draft.versionId, { expectedVersion: reactivation36Ready.version });
    assert.equal(reanalyzed36.batch.counts.REACTIVATE, 36);
    const reready36 = reanalyzed36;
    const concurrentRequestId = randomUUID();
    const concurrentPublish = await Promise.allSettled([
      service.publish(ctxB, reactivation36Draft.versionId, { expectedVersion: reready36.version, clientRequestId: concurrentRequestId }, true),
      service.publish(ctxB, reactivation36Draft.versionId, { expectedVersion: reready36.version, clientRequestId: concurrentRequestId }, true),
    ]);
    assert.equal(concurrentPublish.some((result) => result.status === 'fulfilled'), true);
    assert.equal(concurrentPublish.every((result) => result.status === 'fulfilled' || ['CATALOG_CONFLICT', 'CATALOG_UNAVAILABLE'].includes(result.reason?.code)), true);
    await service.publish(ctxB, reactivation36Draft.versionId, { expectedVersion: reready36.version, clientRequestId: concurrentRequestId }, true);
    const afterReactivation = await admin.query(`select
      count(*) filter (where status = 'ACTIVE')::int as active,
      count(*) filter (where status = 'INACTIVE')::int as inactive,
      (select count(*)::int from catalog_items where tenant_id = $1) as items,
      (select count(*)::int from catalog_base_price_revisions where tenant_id = $1) as price_revisions,
      (select count(*)::int from catalog_reference_cost_revisions where tenant_id = $1) as cost_revisions,
      (select count(*)::int from catalog_supplier_reconciliation_memory where tenant_id = $1) as mappings,
      (select count(*)::int from catalog_supplier_listing_resolutions where tenant_id = $1 and version_id = $2 and resolution = 'MATCHED') as matched,
      (select count(*)::int from catalog_audit_events where tenant_id = $1 and change_summary->>'classification' = 'REACTIVATE') as reactivation_audits
      from catalog_items where tenant_id = $1`, [tenantB, reactivation36Draft.versionId]);
    assert.deepEqual(afterReactivation.rows[0], { active: 36, inactive: 1, items: 37, price_revisions: 74, cost_revisions: 73, mappings: 37, matched: 36, reactivation_audits: 36 });
    const identitiesAfter = await admin.query(`select i.item_id,
      max(ci.display_value) filter (where ci.scheme = 'SKU') as sku,
      max(ci.display_value) filter (where ci.scheme = 'BARCODE') as barcode
      from catalog_items i join catalog_item_identifiers ci using (tenant_id, item_id)
      where i.tenant_id = $1 and i.status = 'ACTIVE'
      group by i.item_id order by i.item_id`, [tenantB]);
    assert.deepEqual(identitiesAfter.rows, historicalIdentities.rows);

    await admin.query(`update catalog_supplier_version_raw_payloads set retained_until = now() - interval '1 day' where tenant_id = $1`, [tenantA]);
    assert.equal(await service.purgeExpiredRaw(ctxA), 9);
    const raw = await admin.query(`select count(*) filter (where payload_text is not null)::int as retained from catalog_supplier_version_raw_payloads where tenant_id = $1`, [tenantA]);
    assert.equal(raw.rows[0].retained, 0);
    assert.equal((await service.listSources({ tenantId: tenantB, branchId: branchB })).length, 1);

    const candidateSource = await service.createSource(ctxB, { name: 'Proveedor Candidate QA' });
    const candidateRows = [
      { kind: 'PART', supplierObservedTitle: 'Pantalla iPhone 11 Calidad RJ >>', title: 'Pantalla iPhone 11 Calidad RJ >>', description: null, category: 'Pantallas', brand: 'Apple', supplierItemCode: null, sku: null, barcode: null, basePriceMinor: 139_900, referenceCostMinor: 48_000 },
      { kind: 'PART', supplierObservedTitle: 'Pantalla iPhone 11 Original >>I', title: 'Pantalla iPhone 11 Original >>I', description: null, category: 'Pantallas', brand: 'Apple', supplierItemCode: null, sku: null, barcode: null, basePriceMinor: 149_900, referenceCostMinor: 58_000 },
    ];
    const candidateV1 = await service.createDraft(ctxB, { sourceId: candidateSource.sourceId, description: 'Candidate anchors', clientRequestId: randomUUID(), mode: 'FULL', columnSignature: 'f'.repeat(64), rawPayload: 'candidate-v1', rows: candidateRows });
    const candidateV1Analyzed = await service.analyze(ctxB, candidateV1.versionId, { expectedVersion: candidateV1.version });
    await service.publish(ctxB, candidateV1.versionId, { expectedVersion: candidateV1Analyzed.version, clientRequestId: randomUUID() }, true);
    const modifiedCandidateRows = [
      { ...candidateRows[0], supplierObservedTitle: 'Pantalla iPhone 11 Calidad RJ >> (liquidacion)', title: 'Pantalla iPhone 11 Calidad RJ >> (liquidacion)' },
      { ...candidateRows[1], supplierObservedTitle: 'Display iPhone 11 Original >>I', title: 'Display iPhone 11 Original >>I' },
    ];
    const candidateV2 = await service.createDraft(ctxB, { sourceId: candidateSource.sourceId, description: 'Candidate observations', clientRequestId: randomUUID(), mode: 'FULL', columnSignature: 'f'.repeat(64), rawPayload: 'candidate-v2', rows: modifiedCandidateRows });
    const candidateV2Analyzed = await service.analyze(ctxB, candidateV2.versionId, { expectedVersion: candidateV2.version });
    assert.equal(candidateV2Analyzed.batch.counts.CANDIDATE, 2);
    assert.equal(candidateV2Analyzed.batch.lifecycle, 'RECONCILING');
    assert.equal(candidateV2Analyzed.rows.every((row) => row.matchOrigin === 'CANDIDATE' && row.decision === 'UNRESOLVED' && row.targetItemId === null && row.candidates.length === 1), true);
    await assert.rejects(service.decide(ctxB, candidateV2.versionId, candidateV2Analyzed.rows[0].rowDecisionId, { expectedRowVersion: candidateV2Analyzed.rows[0].version, decision: 'APPLY', targetItemId: randomUUID() }), CatalogConflictError);
    const memoryBeforeCandidatePublish = await admin.query(`select count(*)::int as count from catalog_supplier_reconciliation_memory where tenant_id = $1 and source_id = $2`, [tenantB, candidateSource.sourceId]);
    assert.equal(memoryBeforeCandidatePublish.rows[0].count, 2);
    let candidateResolved = candidateV2Analyzed;
    for (const originalRow of candidateV2Analyzed.rows) {
      const currentRow = candidateResolved.rows.find(({ rowDecisionId }) => rowDecisionId === originalRow.rowDecisionId);
      candidateResolved = await service.decide(ctxB, candidateV2.versionId, originalRow.rowDecisionId, { expectedRowVersion: currentRow.version, decision: 'APPLY', targetItemId: originalRow.candidates[0].itemId });
    }
    assert.equal(candidateResolved.batch.lifecycle, 'READY');
    await service.publish(ctxB, candidateV2.versionId, { expectedVersion: candidateResolved.version, clientRequestId: randomUUID() }, true);
    const candidateV3 = await service.createDraft(ctxB, { sourceId: candidateSource.sourceId, description: 'Exact candidate repetition', clientRequestId: randomUUID(), mode: 'FULL', columnSignature: 'f'.repeat(64), rawPayload: 'candidate-v3', rows: modifiedCandidateRows });
    const candidateV3Analyzed = await service.analyze(ctxB, candidateV3.versionId, { expectedVersion: candidateV3.version });
    assert.equal(candidateV3Analyzed.batch.counts.UNCHANGED, 2);
    assert.equal(candidateV3Analyzed.rows.every((row) => row.matchOrigin === 'TRUSTED_HISTORY' && row.preselectedByMemory && row.decision === 'APPLY'), true);
    assert.equal((await service.getVersion({ tenantId: tenantA, branchId: branchA }, candidateV3.versionId, true).catch(() => null)), null);

    const benchmarkRows = Array.from({ length: 10_000 }, (_, index) => ({ kind: 'PART', title: `Benchmark ${index + 1}`, description: null, category: 'Benchmark', brand: null, supplierItemCode: `BENCH-${String(index + 1).padStart(5, '0')}`, sku: null, barcode: null, basePriceMinor: 100_00 + index, referenceCostMinor: null }));
    const benchmarkSource = await service.createSource(ctxC, { name: 'Proveedor Benchmark' });
    const heapBefore = process.memoryUsage().heapUsed; let started = performance.now();
    const benchmarkDraft = await service.createDraft(ctxC, { sourceId: benchmarkSource.sourceId, description: '10K', clientRequestId: randomUUID(), mode: 'FULL', columnSignature: 'b'.repeat(64), rawPayload: 'synthetic-10k', rows: benchmarkRows });
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
    await concurrentConnection.close().catch(() => undefined);
    await connection.close().catch(() => undefined);
    await admin.end().catch(() => undefined);
  }
});
