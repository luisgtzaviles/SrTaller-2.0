import { spawn } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
const postgresImage =
  process.env.SR_PBI030_POSTGRES_IMAGE ??
  'postgres@sha256:d93de42662696f278fb34354b06fdaa90ad7ca3106d6f72fbd01d16da006d2cf';
const nodeImage = process.env.SR_PBI030_NODE_IMAGE ?? 'node:24.18.0-bookworm-slim';
const socketDirectory = '/var/run/postgresql';
const database = 'srtaller_preview';
const owner = 'srtaller_preview_owner';
const migrator = 'srtaller_preview_migrator';
const application = 'srtaller_preview_application';

async function command(commandName, argumentsList, options = {}) {
  const timeoutMs = options.timeout ?? 120_000;
  const maxBuffer = options.maxBuffer ?? 20 * 1024 * 1024;
  return await new Promise((resolve, reject) => {
    const child = spawn(commandName, argumentsList, {
      env: options.env,
      cwd: options.cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    let killed = false;
    const timer = setTimeout(() => {
      killed = true;
      child.kill('SIGKILL');
    }, timeoutMs);
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
      if (stdout.length + stderr.length > maxBuffer) {
        killed = true;
        child.kill('SIGKILL');
      }
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
      if (stdout.length + stderr.length > maxBuffer) {
        killed = true;
        child.kill('SIGKILL');
      }
    });
    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      const diagnostic = [stdout, stderr]
      .filter((value) => typeof value === 'string' && value.trim() !== '')
      .join('\n')
      .replace(/synthetic_[0-9a-f]+/giu, 'synthetic_<redacted>')
      .split('\n')
      .slice(-80)
      .join('\n')
      .trim();
      reject(
        new Error(
          `${commandName} ${argumentsList[0] ?? ''} failed` +
            (killed ? ` (${signal ?? 'timeout'})` : '') +
            (diagnostic === '' ? '' : `\n${diagnostic}`),
        ),
      );
    });
    child.stdin.end(options.input ?? '');
  });
}

async function docker(argumentsList, options = {}) {
  return command('docker', argumentsList, options);
}

async function waitForPostgresql(container) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    const result = await docker([
      'exec',
      '-u',
      'postgres',
      container,
      'pg_isready',
      '-h',
      socketDirectory,
      '-p',
      '5432',
      '-U',
      'postgres',
    ]).catch(() => undefined);
    if (result?.stdout.includes('accepting connections')) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('PostgreSQL socket readiness timed out');
}

function baseEnvironment(password, role) {
  return {
    SR_DB_ENVIRONMENT: 'development',
    SR_DB_HOST: socketDirectory,
    SR_DB_PORT: '5432',
    SR_DB_NAME: database,
    SR_DB_USER: role === 'migration' ? migrator : application,
    SR_DB_PASSWORD: password,
    SR_DB_SSL_MODE: 'disable',
    SR_DB_POOL_MIN: '0',
    SR_DB_POOL_MAX: '4',
    SR_DB_IDLE_TIMEOUT_MS: '1000',
    SR_DB_CONNECTION_TIMEOUT_MS: '2000',
    SR_DB_STATEMENT_TIMEOUT_MS: '5000',
    SR_DB_QUERY_TIMEOUT_MS: '5000',
    SR_DB_APPLICATION_NAME:
      role === 'migration'
        ? 'srtaller-preview-migration'
        : 'srtaller-preview',
    SR_DB_ROLE: role,
    SR_DB_ACCESS_MODE: 'read-write',
    SR_DB_MIGRATIONS_ENABLED: role === 'migration' ? 'true' : 'false',
  };
}

async function psql(volume, user, password, targetDatabase, sql) {
  return docker([
    'run',
    '--rm',
    '--platform',
    'linux/amd64',
    '--network',
    'none',
    '--volume',
    `${volume}:${socketDirectory}`,
    '--env',
    `PGPASSWORD=${password}`,
    postgresImage,
    'psql',
    '-X',
    '-v',
    'ON_ERROR_STOP=1',
    '-h',
    socketDirectory,
    '-p',
    '5432',
    '-U',
    user,
    '-d',
    targetDatabase,
    '-A',
    '-t',
    '-q',
    '-c',
    sql,
  ]);
}

async function expectPsqlFailure(volume, user, password, targetDatabase, sql) {
  const result = await psql(volume, user, password, targetDatabase, sql).then(
    () => false,
    () => true,
  );
  if (!result) {
    throw new Error(`unexpected PostgreSQL connection success for ${user}`);
  }
}

