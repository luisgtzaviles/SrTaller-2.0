import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';

import {
  LOCAL_ENVIRONMENT,
  LOCAL_CONTAINER,
  LOCAL_DB_NAME,
  LOCAL_DB_PORT,
  LOCAL_IMAGE,
  LOCAL_VOLUME,
  ensureLocalEnvironment,
} from './lib/local-development.mjs';

const execute = promisify(execFile);

function safeIdentifier(value) {
  if (!/^[a-z][a-z0-9_]*$/u.test(value)) {
    throw new Error('Local database identifier is invalid');
  }
  return value;
}

function sqlLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

async function docker(argumentsList, { input, allowFailure = false } = {}) {
  if (input === undefined) {
    try {
      const result = await execute('docker', argumentsList, {
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024,
      });
      return { code: 0, stdout: result.stdout, stderr: result.stderr };
    } catch (error) {
      if (allowFailure) {
        return {
          code: typeof error.code === 'number' ? error.code : 1,
          stdout: String(error.stdout ?? ''),
          stderr: String(error.stderr ?? ''),
        };
      }
      throw new Error(`Docker operation failed: ${argumentsList[0] ?? 'command'}`);
    }
  }

  return new Promise((resolve, reject) => {
    const child = spawn('docker', argumentsList, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.once('error', reject);
    child.once('exit', (code) => {
      if (code !== 0 && !allowFailure) {
        reject(new Error(`Docker operation failed: ${argumentsList[0] ?? 'command'}`));
      } else {
        resolve({ code: code ?? 1, stdout, stderr });
      }
    });
    child.stdin.end(input);
  });
}

async function inspectContainer() {
  const result = await docker(['inspect', LOCAL_CONTAINER], { allowFailure: true });
  if (result.code !== 0) return null;
  const parsed = JSON.parse(result.stdout);
  return parsed[0] ?? null;
}

function assertContainerSafety(container) {
  if (!container) return;
  const labels = container.Config?.Labels ?? {};
  if (container.Config?.Image !== LOCAL_IMAGE) {
    throw new Error('Refusing to operate on a PostgreSQL container with an unexpected image');
  }
  if (labels['io.srtaller.environment'] !== 'local' || labels['io.srtaller.component'] !== 'postgres') {
    throw new Error('Refusing to operate on a container that is not labeled SR Taller Local PostgreSQL');
  }
  if (!(container.Config?.Env ?? []).includes(`POSTGRES_DB=${LOCAL_DB_NAME}`)) {
    throw new Error('Refusing to operate on a container with an unexpected local database');
  }
  const volumes = container.Mounts ?? [];
  if (!volumes.some((mount) => mount.Type === 'volume' && mount.Name === LOCAL_VOLUME)) {
    throw new Error('Refusing to operate on a container without the governed local volume');
  }
  const bindings = container.HostConfig?.PortBindings?.['5432/tcp'] ?? [];
  if (!bindings.some((binding) => binding.HostIp === '127.0.0.1' && binding.HostPort === String(LOCAL_DB_PORT))) {
    throw new Error('Refusing to operate on a PostgreSQL container without loopback-only port binding');
  }
}

async function waitForHealthy() {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    const result = await docker([
      'inspect',
      '--format',
      '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}',
      LOCAL_CONTAINER,
    ]);
    const state = result.stdout.trim();
    if (state === 'healthy') return;
    if (state === 'exited' || state === 'dead') throw new Error('Local PostgreSQL container exited before becoming healthy');
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 400));
  }
  throw new Error('Local PostgreSQL healthcheck timed out');
}

async function runAdminSql(sql, values) {
  const adminUser = safeIdentifier(values.SR_LOCAL_ADMIN_USER);
  await docker(
    ['exec', '--interactive', LOCAL_CONTAINER, 'psql', '-v', 'ON_ERROR_STOP=1', '-U', adminUser, '-d', LOCAL_DB_NAME],
    { input: sql },
  );
}

async function configureRoles(values) {
  const adminUser = safeIdentifier(values.SR_LOCAL_ADMIN_USER);
  const migrationUser = safeIdentifier(values.SR_LOCAL_MIGRATION_USER);
  const applicationUser = safeIdentifier(values.SR_LOCAL_APPLICATION_USER);
  const sql = `
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = ${sqlLiteral(migrationUser)}) THEN
    CREATE ROLE "${migrationUser}" LOGIN PASSWORD ${sqlLiteral(values.SR_LOCAL_MIGRATION_PASSWORD)};
  ELSE
    ALTER ROLE "${migrationUser}" PASSWORD ${sqlLiteral(values.SR_LOCAL_MIGRATION_PASSWORD)};
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = ${sqlLiteral(applicationUser)}) THEN
    CREATE ROLE "${applicationUser}" LOGIN PASSWORD ${sqlLiteral(values.SR_LOCAL_APPLICATION_PASSWORD)};
  ELSE
    ALTER ROLE "${applicationUser}" PASSWORD ${sqlLiteral(values.SR_LOCAL_APPLICATION_PASSWORD)};
  END IF;
END $$;
GRANT CONNECT ON DATABASE "${LOCAL_DB_NAME}" TO "${migrationUser}", "${applicationUser}";
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE, CREATE ON SCHEMA public TO "${migrationUser}";
GRANT USAGE ON SCHEMA public TO "${applicationUser}";
ALTER DEFAULT PRIVILEGES FOR ROLE "${adminUser}" IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO "${applicationUser}";
ALTER DEFAULT PRIVILEGES FOR ROLE "${migrationUser}" IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO "${applicationUser}";
`;
  await runAdminSql(sql, values);
}

