import { access } from 'node:fs/promises';
import { spawn } from 'node:child_process';

import {
  cleanChildEnvironment,
  databaseEnvironment,
  ensureLocalEnvironment,
} from './lib/local-development.mjs';
import { grantApplicationAccess, localDbUp } from './local-db.mjs';

async function run(command, argumentsList, environment) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, argumentsList, {
      env: environment,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.once('error', reject);
    child.once('exit', (code, signal) => resolve({ code: code ?? 1, signal, stdout, stderr }));
  });
}

const values = await ensureLocalEnvironment();
await localDbUp();
try {
  await access('dist/db-migrate.js');
} catch {
  const build = await run('pnpm', ['run', 'build'], cleanChildEnvironment());
  if (build.code !== 0) process.exitCode = build.code;
}

if (typeof process.exitCode === 'number' && process.exitCode !== 0) process.exit(process.exitCode);

const environment = {
  ...cleanChildEnvironment(),
  ...databaseEnvironment(values, 'migration'),
};
const migration = await run(process.execPath, ['--enable-source-maps', 'dist/db-migrate.js'], environment);
if (migration.stdout) process.stdout.write(migration.stdout);
if (migration.stderr) process.stderr.write(migration.stderr);
if (migration.code !== 0) {
  process.exitCode = migration.code;
} else {
  await grantApplicationAccess(values);
  process.stdout.write('{"event":"local_postgresql_application_access_ready","role":"application"}\n');
}
