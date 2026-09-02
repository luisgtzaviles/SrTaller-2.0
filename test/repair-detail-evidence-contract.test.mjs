import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { localRepairEvidenceRows } from '../scripts/lib/local-development.mjs';
import { LOCAL_EVIDENCE_FIXTURES } from '../scripts/lib/local-evidence-fixtures.mjs';

const migration = await readFile('src/infrastructure/database/migrations/20260819150000_repairs_create_attachments.ts', 'utf8');
const repository = await readFile('src/modules/repairs/infrastructure/persistence/kysely-repair.repository.ts', 'utf8');
const controller = await readFile('src/modules/repairs/presentation/repairs.controller.ts', 'utf8');
const useCase = await readFile('src/modules/repairs/application/use-cases/get-repair-evidence-content.use-case.ts', 'utf8');
const storage = await readFile('src/modules/repairs/infrastructure/storage/local-repair-evidence.storage.ts', 'utf8');
const page = await readFile('apps/dev-preview-web/src/pages/RepairDetailPage.tsx', 'utf8');

test('repair evidence metadata uses a scoped repairs-owned table without blobs', () => {
  assert.match(migration, /createTable\('repair_attachments'\)/u);
  assert.match(migration, /repair_attachments_repair_scope_fk/u);
  assert.match(migration, /\['tenant_id', 'branch_id', 'repair_id'\]/u);
  for (const constraint of ['kind_ck', 'category_ck', 'mime_ck', 'size_ck', 'dimensions_ck', 'uploader_ck', 'storage_key_ck']) {
    assert.match(migration, new RegExp(`repair_attachments_${constraint}`, 'u'));
  }
  assert.doesNotMatch(migration, /bytea|blob|binary/iu);
});

test('repair evidence repository is explicitly projected and tenant branch repair scoped', () => {
  assert.match(repository, /selectFrom\('repair_attachments'\)/u);
  assert.match(repository, /where\('tenant_id', '=', validatedScope\.tenantId\)[\s\S]*?where\('branch_id', '=', validatedScope\.branchId\)[\s\S]*?where\('repair_id', '=', repairId\)/u);
  assert.match(repository, /getRepairEvidenceById\([\s\S]*?evidenceId: string/u);
  const evidenceMethod = repository.slice(repository.indexOf('async getRepairEvidenceById'));
  assert.doesNotMatch(evidenceMethod, /selectAll/u);
});

test('content access resolves opaque IDs server-side and fails closed', () => {
  assert.match(controller, /@Get\(':repairId\/evidence\/:evidenceId\/content'\)/u);
  assert.match(controller, /Cache-Control': 'private, no-store'/u);
  assert.match(controller, /X-Content-Type-Options': 'nosniff'/u);
  assert.match(useCase, /canonicalUuid/u);
  assert.match(useCase, /content\.byteLength !== record\.sizeBytes/u);
  assert.match(storage, /storageKeyPattern/u);
  assert.match(storage, /isSymbolicLink/u);
  assert.match(storage, /realpath/u);
  assert.doesNotMatch(controller, /storageKey|\.runtime|file:\/\//u);
  const contentEndpoint = controller.slice(
    controller.indexOf("@Get(':repairId/evidence/:evidenceId/content')"),
    controller.indexOf("@Get(':id')"),
  );
  assert.doesNotMatch(contentEndpoint, /@Post|@Patch|@Put|@Delete/u);
});

test('local evidence is deterministic synthetic data with many one empty and broken scenarios', () => {
  const rows = localRepairEvidenceRows();
  assert.equal(LOCAL_EVIDENCE_FIXTURES.length, 6);
  assert.equal(rows.filter((row) => row.repairId.endsWith('1003')).length, 5);
  assert.equal(rows.filter((row) => row.repairId.endsWith('1002')).length, 1);
  assert.equal(rows.filter((row) => row.repairId.endsWith('1008')).length, 0);
  assert.equal(rows.filter((row) => row.repairId.endsWith('1004')).length, 1);
  assert.ok(rows.every((row) => row.kind === 'photo' && ['intake', 'general'].includes(row.category)));
  assert.ok(rows.every((row) => row.caption.includes('sintética')));
});

test('detail UI exposes a semantic read-only gallery and accessible dialog viewer', () => {
  assert.match(page, /<section className=\{styles\.repairEvidence\}/u);
  assert.match(page, /<ul className=\{styles\.evidenceGrid\}/u);
  assert.match(page, /No hay evidencias visuales registradas\./u);
  assert.match(page, /open=\{activeEvidence !== null\}/u);
  assert.match(page, /Anterior/u);
  assert.match(page, /Siguiente/u);
  assert.match(page, /Evidencia no disponible/u);
  assert.doesNotMatch(page, /Subir evidencia|Eliminar evidencia|Tomar foto|Arrastrar/iu);
});
