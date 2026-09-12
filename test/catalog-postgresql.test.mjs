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
const { CatalogConflictError, CatalogNotFoundError } = enabled
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

test('PostgreSQL enforces PBI-040 tenant identity, branch pricing, history and fast lookup', { skip: !enabled, timeout: 60_000 }, async () => {
  assert.equal(process.version, 'v24.18.0');
  const admin = adminPool();
  const connection = createDatabaseConnection(config());
  const repository = new KyselyCatalogRepository(connection);
  const service = new CatalogService(repository, async (tenantId) => {
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
    const pendingCategory = await service.createCategory(ctxA1, command({ name: 'Termos', applicableKinds: ['PRODUCT'] }), 'PENDING');
    const pendingBrand = await service.createBrand(ctxA1, command({ name: 'Marca Owner QA', applicableKinds: ['PRODUCT'] }), 'PENDING');
    assert.equal(pendingCategory.reviewStatus, 'PENDING');
    assert.deepEqual(pendingCategory.applicableKinds, ['PRODUCT']);
    assert.equal(pendingBrand.reviewStatus, 'PENDING');
    await assert.rejects(
      item(service, ctxA1, { kind: 'PART', title: 'Combinación inválida', categoryId: pendingCategory.categoryId, brandId: pendingBrand.brandId }),
      CatalogNotFoundError,
    );
    const explicitIdentifiers = await item(service, ctxA1, {
      kind: 'PRODUCT', title: 'Termo Owner QA', categoryId: pendingCategory.categoryId, brandId: pendingBrand.brandId,
      sku: 'PRO-TERMO-QA', barcode: 'SRTERMOQA', basePriceAmountMinor: 49900,
    });
    assert.equal(explicitIdentifiers.identifiers.some(({ scheme, value }) => scheme === 'SKU' && value === 'PRO-TERMO-QA'), true);
    assert.equal(explicitIdentifiers.identifiers.some(({ scheme, value }) => scheme === 'BARCODE' && value === 'SRTERMOQA'), true);
    const approvedPendingBrand = await service.resolveBrand(ctxA1, pendingBrand.brandId, {
      resolution: 'APPROVE', targetId: null, expectedVersion: pendingBrand.version, clientRequestId: randomUUID(),
    });
    assert.equal(approvedPendingBrand.reviewStatus, 'APPROVED');
    const mergedPendingCategory = await service.resolveCategory(ctxA1, pendingCategory.categoryId, {
      resolution: 'MERGE', targetId: productCategory.categoryId, expectedVersion: pendingCategory.version, clientRequestId: randomUUID(),
    });
    assert.equal(mergedPendingCategory.reviewStatus, 'MERGED');
    assert.equal((await service.getItem({ tenantId: tenantA, branchId: branchA1 }, explicitIdentifiers.itemId)).category.categoryId, productCategory.categoryId);

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

    const duplicateInputs = [0, 1].map((index) => item(service, ctxA1, {
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

    await admin.query(
      `with inserted as (
         insert into catalog_items (
           tenant_id, item_id, kind, title, normalized_title, description,
           category_id, brand_id, status, sellable, stockable, purchasable,
           applicable_to_repair, version, created_at, updated_at
         )
         select $1, gen_random_uuid(), 'PRODUCT', 'Benchmark item ' || value,
                'benchmark item ' || lpad(value::text, 5, '0'), null,
                $2, null, 'ACTIVE', true, true, true, false, 1, now(), now()
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
    await admin.end();
  }
});
