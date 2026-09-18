import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import test from 'node:test';

import { Pool } from 'pg';

const enabled = process.env.SR_PBI041_PG_TEST === '1';
const frontendComposerModel = enabled ? await import('../apps/dev-preview-web/src/pages/bulk-catalog-composer-model.mjs') : null;
const { createDatabaseConnection } = enabled ? await import('../dist/infrastructure/database/database-connection.js') : {};
const { KyselyBulkCatalogRepository } = enabled ? await import('../dist/modules/catalog/infrastructure/persistence/kysely-bulk-catalog.repository.js') : {};
const { KyselyCatalogRepository } = enabled ? await import('../dist/modules/catalog/infrastructure/persistence/kysely-catalog.repository.js') : {};
const { KyselyCatalogRetirementRepository } = enabled ? await import('../dist/modules/catalog/infrastructure/persistence/kysely-catalog-retirement.repository.js') : {};
const { BulkCatalogService } = enabled ? await import('../dist/modules/catalog/application/bulk-catalog.service.js') : {};
const { CatalogService } = enabled ? await import('../dist/modules/catalog/application/catalog.service.js') : {};
const { CatalogRetirementService } = enabled ? await import('../dist/modules/catalog/application/catalog-retirement.service.js') : {};
const { CatalogFieldPolicyService } = enabled ? await import('../dist/modules/catalog/application/catalog-field-policy.service.js') : {};
const { KyselyCatalogFieldPolicyRepository } = enabled ? await import('../dist/modules/catalog/infrastructure/persistence/kysely-catalog-field-policy.repository.js') : {};
const { CatalogFieldPolicyConcurrencyConflictError } = enabled ? await import('../dist/modules/catalog/application/ports/catalog-field-policy-repository.port.js') : {};
const { CatalogConflictError, CatalogCoverageReviewRequiredError, CatalogInputError, CatalogNotFoundError, CatalogRequiredEffectiveValueError, CatalogSupplierDeleteNotAllowedError } = enabled ? await import('../dist/modules/catalog/domain/catalog-item.js') : {};

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

function withExplicitPartialCompleteness(service) {
  return new Proxy(service, {
    get(target, property) {
      const value = Reflect.get(target, property, target);
      if (typeof value !== 'function') return value;
      if (property === 'createDraft') return (context, input) => target.createDraft(context, { completeness: 'PARTIAL', ...input });
      return value.bind(target);
    },
  });
}

