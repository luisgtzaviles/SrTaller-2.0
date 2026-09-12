import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execute = promisify(execFile);
export const RUNTIME_REVISION_PATTERN = /^[0-9a-f]{40}$/u;
export const RUNTIME_SOURCE_STATES = Object.freeze(['clean', 'dirty']);

export function validateRuntimeProvenance(value) {
  if (
    typeof value !== 'object' ||
    value === null ||
    !RUNTIME_REVISION_PATTERN.test(value.sourceRevision ?? '') ||
    !RUNTIME_SOURCE_STATES.includes(value.sourceState)
  ) {
    throw new Error('Runtime provenance is unavailable or invalid');
  }
  return Object.freeze({
    sourceRevision: value.sourceRevision,
    sourceState: value.sourceState,
  });
}

async function git(root, argumentsList) {
  const { stdout } = await execute('git', argumentsList, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  return stdout.trim();
}

export async function inspectWorkingTreeProvenance(root = process.cwd()) {
  const [sourceRevision, status] = await Promise.all([
    git(root, ['rev-parse', 'HEAD']),
    git(root, ['status', '--porcelain=v1', '--untracked-files=all']),
  ]);
  return validateRuntimeProvenance({
    sourceRevision,
    sourceState: status === '' ? 'clean' : 'dirty',
  });
}

export function runtimeProvenanceEnvironment(provenance) {
  const validated = validateRuntimeProvenance(provenance);
  return Object.freeze({
    SR_RUNTIME_GIT_SHA: validated.sourceRevision,
    SR_RUNTIME_SOURCE_STATE: validated.sourceState,
  });
}

function header(response, name) {
  return response.headers.get(name)?.trim() ?? '';
}

export async function inspectLiveRuntimeProvenance({
  frontendBaseUrl,
  backendBaseUrl,
  expected,
  fetchImplementation = fetch,
}) {
  const expectedValue = validateRuntimeProvenance(expected);
  const [frontendResponse, backendResponse] = await Promise.all([
    fetchImplementation(`${frontendBaseUrl}/runtime-provenance.json`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(2_000),
    }),
    fetchImplementation(`${backendBaseUrl}/readyz`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(2_000),
    }),
  ]);
  if (!frontendResponse.ok || !backendResponse.ok) {
    throw new Error('Runtime provenance endpoints are not ready');
  }
  const frontendBody = await frontendResponse.json();
  const frontend = validateRuntimeProvenance(frontendBody);
  const backend = validateRuntimeProvenance({
    sourceRevision: header(backendResponse, 'x-sr-source-revision'),
    sourceState: header(backendResponse, 'x-sr-source-state'),
  });
  if (frontendBody.role !== 'frontend' || header(backendResponse, 'x-sr-runtime-role') !== 'backend') {
    throw new Error('Runtime provenance roles are invalid');
  }
  for (const [role, actual] of [['frontend', frontend], ['backend', backend]]) {
    if (
      actual.sourceRevision !== expectedValue.sourceRevision ||
      actual.sourceState !== expectedValue.sourceState
    ) {
      throw new Error(`${role} runtime provenance does not match the current working tree`);
    }
  }
  return Object.freeze({
    status: 'PASS',
    expected: expectedValue,
    frontend,
    backend,
  });
}

export async function waitForLiveRuntimeProvenance(input, {
  attempts = 80,
  delayMs = 100,
} = {}) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await inspectLiveRuntimeProvenance(input);
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error(`Runtime provenance verification timed out: ${lastError?.message ?? 'unknown error'}`);
}
