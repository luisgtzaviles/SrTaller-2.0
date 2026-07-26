import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function source(path) {
  return readFile(path, 'utf8');
}

test('Tenancy exclusively owns Branch persistence and public eligibility', async () => {
  const [policy, tenancyIndex, branchPort, branchAdapter, stationFiles] =
    await Promise.all([
      source('architecture/dec-005-policy.json').then(JSON.parse),
      source('src/modules/tenancy/index.ts'),
      source(
        'src/modules/tenancy/application/ports/branch-repository.port.ts',
      ),
      source(
        'src/modules/tenancy/infrastructure/persistence/kysely-branch.repository.ts',
      ),
      Promise.all([
        'src/modules/stations/application/use-cases/link-station.ts',
        'src/modules/stations/application/use-cases/resolve-trusted-station-context.ts',
        'src/modules/stations/infrastructure/persistence/kysely-station-unit-of-work.ts',
      ].map(source)).then((files) => files.join('\n')),
    ]);

  assert.equal(policy.persistence.databaseObjects.branches.owner, 'tenancy');
  assert.match(tenancyIndex, /export interface BranchEligibilityCapability/u);
  assert.match(tenancyIndex, /readonly tenantId: TenantId/u);
  assert.match(tenancyIndex, /readonly branchId: BranchId/u);
  assert.match(branchPort, /TenantBranchPersistenceScope/u);
  assert.match(branchAdapter, /\.where\('tenant_id'/u);
  assert.match(branchAdapter, /\.where\('branch_id'/u);
  assert.match(stationFiles, /from ['"]\.\.\/\.\.\/\.\.\/tenancy\/index\.js['"]/u);
  assert.doesNotMatch(
    stationFiles,
    /tenancy\/(?:application|domain|infrastructure)\//u,
  );
});

test('Station and binding adapters are tenant-scoped and share explicit locks', async () => {
  const [stationAdapter, bindingAdapter, link, unlink, revoke, guard] =
    await Promise.all([
      source(
        'src/modules/stations/infrastructure/persistence/kysely-station.repository.ts',
      ),
      source(
        'src/modules/stations/infrastructure/persistence/kysely-station-binding.repository.ts',
      ),
      source('src/modules/stations/application/use-cases/link-station.ts'),
      source('src/modules/stations/application/use-cases/unlink-station.ts'),
      source('src/modules/stations/application/use-cases/revoke-station.ts'),
      source(
        'src/modules/stations/application/use-cases/run-with-trusted-station-context.ts',
      ),
    ]);

  for (const adapter of [stationAdapter, bindingAdapter]) {
    assert.match(adapter, /\.where\('tenant_id'/u);
    assert.match(adapter, /\.where\('station_id'/u);
    assert.doesNotMatch(adapter, /findByStationId|listAll|BaseRepository/u);
  }
  assert.match(stationAdapter, /query = query\.forUpdate\(\)/u);
  assert.match(bindingAdapter, /query = query\.forUpdate\(\)/u);
  for (const operation of [link, unlink, revoke, guard]) {
    assert.match(operation, /lockStation\(scope\)/u);
  }
  assert.match(unlink, /lockOpenBinding\(scope\)/u);
  assert.match(revoke, /lockOpenBinding\(scope\)/u);
  assert.match(revoke, /closeOpenBinding\(/u);
  assert.match(guard, /station\.revision !== context\.stationRevision/u);
});

test('trusted context stays immutable, unforgeable and free of global fallback', async () => {
  const [context, resolver, domain, recognition] = await Promise.all([
    source(
      'src/modules/stations/application/contracts/trusted-station-context.ts',
    ),
    source(
      'src/modules/stations/application/use-cases/resolve-trusted-station-context.ts',
    ),
    source('src/modules/stations/domain/station.ts'),
    source(
      'src/modules/stations/infrastructure/recognition/fake-station-recognition.ts',
    ),
  ]);
  assert.match(context, /Object\.freeze\(/u);
  assert.match(context, /WeakSet<object>/u);
  assert.match(context, /source: 'server-verified-station'/u);
  assert.doesNotMatch(
    `${context}\n${resolver}\n${domain}`,
    /AsyncLocalStorage|node:async_hooks|@Global|ModuleRef|fallback|wildcard/iu,
  );
  assert.doesNotMatch(domain, /@nestjs|kysely|from ['"].*tenancy/u);
  assert.match(resolver, /this\.recognition\.recognize\(evidence\)/u);
  assert.match(resolver, /work\.branches\.findEligibleBranch/u);
  assert.match(recognition, /FakeStationRecognition/u);
  assert.doesNotMatch(
    recognition,
    /process\.env|api.?key|private.?key|password|token|secret/iu,
  );
});

test('PBI-024 adds no HTTP, user, PIN, session, role or repair behavior', async () => {
  const files = JSON.parse(
    await source('architecture/dec-005-policy.json'),
  ).productModuleFiles;
  const combined = (
    await Promise.all(files.map((path) => source(path)))
  ).join('\n');
  assert.doesNotMatch(combined, /@Controller|@(Get|Post|Patch|Delete)\b/u);
  assert.doesNotMatch(
    combined,
    /\b(?:Pin|Password|UserSession|RepairRepository|CreateRepair|RoleRepository|PermissionRepository)\b/u,
  );
});
