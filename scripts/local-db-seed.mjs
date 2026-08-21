import { Pool } from 'pg';

import {
  cleanChildEnvironment,
  databaseEnvironment,
  ensureLocalEnvironment,
  localRepairIntakeRows,
  localRepairRows,
  localRepairTimelineRows,
  localRepairEvidenceRows,
  localSeedRows,
} from './lib/local-development.mjs';
import { materializeLocalEvidenceFixtures } from './lib/local-evidence-fixtures.mjs';
import { grantApplicationAccess, localDbUp } from './local-db.mjs';

const values = await ensureLocalEnvironment({ create: false });
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
await materializeLocalEvidenceFixtures();
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query(
    `INSERT INTO tenants (tenant_id, created_at) VALUES ($1::uuid, $2::timestamptz)
     ON CONFLICT (tenant_id) DO UPDATE SET created_at = EXCLUDED.created_at`,
    [rows.tenant.tenantId, rows.tenant.createdAt],
  );
  for (const branch of rows.branches) {
    await client.query(
      `INSERT INTO branches (tenant_id, branch_id, created_at) VALUES ($1::uuid, $2::uuid, $3::timestamptz)
       ON CONFLICT (tenant_id, branch_id) DO UPDATE SET created_at = EXCLUDED.created_at`,
      [branch.tenantId, branch.branchId, branch.createdAt],
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
  for (const intake of localRepairIntakeRows()) {
    await client.query(
      `INSERT INTO repair_intakes (
         repair_id, tenant_id, branch_id, device_color,
         received_by_id, received_by_display_name, customer_narrative,
         physical_condition_summary, documented_risk_summary, created_at
       ) VALUES (
         $1::uuid, $2::uuid, $3::uuid, $4,
         $5::uuid, $6, $7, $8, $9, $10::timestamptz
       )
       ON CONFLICT (repair_id) DO UPDATE SET
         tenant_id = EXCLUDED.tenant_id,
         branch_id = EXCLUDED.branch_id,
         device_color = EXCLUDED.device_color,
         received_by_id = EXCLUDED.received_by_id,
         received_by_display_name = EXCLUDED.received_by_display_name,
         customer_narrative = EXCLUDED.customer_narrative,
         physical_condition_summary = EXCLUDED.physical_condition_summary,
         documented_risk_summary = EXCLUDED.documented_risk_summary,
         created_at = EXCLUDED.created_at`,
      [
        intake.repairId,
        intake.tenantId,
        intake.branchId,
        intake.deviceColor,
        intake.receivedById,
        intake.receivedByDisplayName,
        intake.customerNarrative,
        intake.physicalConditionSummary,
        intake.documentedRiskSummary,
        intake.createdAt,
      ],
    );
  }
  for (const entry of localRepairTimelineRows()) {
    await client.query(
      `INSERT INTO repair_timeline_entries (
         entry_id, tenant_id, branch_id, repair_id, entry_type,
         actor_id, actor_display_name, title, body, source,
         occurred_at, created_at
       ) VALUES (
         $1::uuid, $2::uuid, $3::uuid, $4::uuid, $5,
         $6::uuid, $7, $8, $9, $10, $11::timestamptz, $12::timestamptz
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
  repairCount: localRepairRows().length,
  repairIntakeCount: localRepairIntakeRows().length,
  repairTimelineEntryCount: localRepairTimelineRows().length,
  repairEvidenceCount: localRepairEvidenceRows().length,
  deterministic: true,
  applicationRole: environment.SR_DB_USER,
  forbiddenConnectionString: !Object.keys(cleanChildEnvironment()).includes('DATABASE_URL'),
})}\n`);
