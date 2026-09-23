export const ownerScopedPostgresqlTestFiles = Object.freeze([
  'test/owner-scoped-persistence-postgresql.test.mjs',
  'test/repair-persistence-postgresql.test.mjs',
  'test/trusted-station-context-postgresql.test.mjs',
  'test/user-directory-postgresql.test.mjs',
  'test/access-role-postgresql.test.mjs',
  'test/access-pin-postgresql.test.mjs',
  'test/access-session-postgresql.test.mjs',
  'test/contextual-authorization-postgresql.test.mjs',
]);

export const pbi039PostgresqlTestFiles = Object.freeze([
  'test/customer-phone-postgresql.test.mjs',
  'test/user-preferences-postgresql.test.mjs',
]);

const childFailureMarker = 'SR_POSTGRESQL_CHILD_FAILURE=';
const childFailureOperation = 'owner-scoped-adapters-node-test';
const childDiagnosticMarker = 'SR_POSTGRESQL_CHILD_DIAGNOSTIC=';
const childDiagnosticOperation = 'owner-scoped-adapters-node-test-diagnostic';
const childDiagnosticStreamLimit = 4_096;
const childDiagnosticMarkerLimit = 16_384;
const harnessFailureMarker = 'SR_POSTGRESQL_HARNESS_FAILURE=';
export const ownerScopedPostgresqlHarnessOperations = Object.freeze([
  'owner-scoped-adapters-docker-exec',
  'owner-scoped-adapters-docker-inspect',
  'owner-scoped-adapters-docker-list',
  'owner-scoped-adapters-docker-pull',
  'owner-scoped-adapters-docker-remove',
  'owner-scoped-adapters-docker-run',
]);
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

function validTimeoutReason(value) {
  return value === null || value === 'execFile-timeout';
}

function boundedDiagnosticText(value) {
  const text = typeof value === 'string' ? value : '';
  if (text.length <= childDiagnosticStreamLimit) return text;
  const marker = '\n...[diagnostic output truncated]...\n';
  const available = childDiagnosticStreamLimit - marker.length;
  const headLength = Math.ceil(available / 2);
  return `${text.slice(0, headLength)}${marker}${text.slice(-(
    available - headLength
  ))}`;
}

