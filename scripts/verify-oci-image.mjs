import { execFile } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const imageReference = process.argv.slice(2).find((argument) => argument !== '--');

if (!imageReference) {
  process.stderr.write(
    'Usage: pnpm run verify:container -- <local-image-reference>\n',
  );
  process.exit(2);
}

const containerName = `srtaller-oci-verify-${randomUUID()}`;
const postgresContainerName = `srtaller-pg-verify-${randomUUID()}`;
const networkName = `srtaller-oci-verify-${randomUUID()}`;
const postgresImage =
  'postgres@sha256:d93de42662696f278fb34354b06fdaa90ad7ca3106d6f72fbd01d16da006d2cf';
const databaseName = 'srtaller_preview_oci';
const databaseUser = 'srtaller_preview_oci';
const databasePassword = `synthetic_${randomBytes(24).toString('hex')}`;
const pinPepper = randomBytes(32).toString('base64url');
const expectedRootEntries = ['dist', 'node_modules', 'package.json'];
const forbiddenPaths = [
  '/app/.env',
  '/app/.git',
  '/app/apps',
  '/app/docs',
  '/app/spikes',
  '/app/src',
  '/app/test',
  '/app/tools',
  '/app/node_modules/@types',
  '/app/node_modules/@vitejs',
  '/app/node_modules/react',
  '/app/node_modules/react-dom',
  '/app/node_modules/react-router-dom',
  '/app/node_modules/typescript',
  '/app/node_modules/vite',
];

async function docker(arguments_, options = {}) {
  try {
    return await execFileAsync('docker', arguments_, {
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
      ...options,
    });
  } catch {
    throw new Error(
      `OCI verification Docker operation failed: ${arguments_[0] ?? 'unknown'}`,
    );
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function inspect(target) {
  const { stdout } = await docker(['inspect', target]);
  return JSON.parse(stdout)[0];
}

async function execInContainer(...arguments_) {
  return docker(['exec', containerName, ...arguments_]);
}

async function waitForReady(port) {
  let lastError;

  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/readyz`, {
        signal: AbortSignal.timeout(500),
      });

      if (response.status === 200) {
        return;
      }
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`Container readiness timed out: ${lastError?.message ?? 'not ready'}`);
}

async function request(port, path) {
  const response = await fetch(`http://127.0.0.1:${port}${path}`, {
    signal: AbortSignal.timeout(2_000),
  });
  const text = await response.text();
  let body;

  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  return {
    body,
    headers: Object.fromEntries(response.headers.entries()),
    status: response.status,
  };
}

async function removeContainer() {
  try {
    await docker(['rm', '--force', containerName]);
  } catch {
    // Best-effort cleanup after either a successful stop or an early failure.
  }
}

async function removePostgres() {
  try {
    await docker(['rm', '--force', postgresContainerName]);
  } catch {
    // Best-effort cleanup.
  }
  try {
    await docker(['network', 'rm', networkName]);
  } catch {
    // Best-effort cleanup.
  }
}

async function waitForPostgres() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const state = await inspect(postgresContainerName);
    if (state.State.Health?.Status === 'healthy') return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('PostgreSQL container health timed out');
}

function databaseEnvironment(role) {
  return {
    SR_DB_ENVIRONMENT: 'development',
    SR_DB_HOST: 'postgres',
    SR_DB_PORT: '5432',
    SR_DB_NAME: databaseName,
    SR_DB_USER: databaseUser,
    SR_DB_PASSWORD: databasePassword,
    SR_DB_SSL_MODE: 'disable',
    SR_DB_POOL_MIN: '0',
    SR_DB_POOL_MAX: '3',
    SR_DB_IDLE_TIMEOUT_MS: '1000',
    SR_DB_CONNECTION_TIMEOUT_MS: '2000',
    SR_DB_STATEMENT_TIMEOUT_MS: '2000',
    SR_DB_QUERY_TIMEOUT_MS: '2000',
    SR_DB_APPLICATION_NAME:
      role === 'migration'
        ? 'srtaller-preview-oci-migrator'
        : 'srtaller-preview-oci-runtime',
    SR_DB_ROLE: role,
    SR_DB_ACCESS_MODE: 'read-write',
    SR_DB_MIGRATIONS_ENABLED: role === 'migration' ? 'true' : 'false',
    ...(role === 'application' ? { SR_PIN_PEPPER: pinPepper } : {}),
  };
}

function environmentArguments(environment) {
  return Object.entries(environment).flatMap(([name, value]) => [
    '--env',
    `${name}=${value}`,
  ]);
}

let stoppedNormally = false;

