import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import test from 'node:test';

import { Pool } from 'pg';

const enabled = process.env.SR_PBI040_PG_TEST === '1';
const { createDatabaseConnection } = enabled
  ? await import('../dist/infrastructure/database/database-connection.js')
  : {};
const { KyselyCatalogRepository } = enabled
  ? await import('../dist/modules/catalog/infrastructure/persistence/kysely-catalog.repository.js')
  : {};
const { CatalogService } = enabled
  ? await import('../dist/modules/catalog/application/catalog.service.js')
  : {};
const { CatalogConflictError, CatalogNotFoundError, CatalogReferenceAlreadyExistsError, CatalogReferenceInUseError } = enabled
  ? await import('../dist/modules/catalog/domain/catalog-item.js')
  : {};

const tenantA = 'a1200000-0000-4000-8000-000000000040';
const tenantB = 'b1200000-0000-4000-8000-000000000040';
const branchA1 = 'a2200000-0000-4000-8000-000000000040';
const branchA2 = 'a2200000-0000-4000-8000-000000000041';
const branchB1 = 'b2200000-0000-4000-8000-000000000040';
const stationId = 'c1200000-0000-4000-8000-000000000040';
const sessionId = 'd1200000-0000-4000-8000-000000000040';
const actorUserId = 'e1200000-0000-4000-8000-000000000040';

function config() {
  return Object.freeze({
    identity: Object.freeze({
      host: process.env.SR_PBI040_PG_HOST,
      port: Number(process.env.SR_PBI040_PG_PORT),
      database: process.env.SR_PBI040_PG_NAME,
      user: process.env.SR_PBI040_PG_USER,
      password: process.env.SR_PBI040_PG_PASSWORD,
    }),
    transport: Object.freeze({ sslMode: 'disable' }),
    pool: Object.freeze({ min: 0, max: 12, idleTimeoutMs: 1_000, connectionTimeoutMs: 2_000, statementTimeoutMs: 20_000, queryTimeoutMs: 20_000 }),
    runtime: Object.freeze({ environment: 'development', role: 'migration', accessMode: 'read-write', migrationsEnabled: true, testRunId: null }),
    observability: Object.freeze({
      applicationName: 'srtaller-pbi040-catalog-postgresql',
      labels: Object.freeze({ component: 'catalog', environment: 'development', role: 'application' }),
    }),
  });
}

function adminPool() {
  return new Pool({
    host: process.env.SR_PBI040_PG_HOST,
    port: Number(process.env.SR_PBI040_PG_PORT),
    database: process.env.SR_PBI040_PG_NAME,
    user: process.env.SR_PBI040_PG_USER,
    password: process.env.SR_PBI040_PG_PASSWORD,
    application_name: 'srtaller-pbi040-catalog-fixture',
    max: 4,
  });
}

function context(tenantId, branchId) {
  return Object.freeze({
    tenantId, branchId, stationId, sessionId, actorUserId,
    actorDisplayName: 'Owner QA', capability: 'catalog.manage',
    commitGuards: Object.freeze([Object.freeze({
      async confirmCurrent() { return true; },
      async confirmTemporalCurrent() { return true; },
    })]),
  });
}

function command(extra = {}) {
  return { expectedVersion: 0, clientRequestId: randomUUID(), ...extra };
}

async function category(service, ctx, name, kind = 'PART') {
  return service.createCategory(ctx, command({ name, applicableKinds: [kind] }));
}

async function brand(service, ctx, name, applicableKinds = ['PART', 'PRODUCT', 'SERVICE', 'SUPPLY']) {
  return service.createBrand(ctx, command({ name, applicableKinds }));
}

async function item(service, ctx, input) {
  return service.createItem(ctx, command({
    kind: 'PART', title: 'Pantalla iPhone 11 OLED', description: null,
    categoryId: input.categoryId, brandId: input.brandId ?? null,
    sku: input.sku ?? null, barcode: input.barcode ?? null,
    basePriceAmountMinor: input.basePriceAmountMinor ?? 139900,
    referenceCostAmountMinor: input.referenceCostAmountMinor ?? null,
    referenceCostSourceType: input.referenceCostSourceType,
    referenceCostSourceLabel: input.referenceCostSourceLabel,
    ...input,
  }));
}

async function waitForCatalogDeleteLock(admin) {
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    const result = await admin.query(
      `select 1
       from pg_stat_activity
       where application_name = 'srtaller-pbi040-catalog-postgresql'
         and wait_event_type = 'Lock'
         and query ilike '%catalog_categories%'
       limit 1`,
    );
    if (result.rowCount === 1) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  assert.fail('the controlled catalog delete never reached its reference lock');
}

