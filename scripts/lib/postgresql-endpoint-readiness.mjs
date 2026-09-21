import { Pool } from 'pg';

const defaultNow = () => Date.now();
const defaultSleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));
const defaultCreatePool = (configuration) => new Pool(configuration);

function requireString(value, name) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${name} must be a non-empty string`);
  }
}

function requirePositiveInteger(value, name) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new TypeError(`${name} must be a positive integer`);
  }
}

function failureIdentity(error) {
  const name = error instanceof Error ? error.name : 'Error';
  const code =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string' &&
    /^[A-Z0-9_]+$/u.test(error.code)
      ? error.code
      : 'UNKNOWN';
  return `${name}/${code}`;
}

export async function waitForPostgresqlEndpoint(options) {
  if (typeof options !== 'object' || options === null) {
    throw new TypeError('PostgreSQL readiness options are required');
  }
  const {
    host,
    port,
    database,
    user,
    password,
    ssl = false,
    timeoutMs = 10_000,
    retryIntervalMs = 200,
    connectionTimeoutMs = 1_000,
    createPool = defaultCreatePool,
    now = defaultNow,
    sleep = defaultSleep,
  } = options;

  requireString(host, 'host');
  requirePositiveInteger(port, 'port');
  if (port > 65_535) throw new TypeError('port must be at most 65535');
  requireString(database, 'database');
  requireString(user, 'user');
  requireString(password, 'password');
  requirePositiveInteger(timeoutMs, 'timeoutMs');
  requirePositiveInteger(retryIntervalMs, 'retryIntervalMs');
  requirePositiveInteger(connectionTimeoutMs, 'connectionTimeoutMs');
  if (
    typeof createPool !== 'function' ||
    typeof now !== 'function' ||
    typeof sleep !== 'function'
  ) {
    throw new TypeError('PostgreSQL readiness collaborators must be functions');
  }

  const startedAt = now();
  const deadline = startedAt + timeoutMs;
  let attempts = 0;
  let lastError;

  while (true) {
    attempts += 1;
    const pool = createPool({
      host,
      port,
      database,
      user,
      password,
      ssl,
      max: 1,
      connectionTimeoutMillis: Math.min(connectionTimeoutMs, timeoutMs),
    });
    let ready = false;
    try {
      await pool.query('select 1');
      ready = true;
    } catch (error) {
      lastError = error;
    } finally {
      try {
        await pool.end();
      } catch (error) {
        if (ready) {
          throw new Error('PostgreSQL readiness probe cleanup failed', {
            cause: error,
          });
        }
        lastError = error;
      }
    }

    if (ready) {
      return Object.freeze({ attempts, elapsedMs: Math.max(0, now() - startedAt) });
    }

    const remainingMs = deadline - now();
    if (remainingMs <= 0) {
      throw new Error(
        `PostgreSQL endpoint readiness timed out after ${timeoutMs}ms (${attempts} attempts; last failure ${failureIdentity(lastError)})`,
        { cause: lastError },
      );
    }
    await sleep(Math.min(retryIntervalMs, remainingMs));
  }
}