test('PBI-041 persists immutable supplier versions and publishes one tenant-wide atomic batch', { skip: !enabled, timeout: 90_000 }, async () => {
  assert.equal(process.version, 'v24.18.0');
  const admin = new Pool({ host: process.env.SR_PBI041_PG_HOST, port: Number(process.env.SR_PBI041_PG_PORT), database: process.env.SR_PBI041_PG_NAME, user: process.env.SR_PBI041_PG_USER, password: process.env.SR_PBI041_PG_PASSWORD, max: 2 });
  const connection = createDatabaseConnection(config());
  const concurrentConnection = createDatabaseConnection(config());
  const repository = new KyselyBulkCatalogRepository(connection);
  const rawService = new BulkCatalogService(repository, async (tenantId) => tenantId === tenantA || tenantId === tenantC ? 'MXN' : tenantId === tenantB ? 'USD' : null);
  const service = withExplicitPartialCompleteness(rawService);
  const catalog = new CatalogService(new KyselyCatalogRepository(connection), async (tenantId) => tenantId === tenantA || tenantId === tenantC ? 'MXN' : tenantId === tenantB ? 'USD' : null);
  const concurrentService = withExplicitPartialCompleteness(new BulkCatalogService(new KyselyBulkCatalogRepository(concurrentConnection), async (tenantId) => tenantId === tenantA || tenantId === tenantC ? 'MXN' : tenantId === tenantB ? 'USD' : null));
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
    const rows = [
      { ...fullRow(1), supplierObservedTitle: 'PANTALLA IPHONE 11 OLED GX >>I', title: 'Pantalla iPhone 11 OLED GX >>I', sku: 'STRONG-001', barcode: 'STRONG-BAR-001' },
      { ...fullRow(2), sku: 'STRONG-002', barcode: 'STRONG-BAR-002' },
      fullRow(3),
      fullRow(5),
    ];
    const createV1Request = randomUUID();
    const v1Input = { sourceId: source.sourceId, description: 'Primera lista', clientRequestId: createV1Request, mode: 'FULL', completeness: 'COMPLETE', columnSignature: 'a'.repeat(64), rawPayload: 'synthetic-v1', rows };
    const missingCompleteness = { ...v1Input }; delete missingCompleteness.completeness;
    assert.throws(() => rawService.createDraft(ctxA, missingCompleteness), (error) => error instanceof CatalogInputError && error.parameter === 'completeness');
    assert.throws(() => rawService.createDraft(ctxA, { ...v1Input, clientRequestId: randomUUID(), completeness: 'INVALID' }), (error) => error instanceof CatalogInputError && error.parameter === 'completeness');
    let draft = await service.createDraft(ctxA, v1Input);
    const replay = await service.createDraft(ctxA, v1Input);
    assert.equal(replay.versionId, draft.versionId);
    await assert.rejects(service.createDraft(ctxA, { ...v1Input, rawPayload: 'synthetic-conflicting-retry' }), CatalogConflictError);
    assert.deepEqual([draft.sequenceNumber, draft.sourceRevision, draft.description, draft.completeness], [1, 'v1', 'Primera lista', 'COMPLETE']);
    const compactDraft = await service.replaceDraft(ctxA, draft.versionId, { expectedVersion: draft.version, mode: 'COMPACT', completeness: 'COMPLETE', columnSignature: 'c'.repeat(64), rawPayload: 'compact-draft', rows });
    assert.equal(compactDraft.mode, 'COMPACT');
    const restoredFullDraft = await service.replaceDraft(ctxA, compactDraft.versionId, { expectedVersion: compactDraft.version, mode: 'FULL', completeness: 'COMPLETE', columnSignature: 'a'.repeat(64), rawPayload: 'full-draft', rows });
    assert.equal((await service.getVersion({ tenantId: tenantA, branchId: branchA }, restoredFullDraft.versionId, true)).mode, 'FULL');
    draft = restoredFullDraft;
    assert.throws(() => rawService.replaceDraft(ctxA, draft.versionId, { expectedVersion: draft.version, mode: 'FULL', columnSignature: 'a'.repeat(64), rawPayload: 'missing-completeness', rows }), (error) => error instanceof CatalogInputError && error.parameter === 'completeness');
    assert.throws(() => rawService.replaceDraft(ctxA, draft.versionId, { expectedVersion: draft.version, mode: 'FULL', completeness: null, columnSignature: 'a'.repeat(64), rawPayload: 'invalid-completeness', rows }), (error) => error instanceof CatalogInputError && error.parameter === 'completeness');

    const sequencingSource = await service.createSource(ctxA, { name: 'Proveedor Secuencial' });
    const [concurrentLeft, concurrentRight] = await Promise.all([
      service.createDraft(ctxA, { sourceId: sequencingSource.sourceId, description: 'Misma fecha A', clientRequestId: randomUUID(), mode: 'FULL', columnSignature: 'd'.repeat(64), rawPayload: 'concurrent-a', rows: [fullRow(801)] }),
      concurrentService.createDraft(ctxA, { sourceId: sequencingSource.sourceId, description: 'Misma fecha B', clientRequestId: randomUUID(), mode: 'FULL', columnSignature: 'd'.repeat(64), rawPayload: 'concurrent-b', rows: [fullRow(802)] }),
    ]);
    assert.deepEqual([concurrentLeft.sequenceNumber, concurrentRight.sequenceNumber].sort((left, right) => left - right), [1, 2]);
    assert.equal(new Set([concurrentLeft.sourceRevision, concurrentRight.sourceRevision]).size, 2);

    const safeSource = await service.createSource(ctxA, { name: 'Proveedor Borrador Eliminable' });
    const safeDraft = await service.createDraft(ctxA, { sourceId: safeSource.sourceId, description: 'Sólo borrador sintético', clientRequestId: randomUUID(), mode: 'FULL', columnSignature: 'e'.repeat(64), rawPayload: 'safe-draft', rows: [fullRow(901)] });
    assert.equal(safeDraft.completeness, 'PARTIAL');
    assert.deepEqual({ status: safeDraft.absenceBaseline.status, versionId: safeDraft.absenceBaseline.versionId, currentCount: safeDraft.absenceBaseline.currentCount, continuedCount: safeDraft.absenceBaseline.continuedCount, additionalCount: safeDraft.absenceBaseline.additionalCount, plausibility: safeDraft.absenceBaseline.plausibility.status }, { status: 'NOT_APPLICABLE', versionId: null, currentCount: 1, continuedCount: null, additionalCount: null, plausibility: 'NORMAL' });
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
    const compactSource = await service.createSource(ctxA, { name: 'Proveedor modo restringido' });
    const compactOnlyDraft = await service.createDraft(ctxA, { sourceId: compactSource.sourceId, description: 'Modo restringido', clientRequestId: randomUUID(), mode: 'COMPACT', columnSignature: 'f'.repeat(64), rawPayload: 'compact-only', rows: [fullRow(902)] });
    assert.equal((await service.getVersion({ tenantId: tenantA, branchId: branchA }, compactOnlyDraft.versionId, true)).mode, 'COMPACT');
    const compactOnlyAnalyzed = await service.analyze(ctxA, compactOnlyDraft.versionId, { expectedVersion: compactOnlyDraft.version });
    assert.deepEqual([compactOnlyAnalyzed.mode, compactOnlyAnalyzed.lifecycle, compactOnlyAnalyzed.batch.counts.INVALID], ['COMPACT', 'INGESTED', 1]);
    assert.equal(compactOnlyAnalyzed.rows[0].classification, 'INVALID');
    await assert.rejects(service.replaceDraft(ctxA, compactOnlyDraft.versionId, { expectedVersion: compactOnlyAnalyzed.version, mode: 'FULL', completeness: 'PARTIAL', columnSignature: 'a'.repeat(64), rawPayload: 'must-not-reinterpret', rows: [fullRow(902)] }), CatalogConflictError);
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
    assert.equal(analyzed.completeness, 'COMPLETE');
    assert.equal(analyzed.rows.every((row) => row.proposal.referenceCostMinor === null), true);
    assert.equal(analyzed.lifecycle, 'INGESTED');
    assert.equal(analyzed.batch.counts.PENDING_REFERENCE, 4);
    assert.equal(analyzed.batch.lifecycle, 'RECONCILING');
    assert.deepEqual({ status: analyzed.absenceBaseline.status, versionId: analyzed.absenceBaseline.versionId, currentCount: analyzed.absenceBaseline.currentCount, continuedCount: analyzed.absenceBaseline.continuedCount, additionalCount: analyzed.absenceBaseline.additionalCount, plausibility: analyzed.absenceBaseline.plausibility.status }, { status: 'NO_BASELINE', versionId: null, currentCount: 4, continuedCount: null, additionalCount: null, plausibility: 'NORMAL' });
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
    assert.equal(applied.completeness, 'COMPLETE');
    const retry = await service.publish(ctxA, draft.versionId, { expectedVersion: ready.version, clientRequestId }, true);
    assert.equal(retry.batch.publishedAt, applied.batch.publishedAt);
    assert.equal((await service.getVersion({ tenantId: tenantA, branchId: branchA }, draft.versionId, true)).completeness, 'COMPLETE');
    await assert.rejects(service.publish(ctxA, draft.versionId, { expectedVersion: ready.version + 1, clientRequestId }, true), CatalogConflictError);

    const state = await admin.query(`select
      (select count(*)::int from catalog_items where tenant_id = $1) as items,
      (select count(*)::int from catalog_item_identifiers where tenant_id = $1) as identifiers,
      (select count(*)::int from catalog_supplier_listing_resolutions where tenant_id = $1) as resolutions,
      (select count(*)::int from catalog_branch_price_revisions where tenant_id = $1) as overrides`, [tenantA]);
    assert.deepEqual(state.rows[0], { items: 4, identifiers: 8, resolutions: 4, overrides: 0 });
    const redacted = await service.getVersion({ tenantId: tenantA, branchId: branchA }, draft.versionId, false);
    assert.equal(redacted.rows.every((row) => row.proposal.referenceCostMinor === null), true);

    const v2Rows = rows.map((row, index) => ({ ...row, basePriceMinor: index === 0 ? row.basePriceMinor + 100 : row.basePriceMinor }));
    const v2 = await service.createDraft(ctxA, { sourceId: source.sourceId, description: 'Segunda lista', clientRequestId: randomUUID(), mode: 'FULL', completeness: 'COMPLETE', columnSignature: 'a'.repeat(64), rawPayload: 'synthetic-v2', rows: v2Rows });
    assert.equal(v2.supersedesVersionId, draft.versionId);
    const v2Analyzed = await service.analyze(ctxA, v2.versionId, { expectedVersion: v2.version });
    assert.equal(v2Analyzed.batch.counts.UPDATE, 1);
    assert.equal(v2Analyzed.batch.counts.UNCHANGED, 3);
    assert.equal(v2Analyzed.rows.every((row) => row.preselectedByMemory && row.matchOrigin === 'TRUSTED_HISTORY' && row.decision === 'APPLY'), true);
    assert.equal(v2Analyzed.batch.lifecycle, 'READY');
    assert.deepEqual({ status: v2Analyzed.absenceBaseline.status, versionId: v2Analyzed.absenceBaseline.versionId, sequenceNumber: v2Analyzed.absenceBaseline.sequenceNumber, baselineCount: v2Analyzed.absenceBaseline.baselineCount, currentCount: v2Analyzed.absenceBaseline.currentCount, continuedCount: v2Analyzed.absenceBaseline.continuedCount, notObservedCount: v2Analyzed.absenceBaseline.notObservedCount, additionalCount: v2Analyzed.absenceBaseline.additionalCount, continuedItems: v2Analyzed.absenceBaseline.continuedItems.length, additionalItems: v2Analyzed.absenceBaseline.additionalItems.length, plausibility: v2Analyzed.absenceBaseline.plausibility.status }, { status: 'EVALUATED', versionId: draft.versionId, sequenceNumber: draft.sequenceNumber, baselineCount: 4, currentCount: 4, continuedCount: 4, notObservedCount: 0, additionalCount: 0, continuedItems: 4, additionalItems: 0, plausibility: 'NORMAL' });
    const comparison = await service.compare({ tenantId: tenantA, branchId: branchA }, draft.versionId, v2.versionId);
    assert.deepEqual({ mapped: comparison.mapped, changed: comparison.changed, added: comparison.added, ambiguous: comparison.ambiguous, absenceStatus: comparison.absenceStatus, notObserved: comparison.notObserved }, { mapped: 4, changed: 1, added: 0, ambiguous: 0, absenceStatus: 'EVALUATED', notObserved: 0 });

    const decisionRow = v2Analyzed.rows.find((row) => row.targetItemId !== null);
    assert.ok(decisionRow?.targetItemId);
    const targetBeforeDecision = await admin.query(`select item_id, title, status, version from catalog_items where tenant_id = $1 and item_id = $2`, [tenantA, decisionRow.targetItemId]);
    const excluded = await service.decide(ctxA, v2.versionId, decisionRow.rowDecisionId, { expectedRowVersion: decisionRow.version, decision: 'EXCLUDE', targetItemId: null, titleDecision: null });
    const excludedRow = excluded.rows.find((row) => row.rowDecisionId === decisionRow.rowDecisionId);
    assert.equal(excludedRow?.decision, 'EXCLUDE');
    assert.deepEqual(excludedRow?.errors, []);
    const excludedStored = await admin.query(`select decision, errors, jsonb_typeof(errors) as errors_type from catalog_update_row_decisions where tenant_id = $1 and row_decision_id = $2`, [tenantA, decisionRow.rowDecisionId]);
    assert.deepEqual(excludedStored.rows[0], { decision: 'EXCLUDE', errors: [], errors_type: 'array' });
    assert.equal(excluded.batch.publishedAt, null);
    assert.deepEqual((await admin.query(`select item_id, title, status, version from catalog_items where tenant_id = $1 and item_id = $2`, [tenantA, decisionRow.targetItemId])).rows, targetBeforeDecision.rows);

    const included = await service.decide(ctxA, v2.versionId, decisionRow.rowDecisionId, { expectedRowVersion: excludedRow.version, decision: 'APPLY', targetItemId: null, titleDecision: null });
    const includedRow = included.rows.find((row) => row.rowDecisionId === decisionRow.rowDecisionId);
    assert.equal(includedRow?.decision, 'APPLY');
    assert.deepEqual(includedRow?.errors, []);
    const includedStored = await admin.query(`select decision, errors, jsonb_typeof(errors) as errors_type from catalog_update_row_decisions where tenant_id = $1 and row_decision_id = $2`, [tenantA, decisionRow.rowDecisionId]);
    assert.deepEqual(includedStored.rows[0], { decision: 'APPLY', errors: [], errors_type: 'array' });
    assert.equal(included.batch.publishedAt, null);
    assert.deepEqual((await admin.query(`select item_id, title, status, version from catalog_items where tenant_id = $1 and item_id = $2`, [tenantA, decisionRow.targetItemId])).rows, targetBeforeDecision.rows);

    await admin.query(`update catalog_update_row_decisions set errors = '{}'::jsonb where tenant_id = $1 and row_decision_id = $2`, [tenantA, decisionRow.rowDecisionId]);
    const malformedRead = await service.getVersion({ tenantId: tenantA, branchId: branchA }, v2.versionId, true);
    assert.deepEqual(malformedRead.rows.find((row) => row.rowDecisionId === decisionRow.rowDecisionId)?.errors, []);
    const normalizedAgain = await service.decide(ctxA, v2.versionId, decisionRow.rowDecisionId, { expectedRowVersion: includedRow.version, decision: 'APPLY', targetItemId: null, titleDecision: null });
    const normalizedStored = await admin.query(`select errors, jsonb_typeof(errors) as errors_type from catalog_update_row_decisions where tenant_id = $1 and row_decision_id = $2`, [tenantA, decisionRow.rowDecisionId]);
    assert.deepEqual(normalizedStored.rows[0], { errors: [], errors_type: 'array' });
    assert.equal(normalizedAgain.batch.publishedAt, null);

    const v2Ready = normalizedAgain;
    await service.publish(ctxA, v2.versionId, { expectedVersion: v2Ready.version, clientRequestId: randomUUID() }, true);
    const completeOmission = await service.createDraft(ctxA, { sourceId: source.sourceId, description: 'Lista completa sin un artículo observado', clientRequestId: randomUUID(), mode: 'FULL', completeness: 'COMPLETE', columnSignature: 'a'.repeat(64), rawPayload: 'synthetic-complete-omission', rows: v2Rows.slice(0, 3) });
    const completeOmissionAnalyzed = await service.analyze(ctxA, completeOmission.versionId, { expectedVersion: completeOmission.version });
    assert.deepEqual({ status: completeOmissionAnalyzed.absenceBaseline.status, versionId: completeOmissionAnalyzed.absenceBaseline.versionId, sequenceNumber: completeOmissionAnalyzed.absenceBaseline.sequenceNumber, baselineCount: completeOmissionAnalyzed.absenceBaseline.baselineCount, currentCount: completeOmissionAnalyzed.absenceBaseline.currentCount, continuedCount: completeOmissionAnalyzed.absenceBaseline.continuedCount, notObservedCount: completeOmissionAnalyzed.absenceBaseline.notObservedCount, additionalCount: completeOmissionAnalyzed.absenceBaseline.additionalCount, notObservedTitles: completeOmissionAnalyzed.absenceBaseline.notObservedItems.map((item) => item.canonicalTitle), plausibility: completeOmissionAnalyzed.absenceBaseline.plausibility.status }, { status: 'EVALUATED', versionId: v2.versionId, sequenceNumber: v2.sequenceNumber, baselineCount: 4, currentCount: 3, continuedCount: 3, notObservedCount: 1, additionalCount: 0, notObservedTitles: ['Artículo proveedor 5'], plausibility: 'NORMAL' });
    const omissionComparison = await service.compare({ tenantId: tenantA, branchId: branchA }, v2.versionId, completeOmission.versionId);
    assert.deepEqual({ absenceStatus: omissionComparison.absenceStatus, notObserved: omissionComparison.notObserved }, { absenceStatus: 'EVALUATED', notObserved: 1 });
    await assert.rejects(service.replaceDraft(ctxA, completeOmission.versionId, { expectedVersion: completeOmissionAnalyzed.version, mode: 'FULL', completeness: 'PARTIAL', columnSignature: 'a'.repeat(64), rawPayload: 'cannot-reinterpret-ingested-history', rows: v2Rows.slice(0, 3) }), CatalogConflictError);
    const omittedBefore = await admin.query(`select i.item_id, i.status, i.version,
      (select count(*)::int from catalog_item_identifiers ci where ci.tenant_id = i.tenant_id and ci.item_id = i.item_id) as identifiers,
      (select count(*)::int from catalog_base_price_revisions p where p.tenant_id = i.tenant_id and p.item_id = i.item_id) as price_revisions,
      (select count(*)::int from catalog_reference_cost_revisions c where c.tenant_id = i.tenant_id and c.item_id = i.item_id) as cost_revisions,
      (select count(*)::int from catalog_supplier_reconciliation_memory m where m.tenant_id = i.tenant_id and m.item_id = i.item_id) as mappings
      from catalog_items i join catalog_supplier_reconciliation_memory m on m.tenant_id = i.tenant_id and m.item_id = i.item_id
      where m.tenant_id = $1 and m.source_id = $2 and m.identifier_scheme = 'SUPPLIER_CODE' and m.normalized_identifier = 'sup-00005'`, [tenantA, source.sourceId]);
    await service.publish(ctxA, completeOmission.versionId, { expectedVersion: completeOmissionAnalyzed.version, clientRequestId: randomUUID() }, true);
    const omittedAfter = await admin.query(`select i.item_id, i.status, i.version,
      (select count(*)::int from catalog_item_identifiers ci where ci.tenant_id = i.tenant_id and ci.item_id = i.item_id) as identifiers,
      (select count(*)::int from catalog_base_price_revisions p where p.tenant_id = i.tenant_id and p.item_id = i.item_id) as price_revisions,
      (select count(*)::int from catalog_reference_cost_revisions c where c.tenant_id = i.tenant_id and c.item_id = i.item_id) as cost_revisions,
      (select count(*)::int from catalog_supplier_reconciliation_memory m where m.tenant_id = i.tenant_id and m.item_id = i.item_id) as mappings
      from catalog_items i join catalog_supplier_reconciliation_memory m on m.tenant_id = i.tenant_id and m.item_id = i.item_id
      where m.tenant_id = $1 and m.source_id = $2 and m.identifier_scheme = 'SUPPLIER_CODE' and m.normalized_identifier = 'sup-00005'`, [tenantA, source.sourceId]);
    assert.deepEqual(omittedAfter.rows, omittedBefore.rows);
    assert.equal(Number((await admin.query(`select count(*)::int as count from catalog_supplier_listing_resolutions where tenant_id = $1 and version_id = $2 and item_id = $3`, [tenantA, completeOmission.versionId, omittedBefore.rows[0].item_id])).rows[0].count), 0);

    const plausibilitySource = await service.createSource(ctxA, { name: 'Proveedor plausibilidad' });
    const plausibilityRows = Array.from({ length: 100 }, (_, index) => ({ kind: 'PART', supplierObservedTitle: `Pantalla plausibilidad ${index + 1}`, title: `Pantalla plausibilidad ${index + 1}`, description: null, category: 'Pantallas', brand: 'Apple', supplierItemCode: `plausibility-${String(index + 1).padStart(3, '0')}`, sku: `PLAUS-${String(index + 1).padStart(3, '0')}`, barcode: `PL${String(index + 1).padStart(8, '0')}`, basePriceMinor: 100_000 + index, referenceCostMinor: null }));
    const plausibilityBaseline = await service.createDraft(ctxA, { sourceId: plausibilitySource.sourceId, description: 'Baseline complete de plausibilidad', clientRequestId: randomUUID(), mode: 'FULL', completeness: 'COMPLETE', columnSignature: 'd'.repeat(64), rawPayload: 'plausibility-baseline', rows: plausibilityRows });
    const plausibilityBaselineAnalyzed = await service.analyze(ctxA, plausibilityBaseline.versionId, { expectedVersion: plausibilityBaseline.version });
    const plausibilityBaselineReady = await service.decideMany(ctxA, plausibilityBaseline.versionId, { expectedBatchVersion: plausibilityBaselineAnalyzed.batch.version, classifications: ['PENDING_REFERENCE'], decision: 'APPLY' });
    await service.publish(ctxA, plausibilityBaseline.versionId, { expectedVersion: plausibilityBaselineReady.version, clientRequestId: randomUUID() }, true);
    const plausibilityCurrent = await service.createDraft(ctxA, { sourceId: plausibilitySource.sourceId, description: 'Lista completa sospechosamente pequeña', clientRequestId: randomUUID(), mode: 'FULL', completeness: 'COMPLETE', columnSignature: 'd'.repeat(64), rawPayload: 'plausibility-current', rows: plausibilityRows.slice(0, 5) });
    const plausibilityCurrentAnalyzed = await service.analyze(ctxA, plausibilityCurrent.versionId, { expectedVersion: plausibilityCurrent.version });
    assert.deepEqual({ status: plausibilityCurrentAnalyzed.absenceBaseline.status, baselineVersionId: plausibilityCurrentAnalyzed.absenceBaseline.versionId, baselineCount: plausibilityCurrentAnalyzed.absenceBaseline.baselineCount, currentCount: plausibilityCurrentAnalyzed.absenceBaseline.currentCount, continuedCount: plausibilityCurrentAnalyzed.absenceBaseline.continuedCount, notObservedCount: plausibilityCurrentAnalyzed.absenceBaseline.notObservedCount, additionalCount: plausibilityCurrentAnalyzed.absenceBaseline.additionalCount, plausibility: plausibilityCurrentAnalyzed.absenceBaseline.plausibility }, { status: 'EVALUATED', baselineVersionId: plausibilityBaseline.versionId, baselineCount: 100, currentCount: 5, continuedCount: 5, notObservedCount: 95, additionalCount: 0, plausibility: { status: 'REVIEW_REQUIRED', reason: 'LARGE_COVERAGE_DROP', baselineCount: 100, currentCount: 5, continuedCount: 5, notObservedCount: 95, additionalCount: 0, absoluteDrop: 95, reductionPercent: 95 } });
    const absentBeforePlausibilityApply = await admin.query(`select i.item_id, i.status, i.version,
      (select count(*)::int from catalog_item_identifiers ci where ci.tenant_id = i.tenant_id and ci.item_id = i.item_id) as identifiers,
      (select count(*)::int from catalog_supplier_reconciliation_memory m where m.tenant_id = i.tenant_id and m.item_id = i.item_id) as mappings
      from catalog_items i join catalog_supplier_reconciliation_memory m on m.tenant_id = i.tenant_id and m.item_id = i.item_id
      where m.tenant_id = $1 and m.source_id = $2 and m.identifier_scheme = 'SUPPLIER_CODE' and m.normalized_identifier = 'plausibility-006'`, [tenantA, plausibilitySource.sourceId]);
    await assert.rejects(service.publish(ctxA, plausibilityCurrent.versionId, { expectedVersion: plausibilityCurrentAnalyzed.version, clientRequestId: randomUUID() }, true), CatalogCoverageReviewRequiredError);
    assert.deepEqual((await admin.query(`select i.item_id, i.status, i.version,
      (select count(*)::int from catalog_item_identifiers ci where ci.tenant_id = i.tenant_id and ci.item_id = i.item_id) as identifiers,
      (select count(*)::int from catalog_supplier_reconciliation_memory m where m.tenant_id = i.tenant_id and m.item_id = i.item_id) as mappings
      from catalog_items i join catalog_supplier_reconciliation_memory m on m.tenant_id = i.tenant_id and m.item_id = i.item_id
      where m.tenant_id = $1 and m.source_id = $2 and m.identifier_scheme = 'SUPPLIER_CODE' and m.normalized_identifier = 'plausibility-006'`, [tenantA, plausibilitySource.sourceId])).rows, absentBeforePlausibilityApply.rows);
    const acknowledgedPlausibilityApply = await service.publish(ctxA, plausibilityCurrent.versionId, { expectedVersion: plausibilityCurrentAnalyzed.version, clientRequestId: randomUUID(), coverageReviewAcknowledged: true }, true);
    assert.equal(acknowledgedPlausibilityApply.batch.lifecycle, 'APPLIED');
    assert.deepEqual((await admin.query(`select i.item_id, i.status, i.version,
      (select count(*)::int from catalog_item_identifiers ci where ci.tenant_id = i.tenant_id and ci.item_id = i.item_id) as identifiers,
      (select count(*)::int from catalog_supplier_reconciliation_memory m where m.tenant_id = i.tenant_id and m.item_id = i.item_id) as mappings
      from catalog_items i join catalog_supplier_reconciliation_memory m on m.tenant_id = i.tenant_id and m.item_id = i.item_id
      where m.tenant_id = $1 and m.source_id = $2 and m.identifier_scheme = 'SUPPLIER_CODE' and m.normalized_identifier = 'plausibility-006'`, [tenantA, plausibilitySource.sourceId])).rows, absentBeforePlausibilityApply.rows);
    const plausibilityAudit = await admin.query(`select change_summary->>'coverageReviewRequired' as required, change_summary->>'coverageReviewAcknowledged' as acknowledged, change_summary->>'baselineVersionId' as baseline_version_id, change_summary->>'baselineCount' as baseline_count, change_summary->>'currentCount' as current_count from catalog_audit_events where tenant_id = $1 and change_summary->>'supplierCatalogVersionId' = $2 limit 1`, [tenantA, plausibilityCurrent.versionId]);
    assert.deepEqual(plausibilityAudit.rows[0], { required: 'true', acknowledged: 'true', baseline_version_id: plausibilityBaseline.versionId, baseline_count: '100', current_count: '5' });
    const partialSubset = await service.createDraft(ctxA, { sourceId: source.sourceId, description: 'Actualización parcial sin señal de ausencia', clientRequestId: randomUUID(), mode: 'FULL', completeness: 'PARTIAL', columnSignature: 'a'.repeat(64), rawPayload: 'synthetic-partial-subset', rows: v2Rows.slice(0, 1) });
    const partialSubsetAnalyzed = await service.analyze(ctxA, partialSubset.versionId, { expectedVersion: partialSubset.version });
    const partialComparison = await service.compare({ tenantId: tenantA, branchId: branchA }, completeOmission.versionId, partialSubset.versionId);
    assert.deepEqual({ absenceStatus: partialComparison.absenceStatus, notObserved: partialComparison.notObserved }, { absenceStatus: 'PARTIAL_CURRENT', notObserved: null });
    assert.equal(partialSubsetAnalyzed.completeness, 'PARTIAL');
    assert.deepEqual({ status: partialSubsetAnalyzed.absenceBaseline.status, versionId: partialSubsetAnalyzed.absenceBaseline.versionId, currentCount: partialSubsetAnalyzed.absenceBaseline.currentCount, continuedCount: partialSubsetAnalyzed.absenceBaseline.continuedCount, additionalCount: partialSubsetAnalyzed.absenceBaseline.additionalCount, plausibility: partialSubsetAnalyzed.absenceBaseline.plausibility.status }, { status: 'NOT_APPLICABLE', versionId: null, currentCount: 1, continuedCount: null, additionalCount: null, plausibility: 'NORMAL' });
    const alternatePart = await admin.query(`select item_id from catalog_supplier_reconciliation_memory where tenant_id = $1 and source_id = $2 and identifier_scheme = 'SUPPLIER_CODE' and normalized_identifier = 'sup-00005'`, [tenantA, source.sourceId]);
    const correction = await service.createDraft(ctxA, { sourceId: source.sourceId, description: 'Corrección', clientRequestId: randomUUID(), mode: 'FULL', columnSignature: 'a'.repeat(64), rawPayload: 'synthetic-correction', rows: [rows[0]] });
    assert.equal(correction.supersedesVersionId, partialSubset.versionId);
    const correctionAnalyzed = await service.analyze(ctxA, correction.versionId, { expectedVersion: correction.version });
    const corrected = await service.decide(ctxA, correction.versionId, correctionAnalyzed.rows[0].rowDecisionId, { expectedRowVersion: correctionAnalyzed.rows[0].version, decision: 'APPLY', targetItemId: alternatePart.rows[0].item_id, titleDecision: 'KEEP_CURRENT' });
    await service.publish(ctxA, correction.versionId, { expectedVersion: corrected.version, clientRequestId: randomUUID() }, true);
    const memoryAfterCorrection = await admin.query(`select consistency_state, correction_count from catalog_supplier_reconciliation_memory where tenant_id = $1 and source_id = $2 and identifier_scheme = 'SUPPLIER_CODE' and normalized_identifier = 'sup-00001'`, [tenantA, source.sourceId]);
    assert.deepEqual(memoryAfterCorrection.rows[0], { consistency_state: 'CONFLICTED', correction_count: 1 });
    const inconsistent = await service.createDraft(ctxA, { sourceId: source.sourceId, description: 'Historia inconsistente', clientRequestId: randomUUID(), mode: 'FULL', columnSignature: 'a'.repeat(64), rawPayload: 'synthetic-inconsistent', rows: [rows[0]] });
    const inconsistentAnalyzed = await service.analyze(ctxA, inconsistent.versionId, { expectedVersion: inconsistent.version });
    assert.equal(inconsistentAnalyzed.batch.counts.CONFLICT, 1);
    assert.equal(inconsistentAnalyzed.rows[0].errors.includes('CORRECTED_MAPPING_CONFLICT'), true);
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
    assert.deepEqual(rejectedPlanEvidence.rows[0], { plan_status: 'STALE', rejection_reason: 'PLAN_STALE', active_items: 104 });
    const globalPlan = await retirement.createPlan({ ...ctxA, capability: 'catalog.items.bulk_retire' }, { scope: 'ACTIVE_CATALOG' });
    assert.equal(globalPlan.activeCount, 104);
    const globalRetired = await retirement.executePlan({ ...ctxA, capability: 'catalog.items.bulk_retire' }, { planId: globalPlan.planId, confirmation: 'RETIRE_ACTIVE_CATALOG', clientRequestId: randomUUID() }, new Date().toISOString());
    assert.equal(globalRetired.activeCatalogCount, 0);
    assert.equal(globalRetired.retiredCount, 104);
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

    const identifierConflict = await service.createDraft(ctxA, { sourceId: source.sourceId, description: 'Identificadores incompatibles', clientRequestId: randomUUID(), mode: 'FULL', columnSignature: 'a'.repeat(64), rawPayload: 'synthetic-identifier-conflict', rows: [{ ...rows[0], barcode: rows[1].barcode }] });
    const identifierConflictAnalyzed = await service.analyze(ctxA, identifierConflict.versionId, { expectedVersion: identifierConflict.version });
    assert.equal(identifierConflictAnalyzed.batch.counts.CONFLICT, 1);
    assert.equal(identifierConflictAnalyzed.rows[0].errors.includes('IDENTIFIERS_POINT_TO_DIFFERENT_ITEMS'), true);

    const batchSource = await service.createSource(ctxB, { name: 'Proveedor Batch Created' });
    const batchRows = Array.from({ length: 36 }, (_, index) => ({ ...fullRow(index + 20), kind: 'PART', title: `Pantalla AG ${index + 1}`, category: 'Pantallas', brand: 'Apple', supplierItemCode: `AG-${String(index + 1).padStart(4, '0')}`, referenceCostMinor: 50_000 + index }));
    const batchDraft = await service.createDraft(ctxB, { sourceId: batchSource.sourceId, description: 'Primer lote', clientRequestId: randomUUID(), mode: 'FULL', completeness: 'COMPLETE', columnSignature: 'c'.repeat(64), rawPayload: 'synthetic-batch-created', rows: batchRows });
    const batchAnalyzed = await service.analyze(ctxB, batchDraft.versionId, { expectedVersion: batchDraft.version });
    assert.equal(batchAnalyzed.batch.counts.NEW, 36);
    assert.equal(batchAnalyzed.batch.lifecycle, 'READY');
    await service.publish(ctxB, batchDraft.versionId, { expectedVersion: batchAnalyzed.version, clientRequestId: randomUUID() }, true);
    const nextBatchRows = [
      ...batchRows.map((row, index) => ({ ...row, basePriceMinor: index === 0 ? row.basePriceMinor + 1_000 : row.basePriceMinor })),
      { ...fullRow(200), kind: 'PART', title: 'Pantalla AG 37', category: 'Pantallas', brand: 'Apple', supplierItemCode: 'AG-0037' },
    ];
    const nextBatchDraft = await service.createDraft(ctxB, { sourceId: batchSource.sourceId, description: 'Segundo lote', clientRequestId: randomUUID(), mode: 'FULL', completeness: 'COMPLETE', columnSignature: 'c'.repeat(64), rawPayload: 'synthetic-batch-mixed', rows: nextBatchRows });
    const nextBatchAnalyzed = await service.analyze(ctxB, nextBatchDraft.versionId, { expectedVersion: nextBatchDraft.version });
    assert.equal(nextBatchAnalyzed.batch.counts.UPDATE, 1);
    assert.equal(nextBatchAnalyzed.batch.counts.UNCHANGED, 35);
    assert.equal(nextBatchAnalyzed.batch.counts.NEW, 1);
    assert.deepEqual(nextBatchAnalyzed.absenceBaseline.additionalItems.map((item) => ({ title: item.observedTitle, coverageRelation: item.coverageRelation, catalogRelation: item.catalogRelation, catalogStatus: item.catalogStatus, catalogClassification: item.catalogClassification, catalogResolution: item.catalogResolution })), [{ title: 'Pantalla AG 37', coverageRelation: 'ADDITIONAL', catalogRelation: 'NEW', catalogStatus: null, catalogClassification: 'NEW', catalogResolution: null }]);
    const nextBatchReady = nextBatchAnalyzed;
    const nextBatchApplied = await service.publish(ctxB, nextBatchDraft.versionId, { expectedVersion: nextBatchReady.version, clientRequestId: randomUUID() }, true);
    assert.deepEqual(nextBatchApplied.absenceBaseline.additionalItems.map((item) => ({ title: item.canonicalTitle, coverageRelation: item.coverageRelation, catalogRelation: item.catalogRelation, catalogStatus: item.catalogStatus, catalogClassification: item.catalogClassification, catalogResolution: item.catalogResolution })), [{ title: 'Pantalla AG 37', coverageRelation: 'ADDITIONAL', catalogRelation: 'NEW', catalogStatus: 'ACTIVE', catalogClassification: 'NEW', catalogResolution: 'CREATED' }]);
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
    const reactivationRows = batchRows.map((row, index) => ({ ...row, ...(index === 0 ? { supplierObservedTitle: 'Pantalla AG 1 Renovada', title: 'Pantalla AG 1 Renovada' } : {}), basePriceMinor: row.basePriceMinor + (index === 0 ? 2_000 : 1_000), referenceCostMinor: row.referenceCostMinor + 1_000 }));
    const reactivation36Draft = await service.createDraft(ctxB, { sourceId: batchSource.sourceId, description: 'Reactivación histórica', clientRequestId: randomUUID(), mode: 'FULL', columnSignature: 'c'.repeat(64), rawPayload: 'synthetic-batch-reactivation', rows: reactivationRows });
    const reactivation36Analyzed = await service.analyze(ctxB, reactivation36Draft.versionId, { expectedVersion: reactivation36Draft.version });
    assert.deepEqual(reactivation36Analyzed.batch.counts, { NEW: 0, UPDATE: 0, REACTIVATE: 36, UNCHANGED: 0, CANDIDATE: 0, PENDING_REFERENCE: 0, AMBIGUOUS: 0, CONFLICT: 0, INVALID: 0 });
    assert.equal(reactivation36Analyzed.rows.every((row) => row.before.status === 'INACTIVE' && row.decision === 'APPLY' && row.matchOrigin === 'TRUSTED_HISTORY' && row.targetItemId), true);
    const reactivationFirstRow = reactivation36Analyzed.rows[0];
    const reactivationTitleReady = await service.decide(ctxB, reactivation36Draft.versionId, reactivationFirstRow.rowDecisionId, { expectedRowVersion: reactivationFirstRow.version, decision: 'APPLY', targetItemId: reactivationFirstRow.targetItemId, titleDecision: 'ADOPT_OBSERVED' });
    assert.equal(reactivationTitleReady.rows[0].titleDecision, 'ADOPT_OBSERVED');
    assert.equal((await admin.query(`select title from catalog_items where tenant_id = $1 and item_id = $2`, [tenantB, reactivationFirstRow.targetItemId])).rows[0].title, 'Pantalla AG 1');
    const reactivation36Ready = reactivationTitleReady;
    await admin.query(`update catalog_items set version = version + 1 where tenant_id = $1 and item_id = $2`, [tenantB, reactivation36Analyzed.rows[0].targetItemId]);
    await assert.rejects(service.publish(ctxB, reactivation36Draft.versionId, { expectedVersion: reactivation36Ready.version, clientRequestId: randomUUID() }, true), CatalogConflictError);
    const failedAtomicPublish = await admin.query(`select
      count(*) filter (where status = 'ACTIVE')::int as active,
      (select count(*)::int from catalog_base_price_revisions where tenant_id = $1) as price_revisions,
      (select count(*)::int from catalog_reference_cost_revisions where tenant_id = $1) as cost_revisions,
      (select title from catalog_items where tenant_id = $1 and item_id = $2) as failed_title,
      (select count(*)::int from catalog_supplier_listing_resolutions where tenant_id = $1 and version_id = $3) as failed_resolutions
      from catalog_items where tenant_id = $1`, [tenantB, reactivationFirstRow.targetItemId, reactivation36Draft.versionId]);
    assert.deepEqual(failedAtomicPublish.rows[0], { active: 0, price_revisions: 38, cost_revisions: 37, failed_title: 'Pantalla AG 1', failed_resolutions: 0 });
    const reanalyzed36 = await service.analyze(ctxB, reactivation36Draft.versionId, { expectedVersion: reactivation36Ready.version });
    assert.equal(reanalyzed36.batch.counts.REACTIVATE, 36);
    const reready36 = await service.decide(ctxB, reactivation36Draft.versionId, reanalyzed36.rows[0].rowDecisionId, { expectedRowVersion: reanalyzed36.rows[0].version, decision: 'APPLY', targetItemId: reanalyzed36.rows[0].targetItemId, titleDecision: 'ADOPT_OBSERVED' });
    const concurrentRequestId = randomUUID();
    const concurrentPublish = await Promise.allSettled([
      service.publish(ctxB, reactivation36Draft.versionId, { expectedVersion: reready36.version, clientRequestId: concurrentRequestId }, true),
      service.publish(ctxB, reactivation36Draft.versionId, { expectedVersion: reready36.version, clientRequestId: concurrentRequestId }, true),
    ]);
    assert.equal(concurrentPublish.some((result) => result.status === 'fulfilled'), true);
    assert.equal(concurrentPublish.every((result) => result.status === 'fulfilled' || ['CATALOG_CONFLICT', 'CATALOG_UNAVAILABLE'].includes(result.reason?.code)), true);
    await service.publish(ctxB, reactivation36Draft.versionId, { expectedVersion: reready36.version, clientRequestId: concurrentRequestId }, true);
    assert.equal((await admin.query(`select title from catalog_items where tenant_id = $1 and item_id = $2`, [tenantB, reactivationFirstRow.targetItemId])).rows[0].title, 'Pantalla AG 1 Renovada');
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
    const rawBeforePurge = await admin.query(`select count(*)::int as count from catalog_supplier_version_raw_payloads where tenant_id = $1 and payload_text is not null`, [tenantA]);
    assert.equal(await service.purgeExpiredRaw(ctxA), rawBeforePurge.rows[0].count);
    const raw = await admin.query(`select count(*) filter (where payload_text is not null)::int as retained from catalog_supplier_version_raw_payloads where tenant_id = $1`, [tenantA]);
    assert.equal(raw.rows[0].retained, 0);

    const duplicateSource = await service.createSource(ctxA, { name: 'Proveedor duplicados aislado' });
    const duplicateSeedRow = { ...fullRow(9901), supplierObservedTitle: 'Pantalla duplicados aislado', title: 'Pantalla duplicados aislado' };
    const duplicateSeed = await service.createDraft(ctxA, { sourceId: duplicateSource.sourceId, description: 'Seed identidad duplicados', clientRequestId: randomUUID(), mode: 'FULL', columnSignature: 'a'.repeat(64), rawPayload: 'duplicate-seed', rows: [duplicateSeedRow] });
    const duplicateSeedAnalyzed = await service.analyze(ctxA, duplicateSeed.versionId, { expectedVersion: duplicateSeed.version });
    const duplicateSeedReady = await service.decideMany(ctxA, duplicateSeed.versionId, { expectedBatchVersion: duplicateSeedAnalyzed.batch.version, classifications: ['PENDING_REFERENCE'], decision: 'APPLY' });
    await service.publish(ctxA, duplicateSeed.versionId, { expectedVersion: duplicateSeedReady.version, clientRequestId: randomUUID() }, true);
    const exactDuplicate = await service.createDraft(ctxA, { sourceId: duplicateSource.sourceId, description: 'Duplicado exacto', clientRequestId: randomUUID(), mode: 'FULL', completeness: 'COMPLETE', columnSignature: 'a'.repeat(64), rawPayload: 'duplicate-exact', rows: [duplicateSeedRow, duplicateSeedRow] });
    const exactDuplicateAnalyzed = await service.analyze(ctxA, exactDuplicate.versionId, { expectedVersion: exactDuplicate.version });
    assert.equal(exactDuplicateAnalyzed.batch.lifecycle, 'READY');
    assert.equal(exactDuplicateAnalyzed.batch.counts.CONFLICT, 0);
    assert.equal(exactDuplicateAnalyzed.rows.filter((row) => row.decision === 'APPLY').length, 1);
    assert.equal(exactDuplicateAnalyzed.rows.filter((row) => row.decision === 'EXCLUDE' && row.warnings.includes('DUPLICATE_EXACT_CONSOLIDATED')).length, 1);
    assert.deepEqual({ status: exactDuplicateAnalyzed.absenceBaseline.status, currentCount: exactDuplicateAnalyzed.absenceBaseline.currentCount }, { status: 'NO_BASELINE', currentCount: 1 });
    // The observed title intentionally differs from the trusted canonical title. This is the
    // exact payload shape used by the duplicate-winner card: Analyze already chose KEEP_CURRENT.
    const contradictoryTitleRow = { ...duplicateSeedRow, supplierObservedTitle: 'Pantalla duplicados aislado liquidación', title: 'Pantalla duplicados aislado liquidación' };
    const contradictoryRows = [{ ...contradictoryTitleRow, basePriceMinor: 119900, referenceCostMinor: 45000 }, { ...contradictoryTitleRow, basePriceMinor: 120000, referenceCostMinor: 46000 }];
    const contradictoryDuplicate = await service.createDraft(ctxA, { sourceId: duplicateSource.sourceId, description: 'Duplicado contradictorio', clientRequestId: randomUUID(), mode: 'FULL', columnSignature: 'a'.repeat(64), rawPayload: 'duplicate-contradictory', rows: contradictoryRows });
    const contradictoryAnalyzed = await service.analyze(ctxA, contradictoryDuplicate.versionId, { expectedVersion: contradictoryDuplicate.version });
    assert.equal(contradictoryAnalyzed.batch.lifecycle, 'RECONCILING');
    assert.equal(contradictoryAnalyzed.rows.every((row) => row.errors.includes('DUPLICATE_VALUE_CONTRADICTION')), true);
    assert.equal(new Set(contradictoryAnalyzed.rows.map((row) => row.targetItemId)).size, 1);
    const duplicateGroupsFromPersistedDto = frontendComposerModel.groupDuplicateResolutionRows(
      contradictoryAnalyzed.rows,
      (row) => `C:${row.proposal.supplierItemCode.toLowerCase()}`,
      (row) => (Array.isArray(row.errors) ? row.errors.filter((value) => typeof value === 'string') : []),
      (row) => (Array.isArray(row.warnings) ? row.warnings.filter((value) => typeof value === 'string') : []),
    );
    assert.deepEqual(
      duplicateGroupsFromPersistedDto.map((group) => ({ key: group.key, rows: group.members.map((row) => row.rowNumber) })),
      [{ key: 'C:sup-09901', rows: [1, 2] }],
    );
    await assert.rejects(service.publish(ctxA, contradictoryDuplicate.versionId, { expectedVersion: contradictoryAnalyzed.version, clientRequestId: randomUUID() }, true), CatalogConflictError);
    const duplicateWinner = contradictoryAnalyzed.rows[1];
    assert.equal(duplicateWinner.titleDecision, 'KEEP_CURRENT');
    const duplicatePreChoice = await admin.query(`select
      (select count(*)::int from catalog_items where tenant_id = $1) as items,
      (select count(*)::int from catalog_supplier_listing_resolutions where tenant_id = $1 and version_id = $2) as resolutions,
      (select count(*)::int from catalog_supplier_reconciliation_memory where tenant_id = $1 and source_id = $3) as memory,
      (select published_at from catalog_update_batches where tenant_id = $1 and version_id = $2) as published_at`, [tenantA, contradictoryDuplicate.versionId, duplicateSource.sourceId]);
    await assert.rejects(service.decide(ctxA, contradictoryDuplicate.versionId, duplicateWinner.rowDecisionId, { expectedRowVersion: duplicateWinner.version, decision: 'APPLY', targetItemId: duplicateWinner.targetItemId, titleDecision: null }), (error) => error instanceof CatalogInputError && error.parameter === 'titleDecision');
    const afterRejectedDuplicateChoice = await service.getVersion({ tenantId: tenantA, branchId: branchA }, contradictoryDuplicate.versionId, true);
    assert.equal(afterRejectedDuplicateChoice.rows.every((row) => row.decision === 'UNRESOLVED' && row.errors.includes('DUPLICATE_VALUE_CONTRADICTION')), true);
    const contradictoryReady = await service.decide(ctxA, contradictoryDuplicate.versionId, duplicateWinner.rowDecisionId, { expectedRowVersion: duplicateWinner.version, decision: 'APPLY', targetItemId: duplicateWinner.targetItemId, titleDecision: duplicateWinner.titleDecision });
    assert.equal(contradictoryReady.batch.lifecycle, 'READY');
    assert.equal(contradictoryReady.rows.filter((row) => row.decision === 'APPLY' && row.targetItemId === duplicateWinner.targetItemId).length, 1);
    assert.equal(contradictoryReady.rows.filter((row) => row.decision === 'EXCLUDE' && row.warnings.includes('DUPLICATE_VALUE_CONTRADICTION_SUPERSEDED')).length, 1);
    assert.equal(contradictoryReady.rows.every((row) => !row.errors.includes('DUPLICATE_VALUE_CONTRADICTION')), true);
    assert.deepEqual((await admin.query(`select
      (select count(*)::int from catalog_items where tenant_id = $1) as items,
      (select count(*)::int from catalog_supplier_listing_resolutions where tenant_id = $1 and version_id = $2) as resolutions,
      (select count(*)::int from catalog_supplier_reconciliation_memory where tenant_id = $1 and source_id = $3) as memory,
      (select published_at from catalog_update_batches where tenant_id = $1 and version_id = $2) as published_at`, [tenantA, contradictoryDuplicate.versionId, duplicateSource.sourceId])).rows[0], duplicatePreChoice.rows[0]);
    await assert.rejects(service.decide(ctxA, contradictoryDuplicate.versionId, duplicateWinner.rowDecisionId, { expectedRowVersion: duplicateWinner.version, decision: 'APPLY', targetItemId: duplicateWinner.targetItemId, titleDecision: duplicateWinner.titleDecision }), CatalogConflictError);
    const contradictoryReanalyzed = await service.analyze(ctxA, contradictoryDuplicate.versionId, { expectedVersion: contradictoryReady.version });
    assert.equal(contradictoryReanalyzed.batch.lifecycle, 'READY');
    assert.equal(contradictoryReanalyzed.rows.filter((row) => row.decision === 'APPLY' && row.targetItemId === duplicateWinner.targetItemId).length, 1);
    assert.equal(contradictoryReanalyzed.rows.filter((row) => row.decision === 'EXCLUDE' && row.warnings.includes('DUPLICATE_VALUE_CONTRADICTION_SUPERSEDED')).length, 1);
    assert.equal(contradictoryReanalyzed.rows.every((row) => !row.errors.includes('DUPLICATE_VALUE_CONTRADICTION')), true);
    const firstWinnerDuplicate = await service.createDraft(ctxA, { sourceId: duplicateSource.sourceId, description: 'Duplicado contradictorio primera fila', clientRequestId: randomUUID(), mode: 'FULL', columnSignature: 'a'.repeat(64), rawPayload: 'duplicate-first-winner', rows: contradictoryRows });
    const firstWinnerAnalyzed = await service.analyze(ctxA, firstWinnerDuplicate.versionId, { expectedVersion: firstWinnerDuplicate.version });
    const firstWinner = firstWinnerAnalyzed.rows[0];
    const firstWinnerReady = await service.decide(ctxA, firstWinnerDuplicate.versionId, firstWinner.rowDecisionId, { expectedRowVersion: firstWinner.version, decision: 'APPLY', targetItemId: firstWinner.targetItemId, titleDecision: firstWinner.titleDecision });
    assert.equal(firstWinnerReady.rows.filter((row) => row.decision === 'APPLY' && row.rowNumber === 1).length, 1);
    assert.equal(firstWinnerReady.rows.filter((row) => row.decision === 'EXCLUDE' && row.warnings.includes('DUPLICATE_VALUE_CONTRADICTION_SUPERSEDED')).length, 1);
    await assert.rejects(service.decide(ctxA, firstWinnerDuplicate.versionId, firstWinner.rowDecisionId, { expectedRowVersion: firstWinner.version, decision: 'APPLY', targetItemId: randomUUID(), titleDecision: firstWinner.titleDecision }), CatalogConflictError);
    const tripleDuplicate = await service.createDraft(ctxA, { sourceId: duplicateSource.sourceId, description: 'Duplicado contradictorio tres filas', clientRequestId: randomUUID(), mode: 'FULL', columnSignature: 'a'.repeat(64), rawPayload: 'duplicate-three-winner', rows: [...contradictoryRows, { ...contradictoryTitleRow, basePriceMinor: 121000, referenceCostMinor: 47000 }] });
    const tripleAnalyzed = await service.analyze(ctxA, tripleDuplicate.versionId, { expectedVersion: tripleDuplicate.version });
    const thirdWinner = tripleAnalyzed.rows[2];
    const tripleReady = await service.decide(ctxA, tripleDuplicate.versionId, thirdWinner.rowDecisionId, { expectedRowVersion: thirdWinner.version, decision: 'APPLY', targetItemId: thirdWinner.targetItemId, titleDecision: thirdWinner.titleDecision });
    assert.equal(tripleReady.rows.filter((row) => row.decision === 'APPLY' && row.targetItemId === thirdWinner.targetItemId).length, 1);
    assert.equal(tripleReady.rows.filter((row) => row.decision === 'EXCLUDE' && row.warnings.includes('DUPLICATE_VALUE_CONTRADICTION_SUPERSEDED')).length, 2);
    assert.equal((await service.listSources({ tenantId: tenantB, branchId: branchB })).length, 1);

    const candidateSource = await service.createSource(ctxB, { name: 'Proveedor Candidate QA' });
    const candidateRows = [
      { kind: 'PART', supplierObservedTitle: 'Pantalla iPhone 11 Calidad RJ >>', title: 'Pantalla iPhone 11 Calidad RJ >>', description: null, category: 'Pantallas', brand: 'Apple', supplierItemCode: null, sku: null, barcode: null, basePriceMinor: 139_900, referenceCostMinor: 48_000 },
      { kind: 'PART', supplierObservedTitle: 'Pantalla iPhone 11 Original >>I', title: 'Pantalla iPhone 11 Original >>I', description: null, category: 'Pantallas', brand: 'Apple', supplierItemCode: null, sku: null, barcode: null, basePriceMinor: 149_900, referenceCostMinor: 58_000 },
      { kind: 'PART', supplierObservedTitle: 'Pantalla iPhone 11 GX', title: 'Pantalla iPhone 11 GX', description: null, category: 'Pantallas', brand: 'Apple', supplierItemCode: null, sku: null, barcode: null, basePriceMinor: 129_900, referenceCostMinor: 45_000 },
      { kind: 'PART', supplierObservedTitle: 'Pantalla iPhone 11 ZY', title: 'Pantalla iPhone 11 ZY', description: null, category: 'Pantallas', brand: 'Apple', supplierItemCode: null, sku: null, barcode: null, basePriceMinor: 129_900, referenceCostMinor: 45_000 },
    ];
    const candidateV1 = await service.createDraft(ctxB, { sourceId: candidateSource.sourceId, description: 'Candidate anchors', clientRequestId: randomUUID(), mode: 'FULL', columnSignature: 'f'.repeat(64), rawPayload: 'candidate-v1', rows: candidateRows });
    const candidateV1Analyzed = await service.analyze(ctxB, candidateV1.versionId, { expectedVersion: candidateV1.version });
    const unpublishedReplay = await service.createDraft(ctxB, { sourceId: candidateSource.sourceId, description: 'Unpublished exact replay', clientRequestId: randomUUID(), mode: 'FULL', columnSignature: 'f'.repeat(64), rawPayload: 'candidate-unpublished', rows: [candidateRows[0]] });
    const unpublishedReplayAnalyzed = await service.analyze(ctxB, unpublishedReplay.versionId, { expectedVersion: unpublishedReplay.version });
    assert.equal(unpublishedReplayAnalyzed.batch.counts.NEW, 1);
    assert.equal(unpublishedReplayAnalyzed.rows[0].matchOrigin, 'NONE');
    assert.equal(unpublishedReplayAnalyzed.rows[0].preselectedByMemory, false);
    await service.publish(ctxB, candidateV1.versionId, { expectedVersion: candidateV1Analyzed.version, clientRequestId: randomUUID() }, true);
    const ambiguousCandidateVersion = await service.createDraft(ctxB, { sourceId: candidateSource.sourceId, description: 'Multiple reasonable candidates', clientRequestId: randomUUID(), mode: 'FULL', columnSignature: 'f'.repeat(64), rawPayload: 'candidate-ambiguous', rows: [{ ...candidateRows[2], supplierObservedTitle: 'Pantalla iPhone 11', title: 'Pantalla iPhone 11' }] });
    const ambiguousCandidateAnalyzed = await service.analyze(ctxB, ambiguousCandidateVersion.versionId, { expectedVersion: ambiguousCandidateVersion.version });
    assert.equal(ambiguousCandidateAnalyzed.batch.counts.AMBIGUOUS, 1);
    assert.equal(ambiguousCandidateAnalyzed.rows[0].candidates.length, 2);
    assert.equal(ambiguousCandidateAnalyzed.rows[0].targetItemId, null);
    assert.equal(ambiguousCandidateAnalyzed.rows[0].warnings.includes('MULTIPLE_BOUNDED_CANDIDATES'), true);
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
    assert.equal(memoryBeforeCandidatePublish.rows[0].count, 4);
    const candidateIdentityBefore = await admin.query(`select item_id, title, version from catalog_items where tenant_id = $1 and item_id = any($2::uuid[]) order by title`, [tenantB, candidateV2Analyzed.rows.map((row) => row.candidates[0].itemId)]);
    let candidateResolved = candidateV2Analyzed;
    for (const [index, originalRow] of candidateV2Analyzed.rows.entries()) {
      const currentRow = candidateResolved.rows.find(({ rowDecisionId }) => rowDecisionId === originalRow.rowDecisionId);
      candidateResolved = await service.decide(ctxB, candidateV2.versionId, originalRow.rowDecisionId, { expectedRowVersion: currentRow.version, decision: 'APPLY', targetItemId: originalRow.candidates[0].itemId, titleDecision: index === 0 ? 'KEEP_CURRENT' : 'ADOPT_OBSERVED' });
    }
    assert.equal(candidateResolved.batch.lifecycle, 'READY');
    assert.deepEqual(candidateResolved.rows.map(({ titleDecision }) => titleDecision), ['KEEP_CURRENT', 'ADOPT_OBSERVED']);
    const memoryAfterCandidateDecision = await admin.query(`select count(*)::int as count from catalog_supplier_reconciliation_memory where tenant_id = $1 and source_id = $2`, [tenantB, candidateSource.sourceId]);
    assert.equal(memoryAfterCandidateDecision.rows[0].count, 4);
    assert.deepEqual((await admin.query(`select item_id, title, version from catalog_items where tenant_id = $1 and item_id = any($2::uuid[]) order by title`, [tenantB, candidateV2Analyzed.rows.map((row) => row.candidates[0].itemId)])).rows, candidateIdentityBefore.rows);
    const candidatePublishRequest = randomUUID();
    await service.publish(ctxB, candidateV2.versionId, { expectedVersion: candidateResolved.version, clientRequestId: candidatePublishRequest }, true);
    await service.publish(ctxB, candidateV2.versionId, { expectedVersion: candidateResolved.version, clientRequestId: candidatePublishRequest }, true);
    const candidateIdentityAfter = await admin.query(`select item_id, title from catalog_items where tenant_id = $1 and item_id = any($2::uuid[]) order by title`, [tenantB, candidateV2Analyzed.rows.map((row) => row.candidates[0].itemId)]);
    assert.deepEqual(candidateIdentityAfter.rows.map(({ title }) => title), ['Display iPhone 11 Original >>I', 'Pantalla iPhone 11 Calidad RJ >>']);
    const candidateRenameAudit = await admin.query(`select change_summary from catalog_audit_events where tenant_id = $1 and client_request_id = $2 and change_summary ? 'canonicalTitle'`, [tenantB, candidatePublishRequest]);
    assert.equal(candidateRenameAudit.rowCount, 1);
    assert.deepEqual(candidateRenameAudit.rows[0].change_summary.canonicalTitle, { before: 'Pantalla iPhone 11 Original >>I', after: 'Display iPhone 11 Original >>I' });
    assert.equal(candidateRenameAudit.rows[0].change_summary.sourceId, candidateSource.sourceId);
    assert.equal(candidateRenameAudit.rows[0].change_summary.supplierCatalogVersionId, candidateV2.versionId);
    assert.equal(Number((await admin.query(`select count(*)::int as count from catalog_audit_events where tenant_id = $1 and client_request_id = $2 and change_summary ? 'canonicalTitle'`, [tenantB, candidatePublishRequest])).rows[0].count), 1);
    for (const [term, expectedItemId] of [['display', candidateV2Analyzed.rows[1].candidates[0].itemId], ['pantalla', null], ['liquidacion', candidateV2Analyzed.rows[0].candidates[0].itemId]]) {
      const result = await catalog.search({ tenantId: tenantB, branchId: branchB }, { query: term, page: 1, pageSize: 50 }, false);
      assert.equal(new Set(result.items.map(({ item }) => item.itemId)).size, result.items.length);
      if (expectedItemId) assert.equal(result.items.some(({ item }) => item.itemId === expectedItemId), true, term);
    }
    assert.equal((await catalog.search({ tenantId: tenantA, branchId: branchA }, { query: 'liquidacion', page: 1, pageSize: 50 }, false)).totalCount, 0);
    const candidateV3 = await service.createDraft(ctxB, { sourceId: candidateSource.sourceId, description: 'Exact candidate repetition', clientRequestId: randomUUID(), mode: 'FULL', columnSignature: 'f'.repeat(64), rawPayload: 'candidate-v3', rows: modifiedCandidateRows });
    const candidateV3Analyzed = await service.analyze(ctxB, candidateV3.versionId, { expectedVersion: candidateV3.version });
    assert.equal(candidateV3Analyzed.batch.counts.UNCHANGED, 2);
    assert.equal(candidateV3Analyzed.rows.every((row) => row.matchOrigin === 'TRUSTED_HISTORY' && row.preselectedByMemory && row.decision === 'APPLY'), true);
    const offerVersion = await service.createDraft(ctxB, { sourceId: candidateSource.sourceId, description: 'Different observation is not inherited', clientRequestId: randomUUID(), mode: 'FULL', columnSignature: 'f'.repeat(64), rawPayload: 'candidate-offer', rows: [{ ...candidateRows[0], supplierObservedTitle: 'Pantalla iPhone 11 Calidad RJ >> (oferta)', title: 'Pantalla iPhone 11 Calidad RJ >> (oferta)' }] });
    const offerAnalyzed = await service.analyze(ctxB, offerVersion.versionId, { expectedVersion: offerVersion.version });
    assert.equal(offerAnalyzed.batch.counts.CANDIDATE, 1);
    assert.equal(offerAnalyzed.rows[0].matchOrigin, 'CANDIDATE');
    assert.equal(offerAnalyzed.rows[0].targetItemId, null);
    assert.equal(offerAnalyzed.rows[0].preselectedByMemory, false);
    const excludedOffer = await service.decide(ctxB, offerVersion.versionId, offerAnalyzed.rows[0].rowDecisionId, { expectedRowVersion: offerAnalyzed.rows[0].version, decision: 'EXCLUDE', targetItemId: null });
    await service.publish(ctxB, offerVersion.versionId, { expectedVersion: excludedOffer.version, clientRequestId: randomUUID() }, true);
    assert.equal((await catalog.search({ tenantId: tenantB, branchId: branchB }, { query: 'oferta', page: 1, pageSize: 50 }, false)).totalCount, 0);

    const competingTargetId = candidateV2Analyzed.rows[1].candidates[0].itemId;
    const competingRows = ['Edición taller norte', 'Edición taller sur'].map((suffix) => ({ ...candidateRows[1], supplierObservedTitle: `Display iPhone 11 Original >>I ${suffix}`, title: `Display iPhone 11 Original >>I ${suffix}` }));
    const competingDrafts = [];
    for (const [index, row] of competingRows.entries()) competingDrafts.push(await service.createDraft(ctxB, { sourceId: candidateSource.sourceId, description: `Rename competing ${index + 1}`, clientRequestId: randomUUID(), mode: 'FULL', columnSignature: 'f'.repeat(64), rawPayload: `candidate-competing-${index + 1}`, rows: [row] }));
    const competingAnalyzed = [];
    for (const value of competingDrafts) competingAnalyzed.push(await service.analyze(ctxB, value.versionId, { expectedVersion: value.version }));
    assert.equal(competingAnalyzed.every((value) => value.rows[0].classification === 'CANDIDATE' && value.rows[0].candidates[0].itemId === competingTargetId), true);
    const competingReady = [];
    for (const value of competingAnalyzed) competingReady.push(await service.decide(ctxB, value.versionId, value.rows[0].rowDecisionId, { expectedRowVersion: value.rows[0].version, decision: 'APPLY', targetItemId: competingTargetId, titleDecision: 'ADOPT_OBSERVED' }));
    await service.publish(ctxB, competingReady[0].versionId, { expectedVersion: competingReady[0].version, clientRequestId: randomUUID() }, true);
    await assert.rejects(service.publish(ctxB, competingReady[1].versionId, { expectedVersion: competingReady[1].version, clientRequestId: randomUUID() }, true), CatalogConflictError);
    assert.equal((await admin.query(`select title from catalog_items where tenant_id = $1 and item_id = $2`, [tenantB, competingTargetId])).rows[0].title, competingRows[0].title);
    assert.equal(Number((await admin.query(`select count(*)::int as count from catalog_supplier_listing_resolutions where tenant_id = $1 and version_id = $2`, [tenantB, competingReady[1].versionId])).rows[0].count), 0);

    const secondSupplier = await service.createSource(ctxB, { name: 'Proveedor Candidate QA B' });
    const secondSupplierRow = { ...candidateRows[1], supplierObservedTitle: 'Nombre exclusivo proveedor B iPhone 11', title: 'Nombre exclusivo proveedor B iPhone 11' };
    const secondSupplierDraft = await service.createDraft(ctxB, { sourceId: secondSupplier.sourceId, description: 'Mapping multi proveedor', clientRequestId: randomUUID(), mode: 'FULL', columnSignature: '9'.repeat(64), rawPayload: 'candidate-second-supplier', rows: [secondSupplierRow] });
    const secondSupplierAnalyzed = await service.analyze(ctxB, secondSupplierDraft.versionId, { expectedVersion: secondSupplierDraft.version });
    const secondSupplierReady = await service.decide(ctxB, secondSupplierDraft.versionId, secondSupplierAnalyzed.rows[0].rowDecisionId, { expectedRowVersion: secondSupplierAnalyzed.rows[0].version, decision: 'APPLY', targetItemId: competingTargetId, titleDecision: 'KEEP_CURRENT' });
    await service.publish(ctxB, secondSupplierDraft.versionId, { expectedVersion: secondSupplierReady.version, clientRequestId: randomUUID() }, true);
    const secondSupplierSearch = await catalog.search({ tenantId: tenantB, branchId: branchB }, { query: 'exclusivo proveedor', page: 1, pageSize: 50 }, false);
    assert.deepEqual(secondSupplierSearch.items.map(({ item }) => item.itemId), [competingTargetId]);
    assert.equal((await service.getVersion({ tenantId: tenantA, branchId: branchA }, candidateV3.versionId, true).catch(() => null)), null);

    const benchmarkRows = Array.from({ length: 10_000 }, (_, index) => ({ kind: 'PART', supplierObservedTitle: `Original proveedor benchmark ${index + 1}`, title: `Benchmark ${index + 1}`, description: null, category: 'Benchmark', brand: null, supplierItemCode: `BENCH-${String(index + 1).padStart(5, '0')}`, sku: null, barcode: null, basePriceMinor: 100_00 + index, referenceCostMinor: null }));
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
    started = performance.now(); const historicalSearch = await catalog.search({ tenantId: tenantC, branchId: branchC }, { query: 'original proveedor benchmark 10000', page: 1, pageSize: 25 }, false); const historicalSearchMs = performance.now() - started;
    assert.equal(historicalSearch.totalCount, 1); assert.equal(historicalSearch.items[0].item.title, 'Benchmark 10000'); assert.ok(historicalSearchMs <= 750, `10k historical-title search exceeded budget: ${historicalSearchMs}ms`);
    assert.equal(Number((await admin.query(`select count(*)::int as count from pg_indexes where indexname in ('catalog_supplier_listings_title_search_idx','catalog_supplier_resolutions_item_history_idx')`)).rows[0].count), 2);
    const heapDeltaMiB = Math.max(0, process.memoryUsage().heapUsed - heapBefore) / 1024 / 1024; assert.ok(heapDeltaMiB <= 250, `10k heap delta exceeded budget: ${heapDeltaMiB}MiB`);
    process.stdout.write(`PBI-041 10k benchmark: ingest=${ingestMs.toFixed(1)}ms analyze=${analyzeMs.toFixed(1)}ms preview=${previewMs.toFixed(1)}ms publish=${publishMs.toFixed(1)}ms historicalSearch=${historicalSearchMs.toFixed(1)}ms heapDelta=${heapDeltaMiB.toFixed(1)}MiB\n`);
  } finally {
    await concurrentConnection.close().catch(() => undefined);
    await connection.close().catch(() => undefined);
    await admin.end().catch(() => undefined);
  }
});