test('PostgreSQL enforces PBI-040 tenant identity, branch pricing, history and fast lookup', { skip: !enabled, timeout: 60_000 }, async () => {
  assert.equal(process.version, 'v24.18.0');
  const admin = adminPool();
  const connection = createDatabaseConnection(config());
  const peerConnection = createDatabaseConnection(config());
  const repository = new KyselyCatalogRepository(connection);
  const peerRepository = new KyselyCatalogRepository(peerConnection);
  const service = new CatalogService(repository, async (tenantId) => {
    const result = await admin.query('select operating_currency from tenants where tenant_id = $1', [tenantId]);
    return result.rows[0]?.operating_currency ?? null;
  });
  const peerService = new CatalogService(peerRepository, async (tenantId) => {
    const result = await admin.query('select operating_currency from tenants where tenant_id = $1', [tenantId]);
    return result.rows[0]?.operating_currency ?? null;
  });
  try {
    await admin.query(
      `insert into tenants (tenant_id, operating_currency, created_at)
       values ($1, 'MXN', now()), ($2, 'USD', now())`,
      [tenantA, tenantB],
    );
    await admin.query(
      `insert into branches (tenant_id, branch_id, time_zone, active, created_at)
       values ($1, $2, 'America/Hermosillo', true, now()),
              ($1, $3, 'America/Hermosillo', true, now()),
              ($4, $5, 'America/Phoenix', true, now())`,
      [tenantA, branchA1, branchA2, tenantB, branchB1],
    );

    const ctxA1 = context(tenantA, branchA1);
    const ctxA2 = context(tenantA, branchA2);
    const ctxB1 = context(tenantB, branchB1);
    const categoryA = await category(service, ctxA1, 'Pantalla');
    const brandA = await brand(service, ctxA1, 'Apple');
    const categoryB = await category(service, ctxB1, 'Pantalla');
    const brandB = await brand(service, ctxB1, 'Apple');
    const serviceCategory = await category(service, ctxA1, 'Mantenimiento', 'SERVICE');
    const supplyCategory = await category(service, ctxA1, 'Consumibles', 'SUPPLY');
    const productCategory = await category(service, ctxA1, 'Fundas', 'PRODUCT');
    const explicitIdentifiers = await item(service, ctxA1, {
      kind: 'PRODUCT', title: 'Termo Owner QA', categoryId: null, categoryCapturedValue: 'Termoz', brandId: null, brandCapturedValue: 'Marca Owner QA',
      sku: 'PRO-TERMO-QA', barcode: 'SRTERMOQA', basePriceAmountMinor: 49900,
    });
    assert.equal(explicitIdentifiers.category.reconciliationStatus, 'PENDING');
    assert.equal(explicitIdentifiers.category.name, 'Termoz');
    assert.equal(explicitIdentifiers.brand.reconciliationStatus, 'PENDING');
    assert.equal(explicitIdentifiers.identifiers.some(({ scheme, value }) => scheme === 'SKU' && value === 'PRO-TERMO-QA'), true);
    assert.equal(explicitIdentifiers.identifiers.some(({ scheme, value }) => scheme === 'BARCODE' && value === 'SRTERMOQA'), true);
    const firstPending = await service.listReferences({ tenantId: tenantA, branchId: branchA1 });
    const pendingCategory = firstPending.pendingCategories.find(({ rawLabel }) => rawLabel === 'Termoz');
    const pendingBrand = firstPending.pendingBrands.find(({ rawLabel }) => rawLabel === 'Marca Owner QA');
    assert.equal(pendingCategory.usageCount, 1);
    assert.equal(pendingCategory.kind, 'PRODUCT');
    assert.deepEqual(pendingBrand.applicableKinds, ['PRODUCT']);
    assert.equal(pendingBrand.capturedBy, 'Owner QA');
    await assert.rejects(service.resolveCategory(ctxB1, pendingCategory.pendingCategoryValueId, {
      canonicalCategoryId: categoryB.categoryId, expectedVersion: pendingCategory.version, clientRequestId: randomUUID(),
    }), CatalogNotFoundError);
    await assert.rejects(service.resolveCategory(ctxA1, pendingCategory.pendingCategoryValueId, {
      canonicalCategoryId: serviceCategory.categoryId, expectedVersion: pendingCategory.version, clientRequestId: randomUUID(),
    }), CatalogConflictError);
    const resolvedPendingCategory = await service.resolveCategory(ctxA1, pendingCategory.pendingCategoryValueId, {
      canonicalCategoryId: productCategory.categoryId, expectedVersion: pendingCategory.version, clientRequestId: randomUUID(),
    });
    assert.equal(resolvedPendingCategory.resolutionStatus, 'RESOLVED');
    const resolvedPendingBrand = await service.resolveBrand(ctxA1, pendingBrand.pendingBrandValueId, {
      canonicalBrandId: brandA.brandId, expectedVersion: pendingBrand.version, clientRequestId: randomUUID(),
    });
    assert.equal(resolvedPendingBrand.resolutionStatus, 'RESOLVED');
    const resolvedExistingItem = await service.getItem({ tenantId: tenantA, branchId: branchA1 }, explicitIdentifiers.itemId);
    assert.equal(resolvedExistingItem.category.categoryId, productCategory.categoryId);
    assert.equal(resolvedExistingItem.category.pendingCategoryValueId, pendingCategory.pendingCategoryValueId);
    assert.equal(resolvedExistingItem.brand.brandId, brandA.brandId);
    assert.equal(resolvedExistingItem.brand.pendingBrandValueId, pendingBrand.pendingBrandValueId);

    const newCanonicalItem = await item(service, ctxA1, {
      kind: 'PRODUCT', title: 'Accesorio capturado', categoryId: null, categoryCapturedValue: 'Accesorio Premium', brandId: null, brandCapturedValue: 'Casa QA', basePriceAmountMinor: 25000,
    });
    const secondPending = await service.listReferences({ tenantId: tenantA, branchId: branchA1 });
    const newCategoryPending = secondPending.pendingCategories.find(({ rawLabel }) => rawLabel === 'Accesorio Premium');
    const newBrandPending = secondPending.pendingBrands.find(({ rawLabel }) => rawLabel === 'Casa QA');
    const createdCategoryResolution = await service.resolveCategory(ctxA1, newCategoryPending.pendingCategoryValueId, {
      canonicalName: 'Accesorios premium', applicableKinds: ['PRODUCT'], expectedVersion: newCategoryPending.version, clientRequestId: randomUUID(),
    });
    const createdBrandResolution = await service.resolveBrand(ctxA1, newBrandPending.pendingBrandValueId, {
      canonicalName: 'Casa QA', applicableKinds: ['PART', 'PRODUCT'], expectedVersion: newBrandPending.version, clientRequestId: randomUUID(),
    });
    assert.equal(createdCategoryResolution.canonicalName, 'Accesorios premium');
    assert.deepEqual(createdBrandResolution.applicableKinds, ['PRODUCT']);
    const resolvedNewItem = await service.getItem({ tenantId: tenantA, branchId: branchA1 }, newCanonicalItem.itemId);
    assert.equal(resolvedNewItem.category.name, 'Accesorios premium');
    assert.equal(resolvedNewItem.brand.name, 'Casa QA');

    for (const [index, capturedCategory] of ['Fundas', 'fundas', '  FUNDAS  ', 'fúndas'].entries()) {
      const reused = await item(service, ctxA1, { kind: 'PRODUCT', title: `Coincidencia exacta ${index}`, categoryId: null, categoryCapturedValue: capturedCategory, basePriceAmountMinor: 10000 });
      assert.equal(reused.category.categoryId, productCategory.categoryId);
      assert.equal(reused.category.pendingCategoryValueId, null);
      assert.equal(reused.category.reconciliationStatus, 'CANONICAL');
    }
    const noDuplicatePending = await service.listReferences({ tenantId: tenantA, branchId: branchA1 });
    assert.equal(noDuplicatePending.pendingCategories.some(({ normalizedKey, kind }) => normalizedKey === 'fundas' && kind === 'PRODUCT'), false);
    const singularCandidate = await item(service, ctxA1, { kind: 'PRODUCT', title: 'Coincidencia no difusa', categoryId: null, categoryCapturedValue: 'Funda', basePriceAmountMinor: 10000 });
    assert.equal(singularCandidate.category.reconciliationStatus, 'PENDING');
    const renameCandidate = await category(service, ctxA1, 'Estuches', 'PRODUCT');
    await assert.rejects(service.updateCategory(ctxA1, renameCandidate.categoryId, command({ name: ' FÚNDA ', status: 'ACTIVE', applicableKinds: ['PRODUCT'], expectedVersion: renameCandidate.version })), CatalogConflictError);
    const sameNameOtherKind = await category(service, ctxA1, 'Fundas', 'SERVICE');
    assert.deepEqual(sameNameOtherKind.applicableKinds, ['SERVICE']);
    await assert.rejects(category(service, ctxA1, ' FUNDAS ', 'PRODUCT'), CatalogReferenceAlreadyExistsError);

    const reusedBrandItem = await item(service, ctxA1, { kind: 'PRODUCT', title: 'Marca exacta reutilizada', categoryId: productCategory.categoryId, brandId: null, brandCapturedValue: '  ÁPPLE ', basePriceAmountMinor: 10000 });
    assert.equal(reusedBrandItem.brand.brandId, brandA.brandId);
    assert.equal(reusedBrandItem.brand.pendingBrandValueId, null);
    const serviceOnlyBrand = await brand(service, ctxA1, 'Marca multi tipo', ['SERVICE']);
    const expandedBrandItem = await item(service, ctxA1, { kind: 'PRODUCT', title: 'Marca reutilizada', categoryId: productCategory.categoryId, brandId: null, brandCapturedValue: '  MARCA   MULTI TIPO ', basePriceAmountMinor: 10000 });
    assert.equal(expandedBrandItem.brand.brandId, serviceOnlyBrand.brandId);
    assert.equal(expandedBrandItem.brand.pendingBrandValueId, null);
    const expandedBrand = (await service.listReferences({ tenantId: tenantA, branchId: branchA1 })).brands.find(({ brandId }) => brandId === serviceOnlyBrand.brandId);
    assert.deepEqual(expandedBrand.applicableKinds, ['PRODUCT', 'SERVICE']);
    const expansionAudit = await admin.query("select change_summary from catalog_audit_events where tenant_id = $1 and resource_id = $2 and action = 'catalog.item.create'", [tenantA, expandedBrandItem.itemId]);
    assert.deepEqual(expansionAudit.rows[0].change_summary.expandedBrandApplicability, ['PRODUCT']);

    const concurrentCaptured = await Promise.all([
      item(service, ctxA1, { kind: 'PRODUCT', title: 'Captura concurrente A', categoryId: null, categoryCapturedValue: 'Conectores especiales', basePriceAmountMinor: 10000 }),
      item(peerService, ctxA1, { kind: 'PRODUCT', title: 'Captura concurrente B', categoryId: null, categoryCapturedValue: ' conectores   ESPECIALES ', basePriceAmountMinor: 10000 }),
    ]);
    assert.equal(concurrentCaptured.every((created) => created.category.reconciliationStatus === 'PENDING'), true);
    assert.equal(new Set(concurrentCaptured.map((created) => created.category.pendingCategoryValueId)).size, 1);
    assert.equal((await admin.query("select count(*)::int as count from catalog_category_pending_values where tenant_id = $1 and kind = 'PRODUCT' and normalized_key = 'conectores especiales'", [tenantA])).rows[0].count, 1);
    const concurrentCanonical = await Promise.allSettled([
      category(service, ctxA1, 'Cables concurrentes', 'PRODUCT'),
      category(peerService, ctxA1, ' cables   CONCURRENTES ', 'PRODUCT'),
    ]);
    assert.equal(concurrentCanonical.filter(({ status }) => status === 'fulfilled').length, 1);
    assert.equal(concurrentCanonical.filter(({ status, reason }) => status === 'rejected' && reason instanceof CatalogReferenceAlreadyExistsError).length, 1);
    assert.equal((await admin.query("select count(*)::int as count from catalog_categories where tenant_id = $1 and kind = 'PRODUCT' and normalized_name = 'cables concurrentes'", [tenantA])).rows[0].count, 1);

    const tenantBExact = await item(service, ctxB1, { kind: 'PART', title: 'Aislamiento Tenant B', categoryId: null, categoryCapturedValue: ' PANTALLA ', basePriceAmountMinor: 10000 });
    assert.equal(tenantBExact.category.categoryId, categoryB.categoryId);
    assert.notEqual(tenantBExact.category.categoryId, categoryA.categoryId);

    const historicalPendingId = randomUUID();
    const historicalItemId = randomUUID();
    await admin.query(`insert into catalog_category_pending_values (
      tenant_id, pending_category_value_id, raw_label_example, normalized_key, kind, resolution_status,
      canonical_category_id, version, first_seen_at, last_seen_at, captured_by_actor_id,
      captured_by_actor_display_name, captured_in_branch_id, captured_in_station_id, captured_in_session_id,
      resolved_by_actor_id, resolved_at
    ) values ($1, $2, ' PANTALLA ', 'pantalla', 'PART', 'PENDING', null, 1, now() - interval '2 days', now() - interval '1 day', $3, 'Fixture histórico', $4, $5, $6, null, null)`, [tenantA, historicalPendingId, actorUserId, branchA1, stationId, sessionId]);
    await admin.query(`insert into catalog_items (
      tenant_id, item_id, kind, title, normalized_title, description, category_id, brand_id,
      pending_category_value_id, pending_brand_value_id, status, sellable, stockable, purchasable,
      applicable_to_repair, version, created_at, updated_at
    ) values ($1, $2, 'PART', 'Fixture duplicado histórico', 'fixture duplicado historico', null, null, null, $3, null, 'ACTIVE', true, true, true, true, 1, now(), now())`, [tenantA, historicalItemId, historicalPendingId]);
    const historicalPending = (await service.listReferences({ tenantId: tenantA, branchId: branchA1 })).pendingCategories.find(({ pendingCategoryValueId }) => pendingCategoryValueId === historicalPendingId);
    assert.equal(historicalPending.rawLabel, ' PANTALLA ');
    await assert.rejects(service.resolveCategory(ctxA1, historicalPendingId, { canonicalName: '  PANTALLA ', applicableKinds: ['PART'], expectedVersion: 1, clientRequestId: randomUUID() }), CatalogReferenceAlreadyExistsError);
    const historicalResolution = await service.resolveCategory(ctxA1, historicalPendingId, { canonicalCategoryId: categoryA.categoryId, expectedVersion: 1, clientRequestId: randomUUID() });
    assert.equal(historicalResolution.canonicalCategoryId, categoryA.categoryId);
    const historicalRow = (await admin.query('select raw_label_example, captured_by_actor_display_name, first_seen_at, resolved_at from catalog_category_pending_values where tenant_id = $1 and pending_category_value_id = $2', [tenantA, historicalPendingId])).rows[0];
    assert.equal(historicalRow.raw_label_example, ' PANTALLA ');
    assert.equal(historicalRow.captured_by_actor_display_name, 'Fixture histórico');
    assert.ok(historicalRow.first_seen_at < historicalRow.resolved_at);
    assert.equal((await service.getItem({ tenantId: tenantA, branchId: branchA1 }, historicalItemId)).category.categoryId, categoryA.categoryId);

    const partA = await item(service, ctxA1, {
      categoryId: categoryA.categoryId, brandId: brandA.brandId,
      sku: 'REF-IP11-OLED',
      barcode: 'SR00000042',
      referenceCostAmountMinor: 48000,
      referenceCostSourceType: 'THIRD_PARTY',
      referenceCostSourceLabel: 'Lista proveedor septiembre',
    });
    const partB = await item(service, ctxB1, {
      categoryId: categoryB.categoryId, brandId: brandB.brandId,
      sku: 'REF-IP11-OLED', title: 'Tenant B private item',
      barcode: 'SR00000042',
      basePriceAmountMinor: 99900,
    });
    assert.equal(partA.identifiers.some(({ value }) => value === 'REF-IP11-OLED'), true);
    assert.equal(partB.identifiers.some(({ value }) => value === 'REF-IP11-OLED'), true);
    assert.equal(partA.identifiers.some(({ scheme, value }) => scheme === 'BARCODE' && /^SR\d{8}$/u.test(value)), true);
    assert.equal(await repository.getItem({ tenantId: tenantB, branchId: branchB1 }, partA.itemId), null);
    await assert.rejects(
      item(service, ctxA1, { categoryId: categoryB.categoryId, sku: 'REF-CROSS-TENANT' }),
      CatalogNotFoundError,
    );

    const byName = await service.search({ tenantId: tenantA, branchId: branchA1 }, { query: 'iPhone OLED', pageSize: 25 }, false);
    assert.equal(byName.totalCount, 1);
    assert.equal(Object.hasOwn(byName.items[0], 'referenceCost'), false);
    assert.equal(byName.items[0].price.amountMinor, 139900);
    assert.equal(byName.items[0].price.currency, 'MXN');
    assert.equal(byName.items[0].price.source, 'TENANT_BASE');
    const bySku = await service.search({ tenantId: tenantA, branchId: branchA1 }, { query: 'ref-ip11-oled' }, false);
    assert.equal(bySku.items[0].item.itemId, partA.itemId);
    const byBarcode = await service.search({ tenantId: tenantA, branchId: branchA1 }, { query: 'sr00000042' }, false);
    assert.equal(byBarcode.items[0].item.itemId, partA.itemId);
    const byKind = await service.search({ tenantId: tenantA, branchId: branchA1 }, { query: '', kind: 'PART' }, false);
    assert.equal(byKind.items.some((entry) => entry.item.itemId === partA.itemId), true);
    const withCost = await service.search({ tenantId: tenantA, branchId: branchA1 }, { query: 'REF-IP11-OLED' }, true);
    assert.equal(withCost.items[0].referenceCost.amountMinor, 48000);
    assert.equal(withCost.items[0].referenceCost.sourceType, 'THIRD_PARTY');

    const serviceItem = await item(service, ctxA1, {
      kind: 'SERVICE', title: 'Limpieza centro de carga', categoryId: serviceCategory.categoryId,
      sku: null, basePriceAmountMinor: 35000,
    });
    assert.deepEqual(serviceItem.capabilities, { sellable: true, stockable: false, purchasable: false, applicableToRepair: true });
    const supply = await item(service, ctxA1, {
      kind: 'SUPPLY', title: 'Alcohol isopropílico', categoryId: supplyCategory.categoryId,
      sku: 'INS-ALCOHOL', basePriceAmountMinor: 10000,
    });
    assert.equal(supply.capabilities.sellable, false);
    assert.equal((await service.search({ tenantId: tenantA, branchId: branchA1 }, { query: 'alcohol' }, false)).totalCount, 0);
    await assert.rejects(
      async () => service.search({ tenantId: tenantA, branchId: branchA1 }, { query: '', kind: 'SUPPLY' }, false),
      (error) => error?.parameter === 'kind',
    );

    const operationalReferences = await service.listOperationalReferences({ tenantId: tenantA, branchId: branchA1 });
    assert.equal(operationalReferences.categoryBrandApplicability.some((entry) => entry.categoryId === categoryA.categoryId && entry.brandId === brandA.brandId && entry.kind === 'PART'), true);
    assert.equal(operationalReferences.categoryBrandApplicability.some((entry) => entry.kind === 'SUPPLY'), false);

    const override = await service.changeBranchOverride(ctxA1, serviceItem.itemId, {
      amountMinor: 39900, reason: 'Precio plaza', expectedVersion: serviceItem.version, clientRequestId: randomUUID(),
    }, false);
    assert.equal(override.version, 2);
    const priceA1 = await service.search({ tenantId: tenantA, branchId: branchA1 }, { query: serviceItem.identifiers[0].value }, false);
    const priceA2 = await service.search({ tenantId: tenantA, branchId: branchA2 }, { query: serviceItem.identifiers[0].value }, false);
    assert.deepEqual([priceA1.items[0].price.amountMinor, priceA1.items[0].price.source], [39900, 'BRANCH_OVERRIDE']);
    assert.deepEqual([priceA2.items[0].price.amountMinor, priceA2.items[0].price.source], [35000, 'TENANT_BASE']);
    await assert.rejects(
      service.changeBasePrice(ctxA1, serviceItem.itemId, { amountMinor: 36000, expectedVersion: 1, clientRequestId: randomUUID() }),
      CatalogConflictError,
    );
    const revoked = await service.changeBranchOverride(ctxA1, serviceItem.itemId, {
      reason: 'Restaurar herencia', expectedVersion: override.version, clientRequestId: randomUUID(),
    }, true);
    assert.equal(revoked.version, 3);
    const inherited = await service.search({ tenantId: tenantA, branchId: branchA1 }, { query: serviceItem.identifiers[0].value }, false);
    assert.deepEqual([inherited.items[0].price.amountMinor, inherited.items[0].price.source], [35000, 'TENANT_BASE']);
    await assert.rejects(
      service.changeBranchOverride(context(tenantA, branchB1), serviceItem.itemId, {
        amountMinor: 50000, expectedVersion: revoked.version, clientRequestId: randomUUID(),
      }, false),
      CatalogConflictError,
    );

    const duplicateInputs = [service, peerService].map((writer, index) => item(writer, ctxA1, {
      kind: 'PRODUCT', title: `Funda duplicada ${index}`, categoryId: productCategory.categoryId,
      sku: 'PRO-DUPLICATE', basePriceAmountMinor: 29900,
    }));
    const duplicateResults = await Promise.allSettled(duplicateInputs);
    assert.equal(duplicateResults.filter(({ status }) => status === 'fulfilled').length, 1);
    assert.equal(duplicateResults.filter(({ status, reason }) => status === 'rejected' && reason instanceof CatalogConflictError).length, 1);

    await item(service, ctxA1, {
      kind: 'PRODUCT', title: 'Funda barcode único', categoryId: productCategory.categoryId,
      sku: 'PRO-BARCODE-0', barcode: 'SRDUPLICATE42', basePriceAmountMinor: 29900,
    });
    await assert.rejects(
      item(service, ctxA1, {
        kind: 'PRODUCT', title: 'Funda barcode duplicado', categoryId: productCategory.categoryId,
        sku: 'PRO-BARCODE-1', barcode: 'SRDUPLICATE42', basePriceAmountMinor: 29900,
      }),
      CatalogConflictError,
    );

    const inactive = duplicateResults.find(({ status }) => status === 'fulfilled').value;
    const inactivated = await service.updateItem(ctxA1, inactive.itemId, {
      title: inactive.title, description: inactive.description,
      categoryId: inactive.category.categoryId, brandId: null, status: 'INACTIVE',
      expectedVersion: inactive.version, clientRequestId: randomUUID(),
    });
    assert.equal(inactivated.status, 'INACTIVE');
    const identifiersBeforeEdit = inactive.identifiers;
    const reloadedAfterEdit = await service.getItem({ tenantId: tenantA, branchId: branchA1 }, inactive.itemId);
    assert.deepEqual(reloadedAfterEdit.identifiers, identifiersBeforeEdit);
    assert.equal((await service.search({ tenantId: tenantA, branchId: branchA1 }, { query: 'PRO-DUPLICATE' }, false)).totalCount, 0);
    await assert.rejects(
      item(service, ctxA1, { kind: 'PRODUCT', title: 'Reuse forbidden', categoryId: productCategory.categoryId, sku: 'PRO-DUPLICATE' }),
      CatalogConflictError,
    );

    const history = await admin.query(
      `select
         (select count(*)::int from catalog_base_price_revisions where tenant_id = $1 and item_id = $2) as base_count,
         (select count(*)::int from catalog_branch_price_revisions where tenant_id = $1 and item_id = $2) as override_count,
         (select count(*)::int from catalog_audit_events where tenant_id = $1 and resource_id = $2) as audit_count`,
      [tenantA, serviceItem.itemId],
    );
    assert.deepEqual(history.rows[0], { base_count: 1, override_count: 2, audit_count: 3 });
    await assert.rejects(
      admin.query('update catalog_base_price_revisions set amount_minor = 1 where tenant_id = $1 and item_id = $2', [tenantA, serviceItem.itemId]),
      (error) => error?.code === '23514',
    );

    const disposableCategory = await category(service, ctxA1, 'Categoría temporal', 'PRODUCT');
    const disposableBrand = await brand(service, ctxA1, 'Marca temporal', ['PRODUCT']);
    const referencesBeforeDelete = await service.listReferences({ tenantId: tenantA, branchId: branchA1 });
    assert.equal(referencesBeforeDelete.categories.find(({ categoryId }) => categoryId === disposableCategory.categoryId)?.deletable, true);
    assert.equal(referencesBeforeDelete.brands.find(({ brandId }) => brandId === disposableBrand.brandId)?.deletable, true);
    const categoryDeleteRequest = { expectedVersion: disposableCategory.version, clientRequestId: randomUUID() };
    const deletedCategory = await service.deleteCategory(ctxA1, disposableCategory.categoryId, categoryDeleteRequest);
    const deletedBrand = await service.deleteBrand(ctxA1, disposableBrand.brandId, { expectedVersion: disposableBrand.version, clientRequestId: randomUUID() });
    assert.deepEqual([deletedCategory.kind, deletedBrand.kind], ['category', 'brand']);
    assert.equal((await service.listReferences({ tenantId: tenantA, branchId: branchA1 })).categories.some(({ categoryId }) => categoryId === disposableCategory.categoryId), false);
    assert.deepEqual(await service.deleteCategory(ctxA1, disposableCategory.categoryId, categoryDeleteRequest), deletedCategory);

    const usedReferences = await service.listReferences({ tenantId: tenantA, branchId: branchA1 });
    assert.equal(usedReferences.categories.find(({ categoryId }) => categoryId === categoryA.categoryId)?.deletable, false);
    assert.equal(usedReferences.brands.find(({ brandId }) => brandId === brandA.brandId)?.deletable, false);
    await assert.rejects(service.deleteCategory(ctxA1, categoryA.categoryId, { expectedVersion: categoryA.version, clientRequestId: randomUUID() }), CatalogReferenceInUseError);
    await assert.rejects(service.deleteBrand(ctxA1, brandA.brandId, { expectedVersion: brandA.version, clientRequestId: randomUUID() }), CatalogReferenceInUseError);
    await assert.rejects(service.deleteCategory(ctxB1, categoryA.categoryId, { expectedVersion: categoryA.version, clientRequestId: randomUUID() }), CatalogNotFoundError);

    const staleCategory = await category(service, ctxA1, 'Categoría stale', 'SERVICE');
    await assert.rejects(service.deleteCategory(ctxA1, staleCategory.categoryId, { expectedVersion: staleCategory.version + 1, clientRequestId: randomUUID() }), CatalogConflictError);
    await service.deleteCategory(ctxA1, staleCategory.categoryId, { expectedVersion: staleCategory.version, clientRequestId: randomUUID() });

    const concurrentCategory = await category(service, ctxA1, 'Categoría concurrente', 'PRODUCT');
    const concurrentItemId = randomUUID();
    const referencingWriter = await admin.connect();
    try {
      await referencingWriter.query('begin');
      await referencingWriter.query(
        `insert into catalog_items (
           tenant_id, item_id, kind, title, normalized_title, description,
           category_id, brand_id, pending_category_value_id, pending_brand_value_id,
           status, sellable, stockable, purchasable, applicable_to_repair,
           version, created_at, updated_at
         ) values (
           $1, $2, 'PRODUCT', 'Uso concurrente', 'uso concurrente', null,
           $3, null, null, null,
           'ACTIVE', true, true, true, false,
           1, now(), now()
         )`,
        [tenantA, concurrentItemId, concurrentCategory.categoryId],
      );
      const concurrentDelete = service.deleteCategory(ctxA1, concurrentCategory.categoryId, {
        expectedVersion: concurrentCategory.version,
        clientRequestId: randomUUID(),
      });
      await waitForCatalogDeleteLock(admin);
      await referencingWriter.query('commit');
      await assert.rejects(concurrentDelete, CatalogReferenceInUseError);
    } catch (error) {
      await referencingWriter.query('rollback').catch(() => undefined);
      throw error;
    } finally {
      referencingWriter.release();
    }
    assert.equal((await service.listReferences({ tenantId: tenantA, branchId: branchA1 })).categories.find(({ categoryId }) => categoryId === concurrentCategory.categoryId)?.deletable, false);
    assert.equal((await admin.query('select count(*)::int as count from catalog_items where tenant_id = $1 and item_id = $2', [tenantA, concurrentItemId])).rows[0].count, 1);

    const mergeCategoryA = await category(service, ctxA1, 'Pantallas merge', 'PRODUCT');
    const mergeCategoryB = await category(service, ctxA1, 'Pantallas QA merge', 'PRODUCT');
    const mergeItemA = await item(service, ctxA1, { kind: 'PRODUCT', title: 'Merge producto A', categoryId: mergeCategoryA.categoryId, basePriceAmountMinor: 10100 });
    const mergeItemB = await item(service, ctxA1, { kind: 'PRODUCT', title: 'Merge producto B', categoryId: mergeCategoryB.categoryId, basePriceAmountMinor: 20200 });
    const categoryMergeRequest = {
      references: [
        { referenceId: mergeCategoryA.categoryId, expectedVersion: mergeCategoryA.version },
        { referenceId: mergeCategoryB.categoryId, expectedVersion: mergeCategoryB.version },
      ],
      survivorReferenceId: mergeCategoryA.categoryId,
      finalName: 'Pantallas consolidadas',
      clientRequestId: randomUUID(),
    };
    const categoryMerge = await service.mergeCategories(ctxA1, categoryMergeRequest);
    assert.equal(categoryMerge.survivor.categoryId, mergeCategoryA.categoryId);
    assert.equal(categoryMerge.survivor.name, 'Pantallas consolidadas');
    assert.equal(categoryMerge.survivor.usageCount, 2);
    assert.equal(categoryMerge.reassignedItemCount, 1);
    assert.deepEqual(categoryMerge.sourceReferenceIds, [mergeCategoryB.categoryId]);
    assert.deepEqual(await service.mergeCategories(ctxA1, categoryMergeRequest), categoryMerge);
    const mergedCategoryReferences = await service.listReferences({ tenantId: tenantA, branchId: branchA1 });
    assert.equal(mergedCategoryReferences.categories.some(({ categoryId }) => categoryId === mergeCategoryB.categoryId), false);
    assert.equal(mergedCategoryReferences.categories.find(({ categoryId }) => categoryId === mergeCategoryA.categoryId)?.usageCount, 2);
    assert.equal((await service.getItem({ tenantId: tenantA, branchId: branchA1 }, mergeItemB.itemId)).category.categoryId, mergeCategoryA.categoryId);
    const categorySourceState = (await admin.query('select status, merged_into_id from catalog_categories where tenant_id = $1 and category_id = $2', [tenantA, mergeCategoryB.categoryId])).rows[0];
    assert.deepEqual(categorySourceState, { status: 'INACTIVE', merged_into_id: mergeCategoryA.categoryId });
    assert.equal((await admin.query('select amount_minor::int amount_minor from catalog_base_price_revisions where tenant_id = $1 and item_id = $2', [tenantA, mergeItemB.itemId])).rows[0].amount_minor, 20200);

    const incompatibleCategory = await category(service, ctxA1, 'Merge incompatible', 'SERVICE');
    await assert.rejects(service.mergeCategories(ctxA1, {
      references: [
        { referenceId: mergeCategoryA.categoryId, expectedVersion: categoryMerge.version },
        { referenceId: incompatibleCategory.categoryId, expectedVersion: incompatibleCategory.version },
      ], survivorReferenceId: mergeCategoryA.categoryId, finalName: 'No permitido', clientRequestId: randomUUID(),
    }), CatalogConflictError);
    await assert.rejects(service.mergeCategories(ctxB1, {
      references: [
        { referenceId: mergeCategoryA.categoryId, expectedVersion: categoryMerge.version },
        { referenceId: incompatibleCategory.categoryId, expectedVersion: incompatibleCategory.version },
      ], survivorReferenceId: mergeCategoryA.categoryId, finalName: 'Cross tenant', clientRequestId: randomUUID(),
    }), CatalogNotFoundError);
    const collidingCategory = await category(service, ctxA1, 'Nombre ocupado merge', 'PRODUCT');
    const otherMergeCategory = await category(service, ctxA1, 'Otro merge', 'PRODUCT');
    await assert.rejects(service.mergeCategories(ctxA1, {
      references: [
        { referenceId: mergeCategoryA.categoryId, expectedVersion: categoryMerge.version },
        { referenceId: otherMergeCategory.categoryId, expectedVersion: otherMergeCategory.version },
      ], survivorReferenceId: mergeCategoryA.categoryId, finalName: collidingCategory.name, clientRequestId: randomUUID(),
    }), CatalogReferenceAlreadyExistsError);

    const mergeBrandA = await brand(service, ctxA1, 'Apple merge QA', ['PART']);
    const mergeBrandB = await brand(service, ctxA1, 'Apple merge final', ['PRODUCT', 'SERVICE']);
    const mergeBrandPartItem = await item(service, ctxA1, { title: 'Brand merge part', categoryId: categoryA.categoryId, brandId: mergeBrandA.brandId, basePriceAmountMinor: 30300 });
    const mergeBrandProductItem = await item(service, ctxA1, { kind: 'PRODUCT', title: 'Brand merge product', categoryId: productCategory.categoryId, brandId: mergeBrandB.brandId, basePriceAmountMinor: 40400 });
    const brandMerge = await service.mergeBrands(ctxA1, {
      references: [
        { referenceId: mergeBrandA.brandId, expectedVersion: mergeBrandA.version },
        { referenceId: mergeBrandB.brandId, expectedVersion: mergeBrandB.version },
      ], survivorReferenceId: mergeBrandB.brandId, finalName: 'Apple unificada', clientRequestId: randomUUID(),
    });
    assert.deepEqual(brandMerge.applicabilityAfter, ['PART', 'PRODUCT', 'SERVICE']);
    assert.equal(brandMerge.survivor.usageCount, 2);
    assert.equal((await service.getItem({ tenantId: tenantA, branchId: branchA1 }, mergeBrandPartItem.itemId)).brand.brandId, mergeBrandB.brandId);
    assert.equal((await service.getItem({ tenantId: tenantA, branchId: branchA1 }, mergeBrandProductItem.itemId)).brand.brandId, mergeBrandB.brandId);

    const inlineEditItem = await item(service, ctxA1, { kind: 'PRODUCT', title: 'Edición inline pendiente', categoryId: productCategory.categoryId, brandId: brandA.brandId, basePriceAmountMinor: 50500 });
    const editedPending = await service.updateItem(ctxA1, inlineEditItem.itemId, {
      title: inlineEditItem.title, description: inlineEditItem.description,
      categoryId: null, categoryCapturedValue: 'Categoría editada QA',
      brandId: null, brandCapturedValue: 'Marca editada QA', status: 'ACTIVE',
      expectedVersion: inlineEditItem.version, clientRequestId: randomUUID(),
    });
    assert.equal(editedPending.category.reconciliationStatus, 'PENDING');
    assert.equal(editedPending.brand.reconciliationStatus, 'PENDING');
    const editPendingReferences = await service.listReferences({ tenantId: tenantA, branchId: branchA1 });
    const editedPendingCategory = editPendingReferences.pendingCategories.find(({ rawLabel }) => rawLabel === 'Categoría editada QA');
    const editedPendingBrand = editPendingReferences.pendingBrands.find(({ rawLabel }) => rawLabel === 'Marca editada QA');
    assert.equal(editedPendingCategory.usageCount, 1);
    assert.equal(editedPendingBrand.usageCount, 1);
    assert.equal(editedPendingCategory.capturedBy, 'Owner QA');
    assert.ok(new Date(editedPendingCategory.lastSeenAt) >= new Date(editedPendingCategory.firstSeenAt));

    const exactEditItem = await item(service, ctxA1, { kind: 'PRODUCT', title: 'Edición exacta', categoryId: productCategory.categoryId, brandId: null, basePriceAmountMinor: 60600 });
    const exactEdited = await service.updateItem(ctxA1, exactEditItem.itemId, {
      title: exactEditItem.title, description: null, categoryId: null, categoryCapturedValue: ' FÚNDAS ',
      brandId: null, brandCapturedValue: ' APPLE ', status: 'ACTIVE', expectedVersion: exactEditItem.version, clientRequestId: randomUUID(),
    });
    assert.equal(exactEdited.category.categoryId, productCategory.categoryId);
    assert.equal(exactEdited.category.pendingCategoryValueId, null);
    assert.equal(exactEdited.brand.brandId, brandA.brandId);
    const editExpandedBrand = await brand(service, ctxA1, 'Brand edit expansion', ['SERVICE']);
    const expansionEditItem = await item(service, ctxA1, { kind: 'PRODUCT', title: 'Edit expansion', categoryId: productCategory.categoryId, basePriceAmountMinor: 70700 });
    const expansionEdited = await service.updateItem(ctxA1, expansionEditItem.itemId, {
      title: expansionEditItem.title, description: null, categoryId: productCategory.categoryId,
      brandId: null, brandCapturedValue: ' brand edit expansion ', status: 'ACTIVE', expectedVersion: expansionEditItem.version, clientRequestId: randomUUID(),
    });
    assert.equal(expansionEdited.brand.brandId, editExpandedBrand.brandId);
    assert.equal((await service.listReferences({ tenantId: tenantA, branchId: branchA1 })).brands.find(({ brandId }) => brandId === editExpandedBrand.brandId)?.applicableKinds.includes('PRODUCT'), true);

    const rollbackCategoryA = await category(service, ctxA1, 'Rollback merge A', 'PRODUCT');
    const rollbackCategoryB = await category(service, ctxA1, 'Rollback merge B', 'PRODUCT');
    const deniedContext = Object.freeze({ ...ctxA1, commitGuards: Object.freeze([{ async confirmCurrent() { return false; }, async confirmTemporalCurrent() { return true; } }]) });
    await assert.rejects(service.mergeCategories(deniedContext, {
      references: [{ referenceId: rollbackCategoryA.categoryId, expectedVersion: 1 }, { referenceId: rollbackCategoryB.categoryId, expectedVersion: 1 }],
      survivorReferenceId: rollbackCategoryA.categoryId, finalName: 'No commit', clientRequestId: randomUUID(),
    }), (error) => error?.name === 'CatalogAuthorizationChangedError');
    assert.equal((await service.listReferences({ tenantId: tenantA, branchId: branchA1 })).categories.filter(({ categoryId }) => [rollbackCategoryA.categoryId, rollbackCategoryB.categoryId].includes(categoryId)).length, 2);

    const concurrentMergeA = await category(service, ctxA1, 'Concurrent merge A', 'PRODUCT');
    const concurrentMergeB = await category(service, ctxA1, 'Concurrent merge B', 'PRODUCT');
    const concurrentMergeC = await category(service, ctxA1, 'Concurrent merge C', 'PRODUCT');
    const concurrentMerges = await Promise.allSettled([
      service.mergeCategories(ctxA1, { references: [{ referenceId: concurrentMergeA.categoryId, expectedVersion: 1 }, { referenceId: concurrentMergeB.categoryId, expectedVersion: 1 }], survivorReferenceId: concurrentMergeA.categoryId, finalName: 'Concurrent survivor', clientRequestId: randomUUID() }),
      peerService.mergeCategories(ctxA1, { references: [{ referenceId: concurrentMergeA.categoryId, expectedVersion: 1 }, { referenceId: concurrentMergeC.categoryId, expectedVersion: 1 }], survivorReferenceId: concurrentMergeA.categoryId, finalName: 'Concurrent survivor', clientRequestId: randomUUID() }),
    ]);
    assert.equal(concurrentMerges.filter(({ status }) => status === 'fulfilled').length, 1);
    assert.equal(concurrentMerges.filter(({ status }) => status === 'rejected').length, 1);

    const raceCreateSurvivor = await category(service, ctxA1, 'Race create survivor', 'PRODUCT');
    const raceCreateSource = await category(service, ctxA1, 'Race create source', 'PRODUCT');
    const createMergeRace = await Promise.allSettled([
      service.mergeCategories(ctxA1, { references: [{ referenceId: raceCreateSurvivor.categoryId, expectedVersion: 1 }, { referenceId: raceCreateSource.categoryId, expectedVersion: 1 }], survivorReferenceId: raceCreateSurvivor.categoryId, finalName: 'Race create final', clientRequestId: randomUUID() }),
      item(peerService, ctxA1, { kind: 'PRODUCT', title: 'Concurrent create during merge', categoryId: raceCreateSource.categoryId, basePriceAmountMinor: 80800 }),
    ]);
    assert.equal(createMergeRace.some(({ status }) => status === 'fulfilled'), true);
    const raceCreateState = (await admin.query('select merged_into_id from catalog_categories where tenant_id=$1 and category_id=$2', [tenantA, raceCreateSource.categoryId])).rows[0];
    const raceCreateUsage = (await admin.query('select count(*)::int count from catalog_items where tenant_id=$1 and category_id=$2', [tenantA, raceCreateSource.categoryId])).rows[0].count;
    assert.equal(raceCreateState.merged_into_id === null ? raceCreateUsage <= 1 : raceCreateUsage === 0, true, JSON.stringify({ raceCreateState, raceCreateUsage, outcomes: createMergeRace.map(({ status, reason }) => ({ status, reason: reason?.name })) }));

    const raceEditSurvivor = await category(service, ctxA1, 'Race edit survivor', 'PRODUCT');
    const raceEditSource = await category(service, ctxA1, 'Race edit source', 'PRODUCT');
    const raceEditItem = await item(service, ctxA1, { kind: 'PRODUCT', title: 'Concurrent edit during merge', categoryId: raceEditSource.categoryId, basePriceAmountMinor: 90900 });
    const editMergeRace = await Promise.allSettled([
      service.mergeCategories(ctxA1, { references: [{ referenceId: raceEditSurvivor.categoryId, expectedVersion: 1 }, { referenceId: raceEditSource.categoryId, expectedVersion: 1 }], survivorReferenceId: raceEditSurvivor.categoryId, finalName: 'Race edit final', clientRequestId: randomUUID() }),
      peerService.updateItem(ctxA1, raceEditItem.itemId, { title: raceEditItem.title, description: null, categoryId: productCategory.categoryId, brandId: null, status: 'ACTIVE', expectedVersion: raceEditItem.version, clientRequestId: randomUUID() }),
    ]);
    assert.equal(editMergeRace.some(({ status }) => status === 'fulfilled'), true);
    assert.notEqual((await service.getItem({ tenantId: tenantA, branchId: branchA1 }, raceEditItem.itemId)).category.categoryId, raceEditSource.categoryId);

    const raceDeleteSurvivor = await category(service, ctxA1, 'Race delete survivor', 'PRODUCT');
    const raceDeleteSource = await category(service, ctxA1, 'Race delete source', 'PRODUCT');
    const deleteMergeRace = await Promise.allSettled([
      service.mergeCategories(ctxA1, { references: [{ referenceId: raceDeleteSurvivor.categoryId, expectedVersion: 1 }, { referenceId: raceDeleteSource.categoryId, expectedVersion: 1 }], survivorReferenceId: raceDeleteSurvivor.categoryId, finalName: 'Race delete final', clientRequestId: randomUUID() }),
      peerService.deleteCategory(ctxA1, raceDeleteSource.categoryId, { expectedVersion: 1, clientRequestId: randomUUID() }),
    ]);
    assert.equal(deleteMergeRace.filter(({ status }) => status === 'fulfilled').length, 1);
    const raceDeleteSourceRows = (await admin.query('select count(*)::int count from catalog_categories where tenant_id=$1 and category_id=$2', [tenantA, raceDeleteSource.categoryId])).rows[0].count;
    const raceDeleteSourceVisible = (await service.listReferences({ tenantId: tenantA, branchId: branchA1 })).categories.some(({ categoryId }) => categoryId === raceDeleteSource.categoryId);
    assert.equal(raceDeleteSourceRows === 0 || !raceDeleteSourceVisible, true);

    const raceReconcileSurvivor = await category(service, ctxA1, 'Race reconcile survivor', 'PRODUCT');
    const raceReconcileSource = await category(service, ctxA1, 'Race reconcile source', 'PRODUCT');
    const racePendingItem = await item(service, ctxA1, { kind: 'PRODUCT', title: 'Concurrent reconciliation during merge', categoryId: null, categoryCapturedValue: 'Race reconciliation pending', basePriceAmountMinor: 100100 });
    const racePending = (await service.listReferences({ tenantId: tenantA, branchId: branchA1 })).pendingCategories.find(({ rawLabel }) => rawLabel === 'Race reconciliation pending');
    const reconcileMergeRace = await Promise.allSettled([
      service.mergeCategories(ctxA1, { references: [{ referenceId: raceReconcileSurvivor.categoryId, expectedVersion: 1 }, { referenceId: raceReconcileSource.categoryId, expectedVersion: 1 }], survivorReferenceId: raceReconcileSurvivor.categoryId, finalName: 'Race reconcile final', clientRequestId: randomUUID() }),
      peerService.resolveCategory(ctxA1, racePending.pendingCategoryValueId, { canonicalCategoryId: raceReconcileSource.categoryId, expectedVersion: racePending.version, clientRequestId: randomUUID() }),
    ]);
    assert.equal(reconcileMergeRace.some(({ status }) => status === 'fulfilled'), true);
    const reconciledRaceItem = await service.getItem({ tenantId: tenantA, branchId: branchA1 }, racePendingItem.itemId);
    const raceReconcileSourceState = (await admin.query('select merged_into_id from catalog_categories where tenant_id=$1 and category_id=$2', [tenantA, raceReconcileSource.categoryId])).rows[0];
    if (raceReconcileSourceState.merged_into_id !== null) assert.notEqual(reconciledRaceItem.category.categoryId, raceReconcileSource.categoryId);
    const racePendingState = (await admin.query('select resolution_status, canonical_category_id from catalog_category_pending_values where tenant_id=$1 and pending_category_value_id=$2', [tenantA, racePending.pendingCategoryValueId])).rows[0];
    assert.equal(raceReconcileSourceState.merged_into_id === null || racePendingState.canonical_category_id === null || racePendingState.canonical_category_id === raceReconcileSurvivor.categoryId, true);

    const mergeEvidence = await admin.query('select reference_kind, survivor_reference_id, source_reference_ids, previous_names, reassigned_item_count, applicability_after, actor_user_id, correlation_id from catalog_reference_merge_events where tenant_id = $1 order by occurred_at', [tenantA]);
    assert.equal(mergeEvidence.rows.some(({ reference_kind }) => reference_kind === 'CATEGORY'), true);
    assert.equal(mergeEvidence.rows.some(({ reference_kind, applicability_after }) => reference_kind === 'BRAND' && applicability_after.values.includes('PART') && applicability_after.values.includes('PRODUCT')), true);
    assert.equal(mergeEvidence.rows.every(({ actor_user_id, correlation_id }) => actor_user_id === actorUserId && typeof correlation_id === 'string'), true);
    await assert.rejects(admin.query("update catalog_reference_merge_events set final_name = 'mutated' where tenant_id = $1", [tenantA]), (error) => error?.code === '23514');

    const deleteEvidence = await admin.query(`select reference_kind, result, rejection_reason from catalog_reference_deletion_events where tenant_id = $1 order by occurred_at, event_id`, [tenantA]);
    assert.equal(deleteEvidence.rows.some(({ reference_kind, result }) => reference_kind === 'CATEGORY' && result === 'succeeded'), true);
    assert.equal(deleteEvidence.rows.some(({ reference_kind, result, rejection_reason }) => reference_kind === 'BRAND' && result === 'rejected' && rejection_reason === 'reference_in_use'), true);
    await assert.rejects(admin.query(`update catalog_reference_deletion_events set previous_label = 'mutated' where tenant_id = $1`, [tenantA]), (error) => error?.code === '23514');

    await admin.query(
      `with inserted as (
         insert into catalog_items (
           tenant_id, item_id, kind, title, normalized_title, description,
           category_id, brand_id, pending_category_value_id, pending_brand_value_id, status, sellable, stockable, purchasable,
           applicable_to_repair, version, created_at, updated_at
         )
         select $1, gen_random_uuid(), 'PRODUCT', 'Benchmark item ' || value,
                'benchmark item ' || lpad(value::text, 5, '0'), null,
                $2, null, null, null, 'ACTIVE', true, true, true, false, 1, now(), now()
         from generate_series(1, 10000) as values(value)
         returning tenant_id, item_id
       )
       insert into catalog_base_price_revisions (
         tenant_id, revision_id, item_id, amount_minor, currency, item_version,
         reason, actor_user_id, correlation_id, effective_from
       )
       select tenant_id, gen_random_uuid(), item_id, 10000, 'MXN', 1,
              'Benchmark seed', $3, gen_random_uuid(), now()
       from inserted`,
      [tenantA, productCategory.categoryId, actorUserId],
    );
    const durations = [];
    for (let index = 0; index < 20; index += 1) {
      const started = performance.now();
      const result = await service.search(
        { tenantId: tenantA, branchId: index % 2 === 0 ? branchA1 : branchA2 },
        { query: 'benchmark item 09999', page: 1, pageSize: 25 },
        false,
      );
      durations.push(performance.now() - started);
      assert.equal(result.totalCount, 1);
      assert.equal(result.items.length, 1);
    }
    durations.sort((left, right) => left - right);
    const p95 = durations[Math.ceil(durations.length * 0.95) - 1];
    assert.ok(p95 <= 750, `local p95 ${p95.toFixed(2)}ms exceeded the 750ms Owner-QA budget`);
    process.stdout.write(`PBI-040 catalog search benchmark: 10000 items, p95=${p95.toFixed(2)}ms, budget=750ms\n`);
  } finally {
    await connection.close().catch(() => undefined);
    await peerConnection.close().catch(() => undefined);
    await admin.end();
  }
});
