import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  cp,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import test from 'node:test';

const paths = Object.freeze({
  access: 'src/modules/access/access.module.ts',
  binding:
    'src/modules/stations/infrastructure/persistence/kysely-station-binding.repository.ts',
  context:
    'src/modules/stations/application/contracts/trusted-station-context.ts',
  domain: 'src/modules/stations/domain/station.ts',
  errors:
    'src/modules/stations/application/station-application.error.ts',
  guard:
    'src/modules/stations/application/use-cases/run-with-trusted-station-context.ts',
  migration:
    'src/infrastructure/database/migrations/20260726160000_stations_create_stations_and_bindings.ts',
  recognition:
    'src/modules/stations/infrastructure/recognition/fake-station-recognition.ts',
  resolver:
    'src/modules/stations/application/use-cases/resolve-trusted-station-context.ts',
  revoke:
    'src/modules/stations/application/use-cases/revoke-station.ts',
  station:
    'src/modules/stations/infrastructure/persistence/kysely-station.repository.ts',
  tenancy:
    'src/modules/tenancy/infrastructure/persistence/kysely-branch.repository.ts',
  unitOfWork:
    'src/modules/stations/infrastructure/persistence/kysely-station-unit-of-work.ts',
});

function occurrences(source, pattern) {
  return [...source.matchAll(pattern)].length;
}

function requiredReplace(source, before, after) {
  assert.ok(source.includes(before), `mutation anchor missing: ${before}`);
  return source.replace(before, after);
}