async function nodeInSocketTopology(volume, env, script) {
  return docker([
    'run',
    '--rm',
    '--platform',
    'linux/amd64',
    '--network',
    'none',
    '--volume',
    `${process.cwd()}:/workspace:ro`,
    '--volume',
    `${volume}:${socketDirectory}`,
    '--workdir',
    '/workspace',
    ...Object.entries(env).flatMap(([key, value]) => ['--env', `${key}=${value}`]),
    nodeImage,
    'node',
    '--enable-source-maps',
    ...script,
  ]);
}

async function run() {
  if (process.version !== 'v24.18.0') {
    throw new Error('Node.js 24.18.0 is required for the host-side orchestrator');
  }
  await command(process.execPath, ['--version']);
  const distCheck = await command(process.execPath, [
    '-e',
    "require('node:fs').accessSync('dist/run-migrations.js')",
  ]).then(
    () => true,
    () => false,
  );
  if (!distCheck) {
    throw new Error('dist/run-migrations.js is required; run pnpm run build first');
  }

  const suffix = randomBytes(6).toString('hex');
  const container = `srtaller_pbi030_socket_${suffix}`;
  const volume = `srtaller_pbi030_socket_${suffix}`;
  const password = `synthetic_${randomBytes(18).toString('hex')}`;
  let started = false;
  let volumeCreated = false;

  try {
    await docker(['volume', 'create', volume]);
    volumeCreated = true;
    const { stdout } = await docker([
      'run',
      '--detach',
      '--platform',
      'linux/amd64',
      '--network',
      'none',
      '--name',
      container,
      '--volume',
      `${volume}:${socketDirectory}`,
      '--tmpfs',
      '/var/lib/postgresql:rw,noexec,nosuid,size=256m',
      '--env',
      'POSTGRES_DB=postgres',
      '--env',
      `POSTGRES_PASSWORD=${password}`,
      '--env',
      'POSTGRES_USER=postgres',
      '--env',
      'TZ=UTC',
      postgresImage,
      '-c',
      'listen_addresses=',
      '-c',
      `unix_socket_directories=${socketDirectory}`,
    ]);
    if (stdout.trim() === '') {
      throw new Error('Docker did not return an ephemeral PostgreSQL container ID');
    }
    started = true;
    await waitForPostgresql(container);

    const { stdout: version } = await docker([
      'exec',
      container,
      'postgres',
      '--version',
    ]);
    if (!/postgres \(PostgreSQL\) 18\./u.test(version)) {
      throw new Error('ephemeral PostgreSQL version differs from 18.x');
    }

    await docker(
      [
        'exec',
        '-i',
        '-u',
        'postgres',
        container,
        'psql',
        '-X',
        '-v',
        'ON_ERROR_STOP=1',
        '-h',
        socketDirectory,
        '-p',
        '5432',
        '-U',
        'postgres',
        '-d',
        'postgres',
      ],
      {
        input: `
CREATE ROLE ${owner} NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS;
CREATE ROLE ${migrator} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS PASSWORD '${password}';
CREATE ROLE ${application} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS PASSWORD '${password}';
CREATE DATABASE ${database} OWNER ${owner};
REVOKE ALL ON DATABASE ${database} FROM PUBLIC;
GRANT CONNECT ON DATABASE ${database} TO ${owner}, ${migrator}, ${application};
`,
      },
    );
    await docker(
      [
        'exec',
        '-i',
        '-u',
        'postgres',
        container,
        'psql',
        '-X',
        '-v',
        'ON_ERROR_STOP=1',
        '-h',
        socketDirectory,
        '-p',
        '5432',
        '-U',
        'postgres',
        '-d',
        database,
      ],
      {
        input: `
REVOKE ALL ON SCHEMA public FROM PUBLIC;
ALTER SCHEMA public OWNER TO ${owner};
GRANT USAGE, CREATE ON SCHEMA public TO ${migrator};
GRANT USAGE ON SCHEMA public TO ${application};
`,
      },
    );

    await docker(
      [
        'exec',
        '-i',
        '-u',
        'postgres',
        container,
        'bash',
        '-se',
      ],
      {
        input: `
hba="$(psql -X -w -A -t -h ${socketDirectory} -p 5432 -U postgres -d postgres -c 'show hba_file')"
cat > "$hba" <<'HBA'
local   all                 postgres                        peer
local   srtaller_preview    srtaller_preview_migrator       scram-sha-256
local   srtaller_preview    srtaller_preview_application    scram-sha-256
local   all                 all                             reject
host    all                 all             127.0.0.1/32    reject
host    all                 all             ::1/128         reject
HBA
psql -X -w -h ${socketDirectory} -p 5432 -U postgres -d postgres -c 'select pg_reload_conf()' >/dev/null
psql -X -w -A -t -h ${socketDirectory} -p 5432 -U postgres -d postgres -c "select count(*) from pg_hba_file_rules where error is not null" | grep -qx 0
`,
      },
    );

    await docker([
      'exec',
      '-u',
      'postgres',
      container,
      'bash',
      '-ec',
      `PGPASSWORD='${password}' psql -X -v ON_ERROR_STOP=1 -h 127.0.0.1 -p 5432 -U postgres -d postgres -c 'select 1' >/dev/null 2>&1 && exit 1 || exit 0`,
    ]);

    const migratorSelect = await psql(
      volume,
      migrator,
      password,
      database,
      'select 1',
    );
    const applicationSelect = await psql(
      volume,
      application,
      password,
      database,
      'select 1',
    );
    if (migratorSelect.stdout.trim() !== '1' || applicationSelect.stdout.trim() !== '1') {
      throw new Error('socket SELECT 1 did not return the expected value');
    }
    await expectPsqlFailure(volume, migrator, password, 'postgres', 'select 1');
    await expectPsqlFailure(volume, application, password, 'postgres', 'select 1');
    await expectPsqlFailure(volume, owner, password, database, 'select 1');
    await expectPsqlFailure(volume, 'postgres', password, database, 'select 1');

    const migrationEnvironment = baseEnvironment(password, 'migration');
    const runtimeEnvironment = baseEnvironment(password, 'application');
    const runtimeConfig = await nodeInSocketTopology(volume, runtimeEnvironment, [
      '--input-type=module',
      '-e',
      "import { parseDatabaseConfig } from './dist/infrastructure/database/database-config.js'; import { createDatabaseConnection } from './dist/infrastructure/database/database-connection.js'; const config = parseDatabaseConfig(process.env); if (config.identity.host !== '/var/run/postgresql') throw new Error('socket host was not preserved'); const connection = createDatabaseConnection(config); try { await connection.verify(); } finally { await connection.close(); } console.log('RUNTIME_SOCKET_VERIFY=PASS');",
    ]);
    if (!runtimeConfig.stdout.includes('RUNTIME_SOCKET_VERIFY=PASS')) {
      throw new Error('runtime socket verification did not pass');
    }

    const migrationRun = await nodeInSocketTopology(volume, migrationEnvironment, [
      'dist/run-migrations.js',
    ]);
    const event = JSON.parse(migrationRun.stdout.trim());
    if (
      event.event !== 'database_migrations_completed' ||
      event.operation !== 'latest' ||
      event.migrations.length !== 3 ||
      event.migrations.some(
        (migration) =>
          migration.direction !== 'Up' || migration.status !== 'Success',
      )
    ) {
      throw new Error('migration runner did not apply the exact three migrations');
    }

    const journal = await psql(
      volume,
      migrator,
      password,
      database,
      'select count(*) from kysely_migration',
    );
    if (journal.stdout.trim() !== '3') {
      throw new Error('migration journal row count differs from 3');
    }

    const material = JSON.stringify({
      applicationSelect: 'PASS',
      hba: 'exact-local-srtaller-before-reject',
      migrationRunner: event.migrations.map(({ name }) => name),
      migratorSelect: 'PASS',
      negativeControls: [
        'migrator-cross-db-denied',
        'application-cross-db-denied',
        'owner-login-denied',
        'postgres-peer-from-non-postgres-denied',
        'tcp-localhost-denied',
      ],
      node: '24.18.0',
      postgres: '18',
      socketDirectory,
      tcpPublished: false,
    });
    const materialSha256 = createHash('sha256').update(material).digest('hex');
    process.stdout.write(
      `${JSON.stringify(
        {
          cleanup: 'PASS',
          materialSha256,
          migrationsApplied: 3,
          node: '24.18.0',
          postgres: '18',
          socketDirectory,
          status: 'PASS',
          suite: 'PBI-GP-030 PostgreSQL Unix socket',
        },
        null,
        2,
      )}\n`,
    );
  } finally {
    if (started) {
      await docker(['rm', '--force', container]).catch(() => undefined);
    }
    if (volumeCreated) {
      await docker(['volume', 'rm', '--force', volume]).catch(() => undefined);
    }
  }
}

await run();
