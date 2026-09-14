const revisionPattern = /^[0-9a-f]{40}$/u;

export interface RuntimeProvenance {
  readonly sourceRevision: string;
  readonly sourceState: 'clean' | 'dirty' | 'unavailable';
}

export function loadRuntimeProvenance(
  environment: Readonly<Record<string, string | undefined>>,
): RuntimeProvenance {
  const sourceRevision = environment.SR_RUNTIME_GIT_SHA?.trim() ?? '';
  const sourceState = environment.SR_RUNTIME_SOURCE_STATE?.trim() ?? '';
  if (
    !revisionPattern.test(sourceRevision) ||
    (sourceState !== 'clean' && sourceState !== 'dirty')
  ) {
    return Object.freeze({
      sourceRevision: 'unavailable',
      sourceState: 'unavailable',
    });
  }
  return Object.freeze({ sourceRevision, sourceState });
}

export function applyRuntimeProvenanceHeaders(
  response: Readonly<{ setHeader(name: string, value: string): void }>,
  provenance: RuntimeProvenance,
): void {
  response.setHeader('X-SR-Runtime-Role', 'backend');
  response.setHeader('X-SR-Source-Revision', provenance.sourceRevision);
  response.setHeader('X-SR-Source-State', provenance.sourceState);
}