const mutations = [
  {
    id: 'MUT-024-01',
    path: paths.station,
    mutate: (value) =>
      requiredReplace(value, ".where('tenant_id', '=', validated.tenantId)\n", ''),
    verify: (value) =>
      assert.ok(occurrences(value, /\.where\('tenant_id'/gu) >= 2),
  },
  {
    id: 'MUT-024-02',
    path: paths.tenancy,
    mutate: (value) =>
      requiredReplace(value, ".where('tenant_id', '=', validatedScope.tenantId)\n", ''),
    verify: (value) =>
      assert.ok(occurrences(value, /\.where\('tenant_id'/gu) >= 3),
  },
  {
    id: 'MUT-024-03',
    path: paths.resolver,
    mutate: (value) =>
      requiredReplace(
        value,
        "station.status !== 'Active'",
        "station.status === 'Never'",
      ),
    verify: (value) => assert.match(value, /station\.status !== 'Active'/u),
  },
  {
    id: 'MUT-024-04',
    path: paths.resolver,
    mutate: (value) =>
      requiredReplace(
        value,
        'tenantId: recognition.tenantId,',
        'tenantId: evidence.tenantId,',
      ),
    verify: (value) => assert.doesNotMatch(value, /evidence\.tenantId/u),
  },
  {
    id: 'MUT-024-05',
    path: paths.resolver,
    mutate: (value) =>
      requiredReplace(
        value,
        'branchId: binding.branchId,',
        'branchId: evidence.branchId,',
      ),
    verify: (value) => assert.doesNotMatch(value, /evidence\.branchId/u),
  },
  {
    id: 'MUT-024-06',
    path: paths.guard,
    mutate: (value) =>
      requiredReplace(
        value,
        'station.revision !== context.stationRevision',
        'false',
      ),
    verify: (value) =>
      assert.match(value, /station\.revision !== context\.stationRevision/u),
  },
  {
    id: 'MUT-024-07',
    path: paths.domain,
    mutate: (value) =>
      requiredReplace(
        value,
        'station.revision + 1',
        'station.revision',
      ),
    verify: (value) => assert.match(value, /station\.revision \+ 1/u),
  },
  {
    id: 'MUT-024-08',
    path: paths.resolver,
    mutate: (value) =>
      requiredReplace(value, 'if (!eligible) {', 'if (false) {'),
    verify: (value) =>
      assert.doesNotMatch(value, /if \(false\) \{/u),
  },
  {
    id: 'MUT-024-09',
    path: paths.errors,
    mutate: (value) =>
      requiredReplace(
        value,
        "STATION_NOT_TRUSTED: Object.freeze({\n    category: 'Authentication',\n    message: 'Station authentication is required.',",
        "STATION_NOT_TRUSTED: Object.freeze({\n    category: 'NotFound',\n    message: 'Station was revoked.',",
      ),
    verify: (value) => {
      const authenticationMessage =
        "message: 'Station authentication is required.'";
      assert.ok(occurrences(value, /message: 'Station authentication is required\.'/gu) >= 4);
      assert.doesNotMatch(value, /Station was revoked/u);
      assert.ok(value.includes(authenticationMessage));
    },
  },
  {
    id: 'MUT-024-10',
    path: paths.context,
    mutate: (value) =>
      requiredReplace(value, 'const context = Object.freeze({', 'const context = ({'),
    verify: (value) => assert.match(value, /const context = Object\.freeze\(\{/u),
  },
  {
    id: 'MUT-024-11',
    path: paths.context,
    mutate: (value) => `${value}\nexport const fallback = '*';\n`,
    verify: (value) => assert.doesNotMatch(value, /fallback|wildcard|\*/iu),
  },
  {
    id: 'MUT-024-12',
    path: paths.migration,
    mutate: (value) => requiredReplace(value, '    .unique()\n', ''),
    verify: (value) =>
      assert.match(
        value,
        /createIndex\('station_bindings_one_open_uq'\)\s*\.unique\(\)/u,
      ),
  },
  {
    id: 'MUT-024-13',
    path: paths.binding,
    mutate: (value) =>
      requiredReplace(
        value,
        '.set({ unlinked_at: instant(unlinkedAt) })',
        '.set({ branch_id: validated.stationId })',
      ),
    verify: (value) =>
      assert.match(value, /\.set\(\{ unlinked_at: instant\(unlinkedAt\) \}\)/u),
  },
  {
    id: 'MUT-024-14',
    path: paths.errors,
    mutate: (value) =>
      `${value}\nexport const leakedDriverError = (error) => String(error);\n`,
    verify: (value) =>
      assert.doesNotMatch(value, /leakedDriverError|String\(error\)/u),
  },
  {
    id: 'MUT-024-15',
    path: paths.access,
    mutate: (value) =>
      `${value}\nimport '../../stations/infrastructure/persistence/kysely-station.repository.js';\n`,
    verify: (value) =>
      assert.doesNotMatch(value, /stations\/infrastructure/u),
  },
  {
    id: 'MUT-024-16',
    path: paths.context,
    mutate: (value) => `${value}\nexport class StationContextController {}\n`,
    verify: (value) => assert.doesNotMatch(value, /Controller/u),
  },
  {
    id: 'MUT-024-17',
    path: paths.resolver,
    mutate: (value) => `${value}\nlet cachedContext;\n`,
    verify: (value) => assert.doesNotMatch(value, /cachedContext/u),
  },
  {
    id: 'MUT-024-18',
    path: paths.unitOfWork,
    mutate: (value) => `${value}\nconst retry = () => undefined;\n`,
    verify: (value) => assert.doesNotMatch(value, /\bretry\b/iu),
  },
  {
    id: 'MUT-024-19',
    path: paths.guard,
    mutate: (value) =>
      requiredReplace(
        value,
        'const station = await work.stations.lockStation(scope);',
        'const station = await work.stations.findStation(scope);',
      ),
    verify: (value) => assert.match(value, /lockStation\(scope\)/u),
  },
  {
    id: 'MUT-024-20',
    path: paths.recognition,
    mutate: (value) => `${value}\nconst fingerprint = localStorage.getItem('station');\n`,
    verify: (value) =>
      assert.doesNotMatch(value, /fingerprint|localStorage/iu),
  },
  {
    id: 'MUT-024-21',
    path: paths.resolver,
    mutate: (value) =>
      requiredReplace(
        value,
        'const eligible = await work.branches.findEligibleBranch({',
        'const eligible = await Promise.resolve({',
      ),
    verify: (value) =>
      assert.match(value, /work\.branches\.findEligibleBranch\(/u),
  },
  {
    id: 'MUT-024-22',
    path: paths.resolver,
    mutate: (value) =>
      requiredReplace(value, 'if (!eligible) {', 'if (eligible === null && false) {'),
    verify: (value) => assert.match(value, /if \(!eligible\) \{/u),
  },
  {
    id: 'MUT-024-23',
    path: paths.revoke,
    mutate: (value) =>
      requiredReplace(
        value,
        'const closed = await work.bindings.closeOpenBinding(',
        'const closed = await Promise.resolve(null as never) || work.bindings.closeOpenBinding(',
      ),
    verify: (value) =>
      assert.match(value, /await work\.bindings\.closeOpenBinding\(/u),
  },
  {
    id: 'MUT-024-24',
    path: paths.binding,
    mutate: (value) => {
      const marker = 'async closeOpenBinding';
      const index = value.indexOf(marker);
      assert.ok(index > 0);
      return value.slice(0, index) + requiredReplace(
        value.slice(index),
        ".where('tenant_id', '=', validated.tenantId)\n          .where('station_id', '=', validated.stationId)",
        ".where('station_id', '=', validated.stationId)",
      );
    },
    verify: (value) => {
      const close = value.slice(
        value.indexOf('async closeOpenBinding'),
        value.indexOf('async listBindings'),
      );
      assert.match(close, /\.where\('tenant_id'/u);
      assert.match(close, /\.where\('station_id'/u);
    },
  },
  {
    id: 'MUT-024-25',
    path: paths.unitOfWork,
    mutate: (value) =>
      `${value}\nconst splitTransaction = runInTransaction;\n`,
    verify: (value) =>
      assert.equal(occurrences(value, /\brunInTransaction\b/gu), 2),
  },
];

assert.equal(mutations.length, 25);
assert.equal(new Set(mutations.map(({ id }) => id)).size, 25);

for (const mutation of mutations) {
  test(`${mutation.id} is killed and the source copy is restored`, async () => {
    const root = await mkdtemp(join(tmpdir(), 'srtaller-pbi024-mutation-'));
    const target = join(root, basename(mutation.path));
    try {
      await cp(mutation.path, target);
      const baseline = await readFile(target, 'utf8');
      const baselineHash = createHash('sha256').update(baseline).digest('hex');
      mutation.verify(baseline);

      const mutated = mutation.mutate(baseline);
      assert.notEqual(mutated, baseline);
      await writeFile(target, mutated);
      await assert.rejects(
        async () => mutation.verify(await readFile(target, 'utf8')),
        assert.AssertionError,
      );

      await writeFile(target, baseline);
      mutation.verify(await readFile(target, 'utf8'));
      const restoredHash = createHash('sha256')
        .update(await readFile(target))
        .digest('hex');
      assert.equal(restoredHash, baselineHash);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
}
