function requiredReplace(source, before, after) {
  if (!source.includes(before)) {
    throw new Error(`mutation anchor missing: ${before}`);
  }
  return source.replace(before, after);
}

function replaceInSection(source, marker, before, after) {
  const index = source.indexOf(marker);
  if (index < 0) {
    throw new Error(`mutation section missing: ${marker}`);
  }
  return source.slice(0, index) +
    requiredReplace(source.slice(index), before, after);
}

const files = Object.freeze({
  binding:
    'src/modules/stations/infrastructure/persistence/kysely-station-binding.repository.ts',
  context:
    'src/modules/stations/application/contracts/trusted-station-context.ts',
  domain: 'src/modules/stations/domain/station.ts',
  errors:
    'src/modules/stations/application/station-application.error.ts',
  guard:
    'src/modules/stations/application/use-cases/run-with-trusted-station-context.ts',
  link:
    'src/modules/stations/application/use-cases/link-station.ts',
  recognition:
    'src/modules/stations/infrastructure/recognition/fake-station-recognition.ts',
  resolver:
    'src/modules/stations/application/use-cases/resolve-trusted-station-context.ts',
  revoke:
    'src/modules/stations/application/use-cases/revoke-station.ts',
  station:
    'src/modules/stations/infrastructure/persistence/kysely-station.repository.ts',
});

export const stationMutationTestFiles = Object.freeze([
  'test/station-application.test.mjs',
  'test/station-domain.test.mjs',
  'test/station-persistence-errors.test.mjs',
  'test/station-persistence-semantics.test.mjs',
]);

const tests = Object.freeze({
  application: stationMutationTestFiles[0],
  domain: stationMutationTestFiles[1],
  persistenceErrors: stationMutationTestFiles[2],
  persistenceSemantics: stationMutationTestFiles[3],
});

function expectedTests(...identities) {
  return Object.freeze(identities.map(([file, fullName]) =>
    Object.freeze({
      file,
      fullName,
      causalSignature: Object.freeze({
        errorCode: 'ERR_TEST_FAILURE',
        failureType: 'testCodeFailure',
      }),
    })));
}

function expectedTest(file, fullName) {
  return expectedTests([file, fullName]);
}

