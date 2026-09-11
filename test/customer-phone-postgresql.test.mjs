import assert from 'node:assert/strict';
import test from 'node:test';

import { Pool } from 'pg';

const enabled = process.env.SR_PBI039_PG_TEST === '1';
const { createDatabaseConnection } = enabled
  ? await import('../dist/infrastructure/database/database-connection.js')
  : {};
const { KyselyCustomerIntakeRepository, normalizeCustomerPhone } = enabled
  ? await import('../dist/modules/customers/infrastructure/persistence/kysely-customer-intake.repository.js')
  : {};

const tenantA = 'aa100000-0000-4000-8000-000000000001';
const tenantB = 'bb100000-0000-4000-8000-000000000002';
const branchA = 'aa200000-0000-4000-8000-000000000001';
const branchA2 = 'aa200000-0000-4000-8000-000000000002';
const branchB = 'bb200000-0000-4000-8000-000000000002';
const customerA = 'aa300000-0000-4000-8000-000000000001';
const customerA2 = 'aa300000-0000-4000-8000-000000000002';
const customerB = 'bb300000-0000-4000-8000-000000000002';
const phoneA = '521111111111';
const sharedPhone = '529991112222';

function databaseConfig() {
  return Object.freeze({
    identity: Object.freeze({
      host: process.env.SR_PBI039_PG_HOST,
      port: Number(process.env.SR_PBI039_PG_PORT),
      database: process.env.SR_PBI039_PG_NAME,
      user: process.env.SR_PBI039_PG_USER,
      password: process.env.SR_PBI039_PG_PASSWORD,
    }),
    transport: Object.freeze({ sslMode: 'disable' }),
    pool: Object.freeze({ min: 0, max: 4, idleTimeoutMs: 1_000, connectionTimeoutMs: 2_000, statementTimeoutMs: 10_000, queryTimeoutMs: 10_000 }),
    runtime: Object.freeze({ environment: 'development', role: 'migration', accessMode: 'read-write', migrationsEnabled: true, testRunId: null }),
    observability: Object.freeze({
      applicationName: 'srtaller-customer-phone-postgresql-review',
      labels: Object.freeze({ component: 'customers', environment: 'development', role: 'migration' }),
    }),
  });
}

function adminPool() {
  return new Pool({
    host: process.env.SR_PBI039_PG_HOST,
    port: Number(process.env.SR_PBI039_PG_PORT),
    database: process.env.SR_PBI039_PG_NAME,
    user: process.env.SR_PBI039_PG_USER,
    password: process.env.SR_PBI039_PG_PASSWORD,
    application_name: 'srtaller-customer-phone-postgresql-fixture',
    max: 2,
  });
}

async function removeFixture(admin) {
  await admin.query('delete from customer_contact_phones where tenant_id = any($1::uuid[])', [[tenantA, tenantB]]);
  await admin.query('delete from customers where tenant_id = any($1::uuid[])', [[tenantA, tenantB]]);
  await admin.query('delete from branches where tenant_id = any($1::uuid[])', [[tenantA, tenantB]]);
  await admin.query('delete from tenants where tenant_id = any($1::uuid[])', [[tenantA, tenantB]]);
}

test('Customer phone search hydrates matched Customer-owned phones and stays isolated across Tenant and Branch', { skip: !enabled }, async () => {
  assert.equal(process.version, 'v24.18.0');
  assert.equal(normalizeCustomerPhone('+52 (999) 111-2222'), sharedPhone);
  assert.equal(normalizeCustomerPhone('52 999 111 2222'), sharedPhone);
  const admin = adminPool();
  const connection = createDatabaseConnection(databaseConfig());
  const repository = new KyselyCustomerIntakeRepository(connection);
  try {
    await removeFixture(admin);
    await admin.query('insert into tenants (tenant_id, created_at) values ($1, now()), ($2, now())', [tenantA, tenantB]);
    await admin.query('insert into branches (tenant_id, branch_id, created_at) values ($1, $2, now()), ($3, $4, now())', [tenantA, branchA, tenantB, branchB]);
    await admin.query(`insert into customers (customer_id, tenant_id, branch_id, given_name, family_name, created_at)
      values ($1, $2, $3, 'Owner Search Alpha', 'Branch One', now()), ($4, $5, $6, 'Owner Search Beta', 'Branch Two', now())`,
    [customerA, tenantA, branchA, customerB, tenantB, branchB]);
    await admin.query(`insert into customer_contact_phones (customer_contact_phone_id, tenant_id, branch_id, customer_id, phone_normalized, created_at)
      values
        ('aa400000-0000-4000-8000-000000000001', $1, $2, $3, $4, '2026-09-09T00:00:00.000Z'),
        ('aa400000-0000-4000-8000-000000000002', $1, $2, $3, $5, '2026-09-09T00:01:00.000Z'),
        ('bb400000-0000-4000-8000-000000000002', $6, $7, $8, $5, '2026-09-09T00:00:00.000Z')`,
    [tenantA, branchA, customerA, phoneA, sharedPhone, tenantB, branchB, customerB]);
    await admin.query('insert into branches (tenant_id, branch_id, created_at) values ($1, $2, now())', [tenantA, branchA2]);
    await admin.query("insert into customers (customer_id, tenant_id, branch_id, given_name, family_name, created_at) values ($1, $2, $3, 'Owner Search Neighbor', 'Branch Two', now())", [customerA2, tenantA, branchA2]);
    await admin.query("insert into customer_contact_phones (customer_contact_phone_id, tenant_id, branch_id, customer_id, phone_normalized, created_at) values ('aa400000-0000-4000-8000-000000000003', $1, $2, $3, $4, now())", [tenantA, branchA2, customerA2, sharedPhone]);

    const byFullName = await repository.search({ tenantId: tenantA, branchId: branchA }, 'Owner Search Alpha Branch One');
    const byFamilyName = await repository.search({ tenantId: tenantA, branchId: branchA }, 'Branch One');
    const tenantABySharedPhone = await repository.search({ tenantId: tenantA, branchId: branchA }, '+52 (999) 111-2222');
    const tenantBBySharedPhone = await repository.search({ tenantId: tenantB, branchId: branchB }, '529991112222');
    const neighboringBranchBySharedPhone = await repository.search({ tenantId: tenantA, branchId: branchA2 }, sharedPhone);

    assert.deepEqual(byFullName, [{ customerId: customerA, givenName: 'Owner Search Alpha', familyName: 'Branch One', displayName: 'Owner Search Alpha Branch One', contactPhone: phoneA, contactPhones: [phoneA, sharedPhone], matchedPhone: null }]);
    assert.deepEqual(byFamilyName, byFullName);
    assert.deepEqual(tenantABySharedPhone, [{ ...byFullName[0], matchedPhone: sharedPhone }]);
    assert.deepEqual(tenantBBySharedPhone, [{ customerId: customerB, givenName: 'Owner Search Beta', familyName: 'Branch Two', displayName: 'Owner Search Beta Branch Two', contactPhone: sharedPhone, contactPhones: [sharedPhone], matchedPhone: sharedPhone }]);
    assert.deepEqual(neighboringBranchBySharedPhone, [{ customerId: customerA2, givenName: 'Owner Search Neighbor', familyName: 'Branch Two', displayName: 'Owner Search Neighbor Branch Two', contactPhone: sharedPhone, contactPhones: [sharedPhone], matchedPhone: sharedPhone }]);
  } finally {
    await removeFixture(admin).catch(() => undefined);
    await connection.close().catch(() => undefined);
    await admin.end();
  }
});
