import { spawn } from 'node:child_process';

import {
  cleanChildEnvironment,
  databaseEnvironment,
  ensureLocalEnvironment,
  startupEnvironment,
  viteEnvironment,
} from './lib/local-development.mjs';
import { materializeLocalEvidenceFixtures } from './lib/local-evidence-fixtures.mjs';
import { localDbUp } from './local-db.mjs';

const values = await ensureLocalEnvironment();
await localDbUp();
await materializeLocalEvidenceFixtures();
const baseEnvironment = cleanChildEnvironment();
for (const key of [
  'SR_PIN_PEPPER',
  'SR_SESSION_SIGNING_KEY',
  'SR_STATION_BOOTSTRAP_SECRET',
  'SR_USER_BOOTSTRAP_SECRET',
]) delete baseEnvironment[key];
const backend = spawn('pnpm', ['run', 'dev'], {
  env: {
    ...baseEnvironment,
    ...startupEnvironment(values),
    ...databaseEnvironment(values, 'application'),
    SR_PIN_PEPPER: values.SR_PIN_PEPPER,
    SR_STATION_BOOTSTRAP_SECRET: values.SR_STATION_BOOTSTRAP_SECRET,
  },
  stdio: 'inherit',
});
const frontend = spawn('pnpm', [
  '--filter', '@srtaller/dev-preview-web', 'exec', 'vite',
  '--host', values.SR_LOCAL_VITE_HOST,
  '--port', values.SR_LOCAL_VITE_PORT,
], {
  env: { ...baseEnvironment, ...viteEnvironment(values) },
  stdio: 'inherit',
});

let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  backend.kill('SIGTERM');
  frontend.kill('SIGTERM');
  process.exitCode = code;
}

process.once('SIGINT', () => stop());
process.once('SIGTERM', () => stop());
backend.once('exit', (code) => { if (!stopping && code !== 0) stop(code ?? 1); });
frontend.once('exit', (code) => { if (!stopping && code !== 0) stop(code ?? 1); });
