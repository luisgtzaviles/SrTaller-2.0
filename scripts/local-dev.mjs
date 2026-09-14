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
import {
  inspectWorkingTreeProvenance,
  runtimeProvenanceEnvironment,
  waitForLiveRuntimeProvenance,
} from './lib/runtime-provenance.mjs';

const values = await ensureLocalEnvironment();
const provenance = await inspectWorkingTreeProvenance();
const provenanceEnvironment = runtimeProvenanceEnvironment(provenance);
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
    ...startupEnvironment(values, provenanceEnvironment),
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
  env: { ...baseEnvironment, ...viteEnvironment(values, provenanceEnvironment) },
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

try {
  const verified = await waitForLiveRuntimeProvenance({
    frontendBaseUrl: `http://${values.SR_LOCAL_VITE_HOST}:${values.SR_LOCAL_VITE_PORT}`,
    backendBaseUrl: `http://${values.SR_LOCAL_BACKEND_HOST}:${values.SR_LOCAL_BACKEND_PORT}`,
    expected: provenance,
  });
  process.stdout.write(`${JSON.stringify({ event: 'local_runtime_provenance_verified', ...verified })}\n`);
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : 'Local runtime provenance failed'}\n`);
  stop(1);
}