test('PBI-041 material handoff preserves the publisher as the Apply audit actor', { skip: !enabled, timeout: 30_000 }, async () => {
  const admin = new Pool({ host: process.env.SR_PBI041_PG_HOST, port: Number(process.env.SR_PBI041_PG_PORT), database: process.env.SR_PBI041_PG_NAME, user: process.env.SR_PBI041_PG_USER, password: process.env.SR_PBI041_PG_PASSWORD, max: 2 });
  const connection = createDatabaseConnection(config());
  const tenantId = randomUUID(); const branchId = randomUUID();
  const preparer = Object.freeze({ ...context(tenantId, branchId), actorDisplayName: 'Preparer A' });
  const publisher = Object.freeze({ ...context(tenantId, branchId), actorDisplayName: 'Publisher B' });
  const service = new BulkCatalogService(new KyselyBulkCatalogRepository(connection), async () => 'MXN');
  try {
    await admin.query(`insert into tenants (tenant_id, operating_currency, created_at) values ($1, 'MXN', now())`, [tenantId]);
    await admin.query(`insert into branches (tenant_id, branch_id, time_zone, active, created_at) values ($1, $2, 'America/Hermosillo', true, now())`, [tenantId, branchId]);
    const source = await service.createSource(preparer, { name: 'Handoff QA supplier' });
    const draft = await service.createDraft(preparer, { sourceId: source.sourceId, description: 'Prepared by A', clientRequestId: randomUUID(), mode: 'FULL', completeness: 'PARTIAL', columnSignature: 'a'.repeat(64), rawPayload: 'handoff-qa', rows: [fullRow(9_401)] });
    const analyzed = await service.analyze(preparer, draft.versionId, { expectedVersion: draft.version });
    const ready = await service.decideMany(preparer, draft.versionId, { expectedBatchVersion: analyzed.batch.version, classifications: ['PENDING_REFERENCE'], decision: 'APPLY' });
    assert.equal(ready.batch.lifecycle, 'READY');
    const applied = await service.publish(publisher, draft.versionId, { expectedVersion: ready.version, clientRequestId: randomUUID() }, false);
    assert.equal(applied.batch.lifecycle, 'APPLIED');
    const audit = await admin.query(`select actor_user_id, actor_display_name, capability from catalog_audit_events where tenant_id = $1 and action = 'catalog.bulk.publish.row' order by occurred_at desc limit 1`, [tenantId]);
    assert.deepEqual(audit.rows[0], { actor_user_id: publisher.actorUserId, actor_display_name: 'Publisher B', capability: 'catalog.import.publish' });
    assert.notEqual(audit.rows[0].actor_user_id, preparer.actorUserId);
  } finally { await connection.close().catch(() => undefined); await admin.end().catch(() => undefined); }
});

