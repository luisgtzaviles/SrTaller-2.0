import { isAbsolute, normalize, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const stationTestReporterFormat = 'srtaller-node-test-results/v1';
export const stationTestFullNameSeparator = ' > ';

export function buildStationTestFullName(suitePath, name) {
  if (
    !Array.isArray(suitePath) ||
    suitePath.some((segment) =>
      typeof segment !== 'string' || segment === '') ||
    typeof name !== 'string' ||
    name === ''
  ) {
    throw new Error('INVALID_TEST_NAME_COMPONENTS');
  }
  return [...suitePath, name].join(stationTestFullNameSeparator);
}

function portablePath(path) {
  return path.split(sep).join('/');
}

export function normalizeStationTestFile(file, repositoryRoot) {
  if (typeof file !== 'string' || file.trim() === '') {
    throw new Error('RESULT_PARSE_INVALID_TEST_FILE');
  }

  const decoded = file.startsWith('file:')
    ? fileURLToPath(file)
    : file;
  const root = resolve(repositoryRoot);
  const absolute = isAbsolute(decoded)
    ? normalize(decoded)
    : resolve(root, decoded);
  const normalized = portablePath(relative(root, absolute));

  if (
    normalized === '' ||
    normalized === '..' ||
    normalized.startsWith('../') ||
    isAbsolute(normalized)
  ) {
    throw new Error('RESULT_PARSE_TEST_FILE_OUTSIDE_WORKSPACE');
  }
  return normalized;
}

function normalizedError(error, repositoryRoot) {
  if (error === null) {
    return null;
  }
  if (!error || typeof error !== 'object' || Array.isArray(error)) {
    throw new Error('RESULT_PARSE_INVALID_ERROR');
  }

  const root = portablePath(resolve(repositoryRoot));
  const stack = typeof error.stack === 'string'
    ? portablePath(error.stack).replaceAll(root, '<workspace>')
    : '';
  return Object.freeze({
    name: typeof error.name === 'string' ? error.name : 'Error',
    code: typeof error.code === 'string' ? error.code : null,
    message: typeof error.message === 'string' ? error.message : '',
    stack,
    failureType:
      typeof error.failureType === 'string' ? error.failureType : null,
  });
}

function validateTestRecord(record, repositoryRoot) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    throw new Error('RESULT_PARSE_INVALID_TEST_RECORD');
  }
  if (
    typeof record.name !== 'string' ||
    record.name === '' ||
    typeof record.fullName !== 'string' ||
    record.fullName === '' ||
    !Array.isArray(record.suitePath) ||
    record.suitePath.some((segment) =>
      typeof segment !== 'string' || segment === '') ||
    !['suite', 'test'].includes(record.kind) ||
    !Number.isInteger(record.testId) ||
    record.testId < 1 ||
    !Number.isInteger(record.nesting) ||
    record.nesting < 0 ||
    !['PASS', 'FAIL', 'SKIP'].includes(record.status)
  ) {
    throw new Error('RESULT_PARSE_INVALID_TEST_RECORD');
  }

  const error = normalizedError(record.error, repositoryRoot);
  if (record.status === 'FAIL' && error === null) {
    throw new Error('RESULT_PARSE_FAILED_TEST_WITHOUT_ERROR');
  }
  if (record.status !== 'FAIL' && error !== null) {
    throw new Error('RESULT_PARSE_NON_FAILED_TEST_WITH_ERROR');
  }
  if (
    record.suitePath.length !== record.nesting ||
    record.fullName !== buildStationTestFullName(
      record.suitePath,
      record.name,
    )
  ) {
    throw new Error('RESULT_PARSE_INVALID_TEST_IDENTITY');
  }

  return Object.freeze({
    file: normalizeStationTestFile(record.file, repositoryRoot),
    name: record.name,
    fullName: record.fullName,
    suitePath: Object.freeze([...record.suitePath]),
    kind: record.kind,
    testId: record.testId,
    nesting: record.nesting,
    status: record.status,
    error,
  });
}

export function parseStationTestResults(output, {
  repositoryRoot = process.cwd(),
} = {}) {
  if (typeof output !== 'string' || output.trim() === '') {
    throw new Error('RESULT_PARSE_EMPTY_OUTPUT');
  }

  let document;
  try {
    document = JSON.parse(output);
  } catch {
    throw new Error('RESULT_PARSE_INVALID_JSON');
  }
  if (
    !document ||
    typeof document !== 'object' ||
    Array.isArray(document) ||
    document.format !== stationTestReporterFormat ||
    document.complete !== true ||
    !Array.isArray(document.tests)
  ) {
    throw new Error('RESULT_PARSE_INVALID_DOCUMENT');
  }
  if (document.tests.length === 0) {
    throw new Error('RESULT_PARSE_EMPTY_TEST_RESULTS');
  }

  return Object.freeze({
    complete: true,
    format: stationTestReporterFormat,
    tests: Object.freeze(
      document.tests.map((record) =>
        validateTestRecord(record, repositoryRoot)),
    ),
  });
}

export function stationTestIdentityKey({ file, fullName }) {
  if (
    typeof file !== 'string' ||
    file === '' ||
    typeof fullName !== 'string' ||
    fullName === ''
  ) {
    throw new Error('INVALID_TEST_IDENTITY');
  }
  return JSON.stringify([file, fullName]);
}

export function matchesStationTestIdentity(result, identity) {
  return result.file === identity.file &&
    result.fullName === identity.fullName;
}

export function matchesStationCausalSignature(result, signature) {
  if (signature === undefined) {
    return true;
  }
  if (!signature || typeof signature !== 'object') {
    throw new Error('INVALID_CAUSAL_SIGNATURE');
  }

  const error = result.error;
  if (!error) {
    return false;
  }
  if (
    signature.errorCode !== undefined &&
    error.code !== signature.errorCode
  ) {
    return false;
  }
  if (
    signature.errorName !== undefined &&
    error.name !== signature.errorName
  ) {
    return false;
  }
  if (
    signature.failureType !== undefined &&
    error.failureType !== signature.failureType
  ) {
    return false;
  }
  if (
    signature.messageIncludes !== undefined &&
    !error.message.includes(signature.messageIncludes)
  ) {
    return false;
  }
  return true;
}
