import { spawn } from 'node:child_process';

import {
  cleanChildEnvironment,
  databaseEnvironment,
  ensureLocalEnvironment,
  startupEnvironment,
  viteEnvironment,
} from './lib/local-development.mjs';
import { localDbUp } from './local-db.mjs';

const values = await ensureLocalEnvironment({ create: false });
await localDbUp();
const baseEnvironment = cleanChildEnvironment();
const backend = spawn('pnpm', ['run', 'dev'], {
  env: {
    ...baseEnvironment,
    ...startupEnvironment(values),
    ...databaseEnvironment(values, 'application'),
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