test('UX-003.1 persists tenant-isolated catalog field policies with append-only versions', { skip: !enabled, timeout: 30_000 }, async () => {
  const admin = new Pool({ host: process.env.SR_PBI041_PG_HOST, port: Number(process.env.SR_PBI041_PG_PORT), database: process.env.SR_PBI041_PG_NAME, user: process.env.SR_PBI041_PG_USER, password: process.env.SR_PBI041_PG_PASSWORD, max: 2 });
  const connection = createDatabaseConnection(config());
  const policyTenantA = 'd1410000-0000-4000-8000-000000000041'; const policyTenantB = 'e1410000-0000-4000-8000-000000000041';
  const policy = new CatalogFieldPolicyService(new KyselyCatalogFieldPolicyRepository(connection), () => new Date('2026-09-17T19:00:00.000Z'), () => randomUUID());
  const policyContext = (tenantId) => Object.freeze({ tenantId, branchId: randomUUID(), stationId: randomUUID(), sessionId: randomUUID(), actorUserId: randomUUID(), actorDisplayName: 'Policy QA', capability: 'catalog.configuration.manage', commitGuards: Object.freeze([{ async confirmCurrent() { return true; }, async confirmTemporalCurrent() { return true; } }]) });
  try {
    await admin.query(`insert into tenants (tenant_id, operating_currency, created_at) values ($1, 'MXN', now()), ($2, 'MXN', now())`, [policyTenantA, policyTenantB]);
    const fallback = await policy.effective({ tenantId: policyTenantA });
    assert.deepEqual([fallback.source, fallback.policyVersion, fallback.fieldLevels.brand], ['product-default', 0, 'OPTIONAL']);
    const changed = { ...fallback.fieldLevels, brand: 'REQUIRED', referenceCost: 'ESSENTIAL' };
    const written = await policy.update(policyContext(policyTenantA), { expectedVersion: 0, fieldLevels: changed });
    assert.deepEqual([written.source, written.policyVersion, written.fieldLevels.brand, written.fieldLevels.referenceCost], ['tenant', 1, 'REQUIRED', 'ESSENTIAL']);
    assert.deepEqual([(await policy.effective({ tenantId: policyTenantB })).source, (await policy.effective({ tenantId: policyTenantB })).fieldLevels.brand], ['product-default', 'OPTIONAL']);
    await assert.rejects(policy.update(policyContext(policyTenantA), { expectedVersion: 0, fieldLevels: changed }), CatalogFieldPolicyConcurrencyConflictError);
    const restored = await policy.reset(policyContext(policyTenantA), { expectedVersion: 1 });
    assert.deepEqual([restored.policyVersion, restored.fieldLevels.brand, restored.fieldLevels.referenceCost], [2, 'OPTIONAL', 'OPTIONAL']);
    const versions = await admin.query(`select policy_version, previous_version, capability, action, field_levels from catalog_field_policy_versions where tenant_id = $1 order by policy_version`, [policyTenantA]);
    assert.deepEqual(versions.rows.map((row) => [row.policy_version, row.previous_version, row.capability, row.action, row.field_levels.brand]), [[1, 0, 'catalog.configuration.manage', 'catalog_field_policy.updated', 'REQUIRED'], [2, 1, 'catalog.configuration.manage', 'catalog_field_policy.reset', 'OPTIONAL']]);
    await assert.rejects(admin.query(`update catalog_field_policy_versions set action = 'catalog_field_policy.updated' where tenant_id = $1 and policy_version = 1`, [policyTenantA]));
  } finally { await connection.close().catch(() => undefined); await admin.end().catch(() => undefined); }
});

