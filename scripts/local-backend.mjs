import { spawn } from 'node:child_process';

import {
  cleanChildEnvironment,
  databaseEnvironment,
  ensureLocalEnvironment,
  startupEnvironment,
} from './lib/local-development.mjs';
import { localDbUp } from './local-db.mjs';

const values = await ensureLocalEnvironment({ create: false });
await localDbUp();
const child = spawn('pnpm', ['run', 'dev'], {
  env: {
    ...cleanChildEnvironment(),
    ...startupEnvironment(values),
    ...databaseEnvironment(values, 'application'),
  },
  stdio: 'inherit',
});

const stop = () => child.kill('SIGTERM');
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
child.once('exit', (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
