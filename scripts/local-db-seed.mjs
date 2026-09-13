import { Pool } from 'pg';

import {
  cleanChildEnvironment,
  databaseEnvironment,
  ensureLocalEnvironment,
  localAccessCapabilityRows,
  localAccessRoleAssignmentRows,
  localAccessRoleCapabilityRows,
  localAccessRoleRows,
  localRepairIntakeRows,
  localRepairInterventionRiskRows,
  localRepairProblemClassificationRows,
  localRepairRows,
  localRepairTimelineRows,
  localRepairEvidenceRows,
  localRepairCatalogRows,
  localRepairTechnicianRows,
  localRepairTechnicianBranchRows,
  localRepairTechnicianAssignmentRows,
  localRepairWorkflowTransitionRows,
  localRepairLocationRows,
  localRepairLocationMovementRows,
  localSeedRows,
  localUserRows,
  LOCAL_OWNER_USER_ID,
  LOCAL_STATION_CREDENTIAL_ID,
  LOCAL_STATION_ID,
  localStationBootstrapCredentialHash,
} from './lib/local-development.mjs';
import { materializeLocalEvidenceFixtures } from './lib/local-evidence-fixtures.mjs';
import { localPinCredentialRows } from './lib/local-pin-fixtures.mjs';
import { grantApplicationAccess, localDbUp } from './local-db.mjs';

const values = await ensureLocalEnvironment();
await localDbUp();
await grantApplicationAccess(values);
const environment = databaseEnvironment(values, 'application');
const pool = new Pool({
  application_name: environment.SR_DB_APPLICATION_NAME,
  connectionTimeoutMillis: Number(environment.SR_DB_CONNECTION_TIMEOUT_MS),
  database: environment.SR_DB_NAME,
  host: environment.SR_DB_HOST,
  idleTimeoutMillis: Number(environment.SR_DB_IDLE_TIMEOUT_MS),
  max: Number(environment.SR_DB_POOL_MAX),
  password: environment.SR_DB_PASSWORD,
  port: Number(environment.SR_DB_PORT),
  query_timeout: Number(environment.SR_DB_QUERY_TIMEOUT_MS),
  ssl: false,
  statement_timeout: Number(environment.SR_DB_STATEMENT_TIMEOUT_MS),
  user: environment.SR_DB_USER,
});

