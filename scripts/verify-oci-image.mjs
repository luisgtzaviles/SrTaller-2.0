import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
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
  '/app/node_modules/typescript',
];

async function docker(arguments_, options = {}) {
  return execFileAsync('docker', arguments_, {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    ...options,
  });
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

  return { body, status: response.status };
}

async function removeContainer() {
  try {
    await docker(['rm', '--force', containerName]);
  } catch {
    // Best-effort cleanup after either a successful stop or an early failure.
  }
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
  assert(
    !Object.keys(imageEnvironment).some((name) =>
      /(?:DATABASE_URL|PASSWORD|SECRET|TOKEN)/u.test(name),
    ),
    'Runtime image configuration must not contain secret-bearing variables',
  );
  assert(image.Config.ExposedPorts?.['3000/tcp'], 'Runtime image must expose 3000/tcp');
  assert(image.Config.Healthcheck?.Test?.[0] === 'CMD', 'Image must have exec-form HEALTHCHECK');

  await docker([
    'create',
    '--name',
    containerName,
    '--publish',
    '127.0.0.1::3000',
    imageReference,
  ]);
  await docker(['start', containerName]);

  const running = await inspect(containerName);
  const port = Number(running.NetworkSettings.Ports['3000/tcp'][0].HostPort);
  await waitForReady(port);

  const [live, ready, unknown] = await Promise.all([
    request(port, '/livez'),
    request(port, '/readyz'),
    request(port, '/not-authorized'),
  ]);
  assert(live.status === 200, '/livez must return HTTP 200');
  assert(live.body?.status === 'live', '/livez must return the stable live contract');
  assert(ready.status === 200, '/readyz must return HTTP 200 after bootstrap');
  assert(ready.body?.status === 'ready', '/readyz must return the stable ready contract');
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
  assert(beforeStop.State.Running, 'Container must be running before SIGTERM test');

  const { stdout: processList } = await docker([
    'top',
    containerName,
    '-eo',
    'pid,comm,args',
  ]);
  assert(/node --enable-source-maps dist\/main\.js/.test(processList), 'Expected Node app process is missing');
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
        mounts: [],
        ready,
        runtimeIdentity: identity.trim(),
        runtimeRootEntries: expectedRootEntries,
        unknownRouteStatus: unknown.status,
        live,
      },
      null,
      2,
    )}\n`,
  );
} finally {
  await removeContainer();

  if (!stoppedNormally) {
    process.stderr.write('OCI verification did not reach a clean SIGTERM stop.\n');
  }
}
