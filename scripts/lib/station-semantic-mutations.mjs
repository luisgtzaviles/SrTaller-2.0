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

export const stationSemanticMutations = Object.freeze([
  {
    id: 'MUT-024-01',
    description: 'omit tenantId from Station lookup',
    file: files.station,
    expectedTest: 'station lookup never crosses tenant scope',
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
    expectedTest: 'binding lookup never crosses tenant scope',
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
    expectedTest: 'evidence categories are deterministic',
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
    expectedTest: 'resolver rejects lower and higher binding revisions',
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
    expectedTest: 'resolver builds only a server-issued context',
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
    expectedTest: 'resolver fails closed on an impossible persisted branch reference',
    mutate: (source) =>
      requiredReplace(source, 'if (!eligible) {', 'if (false) {'),
  },
  {
    id: 'MUT-024-07',
    description: 'omit FOR UPDATE from Station lock',
    file: files.station,
    expectedTest: 'station and binding locks execute FOR UPDATE',
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
    expectedTest: 'trusted guard revalidates revision and rolls back a failed effect',
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
    expectedTest: 'TrustedStationContext is immutable',
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
    expectedTest: 'evidence categories are deterministic',
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
    expectedTest: 'link, unlink, relink and revoke preserve history',
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
    expectedTest: 'Station lifecycle is immutable, monotonic',
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
    expectedTest: 'binding creation rejects cross-tenant record ownership',
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
    expectedTest: 'a forged context cannot bypass the resolver',
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
    expectedTest: 'public error contract is stable, sanitized',
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
    expectedTest: 'trusted guard rejects station revision drift independently',
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
    expectedTest: 'trusted guard rejects binding revision drift independently',
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
    expectedTest: 'trusted guard rejects binding branch drift',
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
    expectedTest: 'trusted guard rejects a revoked station',
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
    expectedTest: 'rejecting recognition never converts denial into allow',
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
    expectedTest: 'multiple open bindings fail closed',
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
    expectedTest: 'closing a binding cannot update another tenant',
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
    expectedTest: 'station transition requires the expected revision',
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
    expectedTest: 'Revoked is terminal',
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
    expectedTest: 'link fails closed on an existing open binding',
    mutate: (source) =>
      requiredReplace(
        source,
        'if (await work.bindings.lockOpenBinding(scope)) {',
        'if (false) {',
      ),
  },
]);
