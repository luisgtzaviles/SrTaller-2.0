export const ownerScopedPostgresqlTestFiles = Object.freeze([
  'test/owner-scoped-persistence-postgresql.test.mjs',
  'test/repair-persistence-postgresql.test.mjs',
  'test/trusted-station-context-postgresql.test.mjs',
  'test/user-directory-postgresql.test.mjs',
  'test/access-role-postgresql.test.mjs',
  'test/access-pin-postgresql.test.mjs',
  'test/access-session-postgresql.test.mjs',
]);

export const ownerScopedPostgresqlNodeTestArguments = Object.freeze([
  '--no-maglev',
  '--test',
  '--test-concurrency=1',
  ...ownerScopedPostgresqlTestFiles,
]);

const childFailureMarker = 'SR_POSTGRESQL_CHILD_FAILURE=';
const childFailureOperation = 'owner-scoped-adapters-node-test';
const allowedSignals = new Set([
  'SIGABRT',
  'SIGALRM',
  'SIGBUS',
  'SIGCHLD',
  'SIGCONT',
  'SIGFPE',
  'SIGHUP',
  'SIGILL',
  'SIGINT',
  'SIGIO',
  'SIGKILL',
  'SIGPIPE',
  'SIGPOLL',
  'SIGPROF',
  'SIGPWR',
  'SIGQUIT',
  'SIGSEGV',
  'SIGSTOP',
  'SIGSYS',
  'SIGTERM',
  'SIGTRAP',
  'SIGTSTP',
  'SIGTTIN',
  'SIGTTOU',
  'SIGURG',
  'SIGUSR1',
  'SIGUSR2',
  'SIGVTALRM',
  'SIGWINCH',
  'SIGXCPU',
  'SIGXFSZ',
]);

function failedTestFiles(output) {
  const lines = output.split(/\r?\n/u);
  return ownerScopedPostgresqlTestFiles.filter((file) => {
    const prefix = `test at ${file}:`;
    return lines.some(
      (line) =>
        line.startsWith(prefix) &&
        /^\d+:\d+$/u.test(line.slice(prefix.length)),
    );
  });
}

function validExitCode(value) {
  return (
    value === null ||
    (Number.isInteger(value) && value >= 0 && value <= 255)
  );
}

function validSignal(value) {
  return value === null || allowedSignals.has(value);
}

function validFailurePayload(payload) {
  if (
    payload === null ||
    typeof payload !== 'object' ||
    Array.isArray(payload) ||
    Object.keys(payload).sort().join(',') !==
      'exitCode,failedTests,operation,schemaVersion,signal,timeout' ||
    payload.schemaVersion !== 1 ||
    payload.operation !== childFailureOperation ||
    !Array.isArray(payload.failedTests) ||
    payload.failedTests.length > ownerScopedPostgresqlTestFiles.length ||
    new Set(payload.failedTests).size !== payload.failedTests.length ||
    payload.failedTests.some(
      (file) => !ownerScopedPostgresqlTestFiles.includes(file),
    ) ||
    !validExitCode(payload.exitCode) ||
    !validSignal(payload.signal) ||
    typeof payload.timeout !== 'boolean'
  ) {
    return false;
  }
  return true;
}

export function createPostgresqlChildFailureMarker(error) {
  const stdout =
    error !== null &&
    typeof error === 'object' &&
    typeof error.stdout === 'string'
      ? error.stdout
      : '';
  const exitCode =
    error !== null &&
    typeof error === 'object' &&
    validExitCode(error.code)
      ? error.code
      : null;
  const signal =
    error !== null &&
    typeof error === 'object' &&
    validSignal(error.signal)
      ? error.signal
      : null;
  const payload = {
    schemaVersion: 1,
    operation: childFailureOperation,
    failedTests: failedTestFiles(stdout),
    exitCode,
    signal,
    timeout:
      error !== null &&
      typeof error === 'object' &&
      error.killed === true,
  };
  return `${childFailureMarker}${JSON.stringify(payload)}`;
}

export function parsePostgresqlChildFailureMarker(stderr) {
  if (typeof stderr !== 'string') {
    return null;
  }
  const markers = stderr
    .split(/\r?\n/u)
    .filter((line) => line.startsWith(childFailureMarker));
  if (markers.length !== 1 || markers[0].length > 1_024) {
    return null;
  }
  let payload;
  try {
    payload = JSON.parse(markers[0].slice(childFailureMarker.length));
  } catch {
    return null;
  }
  if (!validFailurePayload(payload)) {
    return null;
  }
  return Object.freeze({
    ...payload,
    failedTests: Object.freeze([...payload.failedTests]),
  });
}

export function formatPostgresqlChildFailureDiagnostic(payload) {
  if (!validFailurePayload(payload)) {
    return null;
  }
  return [
    `operation=${payload.operation}`,
    `failedTests=${
      payload.failedTests.length === 0
        ? 'unidentified'
        : payload.failedTests.join(',')
    }`,
    `exitCode=${payload.exitCode ?? 'unknown'}`,
    `signal=${payload.signal ?? 'none'}`,
    `timeout=${payload.timeout ? 'yes' : 'no'}`,
  ].join('; ');
}

function summaryValue(output, label) {
  const pattern = new RegExp(
    `^[^\\r\\n]*\\b${label}\\s+(\\d+)\\s*$`,
    'mu',
  );
  const value = pattern.exec(output)?.[1];
  if (value === undefined) {
    throw new Error(`PostgreSQL test output is missing ${label} count`);
  }
  return Number.parseInt(value, 10);
}

export function assertPostgresqlTestSummary(
  output,
  { minimumTests = 1 } = {},
) {
  const summary = Object.freeze({
    tests: summaryValue(output, 'tests'),
    pass: summaryValue(output, 'pass'),
    fail: summaryValue(output, 'fail'),
    cancelled: summaryValue(output, 'cancelled'),
    skipped: summaryValue(output, 'skipped'),
    todo: summaryValue(output, 'todo'),
  });

  if (
    summary.tests < minimumTests ||
    summary.pass !== summary.tests ||
    summary.fail !== 0 ||
    summary.cancelled !== 0 ||
    summary.skipped !== 0 ||
    summary.todo !== 0
  ) {
    throw new Error(
      'PostgreSQL critical suite did not execute every expected test',
    );
  }

  return summary;
}
