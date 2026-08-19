import { spawn } from 'node:child_process';

import { destroyLocalDatabase } from './local-db.mjs';

async function run(argumentsList) {
  return new Promise((resolve, reject) => {
    const child = spawn('pnpm', argumentsList, { stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code) => resolve(code ?? 1));
  });
}

await destroyLocalDatabase();
for (const script of ['local:db:up', 'local:db:migrate', 'local:db:seed']) {
  const code = await run(['run', script]);
  if (code !== 0) {
    process.exitCode = code;
    break;
  }
}