test('UX-003.4 enforces required values from the resulting Catalog state and rechecks policy at Apply', { skip: !enabled, timeout: 30_000 }, async () => {
  const admin = new Pool({ host: process.env.SR_PBI041_PG_HOST, port: Number(process.env.SR_PBI041_PG_PORT), database: process.env.SR_PBI041_PG_NAME, user: process.env.SR_PBI041_PG_USER, password: process.env.SR_PBI041_PG_PASSWORD, max: 2 });
  const connection = createDatabaseConnection(config());
  const tenantId = 'f1410000-0000-4000-8000-000000000041'; const branchId = 'f2410000-0000-4000-8000-000000000041';
  const ctx = context(tenantId, branchId);
  const service = new BulkCatalogService(new KyselyBulkCatalogRepository(connection), async () => 'MXN');
  const policy = new CatalogFieldPolicyService(new KyselyCatalogFieldPolicyRepository(connection), () => new Date('2026-09-17T21:00:00.000Z'), () => randomUUID());
  const policyContext = Object.freeze({ ...ctx, capability: 'catalog.configuration.manage' });
  const knownRow = { kind: 'PART', supplierObservedTitle: 'Pantalla QA efectiva', title: 'Pantalla QA efectiva', description: null, category: 'Pantallas', brand: 'Apple', supplierItemCode: 'EFFECTIVE-001', sku: 'EFFECTIVE-001', barcode: 'EFFECTIVE-BAR-001', basePriceMinor: 120_00, referenceCostMinor: null };
  try {
    await admin.query(`insert into tenants (tenant_id, operating_currency, created_at) values ($1, 'MXN', now())`, [tenantId]);
    await admin.query(`insert into branches (tenant_id, branch_id, time_zone, active, created_at) values ($1, $2, 'America/Hermosillo', true, now())`, [tenantId, branchId]);
    await admin.query(`insert into catalog_categories (tenant_id, category_id, kind, display_name, normalized_name, status, version, created_at, updated_at) values ($1, $2, 'PART', 'Pantallas', 'pantallas', 'ACTIVE', 1, now(), now())`, [tenantId, randomUUID()]);
    await admin.query(`insert into catalog_brands (tenant_id, brand_id, display_name, normalized_name, status, version, created_at, updated_at) values ($1, $2, 'Apple', 'apple', 'ACTIVE', 1, now(), now())`, [tenantId, randomUUID()]);
    const source = await service.createSource(ctx, { name: 'Proveedor efectiva QA' });
    const baseline = await service.createDraft(ctx, { sourceId: source.sourceId, description: 'baseline', clientRequestId: randomUUID(), mode: 'FULL', completeness: 'PARTIAL', columnSignature: 'e'.repeat(64), rawPayload: 'effective-baseline', rows: [knownRow] });
    const baselineAnalyzed = await service.analyze(ctx, baseline.versionId, { expectedVersion: baseline.version });
    assert.equal(baselineAnalyzed.batch.lifecycle, 'READY');
    await service.publish(ctx, baseline.versionId, { expectedVersion: baselineAnalyzed.version, clientRequestId: randomUUID() }, false);
    const catalogBefore = Number((await admin.query(`select count(*)::int as count from catalog_items where tenant_id = $1`, [tenantId])).rows[0].count);

    const strictBrand = { ...(await policy.effective({ tenantId })).fieldLevels, brand: 'REQUIRED' };
    await policy.update(policyContext, { expectedVersion: 0, fieldLevels: strictBrand });
    const compactKnown = await service.createDraft(ctx, { sourceId: source.sourceId, description: 'known keeps brand', clientRequestId: randomUUID(), mode: 'COMPACT', completeness: 'PARTIAL', columnSignature: 'e'.repeat(64), rawPayload: 'effective-known', rows: [{ kind: null, supplierObservedTitle: 'Pantalla QA efectiva', title: null, description: null, category: null, brand: null, supplierItemCode: 'EFFECTIVE-001', sku: null, barcode: null, basePriceMinor: 130_00, referenceCostMinor: null }] });
    const compactKnownAnalyzed = await service.analyze(ctx, compactKnown.versionId, { expectedVersion: compactKnown.version });
    assert.deepEqual([compactKnownAnalyzed.batch.lifecycle, compactKnownAnalyzed.rows[0].classification, compactKnownAnalyzed.rows[0].errors], ['READY', 'UPDATE', []]);

    const missingBrand = await service.createDraft(ctx, { sourceId: source.sourceId, description: 'new missing brand', clientRequestId: randomUUID(), mode: 'FULL', completeness: 'PARTIAL', columnSignature: '1'.repeat(64), rawPayload: 'effective-missing-brand', rows: [{ ...knownRow, title: 'Artículo nuevo sin marca', supplierObservedTitle: 'Artículo nuevo sin marca', supplierItemCode: 'EFFECTIVE-NEW', sku: 'EFFECTIVE-NEW', barcode: 'EFFECTIVE-NEW-BAR', brand: null }] });
    const missingBrandAnalyzed = await service.analyze(ctx, missingBrand.versionId, { expectedVersion: missingBrand.version });
    assert.deepEqual([missingBrandAnalyzed.lifecycle, missingBrandAnalyzed.batch.lifecycle, missingBrandAnalyzed.rows[0].classification, missingBrandAnalyzed.rows[0].decision], ['DRAFT', 'RECONCILING', 'NEW', 'UNRESOLVED']);
    assert.deepEqual(missingBrandAnalyzed.rows[0].errors, ['MISSING_REQUIRED_EFFECTIVE_VALUE:brand']);
    assert.equal(Number((await admin.query(`select count(*)::int as count from catalog_items where tenant_id = $1`, [tenantId])).rows[0].count), catalogBefore);

    const strictDescription = { ...strictBrand, description: 'REQUIRED' };
    await policy.update(policyContext, { expectedVersion: 1, fieldLevels: strictDescription });
    await assert.rejects(service.publish(ctx, compactKnown.versionId, { expectedVersion: compactKnownAnalyzed.version, clientRequestId: randomUUID() }, false), (error) => error instanceof CatalogRequiredEffectiveValueError && error.missingFields.includes('description'));
    assert.equal(Number((await admin.query(`select count(*)::int as count from catalog_items where tenant_id = $1`, [tenantId])).rows[0].count), catalogBefore);
  } finally { await connection.close().catch(() => undefined); await admin.end().catch(() => undefined); }
});