export async function grantApplicationAccess(values) {
  const migrationUser = safeIdentifier(values.SR_LOCAL_MIGRATION_USER);
  const applicationUser = safeIdentifier(values.SR_LOCAL_APPLICATION_USER);
  await runAdminSql(`
GRANT USAGE ON SCHEMA public TO "${applicationUser}";
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO "${applicationUser}";
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO "${applicationUser}";
ALTER DEFAULT PRIVILEGES FOR ROLE "${migrationUser}" IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO "${applicationUser}";
`, values);
}

export async function assertServerVersion(values) {
  const adminUser = safeIdentifier(values.SR_LOCAL_ADMIN_USER);
  const result = await docker([
    'exec', LOCAL_CONTAINER, 'psql', '-At', '-U', adminUser, '-d', LOCAL_DB_NAME,
    '-c', 'select current_setting(\'server_version\')',
  ]);
  const version = result.stdout.trim();
  if (!version.startsWith('18.4')) throw new Error(`Expected PostgreSQL 18.4, received ${version || 'unknown'}`);
  return version;
}

export async function localDbUp() {
  const values = await ensureLocalEnvironment();
  let container = await inspectContainer();
  if (container) {
    assertContainerSafety(container);
    if (container.State?.Status !== 'running') await docker(['start', LOCAL_CONTAINER]);
  } else {
    await docker(['volume', 'create', LOCAL_VOLUME]);
    await docker([
      'run', '--detach', '--name', LOCAL_CONTAINER,
      '--label', 'io.srtaller.environment=local',
      '--label', 'io.srtaller.component=postgres',
      '--publish', `127.0.0.1:${LOCAL_DB_PORT}:5432`,
      '--volume', `${LOCAL_VOLUME}:/var/lib/postgresql`,
      '--env', `POSTGRES_DB=${LOCAL_DB_NAME}`,
      '--env', `POSTGRES_USER=${values.SR_LOCAL_ADMIN_USER}`,
      '--env', `POSTGRES_PASSWORD=${values.SR_LOCAL_ADMIN_PASSWORD}`,
      '--health-cmd', `pg_isready --username=${values.SR_LOCAL_ADMIN_USER} --dbname=${LOCAL_DB_NAME}`,
      '--health-interval', '1s', '--health-timeout', '2s', '--health-retries', '30',
      LOCAL_IMAGE,
    ]);
  }
  await waitForHealthy();
  await configureRoles(values);
  const version = await assertServerVersion(values);
  process.stdout.write(`${JSON.stringify({ event: 'local_postgresql_ready', environment: LOCAL_ENVIRONMENT, version, container: LOCAL_CONTAINER, volume: LOCAL_VOLUME, host: '127.0.0.1', port: LOCAL_DB_PORT })}\n`);
}

export async function localDbDown() {
  await ensureLocalEnvironment({ create: false });
  const container = await inspectContainer();
  if (!container) {
    process.stdout.write('{"event":"local_postgresql_already_down"}\n');
    return;
  }
  assertContainerSafety(container);
  if (container.State?.Status === 'running') await docker(['stop', LOCAL_CONTAINER]);
  process.stdout.write(`${JSON.stringify({ event: 'local_postgresql_stopped', container: LOCAL_CONTAINER, volumePreserved: true })}\n`);
}

export async function destroyLocalDatabase() {
  await ensureLocalEnvironment();
  const container = await inspectContainer();
  if (container) {
    assertContainerSafety(container);
    await docker(['rm', '--force', LOCAL_CONTAINER]);
  }
  await docker(['volume', 'rm', LOCAL_VOLUME], { allowFailure: true });
  process.stdout.write(`${JSON.stringify({ event: 'local_postgresql_destroyed', container: LOCAL_CONTAINER, volume: LOCAL_VOLUME, destructive: true, environment: LOCAL_ENVIRONMENT })}\n`);
}

const command = process.argv[2] ?? 'up';
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    if (command === 'up') await localDbUp();
    else if (command === 'down') await localDbDown();
    else if (command === 'destroy') await destroyLocalDatabase();
    else throw new Error(`Unknown local database command: ${command}`);
  } catch (error) {
    process.stderr.write(`${JSON.stringify({ event: 'local_postgresql_failed', error: error instanceof Error ? error.message : 'unexpected failure' })}\n`);
    process.exitCode = 1;
  }
}
