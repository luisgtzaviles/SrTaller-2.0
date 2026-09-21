import { spawn } from 'node:child_process';

import {
  cleanChildEnvironment,
  databaseEnvironment,
  ensureLocalEnvironment,
  startupEnvironment,
} from './lib/local-development.mjs';
import { materializeLocalEvidenceFixtures } from './lib/local-evidence-fixtures.mjs';
import { localDbUp } from './local-db.mjs';
import {
  inspectWorkingTreeProvenance,
  runtimeProvenanceEnvironment,
} from './lib/runtime-provenance.mjs';

const values = await ensureLocalEnvironment();
const provenanceEnvironment = runtimeProvenanceEnvironment(
  await inspectWorkingTreeProvenance(),
);
await localDbUp();
await materializeLocalEvidenceFixtures();
const baseEnvironment = cleanChildEnvironment();
for (const key of [
  'SR_PIN_PEPPER',
  'SR_ADMIN_PASSWORD_PEPPER',
  'SR_SESSION_SIGNING_KEY',
  'SR_STATION_BOOTSTRAP_SECRET',
  'SR_USER_BOOTSTRAP_SECRET',
]) delete baseEnvironment[key];
const child = spawn('pnpm', ['run', 'dev'], {
  env: {
    ...baseEnvironment,
    ...startupEnvironment(values, provenanceEnvironment),
    ...databaseEnvironment(values, 'application'),
    SR_PIN_PEPPER: values.SR_PIN_PEPPER,
    SR_ADMIN_PASSWORD_PEPPER: values.SR_ADMIN_PASSWORD_PEPPER,
    SR_STATION_BOOTSTRAP_SECRET: values.SR_STATION_BOOTSTRAP_SECRET,
  },
  stdio: 'inherit',
});

const stop = () => child.kill('SIGTERM');
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
child.once('exit', (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