const rows = localSeedRows();
const repairCatalogs = localRepairCatalogRows();
const catalogReviewFixture = Object.freeze({
  actorId: LOCAL_OWNER_USER_ID,
  actorDisplayName: 'Owner local sintético',
  sessionId: '00000000-0000-4000-8000-000000039001',
  categoryIds: Object.freeze({
    part: '00000000-0000-4000-8000-000000031001',
    product: '00000000-0000-4000-8000-000000031002',
    pending: '00000000-0000-4000-8000-000000033001',
  }),
  brandIds: Object.freeze({
    apple: '00000000-0000-4000-8000-000000032001',
    pending: '00000000-0000-4000-8000-000000034001',
  }),
  itemIds: Object.freeze([
    '00000000-0000-4000-8000-000000035001',
    '00000000-0000-4000-8000-000000035002',
    '00000000-0000-4000-8000-000000035003',
  ]),
  repairPendingDeviceTypeId: '00000000-0000-4000-8000-000000029001',
});
const pinCredentials = await localPinCredentialRows({
  ...values,
  SR_LOCAL_PIN_JORGE: process.env.SR_LOCAL_PIN_JORGE ?? values.SR_LOCAL_PIN_JORGE,
  SR_LOCAL_PIN_MARIA: process.env.SR_LOCAL_PIN_MARIA ?? values.SR_LOCAL_PIN_MARIA,
  SR_LOCAL_PIN_CARLOS: process.env.SR_LOCAL_PIN_CARLOS ?? values.SR_LOCAL_PIN_CARLOS,
  SR_LOCAL_PIN_LUIS: process.env.SR_LOCAL_PIN_LUIS ?? values.SR_LOCAL_PIN_LUIS,
});
await materializeLocalEvidenceFixtures();
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query(
    `INSERT INTO tenants (tenant_id, operating_currency, created_at) VALUES ($1::uuid, 'MXN', $2::timestamptz)
     ON CONFLICT (tenant_id) DO UPDATE SET created_at = EXCLUDED.created_at`,
    [rows.tenant.tenantId, rows.tenant.createdAt],
  );
  for (const branch of rows.branches) {
    await client.query(
      `INSERT INTO branches (tenant_id, branch_id, time_zone, active, created_at) VALUES ($1::uuid, $2::uuid, $3, $4, $5::timestamptz)
       ON CONFLICT (tenant_id, branch_id) DO UPDATE SET time_zone = EXCLUDED.time_zone, active = EXCLUDED.active, created_at = EXCLUDED.created_at`,
      [branch.tenantId, branch.branchId, branch.timeZone, branch.active, branch.createdAt],
    );
  }
  for (const user of localUserRows()) {
    await client.query(
      `INSERT INTO users (user_id, tenant_id, display_name, operational_identifier, status, version, created_at, updated_at)
       VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7::timestamptz, $8::timestamptz)
       ON CONFLICT (tenant_id, user_id) DO UPDATE SET display_name = EXCLUDED.display_name, operational_identifier = EXCLUDED.operational_identifier, status = EXCLUDED.status, version = EXCLUDED.version, updated_at = EXCLUDED.updated_at`,
      [user.userId, user.tenantId, user.displayName, user.operationalIdentifier, user.status, user.version, user.createdAt, user.updatedAt],
    );
  }
  for (const credential of pinCredentials) {
    await client.query(
      `INSERT INTO access_pin_credentials (
         tenant_id, user_id, credential_id, status, algorithm,
         profile_version, pepper_version, memory_kib, passes, parallelism,
         salt, verifier, lookup_digest, credential_version, consecutive_failures,
         locked_until, created_at, updated_at, revoked_at
       ) SELECT
         $1::uuid, $2::uuid, $3::uuid, 'active', $4,
         $5, $6, $7, $8, $9,
         $10::bytea, $11::bytea, $12::bytea, 0, 0,
         null, $13::timestamptz, $13::timestamptz, null
       WHERE EXISTS (
         SELECT 1 FROM users WHERE tenant_id = $1::uuid AND user_id = $2::uuid
       )
       ON CONFLICT (tenant_id, user_id) DO UPDATE SET
         algorithm = EXCLUDED.algorithm,
         profile_version = EXCLUDED.profile_version,
         pepper_version = EXCLUDED.pepper_version,
         memory_kib = EXCLUDED.memory_kib,
         passes = EXCLUDED.passes,
         parallelism = EXCLUDED.parallelism,
         salt = EXCLUDED.salt,
         verifier = EXCLUDED.verifier,
         lookup_digest = EXCLUDED.lookup_digest,
         credential_version = access_pin_credentials.credential_version + 1,
         consecutive_failures = 0,
         locked_until = null,
         updated_at = greatest(EXCLUDED.updated_at, access_pin_credentials.updated_at)
       WHERE access_pin_credentials.lookup_digest IS NULL`,
      [
        credential.tenantId,
        credential.userId,
        credential.credentialId,
        credential.algorithm,
        credential.profileVersion,
        credential.pepperVersion,
        credential.memoryKiB,
        credential.passes,
        credential.parallelism,
        credential.salt,
        credential.verifier,
        credential.lookupDigest,
        credential.createdAt,
      ],
    );
    if (!credential.existingUserOnly) await client.query(
      `INSERT INTO access_pin_credential_commands (
         tenant_id, client_request_id, user_id, credential_id, command_type,
         request_fingerprint, result_status, result_credential_version,
         result_created_at, result_updated_at, applied_at
       )
       SELECT $1::uuid, $2::uuid, $3::uuid, $4::uuid, 'provision',
         $5::bytea, 'active', 0, $6::timestamptz, $6::timestamptz, $6::timestamptz
       WHERE EXISTS (
         SELECT 1 FROM access_pin_credentials
         WHERE tenant_id = $1::uuid AND user_id = $3::uuid AND credential_id = $4::uuid
       )
       ON CONFLICT (tenant_id, client_request_id) DO NOTHING`,
      [
        credential.tenantId,
        credential.clientRequestId,
        credential.userId,
        credential.credentialId,
        credential.requestFingerprint,
        credential.createdAt,
      ],
    );
  }
  for (const capability of localAccessCapabilityRows()) {
    await client.query(
      `INSERT INTO access_capabilities (capability_code, created_at)
       VALUES ($1, $2::timestamptz)
       ON CONFLICT (capability_code) DO UPDATE SET created_at = EXCLUDED.created_at`,
      [capability.capabilityCode, capability.createdAt],
    );
  }
  for (const role of localAccessRoleRows()) {
    await client.query(
      `INSERT INTO access_roles (
         tenant_id, role_id, role_key, display_name, status, version,
         created_at, updated_at
       ) VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7::timestamptz, $8::timestamptz)
       ON CONFLICT (tenant_id, role_id) DO UPDATE SET
         role_key = EXCLUDED.role_key,
         display_name = EXCLUDED.display_name,
         status = EXCLUDED.status,
         version = EXCLUDED.version,
         updated_at = EXCLUDED.updated_at`,
      [
        role.tenantId,
        role.roleId,
        role.roleKey,
        role.displayName,
        role.status,
        role.version,
        role.createdAt,
        role.updatedAt,
      ],
    );
  }
  for (const capability of localAccessRoleCapabilityRows()) {
    await client.query(
      `INSERT INTO access_role_capabilities (
         tenant_id, role_id, capability_code, created_at
       ) VALUES ($1::uuid, $2::uuid, $3, $4::timestamptz)
       ON CONFLICT (tenant_id, role_id, capability_code) DO NOTHING`,
      [
        capability.tenantId,
        capability.roleId,
        capability.capabilityCode,
        capability.createdAt,
      ],
    );
  }
  for (const assignment of localAccessRoleAssignmentRows()) {
    await client.query(
      `INSERT INTO access_role_assignments (
         tenant_id, assignment_id, user_id, role_id, assignment_scope,
         branch_id, status, version, assigned_at, revoked_at
       ) VALUES (
         $1::uuid, $2::uuid, $3::uuid, $4::uuid, $5,
         $6::uuid, $7, $8, $9::timestamptz, $10::timestamptz
       )
       ON CONFLICT (tenant_id, assignment_id) DO UPDATE SET
         user_id = EXCLUDED.user_id,
         role_id = EXCLUDED.role_id,
         assignment_scope = EXCLUDED.assignment_scope,
         branch_id = EXCLUDED.branch_id,
         status = EXCLUDED.status,
         version = EXCLUDED.version,
         revoked_at = EXCLUDED.revoked_at`,
      [
        assignment.tenantId,
        assignment.assignmentId,
        assignment.userId,
        assignment.roleId,
        assignment.assignmentScope,
        assignment.branchId,
        assignment.status,
        assignment.version,
        assignment.assignedAt,
        assignment.revokedAt,
      ],
    );
  }
  await client.query(
    `INSERT INTO stations (tenant_id, station_id, status, created_at, updated_at, revoked_at)
     VALUES ($1::uuid, $2::uuid, 'active', $3::timestamptz, $3::timestamptz, null)
     ON CONFLICT (tenant_id, station_id) DO UPDATE SET status = 'active', updated_at = EXCLUDED.updated_at, revoked_at = null`,
    [rows.tenant.tenantId, LOCAL_STATION_ID, rows.tenant.createdAt],
  );
  await client.query(
    `INSERT INTO station_bindings (tenant_id, station_id, branch_id, revoked_at, created_at)
     VALUES ($1::uuid, $2::uuid, $3::uuid, null, $4::timestamptz)
     ON CONFLICT (tenant_id, station_id) DO UPDATE SET branch_id = EXCLUDED.branch_id, revoked_at = null`,
    [rows.tenant.tenantId, LOCAL_STATION_ID, rows.branches[0].branchId, rows.tenant.createdAt],
  );
  await client.query(
    `INSERT INTO station_credentials (credential_id, credential_hash, tenant_id, station_id, revoked_at, created_at)
     VALUES ($1::uuid, $2, $3::uuid, $4::uuid, null, $5::timestamptz)
     ON CONFLICT (credential_id) DO UPDATE SET credential_hash = EXCLUDED.credential_hash, revoked_at = null`,
    [LOCAL_STATION_CREDENTIAL_ID, localStationBootstrapCredentialHash(values), rows.tenant.tenantId, LOCAL_STATION_ID, rows.tenant.createdAt],
  );
  await client.query(
    `INSERT INTO catalog_categories (
       tenant_id, category_id, display_name, normalized_name, kind, status,
       created_by_actor_id, created_in_branch_id, created_in_station_id,
       created_in_session_id, version, created_at, updated_at
     ) VALUES
       ($1::uuid, $2::uuid, 'Pantallas', 'pantallas', 'PART', 'ACTIVE', $3::uuid, $4::uuid, $5::uuid, $6::uuid, 1, $7::timestamptz, $7::timestamptz),
       ($1::uuid, $8::uuid, 'Fundas', 'fundas', 'PRODUCT', 'ACTIVE', $3::uuid, $4::uuid, $5::uuid, $6::uuid, 1, $7::timestamptz, $7::timestamptz)
     ON CONFLICT (tenant_id, category_id) DO UPDATE SET
       display_name = EXCLUDED.display_name, normalized_name = EXCLUDED.normalized_name,
       kind = EXCLUDED.kind, status = EXCLUDED.status, updated_at = EXCLUDED.updated_at`,
    [rows.tenant.tenantId, catalogReviewFixture.categoryIds.part, catalogReviewFixture.actorId,
      rows.branches[0].branchId, LOCAL_STATION_ID, catalogReviewFixture.sessionId,
      rows.tenant.createdAt, catalogReviewFixture.categoryIds.product],
  );
  await client.query(
    `INSERT INTO catalog_category_kind_applicability (tenant_id, category_id, kind)
     VALUES ($1::uuid, $2::uuid, 'PART'), ($1::uuid, $3::uuid, 'PRODUCT')
     ON CONFLICT (tenant_id, category_id, kind) DO NOTHING`,
    [rows.tenant.tenantId, catalogReviewFixture.categoryIds.part, catalogReviewFixture.categoryIds.product],
  );
  await client.query(
    `INSERT INTO catalog_brands (
       tenant_id, brand_id, display_name, normalized_name, status,
       created_by_actor_id, created_in_branch_id, created_in_station_id,
       created_in_session_id, version, created_at, updated_at
     ) VALUES ($1::uuid, $2::uuid, 'Apple', 'apple', 'ACTIVE', $3::uuid, $4::uuid, $5::uuid, $6::uuid, 1, $7::timestamptz, $7::timestamptz)
     ON CONFLICT (tenant_id, brand_id) DO UPDATE SET
       display_name = EXCLUDED.display_name, normalized_name = EXCLUDED.normalized_name,
       status = EXCLUDED.status, updated_at = EXCLUDED.updated_at`,
    [rows.tenant.tenantId, catalogReviewFixture.brandIds.apple, catalogReviewFixture.actorId,
      rows.branches[0].branchId, LOCAL_STATION_ID, catalogReviewFixture.sessionId, rows.tenant.createdAt],
  );
  await client.query(
    `INSERT INTO catalog_brand_kind_applicability (tenant_id, brand_id, kind)
     VALUES ($1::uuid, $2::uuid, 'PART'), ($1::uuid, $2::uuid, 'PRODUCT')
     ON CONFLICT (tenant_id, brand_id, kind) DO NOTHING`,
    [rows.tenant.tenantId, catalogReviewFixture.brandIds.apple],
  );
  await client.query(
    `INSERT INTO catalog_category_pending_values (
       tenant_id, pending_category_value_id, raw_label_example, normalized_key, kind,
       resolution_status, canonical_category_id, version, first_seen_at, last_seen_at,
       captured_by_actor_id, captured_by_actor_display_name, captured_in_branch_id,
       captured_in_station_id, captured_in_session_id, resolved_by_actor_id, resolved_at
     ) VALUES ($1::uuid, $2::uuid, 'Fundas premium', 'fundas premium', 'PRODUCT',
       'PENDING', null, 1, $3::timestamptz, $4::timestamptz, $5::uuid, $6,
       $7::uuid, $8::uuid, $9::uuid, null, null)
     ON CONFLICT (tenant_id, pending_category_value_id) DO NOTHING`,
    [rows.tenant.tenantId, catalogReviewFixture.categoryIds.pending,
      '2026-08-20T16:00:00.000Z', '2026-08-22T18:30:00.000Z', catalogReviewFixture.actorId,
      catalogReviewFixture.actorDisplayName, rows.branches[0].branchId, LOCAL_STATION_ID,
      catalogReviewFixture.sessionId],
  );
  await client.query(
    `INSERT INTO catalog_brand_pending_values (
       tenant_id, pending_brand_value_id, raw_label_example, normalized_key,
       resolution_status, canonical_brand_id, version, first_seen_at, last_seen_at,
       captured_by_actor_id, captured_by_actor_display_name, captured_in_branch_id,
       captured_in_station_id, captured_in_session_id, resolved_by_actor_id, resolved_at
     ) VALUES ($1::uuid, $2::uuid, 'Aple', 'aple', 'PENDING', null, 1,
       $3::timestamptz, $4::timestamptz, $5::uuid, $6, $7::uuid, $8::uuid, $9::uuid, null, null)
     ON CONFLICT (tenant_id, pending_brand_value_id) DO NOTHING`,
    [rows.tenant.tenantId, catalogReviewFixture.brandIds.pending,
      '2026-08-21T15:00:00.000Z', '2026-08-23T19:00:00.000Z', catalogReviewFixture.actorId,
      catalogReviewFixture.actorDisplayName, rows.branches[0].branchId, LOCAL_STATION_ID,
      catalogReviewFixture.sessionId],
  );
  await client.query(
    `INSERT INTO catalog_brand_pending_kind_applicability (tenant_id, pending_brand_value_id, kind)
     VALUES ($1::uuid, $2::uuid, 'PART'), ($1::uuid, $2::uuid, 'PRODUCT')
     ON CONFLICT (tenant_id, pending_brand_value_id, kind) DO NOTHING`,
    [rows.tenant.tenantId, catalogReviewFixture.brandIds.pending],
  );
  const catalogItems = Object.freeze([
    [catalogReviewFixture.itemIds[0], 'PART', 'Pantalla iPhone 11 OLED', 'pantalla iphone 11 oled', catalogReviewFixture.categoryIds.part, catalogReviewFixture.brandIds.apple, null, null, true, true, true, true],
    [catalogReviewFixture.itemIds[1], 'PRODUCT', 'Funda iPhone 16 rosa', 'funda iphone 16 rosa', null, null, catalogReviewFixture.categoryIds.pending, catalogReviewFixture.brandIds.pending, true, true, true, false],
    [catalogReviewFixture.itemIds[2], 'PART', 'Mica iPhone 15 transparente', 'mica iphone 15 transparente', catalogReviewFixture.categoryIds.part, null, null, catalogReviewFixture.brandIds.pending, true, true, true, true],
  ]);
  for (const item of catalogItems) {
    await client.query(
      `INSERT INTO catalog_items (
         tenant_id, item_id, kind, title, normalized_title, description,
         category_id, brand_id, pending_category_value_id, pending_brand_value_id,
         status, sellable, stockable, purchasable, applicable_to_repair,
         version, created_at, updated_at
       ) VALUES ($1::uuid, $2::uuid, $3, $4, $5, null, $6::uuid, $7::uuid,
         $8::uuid, $9::uuid, 'ACTIVE', $10, $11, $12, $13, 1, $14::timestamptz, $14::timestamptz)
       ON CONFLICT (tenant_id, item_id) DO UPDATE SET
         title = EXCLUDED.title, normalized_title = EXCLUDED.normalized_title,
         status = EXCLUDED.status, updated_at = EXCLUDED.updated_at`,
      [rows.tenant.tenantId, ...item, rows.tenant.createdAt],
    );
  }
  const catalogIdentifiers = Object.freeze([
    ['00000000-0000-4000-8000-000000036001', catalogReviewFixture.itemIds[0], 'SKU', 'REF-000042'],
    ['00000000-0000-4000-8000-000000036002', catalogReviewFixture.itemIds[0], 'BARCODE', 'SR00000042'],
    ['00000000-0000-4000-8000-000000036003', catalogReviewFixture.itemIds[1], 'SKU', 'PRO-000043'],
    ['00000000-0000-4000-8000-000000036004', catalogReviewFixture.itemIds[1], 'BARCODE', 'SR00000043'],
    ['00000000-0000-4000-8000-000000036005', catalogReviewFixture.itemIds[2], 'SKU', 'REF-000044'],
    ['00000000-0000-4000-8000-000000036006', catalogReviewFixture.itemIds[2], 'BARCODE', 'SR00000044'],
  ]);
  for (const identifier of catalogIdentifiers) {
    await client.query(
      `INSERT INTO catalog_item_identifiers (
         tenant_id, identifier_id, item_id, scheme, normalized_value, display_value, created_at
       ) VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $5, $6::timestamptz)
       ON CONFLICT (tenant_id, identifier_id) DO NOTHING`,
      [rows.tenant.tenantId, ...identifier, rows.tenant.createdAt],
    );
  }
  for (const [index, item] of catalogItems.entries()) {
    await client.query(
      `INSERT INTO catalog_base_price_revisions (
         tenant_id, revision_id, item_id, amount_minor, currency, item_version,
         reason, actor_user_id, correlation_id, effective_from
       ) VALUES ($1::uuid, $2::uuid, $3::uuid, $4, 'MXN', 1, 'Fixture sintético Owner Review',
         $5::uuid, $6::uuid, $7::timestamptz)
       ON CONFLICT (tenant_id, revision_id) DO NOTHING`,
      [rows.tenant.tenantId, `00000000-0000-4000-8000-${String(37001 + index).padStart(12, '0')}`,
        item[0], [139900, 29900, 24900][index], catalogReviewFixture.actorId,
        `00000000-0000-4000-8000-${String(38001 + index).padStart(12, '0')}`, rows.tenant.createdAt],
    );
  }
  await client.query(
    `INSERT INTO catalog_reference_cost_revisions (
       tenant_id, revision_id, item_id, amount_minor, currency, source_type,
       source_label, observed_at, item_version, reason, actor_user_id,
       correlation_id, effective_from
     ) VALUES ($1::uuid, $2::uuid, $3::uuid, 48000, 'MXN', 'MANUAL',
       'Fixture sintético Owner Review', $4::timestamptz, 1, null, $5::uuid,
       $6::uuid, $4::timestamptz)
     ON CONFLICT (tenant_id, revision_id) DO NOTHING`,
    [rows.tenant.tenantId, '00000000-0000-4000-8000-000000037101',
      catalogReviewFixture.itemIds[0], rows.tenant.createdAt, catalogReviewFixture.actorId,
      '00000000-0000-4000-8000-000000038101'],
  );
  await client.query(
    `INSERT INTO catalog_branch_price_revisions (
       tenant_id, branch_id, revision_id, item_id, action, amount_minor, currency,
       item_version, reason, actor_user_id, correlation_id, effective_from
     ) VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, 'SET', 149900, 'MXN', 1,
       'Fixture sintético de override', $5::uuid, $6::uuid, $7::timestamptz)
     ON CONFLICT (tenant_id, branch_id, revision_id) DO NOTHING`,
    [rows.tenant.tenantId, rows.branches[0].branchId,
      '00000000-0000-4000-8000-000000037201', catalogReviewFixture.itemIds[0],
      catalogReviewFixture.actorId, '00000000-0000-4000-8000-000000038201', rows.tenant.createdAt],
  );
  await client.query(
    `INSERT INTO catalog_sku_sequences (tenant_id, kind, next_value)
     VALUES ($1::uuid, 'PART', 100), ($1::uuid, 'PRODUCT', 100), ($1::uuid, 'SERVICE', 100), ($1::uuid, 'SUPPLY', 100)
     ON CONFLICT (tenant_id, kind) DO UPDATE SET next_value = greatest(catalog_sku_sequences.next_value, EXCLUDED.next_value)`,
    [rows.tenant.tenantId],
  );
  await client.query(
    `INSERT INTO catalog_barcode_sequences (tenant_id, next_value)
     VALUES ($1::uuid, 100)
     ON CONFLICT (tenant_id) DO UPDATE SET next_value = greatest(catalog_barcode_sequences.next_value, EXCLUDED.next_value)`,
    [rows.tenant.tenantId],
  );
  await client.query(
    `INSERT INTO repair_device_type_pending_values (
       pending_device_type_value_id, tenant_id, raw_label_example, normalized_key,
       resolution_status, canonical_device_type_id, version, first_seen_at,
       last_seen_at, resolved_by_actor_id, resolved_at
     ) VALUES ($1::uuid, $2::uuid, 'Smart Watch', 'smart watch', 'pending', null, 1,
       $3::timestamptz, $4::timestamptz, null, null)
     ON CONFLICT (pending_device_type_value_id) DO NOTHING`,
    [catalogReviewFixture.repairPendingDeviceTypeId, rows.tenant.tenantId,
      '2026-08-18T15:00:00.000Z', '2026-08-22T17:00:00.000Z'],
  );
  for (const item of repairCatalogs.deviceTypes) {
    await client.query(
      `INSERT INTO repair_device_types (device_type_id, scope, tenant_id, code, canonical_label, normalized_key, status, version, created_by_actor_id, updated_by_actor_id, created_at, updated_at)
       VALUES ($1::uuid, $2, $3::uuid, $4, $5, $6, $7, $8, $9::uuid, $10::uuid, $11::timestamptz, $12::timestamptz)
       ON CONFLICT (device_type_id) DO NOTHING`,
      [item.deviceTypeId, item.scope, item.tenantId, item.code, item.canonicalLabel, item.normalizedKey, item.status, item.version, item.createdByActorId, item.updatedByActorId, item.createdAt, item.updatedAt],
    );
  }
  for (const item of repairCatalogs.brands) {
    await client.query(
      `INSERT INTO repair_brands (brand_id, scope, tenant_id, code, canonical_label, normalized_key, status, version, created_by_actor_id, updated_by_actor_id, created_at, updated_at)
       VALUES ($1::uuid, $2, $3::uuid, $4, $5, $6, $7, $8, $9::uuid, $10::uuid, $11::timestamptz, $12::timestamptz)
       ON CONFLICT (brand_id) DO NOTHING`,
      [item.brandId, item.scope, item.tenantId, item.code, item.canonicalLabel, item.normalizedKey, item.status, item.version, item.createdByActorId, item.updatedByActorId, item.createdAt, item.updatedAt],
    );
  }
  for (const item of repairCatalogs.models) {
    await client.query(
      `INSERT INTO repair_models (model_id, canonical_brand_id, scope, tenant_id, code, canonical_label, normalized_key, status, version, created_by_actor_id, updated_by_actor_id, created_at, updated_at)
       VALUES ($1::uuid, $2::uuid, $3, $4::uuid, $5, $6, $7, $8, $9, $10::uuid, $11::uuid, $12::timestamptz, $13::timestamptz)
       ON CONFLICT (model_id) DO NOTHING`,
      [item.modelId, item.canonicalBrandId, item.scope, item.tenantId, item.code, item.canonicalLabel, item.normalizedKey, item.status, item.version, item.createdByActorId, item.updatedByActorId, item.createdAt, item.updatedAt],
    );
  }
  for (const item of repairCatalogs.risks) {
    await client.query(
      `INSERT INTO repair_risks (risk_id, scope, tenant_id, code, canonical_label, normalized_key, status, version, created_by_actor_id, updated_by_actor_id, created_at, updated_at)
       VALUES ($1::uuid, $2, $3::uuid, $4, $5, $6, $7, $8, $9::uuid, $10::uuid, $11::timestamptz, $12::timestamptz)
       ON CONFLICT (risk_id) DO NOTHING`,
      [item.riskId, item.scope, item.tenantId, item.code, item.canonicalLabel, item.normalizedKey, item.status, item.version, item.createdByActorId, item.updatedByActorId, item.createdAt, item.updatedAt],
    );
  }
  for (const item of repairCatalogs.problemCategories) {
    await client.query(
      `INSERT INTO repair_problem_categories (category_id, scope, tenant_id, code, canonical_label, normalized_key, status, version, created_by_actor_id, updated_by_actor_id, created_at, updated_at)
       VALUES ($1::uuid, $2, $3::uuid, $4, $5, $6, $7, $8, $9::uuid, $10::uuid, $11::timestamptz, $12::timestamptz)
       ON CONFLICT (category_id) DO NOTHING`,
      [item.categoryId, item.scope, item.tenantId, item.code, item.canonicalLabel, item.normalizedKey, item.status, item.version, item.createdByActorId, item.updatedByActorId, item.createdAt, item.updatedAt],
    );
  }
  for (const repair of localRepairRows()) {
    await client.query(
      `INSERT INTO repairs (
         repair_id, tenant_id, branch_id, folio, received_at,
         customer_name, customer_phone, device_brand, device_model,
         reported_issue, technician_id, technician_display_name,
         repair_status, custody_status, created_at
       ) VALUES (
         $1::uuid, $2::uuid, $3::uuid, $4, $5::timestamptz,
         $6, $7, $8, $9, $10, $11::uuid, $12, $13, $14, $15::timestamptz
       )
       ON CONFLICT (repair_id) DO UPDATE SET
         tenant_id = EXCLUDED.tenant_id,
         branch_id = EXCLUDED.branch_id,
         folio = EXCLUDED.folio,
         received_at = EXCLUDED.received_at,
         customer_name = EXCLUDED.customer_name,
         customer_phone = EXCLUDED.customer_phone,
         device_brand = EXCLUDED.device_brand,
         device_model = EXCLUDED.device_model,
         reported_issue = EXCLUDED.reported_issue,
         technician_id = EXCLUDED.technician_id,
         technician_display_name = EXCLUDED.technician_display_name,
         repair_status = EXCLUDED.repair_status,
         custody_status = EXCLUDED.custody_status,
         created_at = EXCLUDED.created_at`,
      [
        repair.repairId,
        repair.tenantId,
        repair.branchId,
        repair.folio,
        repair.receivedAt,
        repair.customerName,
        repair.customerPhone,
        repair.deviceBrand,
        repair.deviceModel,
        repair.reportedIssue,
        repair.technicianId,
        repair.technicianDisplayName,
        repair.repairStatus,
        repair.custodyStatus,
        repair.createdAt,
      ],
    );
  }
  for (const location of localRepairLocationRows()) {
    await client.query(
      `INSERT INTO repair_locations (location_id, tenant_id, branch_id, code, semantic_category, display_label, active, created_at)
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7, $8::timestamptz)
       ON CONFLICT (location_id) DO UPDATE SET display_label = EXCLUDED.display_label, active = EXCLUDED.active`,
      [location.locationId, location.tenantId, location.branchId, location.code, location.semanticCategory, location.displayLabel, location.active, location.createdAt],
    );
  }
  for (const movement of localRepairLocationMovementRows()) {
    await client.query(
      `INSERT INTO repair_location_movements (
         movement_id, tenant_id, branch_id, repair_id, command,
         from_location_id, to_location_id, from_code, from_label, to_code, to_label,
         actor_id, actor_display_name, occurred_at, reason, client_request_id,
         expected_location_version, location_version
       ) VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, $6::uuid, $7::uuid, $8, $9, $10, $11, $12::uuid, $13, $14::timestamptz, $15, $16::uuid, $17, $18)
       ON CONFLICT (movement_id) DO NOTHING`,
      [movement.movementId, movement.tenantId, movement.branchId, movement.repairId, movement.command,
        movement.fromLocationId, movement.toLocationId, movement.fromCode, movement.fromLabel,
        movement.toCode, movement.toLabel, movement.actorId, movement.actorDisplayName,
        movement.occurredAt, movement.reason, movement.clientRequestId,
        movement.expectedLocationVersion, movement.locationVersion],
    );
  }
  for (const technician of localRepairTechnicianRows()) {
    await client.query(
      `INSERT INTO repair_technicians (technician_id, tenant_id, display_name, active, created_at)
       VALUES ($1::uuid, $2::uuid, $3, $4, $5::timestamptz)
       ON CONFLICT (technician_id) DO UPDATE SET tenant_id = EXCLUDED.tenant_id, display_name = EXCLUDED.display_name, active = EXCLUDED.active, created_at = EXCLUDED.created_at`,
      [technician.technicianId, technician.tenantId, technician.displayName, technician.active, technician.createdAt],
    );
  }
  for (const transition of localRepairWorkflowTransitionRows()) {
    await client.query(
      `INSERT INTO repair_workflow_transitions (
         transition_id, tenant_id, branch_id, repair_id, command,
         from_state, to_state, actor_id, actor_display_name, occurred_at,
         reason, client_request_id, expected_workflow_version, workflow_version
       ) VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, $6, $7, $8::uuid, $9, $10::timestamptz, $11, $12::uuid, $13, $14)
       ON CONFLICT (transition_id) DO UPDATE SET
         actor_id = EXCLUDED.actor_id,
         actor_display_name = EXCLUDED.actor_display_name,
         occurred_at = EXCLUDED.occurred_at`,
      [transition.transitionId, transition.tenantId, transition.branchId, transition.repairId,
        transition.command, transition.fromState, transition.toState, transition.actorId,
        transition.actorDisplayName, transition.occurredAt, transition.reason,
        transition.clientRequestId, transition.expectedWorkflowVersion, transition.workflowVersion],
    );
  }
  for (const eligibility of localRepairTechnicianBranchRows()) {
    await client.query(
      `INSERT INTO repair_technician_branches (tenant_id, branch_id, technician_id, created_at)
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4::timestamptz)
       ON CONFLICT (tenant_id, branch_id, technician_id) DO NOTHING`,
      [eligibility.tenantId, eligibility.branchId, eligibility.technicianId, eligibility.createdAt],
    );
  }
  for (const assignment of localRepairTechnicianAssignmentRows()) {
    await client.query(
      `INSERT INTO repair_technician_assignments (
         assignment_id, tenant_id, branch_id, repair_id, technician_id,
         assigned_by_actor_id, assigned_by_actor_display_name, assigned_at,
         ended_at, ended_by_actor_id, ended_by_actor_display_name, reason,
         client_request_id, ended_client_request_id, assignment_sequence
       ) VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, $6::uuid, $7, $8::timestamptz, $9::timestamptz, $10::uuid, $11, $12, $13::uuid, $14::uuid, $15)
       ON CONFLICT (assignment_id) DO UPDATE SET technician_id = EXCLUDED.technician_id, ended_at = EXCLUDED.ended_at, ended_by_actor_id = EXCLUDED.ended_by_actor_id, ended_by_actor_display_name = EXCLUDED.ended_by_actor_display_name`,
      [assignment.assignmentId, assignment.tenantId, assignment.branchId, assignment.repairId, assignment.technicianId, assignment.assignedByActorId, assignment.assignedByActorDisplayName, assignment.assignedAt, assignment.endedAt, assignment.endedByActorId, assignment.endedByActorDisplayName, assignment.reason, assignment.clientRequestId, assignment.endedClientRequestId, assignment.assignmentSequence],
    );
  }
  for (const intake of localRepairIntakeRows()) {
    await client.query(
      `INSERT INTO repair_intakes (
         repair_id, tenant_id, branch_id, device_color, device_type,
         device_identifier, device_identifier_unavailable, distinctive_signs,
         sim_included, memory_card_included, other_accessories,
         warranty_review_requested, previous_repair_id, delivered_by_name,
         estimated_delivery_at, received_by_id, received_by_display_name,
         customer_narrative, physical_condition_summary, documented_risk_summary,
         received_power_state, device_access_type, initial_budget_amount_minor,
         new_repair_policy_version, created_at
       ) VALUES (
         $1::uuid, $2::uuid, $3::uuid, $4, $5,
         $6, $7, $8, $9, $10, $11,
         $12, $13::uuid, $14, $15::timestamptz, $16::uuid, $17,
         $18, $19, $20, $21, $22, $23, $24, $25::timestamptz
       )
       ON CONFLICT (repair_id) DO UPDATE SET
         tenant_id = EXCLUDED.tenant_id,
         branch_id = EXCLUDED.branch_id,
         device_color = EXCLUDED.device_color,
         device_type = EXCLUDED.device_type,
         device_identifier = EXCLUDED.device_identifier,
         device_identifier_unavailable = EXCLUDED.device_identifier_unavailable,
         distinctive_signs = EXCLUDED.distinctive_signs,
         sim_included = EXCLUDED.sim_included,
         memory_card_included = EXCLUDED.memory_card_included,
         other_accessories = EXCLUDED.other_accessories,
         warranty_review_requested = EXCLUDED.warranty_review_requested,
         previous_repair_id = EXCLUDED.previous_repair_id,
         delivered_by_name = EXCLUDED.delivered_by_name,
         estimated_delivery_at = EXCLUDED.estimated_delivery_at,
         received_by_id = EXCLUDED.received_by_id,
         received_by_display_name = EXCLUDED.received_by_display_name,
         customer_narrative = EXCLUDED.customer_narrative,
         physical_condition_summary = EXCLUDED.physical_condition_summary,
         documented_risk_summary = EXCLUDED.documented_risk_summary,
         received_power_state = EXCLUDED.received_power_state,
         device_access_type = EXCLUDED.device_access_type,
         initial_budget_amount_minor = EXCLUDED.initial_budget_amount_minor,
         new_repair_policy_version = EXCLUDED.new_repair_policy_version,
         created_at = EXCLUDED.created_at`,
      [
        intake.repairId,
        intake.tenantId,
        intake.branchId,
        intake.deviceColor,
        intake.deviceType,
        intake.deviceIdentifier,
        intake.deviceIdentifierUnavailable,
        intake.distinctiveSigns,
        intake.simIncluded,
        intake.memoryCardIncluded,
        intake.otherAccessories,
        intake.warrantyReviewRequested,
        intake.previousRepairId,
        intake.deliveredByName,
        intake.estimatedDeliveryAt,
        intake.receivedById,
        intake.receivedByDisplayName,
        intake.customerNarrative,
        intake.physicalConditionSummary,
        intake.documentedRiskSummary,
        intake.receivedPowerState,
        intake.deviceAccessType,
        intake.initialBudgetAmountMinor,
        intake.newRepairPolicyVersion,
        intake.createdAt,
      ],
    );
  }
  await client.query(
    `UPDATE repair_intakes intake
     SET device_type = 'Smart Watch', pending_device_type_value_id = $1::uuid
     FROM repair_device_type_pending_values pending
     WHERE pending.pending_device_type_value_id = $1::uuid
       AND pending.resolution_status = 'pending'
       AND intake.tenant_id = $2::uuid AND intake.repair_id = $3::uuid
       AND intake.canonical_device_type_id is null`,
    [catalogReviewFixture.repairPendingDeviceTypeId, rows.tenant.tenantId,
      '00000000-0000-4000-8000-000000001015'],
  );
  for (const problem of localRepairProblemClassificationRows()) {
    await client.query(
      `INSERT INTO repair_problem_classifications (
         problem_capture_id, tenant_id, branch_id, repair_id, category_id,
         pending_problem_value_id, raw_problem_label_snapshot,
         normalized_problem_key, category_label_snapshot, selection_order,
         source, stage, assigned_by_actor_id, assigned_at
       ) VALUES (
         $1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid,
         $6::uuid, $7, $8, $9, $10, $11, $12, $13::uuid, $14::timestamptz
       ) ON CONFLICT (problem_capture_id) DO UPDATE SET
         category_id = EXCLUDED.category_id,
         pending_problem_value_id = EXCLUDED.pending_problem_value_id,
         raw_problem_label_snapshot = EXCLUDED.raw_problem_label_snapshot,
         normalized_problem_key = EXCLUDED.normalized_problem_key,
         category_label_snapshot = EXCLUDED.category_label_snapshot,
         selection_order = EXCLUDED.selection_order,
         source = EXCLUDED.source,
         stage = EXCLUDED.stage,
         assigned_by_actor_id = EXCLUDED.assigned_by_actor_id,
         assigned_at = EXCLUDED.assigned_at`,
      [
        problem.problemCaptureId, problem.tenantId, problem.branchId,
        problem.repairId, problem.categoryId, problem.pendingProblemValueId,
        problem.rawProblemLabelSnapshot, problem.normalizedProblemKey,
        problem.categoryLabelSnapshot, problem.selectionOrder, problem.source,
        problem.stage, problem.assignedByActorId, problem.assignedAt,
      ],
    );
  }
  for (const risk of localRepairInterventionRiskRows()) {
    await client.query(
      `INSERT INTO repair_intervention_risks (
         repair_id, risk_id, risk_label_snapshot, selection_order,
         recorded_by_actor_id, recorded_at
       ) VALUES ($1::uuid, $2::uuid, $3, $4, $5::uuid, $6::timestamptz)
       ON CONFLICT (repair_id, risk_id) DO NOTHING`,
      [
        risk.repairId, risk.riskId, risk.riskLabelSnapshot,
        risk.selectionOrder, risk.recordedByActorId, risk.recordedAt,
      ],
    );
  }
  for (const entry of localRepairTimelineRows()) {
    await client.query(
      `INSERT INTO repair_timeline_entries (
         entry_id, tenant_id, branch_id, repair_id, entry_type,
         actor_id, actor_display_name, title, body, source,
         client_request_id, occurred_at, created_at
       ) VALUES (
         $1::uuid, $2::uuid, $3::uuid, $4::uuid, $5,
         $6::uuid, $7, $8, $9, $10, $11::uuid, $12::timestamptz, $13::timestamptz
       )
       ON CONFLICT (entry_id) DO UPDATE SET
         tenant_id = EXCLUDED.tenant_id,
         branch_id = EXCLUDED.branch_id,
         repair_id = EXCLUDED.repair_id,
         entry_type = EXCLUDED.entry_type,
         actor_id = EXCLUDED.actor_id,
         actor_display_name = EXCLUDED.actor_display_name,
         title = EXCLUDED.title,
         body = EXCLUDED.body,
         source = EXCLUDED.source,
         client_request_id = EXCLUDED.client_request_id,
         occurred_at = EXCLUDED.occurred_at,
         created_at = EXCLUDED.created_at`,
      [
        entry.entryId,
        entry.tenantId,
        entry.branchId,
        entry.repairId,
        entry.entryType,
        entry.actorId,
        entry.actorDisplayName,
        entry.title,
        entry.body,
        entry.source,
        entry.clientRequestId,
        entry.occurredAt,
        entry.createdAt,
      ],
    );
  }
  for (const evidence of localRepairEvidenceRows()) {
    await client.query(
      `INSERT INTO repair_attachments (
         attachment_id, tenant_id, branch_id, repair_id, kind, category,
         storage_key, mime_type, size_bytes, width, height, caption,
         captured_at, uploaded_at, uploaded_by_id, uploaded_by_display_name
       ) VALUES (
         $1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, $6,
         $7, $8, $9, $10, $11, $12, $13::timestamptz, $14::timestamptz, $15::uuid, $16
       )
       ON CONFLICT (attachment_id) DO UPDATE SET
         tenant_id = EXCLUDED.tenant_id, branch_id = EXCLUDED.branch_id,
         repair_id = EXCLUDED.repair_id, kind = EXCLUDED.kind,
         category = EXCLUDED.category, storage_key = EXCLUDED.storage_key,
         mime_type = EXCLUDED.mime_type, size_bytes = EXCLUDED.size_bytes,
         width = EXCLUDED.width, height = EXCLUDED.height, caption = EXCLUDED.caption,
         captured_at = EXCLUDED.captured_at, uploaded_at = EXCLUDED.uploaded_at,
         uploaded_by_id = EXCLUDED.uploaded_by_id,
         uploaded_by_display_name = EXCLUDED.uploaded_by_display_name`,
      [
        evidence.attachmentId, evidence.tenantId, evidence.branchId, evidence.repairId,
        evidence.kind, evidence.category, evidence.storageKey, evidence.mimeType,
        evidence.sizeBytes, evidence.width, evidence.height, evidence.caption,
        evidence.capturedAt, evidence.uploadedAt, evidence.uploadedById,
        evidence.uploadedByDisplayName,
      ],
    );
  }
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK').catch(() => undefined);
  throw error;
} finally {
  client.release();
  await pool.end();
}