export const stationSemanticMutations = Object.freeze([
  {
    id: 'MUT-024-01',
    description: 'omit tenantId from Station lookup',
    file: files.station,
    expectedTests: expectedTest(
      tests.persistenceSemantics,
      'station lookup never crosses tenant scope',
    ),
    manual: true,
    mutate: (source) =>
      replaceInSection(
        source,
        'private async selectStation',
        ".where('tenant_id', '=', validated.tenantId)\n",
        '',
      ),
  },
  {
    id: 'MUT-024-02',
    description: 'omit tenantId from open binding lookup',
    file: files.binding,
    expectedTests: expectedTest(
      tests.persistenceSemantics,
      'binding lookup never crosses tenant scope',
    ),
    mutate: (source) =>
      replaceInSection(
        source,
        'private async selectOpenBinding',
        ".where('tenant_id', '=', validated.tenantId)\n",
        '',
      ),
  },
  {
    id: 'MUT-024-03',
    description: 'accept a non-active Station in the resolver',
    file: files.resolver,
    expectedTests: expectedTest(
      tests.application,
      'evidence categories are deterministic and unknown states anti-enumerate',
    ),
    mutate: (source) =>
      requiredReplace(
        source,
        "if (!station || station.status !== 'Active') {",
        'if (!station || false) {',
      ),
  },
  {
    id: 'MUT-024-04',
    description: 'omit bindingRevision validation before issuing trust',
    file: files.resolver,
    expectedTests: expectedTest(
      tests.application,
      'resolver rejects lower and higher binding revisions before issuing trust',
    ),
    manual: true,
    mutate: (source) =>
      requiredReplace(
        source,
        'if (binding.bindingRevision !== station.revision) {',
        'if (false) {',
      ),
  },
  {
    id: 'MUT-024-05',
    description: 'trust branchId supplied by station evidence',
    file: files.resolver,
    expectedTests: expectedTests(
      [
        tests.application,
        'resolver builds only a server-issued context from recognized active state',
      ],
      [
        tests.application,
        'trusted guard revalidates revision and rolls back a failed effect',
      ],
    ),
    mutate: (source) =>
      requiredReplace(
        source,
        'branchId: binding.branchId,',
        'branchId: (evidence as unknown as { branchId: typeof binding.branchId }).branchId,',
      ),
  },
  {
    id: 'MUT-024-06',
    description: 'omit resolver Branch eligibility denial',
    file: files.resolver,
    expectedTests: expectedTest(
      tests.application,
      'resolver fails closed on an impossible persisted branch reference',
    ),
    mutate: (source) =>
      requiredReplace(source, 'if (!eligible) {', 'if (false) {'),
  },
  {
    id: 'MUT-024-07',
    description: 'omit FOR UPDATE from Station lock',
    file: files.station,
    expectedTests: expectedTest(
      tests.persistenceSemantics,
      'station and binding locks execute FOR UPDATE',
    ),
    manual: true,
    mutate: (source) =>
      requiredReplace(
        source,
        'query = query.forUpdate();',
        'query = query;',
      ),
  },
  {
    id: 'MUT-024-08',
    description: 'execute protected effect after the unit of work closes',
    file: files.guard,
    expectedTests: expectedTest(
      tests.application,
      'trusted guard revalidates revision and rolls back a failed effect',
    ),
    mutate: (source) =>
      requiredReplace(
        requiredReplace(
          source,
          'return await this.unitOfWork.run(async (work) => {',
          'await this.unitOfWork.run(async (work) => {',
        ),
        '        return effect(work);\n      });',
        '        return undefined as Result;\n      });\n      return effect(undefined as never);',
      ),
  },
  {
    id: 'MUT-024-09',
    description: 'return a mutable TrustedStationContext',
    file: files.context,
    expectedTests: expectedTests(
      [
        tests.domain,
        'TrustedStationContext is immutable, internally issued and has no wildcard',
      ],
      [
        tests.application,
        'resolver builds only a server-issued context from recognized active state',
      ],
    ),
    mutate: (source) =>
      requiredReplace(
        source,
        'const context = Object.freeze({',
        'const context = ({',
      ),
  },
  {
    id: 'MUT-024-10',
    description: 'fall back to the first recognized Station',
    file: files.recognition,
    expectedTests: expectedTest(
      tests.application,
      'evidence categories are deterministic and unknown states anti-enumerate',
    ),
    mutate: (source) =>
      requiredReplace(
        source,
        'return this.#recognized.get(evidence.opaque) ??\n      Object.freeze({ kind: \'not-recognized\' });',
        'return this.#recognized.get(evidence.opaque) ??\n      [...this.#recognized.values()][0] ??\n      Object.freeze({ kind: \'not-recognized\' });',
      ),
  },
  {
    id: 'MUT-024-11',
    description: 'revoke without closing the open binding',
    file: files.revoke,
    expectedTests: expectedTest(
      tests.application,
      'link, unlink, relink and revoke preserve history and close the active binding',
    ),
    manual: true,
    mutate: (source) =>
      requiredReplace(
        source,
        `const closed = await work.bindings.closeOpenBinding(
            scope,
            binding.bindingRevision,
            command.revokedAt,
          );`,
        'const closed = binding;',
      ),
  },
  {
    id: 'MUT-024-12',
    description: 'increment lifecycle revision by two',
    file: files.domain,
    expectedTests: expectedTests(
      [
        tests.domain,
        'Station lifecycle is immutable, monotonic and requires unlink before relink',
      ],
      [
        tests.application,
        'resolver builds only a server-issued context from recognized active state',
      ],
      [
        tests.application,
        'resolver rejects lower and higher binding revisions before issuing trust',
      ],
      [
        tests.application,
        'link, unlink, relink and revoke preserve history and close the active binding',
      ],
      [
        tests.application,
        'trusted guard revalidates branch eligibility before the effect',
      ],
      [
        tests.domain,
        'Revoked is terminal and records the terminal instant',
      ],
    ),
    mutate: (source) =>
      requiredReplace(
        source,
        'station.revision + 1',
        'station.revision + 2',
      ),
  },
  {
    id: 'MUT-024-13',
    description: 'allow cross-tenant binding record ownership',
    file: files.binding,
    expectedTests: expectedTest(
      tests.persistenceSemantics,
      'binding creation rejects cross-tenant record ownership',
    ),
    mutate: (source) =>
      requiredReplace(
        source,
        'record.tenantId !== validated.tenantId ||\n      ',
        '',
      ),
  },
  {
    id: 'MUT-024-14',
    description: 'accept a structurally forged trusted context',
    file: files.context,
    expectedTests: expectedTests(
      [
        tests.application,
        'a forged context cannot bypass the resolver',
      ],
      [
        tests.domain,
        'TrustedStationContext is immutable, internally issued and has no wildcard',
      ],
    ),
    mutate: (source) =>
      requiredReplace(
        source,
        'trustedContexts.has(value)',
        "(value as { source?: unknown }).source === 'server-verified-station'",
      ),
  },
  {
    id: 'MUT-024-15',
    description: 'expose an internal error message publicly',
    file: files.errors,
    expectedTests: expectedTests(
      [
        tests.domain,
        'public error contract is stable, sanitized and anti-enumerating',
      ],
      [
        tests.application,
        'resolver rejects lower and higher binding revisions before issuing trust',
      ],
      [
        tests.persistenceErrors,
        'query cancellation remains non-retryable infrastructure failure',
      ],
    ),
    manual: true,
    mutate: (source) =>
      replaceInSection(
        source,
        "code: 'INTERNAL_ERROR'",
        "message: 'Ocurrió un error interno.',",
        'message: error.message,',
      ),
  },
  {
    id: 'MUT-024-16',
    description: 'omit Station revision revalidation in the guard',
    file: files.guard,
    expectedTests: expectedTest(
      tests.application,
      'trusted guard rejects station revision drift independently of binding revision',
    ),
    mutate: (source) =>
      requiredReplace(
        source,
        'station.revision !== context.stationRevision',
        'false',
      ),
  },
  {
    id: 'MUT-024-17',
    description: 'omit binding revision revalidation in the guard',
    file: files.guard,
    expectedTests: expectedTest(
      tests.application,
      'trusted guard rejects binding revision drift independently of station revision',
    ),
    mutate: (source) =>
      requiredReplace(
        source,
        'binding.bindingRevision !== context.stationRevision',
        'false',
      ),
  },
  {
    id: 'MUT-024-18',
    description: 'omit binding branch revalidation in the guard',
    file: files.guard,
    expectedTests: expectedTest(
      tests.application,
      'trusted guard rejects binding branch drift even when candidate branch is eligible',
    ),
    mutate: (source) =>
      requiredReplace(
        source,
        'binding.branchId !== context.branchId',
        'false',
      ),
  },
  {
    id: 'MUT-024-19',
    description: 'omit active Station status revalidation in the guard',
    file: files.guard,
    expectedTests: expectedTest(
      tests.application,
      'trusted guard rejects a revoked station even if damaged state retains a binding',
    ),
    mutate: (source) =>
      requiredReplace(
        source,
        "station.status !== 'Active'",
        'false',
      ),
  },
  {
    id: 'MUT-024-20',
    description: 'convert rejecting recognition denial into allow',
    file: files.recognition,
    expectedTests: expectedTest(
      tests.application,
      'rejecting recognition never converts denial into allow',
    ),
    mutate: (source) =>
      replaceInSection(
        source,
        'export class RejectingStationRecognition',
        "return Object.freeze({ kind: 'not-recognized' });",
        `return Object.freeze({
      kind: 'recognized',
      tenantId: '10000000-0000-4000-8000-000000000001' as TenantId,
      stationId: '50000000-0000-4000-8000-000000000005' as StationId,
    });`,
      ),
  },
  {
    id: 'MUT-024-21',
    description: 'accept multiple open bindings',
    file: files.binding,
    expectedTests: expectedTest(
      tests.persistenceSemantics,
      'multiple open bindings fail closed as persisted integrity damage',
    ),
    mutate: (source) =>
      requiredReplace(
        source,
        `if (rows.length > 1) {
          throw new StationPersistenceError(
            'STATION_PERSISTENCE_INVARIANT_BROKEN',
          );
        }`,
        '',
      ),
  },
  {
    id: 'MUT-024-22',
    description: 'close a binding without tenant scope',
    file: files.binding,
    expectedTests: expectedTest(
      tests.persistenceSemantics,
      'closing a binding cannot update another tenant',
    ),
    mutate: (source) =>
      replaceInSection(
        source,
        'async closeOpenBinding',
        ".where('tenant_id', '=', validated.tenantId)\n",
        '',
      ),
  },
  {
    id: 'MUT-024-23',
    description: 'transition a Station without expected revision CAS',
    file: files.station,
    expectedTests: expectedTest(
      tests.persistenceSemantics,
      'station transition requires the expected revision',
    ),
    mutate: (source) =>
      replaceInSection(
        source,
        'async transitionStation',
        ".where('revision', '=', record.expectedRevision)\n",
        '',
      ),
  },
  {
    id: 'MUT-024-24',
    description: 'allow transition out of terminal Revoked state',
    file: files.domain,
    expectedTests: expectedTest(
      tests.domain,
      'Revoked is terminal and records the terminal instant',
    ),
    mutate: (source) =>
      requiredReplace(
        source,
        "if (station.status === 'Revoked') {",
        'if (false) {',
      ),
  },
  {
    id: 'MUT-024-25',
    description: 'allow link while an open binding already exists',
    file: files.link,
    expectedTests: expectedTest(
      tests.application,
      'link fails closed on an existing open binding before lifecycle evaluation',
    ),
    mutate: (source) =>
      requiredReplace(
        source,
        'if (await work.bindings.lockOpenBinding(scope)) {',
        'if (false) {',
      ),
  },
]);
