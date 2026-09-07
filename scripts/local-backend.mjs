import { spawn } from 'node:child_process';

import {
  cleanChildEnvironment,
  databaseEnvironment,
  ensureLocalEnvironment,
  startupEnvironment,
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
const child = spawn('pnpm', ['run', 'dev'], {
  env: {
    ...baseEnvironment,
    ...startupEnvironment(values),
    ...databaseEnvironment(values, 'application'),
    SR_PIN_PEPPER: values.SR_PIN_PEPPER,
    SR_STATION_BOOTSTRAP_SECRET: values.SR_STATION_BOOTSTRAP_SECRET,
    SR_LOCAL_PIN_JORGE: values.SR_LOCAL_PIN_JORGE,
    SR_LOCAL_PIN_MARIA: values.SR_LOCAL_PIN_MARIA,
    SR_LOCAL_PIN_CARLOS: values.SR_LOCAL_PIN_CARLOS,
    SR_LOCAL_PIN_LUIS: values.SR_LOCAL_PIN_LUIS,
    SR_LOCAL_USER_LUIS_ID: values.SR_LOCAL_USER_LUIS_ID,
  },
  stdio: 'inherit',
});

const stop = () => child.kill('SIGTERM');
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
child.once('exit', (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
