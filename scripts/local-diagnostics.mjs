import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  access,
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';

const projectRoot = process.cwd();
const temporaryRoot = await mkdtemp(join(tmpdir(), 'srtaller-dec004-local-'));

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function run(command, argumentsList, options = {}) {
  const child = spawn(command, argumentsList, {
    cwd: options.cwd,
    env: options.env ?? process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';

  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (chunk) => {
    stdout += chunk;
  });
  child.stderr.on('data', (chunk) => {
    stderr += chunk;
  });

  const code = await new Promise((resolveCode, reject) => {
    child.once('error', reject);
    child.once('exit', (exitCode) => resolveCode(exitCode ?? 1));
  });

  return { code, stderr, stdout };
}

async function copyProduct(target, { includeDist = false } = {}) {
  await mkdir(target, { recursive: true });
  const rootFiles = [
    '.node-version',
    '.npmrc',
    '.nvmrc',
    'package.json',
    'pnpm-lock.yaml',
    'supply-chain-policy.json',
    'tsconfig.build.json',
    'tsconfig.json',
  ];

  for (const file of rootFiles) {
    await cp(resolve(projectRoot, file), resolve(target, file));
  }

  for (const directory of ['scripts', 'src', 'test']) {
    await cp(resolve(projectRoot, directory), resolve(target, directory), {
      recursive: true,
    });
  }

  if (includeDist) {
    await cp(resolve(projectRoot, 'dist'), resolve(target, 'dist'), {
      recursive: true,
    });
  }
}

async function hashFile(path) {
  return createHash('sha256').update(await readFile(path)).digest('hex');
}

async function listFiles(directory, relativeDirectory = '') {
  const entries = await readdir(join(directory, relativeDirectory), {
    withFileTypes: true,
  });
  const files = [];

  for (const entry of entries) {
    const relativePath = join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(directory, relativePath)));
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }

  return files.sort();
}

async function hashManifest(directory) {
  const files = await listFiles(directory, 'dist');
  return Promise.all(
    files.map(async (file) => ({
      path: file.replaceAll('\\', '/'),
      sha256: await hashFile(join(directory, file)),
    })),
  );
}

async function runCanonicalStart(directory) {
  const serverProbe = await import('node:net');
  const reservation = serverProbe.createServer();
  await new Promise((resolveListening) =>
    reservation.listen(0, '127.0.0.1', resolveListening),
  );
  const address = reservation.address();
  if (!address || typeof address === 'string') {
    throw new Error('Could not reserve a local port');
  }
  const port = address.port;
  await new Promise((resolveClose) => reservation.close(resolveClose));

  const child = spawn('pnpm', ['run', 'start'], {
    cwd: directory,
    detached: true,
    env: {
      ...process.env,
      HOST: '127.0.0.1',
      NODE_ENV: 'production',
      PORT: String(port),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (chunk) => {
    stdout += chunk;
  });
  child.stderr.on('data', (chunk) => {
    stderr += chunk;
  });

  const deadline = Date.now() + 8_000;
  let connected = false;
  while (Date.now() < deadline && !connected) {
    connected = await new Promise((resolveConnection) => {
      const socket = serverProbe.createConnection({
        host: '127.0.0.1',
        port,
      });
      socket.once('connect', () => {
        socket.destroy();
        resolveConnection(true);
      });
      socket.once('error', () => resolveConnection(false));
    });
    if (!connected) {
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 50));
    }
  }

  if (child.pid) {
    process.kill(-child.pid, 'SIGTERM');
  }
  const exit = await new Promise((resolveExit) =>
    child.once('exit', (code, signal) => resolveExit({ code, signal })),
  );

  return {
    connected,
    exit,
    marker: stdout.includes('technical_shell_listening'),
    stderrEmpty: stderr.trim().length === 0,
  };
}

const results = {};