try {
  const image = await inspect(imageReference);
  const imageEnvironment = Object.fromEntries(
    (image.Config.Env ?? []).map((entry) => {
      const separator = entry.indexOf('=');
      return [entry.slice(0, separator), entry.slice(separator + 1)];
    }),
  );

  assert(image.Config.User === 'node', 'Runtime image must declare USER node');
  assert(imageEnvironment.HOST === '0.0.0.0', 'HOST default must be 0.0.0.0');
  assert(imageEnvironment.NODE_ENV === 'production', 'NODE_ENV default must be production');
  assert(imageEnvironment.PORT === '3000', 'PORT default must be 3000');
  const sourceRevision = imageEnvironment.SR_RUNTIME_GIT_SHA;
  assert(
    /^[0-9a-f]{40}$/u.test(sourceRevision ?? ''),
    'Runtime image must declare an exact source revision',
  );
  assert(
    imageEnvironment.SR_RUNTIME_SOURCE_STATE === 'clean',
    'Runtime image source state must be clean',
  );
  assert(
    image.Config.Labels?.['org.opencontainers.image.revision'] === sourceRevision,
    'OCI revision label must match runtime source revision',
  );
  assert(
    !Object.keys(imageEnvironment).some((name) =>
      /(?:DATABASE_URL|PASSWORD|SECRET|TOKEN)/u.test(name),
    ),
    'Runtime image configuration must not contain secret-bearing variables',
  );
  assert(image.Config.ExposedPorts?.['3000/tcp'], 'Runtime image must expose 3000/tcp');
  assert(image.Config.Healthcheck?.Test?.[0] === 'CMD', 'Image must have exec-form HEALTHCHECK');

  await docker(['network', 'create', networkName]);
  await docker([
    'run',
    '--detach',
    '--name',
    postgresContainerName,
    '--network',
    networkName,
    '--network-alias',
    'postgres',
    '--tmpfs',
    '/var/lib/postgresql:rw,noexec,nosuid,size=256m',
    '--env',
    `POSTGRES_DB=${databaseName}`,
    '--env',
    `POSTGRES_USER=${databaseUser}`,
    '--env',
    `POSTGRES_PASSWORD=${databasePassword}`,
    '--health-cmd',
    `pg_isready --username=${databaseUser} --dbname=${databaseName}`,
    '--health-interval',
    '1s',
    '--health-timeout',
    '2s',
    '--health-retries',
    '30',
    postgresImage,
  ]);
  await waitForPostgres();
  const postgresState = await inspect(postgresContainerName);
  assert(
    !postgresState.HostConfig.PortBindings?.['5432/tcp'],
    'Ephemeral PostgreSQL must not publish a host port',
  );

  const migrationEnvironment = databaseEnvironment('migration');
  const firstMigration = await docker([
    'run',
    '--rm',
    '--read-only',
    '--network',
    networkName,
    ...environmentArguments(migrationEnvironment),
    imageReference,
    'node',
    '--enable-source-maps',
    'dist/db-migrate.js',
  ]);
  const firstMigrationResult = JSON.parse(firstMigration.stdout.trim());
  assert(firstMigrationResult.applied > 0, 'Initial OCI migration must apply every governed migration once');
  assert(firstMigrationResult.pending === 0, 'Initial OCI migration must leave no pending item');
  assert(
    !firstMigration.stdout.includes(databasePassword),
    'OCI migration output must not expose the database password',
  );
  const secondMigration = await docker([
    'run',
    '--rm',
    '--read-only',
    '--network',
    networkName,
    ...environmentArguments(migrationEnvironment),
    imageReference,
    'node',
    '--enable-source-maps',
    'dist/db-migrate.js',
  ]);
  const secondMigrationResult = JSON.parse(secondMigration.stdout.trim());
  assert(secondMigrationResult.applied === 0, 'Repeated OCI migration must be a no-op');
  assert(secondMigrationResult.pending === 0, 'Repeated OCI migration must remain clean');

  await docker([
    'create',
    '--name',
    containerName,
    '--read-only',
    '--network',
    networkName,
    '--publish',
    '127.0.0.1::3000',
    ...environmentArguments(databaseEnvironment('application')),
    imageReference,
  ]);
  await docker(['start', containerName]);

  const running = await inspect(containerName);
  const port = Number(running.NetworkSettings.Ports['3000/tcp'][0].HostPort);
  await waitForReady(port);

  const [root, spa, provenance, live, ready, apiUnknown, unknown] = await Promise.all([
    request(port, '/'),
    request(port, '/reparaciones'),
    request(port, '/runtime-provenance.json'),
    request(port, '/livez'),
    request(port, '/readyz'),
    request(port, '/api/unknown'),
    request(port, '/not-authorized'),
  ]);
  assert(root.status === 200, '/ must return HTTP 200');
  assert(typeof root.body === 'string', '/ must return HTML');
  assert(root.body.includes('<title>SR Taller 2.0 · Preview</title>'), '/ must return the recovered UI');
  assert(spa.status === 200, '/reparaciones must return HTTP 200');
  assert(spa.body === root.body, '/reparaciones must return the SPA entrypoint');
  assert(provenance.status === 200, '/runtime-provenance.json must return HTTP 200');
  assert(provenance.headers['cache-control'] === 'no-store', 'Runtime provenance must not be cached');
  assert(provenance.body?.role === 'frontend', 'Frontend provenance role is missing');
  assert(provenance.body?.sourceRevision === sourceRevision, 'Frontend source revision must match image');
  assert(provenance.body?.sourceState === 'clean', 'Frontend source state must be clean');
  assert(live.status === 200, '/livez must return HTTP 200');
  assert(live.body?.status === 'live', '/livez must return the stable live contract');
  assert(ready.status === 200, '/readyz must return HTTP 200 after bootstrap');
  assert(ready.body?.status === 'ready', '/readyz must return the stable ready contract');
  assert(ready.headers['x-sr-runtime-role'] === 'backend', 'Backend provenance role is missing');
  assert(ready.headers['x-sr-source-revision'] === sourceRevision, 'Backend source revision must match image');
  assert(ready.headers['x-sr-source-state'] === 'clean', 'Backend source state must be clean');
  assert(apiUnknown.status === 404, 'Unknown API routes must return HTTP 404');
  assert(unknown.status === 404, 'Unknown routes must return HTTP 404');

  const { stdout: identity } = await execInContainer(
    'node',
    '--input-type=module',
    '--eval',
    "process.stdout.write(`${process.getuid()}:${process.getgid()}`)",
  );
  assert(identity.trim() === '1000:1000', 'Runtime process must execute as uid/gid 1000');

  const { stdout: rootListing } = await execInContainer(
    'node',
    '--input-type=module',
    '--eval',
    "import { readdir } from 'node:fs/promises'; process.stdout.write(JSON.stringify((await readdir('/app')).sort()))",
  );
  assert(
    JSON.stringify(JSON.parse(rootListing)) === JSON.stringify(expectedRootEntries),
    'Runtime /app must contain only dist, node_modules and package.json',
  );

  const { stdout: forbiddenPresent } = await execInContainer(
    'node',
    '--input-type=module',
    '--eval',
    `import { access } from 'node:fs/promises'; const paths = ${JSON.stringify(forbiddenPaths)}; const present = []; for (const path of paths) { try { await access(path); present.push(path); } catch {} } process.stdout.write(JSON.stringify(present));`,
  );
  assert(JSON.parse(forbiddenPresent).length === 0, 'Forbidden build or secret paths are present');

  const { stdout: migrationPresent } = await execInContainer(
    'node',
    '--input-type=module',
    '--eval',
    "import { access } from 'node:fs/promises'; await access('/app/dist/infrastructure/database/migrations/20260725183832_database_create_tenants_and_branches.js'); process.stdout.write('yes')",
  );
  assert(migrationPresent === 'yes', 'Compiled migration is missing from the image');

  const beforeStop = await inspect(containerName);
  assert(beforeStop.Mounts.length === 0, 'Container must run without volumes or mounts');
  assert(beforeStop.HostConfig.ReadonlyRootfs, 'Container root filesystem must be read-only');
  assert(beforeStop.State.Running, 'Container must be running before SIGTERM test');

  const { stdout: processList } = await docker([
    'top',
    containerName,
    '-eo',
    'pid,comm,args',
  ]);
  assert(
    /--enable-source-maps dist\/main\.js(?:\s|$)/u.test(processList),
    'Expected Node app process is missing',
  );
  assert(!/postgres|redis|waha/i.test(processList), 'Forbidden auxiliary service process detected');

  const { stdout: filesystemDiff } = await docker(['diff', containerName]);
  assert(filesystemDiff.trim() === '', 'Runtime requests must not mutate the container filesystem');

  await docker(['stop', '--signal', 'SIGTERM', '--time', '10', containerName]);
  stoppedNormally = true;
  const stopped = await inspect(containerName);
  assert(stopped.State.ExitCode === 0, 'SIGTERM shutdown must exit with code 0');
  assert(!stopped.State.Running, 'Container must stop after SIGTERM');

  process.stdout.write(
    `${JSON.stringify(
      {
        filesystemDiff: [],
        gracefulSigterm: true,
        healthcheck: image.Config.Healthcheck,
        imageId: image.Id,
        imageReference,
        imageSizeBytes: image.Size,
        sourceRevision,
        mounts: [],
        migration: {
          firstApplied: firstMigrationResult.applied,
          secondApplied: secondMigrationResult.applied,
          pending: secondMigrationResult.pending,
        },
        postgres: {
          image: postgresImage,
          publicPort: false,
        },
        readOnlyRootFilesystem: true,
        root,
        spa,
        ready,
        runtimeIdentity: identity.trim(),
        runtimeRootEntries: expectedRootEntries,
        unknownRouteStatus: unknown.status,
        unknownApiStatus: apiUnknown.status,
        live,
      },
      null,
      2,
    )}\n`,
  );
} finally {
  await removeContainer();
  await removePostgres();

  if (!stoppedNormally) {
    process.stderr.write('OCI verification did not reach a clean SIGTERM stop.\n');
  }
}