process.stdout.write(`${JSON.stringify({
  event: 'local_synthetic_seed_complete',
  environment: 'local',
  dataClassification: 'synthetic-development-only',
  tenantCount: 1,
  branchCount: rows.branches.length,
  userCount: localUserRows().length,
  accessCapabilityCount: localAccessCapabilityRows().length,
  accessRoleCount: localAccessRoleRows().length,
  accessRoleCapabilityCount: localAccessRoleCapabilityRows().length,
  accessRoleAssignmentCount: localAccessRoleAssignmentRows().length,
  pinCredentialCount: pinCredentials.length,
  repairCount: localRepairRows().length,
  repairCatalogFixtureDefinitionCount: Object.values(repairCatalogs).reduce((total, items) => total + items.length, 0),
  repairPendingDeviceTypeFixtureCount: 1,
  catalogCanonicalFixtureCount: 3,
  catalogPendingReferenceFixtureCount: 2,
  catalogItemFixtureCount: catalogReviewFixture.itemIds.length,
  repairCanonicalLinksCreated: 0,
  repairIntakeCount: localRepairIntakeRows().length,
  repairProblemClassificationCount: localRepairProblemClassificationRows().length,
  repairInterventionRiskCount: localRepairInterventionRiskRows().length,
  repairTimelineEntryCount: localRepairTimelineRows().length,
  repairEvidenceCount: localRepairEvidenceRows().length,
  technicianCount: localRepairTechnicianRows().length,
  assignmentCount: localRepairTechnicianAssignmentRows().length,
  workflowTransitionCount: localRepairWorkflowTransitionRows().length,
  locationCount: localRepairLocationRows().length,
  locationMovementCount: localRepairLocationMovementRows().length,
  deterministic: true,
  applicationRole: environment.SR_DB_USER,
  forbiddenConnectionString: !Object.keys(cleanChildEnvironment()).includes('DATABASE_URL'),
})}\n`);