try {
  const lockFixture = resolve(temporaryRoot, 'lock-mismatch');
  await copyProduct(lockFixture);
  const lockBefore = await hashFile(resolve(lockFixture, 'pnpm-lock.yaml'));
  const lockManifest = JSON.parse(
    await readFile(resolve(lockFixture, 'package.json'), 'utf8'),
  );
  lockManifest.devDependencies['left-pad'] = '1.3.0';
  await writeFile(
    resolve(lockFixture, 'package.json'),
    `${JSON.stringify(lockManifest, null, 2)}\n`,
  );
  const lockRun = await run('pnpm', ['install', '--frozen-lockfile'], {
    cwd: lockFixture,
  });
  results.lockMismatch = {
    exit: lockRun.code,
    lockfileUnchanged:
      lockBefore === await hashFile(resolve(lockFixture, 'pnpm-lock.yaml')),
    rejected: lockRun.code !== 0,
  };

  const lifecycleFixture = resolve(temporaryRoot, 'lifecycle');
  const scriptedPackage = resolve(lifecycleFixture, 'scripted-package');
  await mkdir(scriptedPackage, { recursive: true });
  await writeFile(
    resolve(lifecycleFixture, 'package.json'),
    `${JSON.stringify(
      {
        name: 'vc009-root',
        version: '1.0.0',
        private: true,
        engines: { node: '24.18.0', pnpm: '11.15.1' },
        packageManager: 'pnpm@11.15.1',
        dependencies: { 'vc009-scripted-package': 'file:./scripted-package' },
      },
      null,
      2,
    )}\n`,
  );
  await writeFile(
    resolve(scriptedPackage, 'package.json'),
    `${JSON.stringify(
      {
        name: 'vc009-scripted-package',
        version: '1.0.0',
        scripts: { postinstall: 'node ./postinstall.mjs' },
      },
      null,
      2,
    )}\n`,
  );
  await writeFile(
    resolve(scriptedPackage, 'postinstall.mjs'),
    "import { writeFileSync } from 'node:fs';\nwriteFileSync(new URL('../executed-marker', import.meta.url), 'unexpected');\n",
  );
  const lifecycleLock = await run('pnpm', ['install', '--lockfile-only'], {
    cwd: lifecycleFixture,
  });
  const lifecycleInstall = await run(
    'pnpm',
    ['install', '--frozen-lockfile'],
    { cwd: lifecycleFixture },
  );
  results.lifecycle = {
    configGenerated: await exists(
      resolve(lifecycleFixture, 'pnpm-workspace.yaml'),
    ),
    installExit: lifecycleInstall.code,
    lockExit: lifecycleLock.code,
    markerAbsent: !(await exists(resolve(lifecycleFixture, 'executed-marker'))),
  };

  const typeFixture = resolve(temporaryRoot, 'type-error');
  await copyProduct(typeFixture);
  const typeInstall = await run('pnpm', ['install', '--frozen-lockfile'], {
    cwd: typeFixture,
  });
  await writeFile(
    resolve(typeFixture, 'src/type-error.ts'),
    "export const invalidType: string = 42;\n",
  );
  const typeRun = await run('pnpm', ['run', 'typecheck'], {
    cwd: typeFixture,
  });
  results.typeError = {
    distAbsent: !(await exists(resolve(typeFixture, 'dist'))),
    installExit: typeInstall.code,
    rejected: typeRun.code !== 0,
    typecheckExit: typeRun.code,
  };

  const casingFixture = resolve(temporaryRoot, 'casing');
  await copyProduct(casingFixture);
  const casingInstall = await run('pnpm', ['install', '--frozen-lockfile'], {
    cwd: casingFixture,
  });
  const modulePath = resolve(casingFixture, 'src/app.module.ts');
  const moduleSource = await readFile(modulePath, 'utf8');
  await writeFile(
    modulePath,
    moduleSource.replace(
      './technical-shell.service.js',
      './Technical-Shell.service.js',
    ),
  );
  const casingRun = await run('pnpm', ['run', 'typecheck'], {
    cwd: casingFixture,
  });
  results.casing = {
    installExit: casingInstall.code,
    rejected: casingRun.code !== 0,
    typecheckExit: casingRun.code,
  };

  const productionFixture = resolve(temporaryRoot, 'production-artifact');
  await copyProduct(productionFixture, { includeDist: true });
  await rm(resolve(productionFixture, 'src'), { recursive: true });
  await rm(resolve(productionFixture, 'test'), { recursive: true });
  const productionInstall = await run(
    'pnpm',
    ['install', '--prod', '--frozen-lockfile'],
    { cwd: productionFixture },
  );
  const productionStart =
    productionInstall.code === 0
      ? await runCanonicalStart(productionFixture)
      : { connected: false, marker: false, stderrEmpty: false };
  results.productionArtifact = {
    installExit: productionInstall.code,
    sourceAbsent: !(await exists(resolve(productionFixture, 'src'))),
    startConnected: productionStart.connected,
    startMarker: productionStart.marker,
    typescriptAbsent: !(await exists(
      resolve(productionFixture, 'node_modules/typescript'),
    )),
  };

  const buildDirectories = [
    resolve(temporaryRoot, 'build-a'),
    resolve(temporaryRoot, 'build-b'),
  ];
  const buildRuns = [];
  const manifests = [];
  for (const buildDirectory of buildDirectories) {
    await copyProduct(buildDirectory);
    const install = await run('pnpm', ['install', '--frozen-lockfile'], {
      cwd: buildDirectory,
    });
    const verify =
      install.code === 0
        ? await run('pnpm', ['run', 'verify'], { cwd: buildDirectory })
        : { code: 1 };
    buildRuns.push({ installExit: install.code, verifyExit: verify.code });
    manifests.push(
      verify.code === 0 ? await hashManifest(buildDirectory) : [],
    );
  }
  results.reproducibility = {
    builds: buildRuns,
    hashesEqual: JSON.stringify(manifests[0]) === JSON.stringify(manifests[1]),
    manifests,
  };

  results.nonInteractive = {
    stdinIsTTY: process.stdin.isTTY === true,
    stdoutIsTTY: process.stdout.isTTY === true,
  };
} finally {
  await rm(temporaryRoot, { force: true, recursive: true });
}

process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);

const passed =
  results.lockMismatch?.rejected === true &&
  results.lockMismatch?.lockfileUnchanged === true &&
  results.lifecycle?.markerAbsent === true &&
  results.typeError?.rejected === true &&
  results.typeError?.distAbsent === true &&
  results.casing?.rejected === true &&
  results.productionArtifact?.installExit === 0 &&
  results.productionArtifact?.sourceAbsent === true &&
  results.productionArtifact?.typescriptAbsent === true &&
  results.productionArtifact?.startConnected === true &&
  results.reproducibility?.hashesEqual === true &&
  results.reproducibility?.builds.every(
    (build) => build.installExit === 0 && build.verifyExit === 0,
  ) === true &&
  results.nonInteractive?.stdinIsTTY === false;

if (!passed) {
  process.exitCode = 1;
}