function redactDiagnosticText(value) {
  return (typeof value === 'string' ? value : '')
    .replace(
      /\b(?:postgres(?:ql)?|mysql|redis):\/\/[^\s"'`]+/giu,
      '[redacted-connection]',
    )
    .replace(
      /\b(?:bearer)\s+[A-Za-z0-9._~+/=-]+/giu,
      'Bearer [redacted]',
    )
    .replace(
      /(\b(?:password|passwd|secret|token|pin|cookie|authorization|csrf|pepper|enrollment(?:[_ -]secret)?))\s*[:=]\s*(?:"[^"]*"|'[^']*'|[^\s,;}]+)/giu,
      '$1=[redacted]',
    )
    .replace(
      /\bSR_[A-Z0-9_]*(?:PASSWORD|TOKEN|SECRET|PEPPER)[^=\s]*=[^\s]+/giu,
      '[redacted-env]',
    );
}

function diagnosticSummary(stdout, stderr) {
  const lines = `${stdout}\n${stderr}`
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(
      (line) =>
        line !== '' &&
        /(?:^not ok\b|AssertionError|(?:^|\s)Error:|SQLSTATE|\b(?:code|exit|signal|timeout)\s*[:=])/iu.test(line),
    );
  return boundedDiagnosticText([...new Set(lines)].join('\n'));
}

function validDiagnosticPayload(payload) {
  return (
    payload !== null &&
    typeof payload === 'object' &&
    !Array.isArray(payload) &&
    Object.keys(payload).sort().join(',') ===
      'exitCode,operation,ordinal,schemaVersion,signal,stderr,stderrTruncated,stdout,stdoutTruncated,suite,summary,timeout,timeoutReason' &&
    payload.schemaVersion === 1 &&
    payload.operation === childDiagnosticOperation &&
    ownerScopedPostgresqlTestFiles.includes(payload.suite) &&
    Number.isInteger(payload.ordinal) &&
    payload.ordinal >= 1 &&
    payload.ordinal <= ownerScopedPostgresqlTestFiles.length &&
    validExitCode(payload.exitCode) &&
    validSignal(payload.signal) &&
    typeof payload.timeout === 'boolean' &&
    validTimeoutReason(payload.timeoutReason) &&
    (payload.timeout ? payload.timeoutReason !== null : payload.timeoutReason === null) &&
    typeof payload.stdout === 'string' &&
    typeof payload.stderr === 'string' &&
    typeof payload.summary === 'string' &&
    typeof payload.stdoutTruncated === 'boolean' &&
    typeof payload.stderrTruncated === 'boolean' &&
    payload.stdout.length <= childDiagnosticStreamLimit &&
    payload.stderr.length <= childDiagnosticStreamLimit &&
    payload.summary.length <= childDiagnosticStreamLimit
  );
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

function validHarnessFailurePayload(payload) {
  if (
    payload === null ||
    typeof payload !== 'object' ||
    Array.isArray(payload) ||
    Object.keys(payload).sort().join(',') !==
      'exitCode,operation,schemaVersion,signal,testFile,timeout' ||
    payload.schemaVersion !== 1 ||
    !ownerScopedPostgresqlHarnessOperations.includes(payload.operation) ||
    !ownerScopedPostgresqlTestFiles.includes(payload.testFile) ||
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

export function createPostgresqlChildDiagnosticMarker(
  error,
  { ordinal, suite },
) {
  const rawStdout =
    error !== null &&
    typeof error === 'object' &&
    typeof error.stdout === 'string'
      ? error.stdout
      : '';
  const rawStderr =
    error !== null &&
    typeof error === 'object' &&
    typeof error.stderr === 'string'
      ? error.stderr
      : '';
  const redactedStdout = redactDiagnosticText(rawStdout);
  const redactedStderr = redactDiagnosticText(rawStderr);
  const stdout = boundedDiagnosticText(redactedStdout);
  const stderr = boundedDiagnosticText(redactedStderr);
  const payload = {
    schemaVersion: 1,
    operation: childDiagnosticOperation,
    suite,
    ordinal,
    exitCode:
      error !== null &&
      typeof error === 'object' &&
      validExitCode(error.code)
        ? error.code
        : null,
    signal:
      error !== null &&
      typeof error === 'object' &&
      validSignal(error.signal)
        ? error.signal
        : null,
    timeout:
      error !== null &&
      typeof error === 'object' &&
      error.killed === true,
    timeoutReason:
      error !== null &&
      typeof error === 'object' &&
      error.killed === true
        ? 'execFile-timeout'
        : null,
    stdout,
    stderr,
    summary: diagnosticSummary(redactedStdout, redactedStderr),
    stdoutTruncated: rawStdout.length > childDiagnosticStreamLimit,
    stderrTruncated: rawStderr.length > childDiagnosticStreamLimit,
  };
  if (!validDiagnosticPayload(payload)) {
    throw new Error('PostgreSQL child diagnostic identity is not governed');
  }
  const marker = `${childDiagnosticMarker}${JSON.stringify(payload)}`;
  if (marker.length > childDiagnosticMarkerLimit) {
    throw new Error('PostgreSQL child diagnostic marker exceeds its bound');
  }
  return marker;
}

export function parsePostgresqlChildDiagnosticMarker(stderr) {
  if (typeof stderr !== 'string') return null;
  const markers = stderr
    .split(/\r?\n/u)
    .filter((line) => line.startsWith(childDiagnosticMarker));
  if (markers.length !== 1 || markers[0].length > childDiagnosticMarkerLimit) {
    return null;
  }
  let payload;
  try {
    payload = JSON.parse(markers[0].slice(childDiagnosticMarker.length));
  } catch {
    return null;
  }
  return validDiagnosticPayload(payload) ? Object.freeze({ ...payload }) : null;
}

export function formatPostgresqlChildDiagnostic(payload) {
  if (!validDiagnosticPayload(payload)) return null;
  return [
    `suite=${payload.suite}`,
    `ordinal=${payload.ordinal}`,
    `exitCode=${payload.exitCode ?? 'unknown'}`,
    `signal=${payload.signal ?? 'none'}`,
    `timeout=${payload.timeout ? 'yes' : 'no'}`,
    `timeoutReason=${payload.timeoutReason ?? 'none'}`,
    `summary=${payload.summary || 'none'}`,
    `stdout=${payload.stdout || 'none'}`,
    `stderr=${payload.stderr || 'none'}`,
  ].join('; ');
}

export function createPostgresqlHarnessFailureMarker(
  operation,
  testFile,
  error,
) {
  const payload = {
    schemaVersion: 1,
    operation,
    testFile,
    exitCode:
      error !== null &&
      typeof error === 'object' &&
      validExitCode(error.code)
        ? error.code
        : null,
    signal:
      error !== null &&
      typeof error === 'object' &&
      validSignal(error.signal)
        ? error.signal
        : null,
    timeout:
      error !== null &&
      typeof error === 'object' &&
      error.killed === true,
  };
  if (!validHarnessFailurePayload(payload)) {
    throw new Error('PostgreSQL harness failure identity is not governed');
  }
  return `${harnessFailureMarker}${JSON.stringify(payload)}`;
}

export function parsePostgresqlHarnessFailureMarker(stderr) {
  if (typeof stderr !== 'string') {
    return null;
  }
  const markers = stderr
    .split(/\r?\n/u)
    .filter((line) => line.startsWith(harnessFailureMarker));
  if (markers.length !== 1 || markers[0].length > 1_024) {
    return null;
  }
  let payload;
  try {
    payload = JSON.parse(markers[0].slice(harnessFailureMarker.length));
  } catch {
    return null;
  }
  if (!validHarnessFailurePayload(payload)) {
    return null;
  }
  return Object.freeze({ ...payload });
}

export function formatPostgresqlHarnessFailureDiagnostic(payload) {
  if (!validHarnessFailurePayload(payload)) {
    return null;
  }
  return [
    `operation=${payload.operation}`,
    `testFile=${payload.testFile}`,
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
