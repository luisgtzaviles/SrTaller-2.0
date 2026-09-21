import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { compareHarnessRisk } from './lib/harness-risk-classifier.mjs';
import { listChangedPaths } from './lib/workflow-change-classifier.mjs';

const execute = promisify(execFile);

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

async function revision(value, fallback) {
  const target = value ?? fallback;
  const { stdout } = await execute('git', ['rev-parse', target], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  return stdout.trim();
}

const base = await revision(argument('--base'), 'origin/main');
const head = await revision(argument('--head'), 'HEAD');
const paths = await listChangedPaths({ base, head });
const result = Object.freeze({
  ...compareHarnessRisk(paths),
  base,
  head,
});

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
