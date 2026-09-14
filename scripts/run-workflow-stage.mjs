import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

import { appendWorkflowMetric } from './lib/workflow-metrics.mjs';

function requiredArgument(name) {
  const index = process.argv.indexOf(name);
  const value = index === -1 ? undefined : process.argv[index + 1];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

const separator = process.argv.indexOf('--');
if (separator === -1 || separator === process.argv.length - 1) {
  throw new Error('A command is required after --');
}
const metricsPath = resolve(requiredArgument('--metrics'));
const stageName = requiredArgument('--stage');
const [command, ...argumentsList] = process.argv.slice(separator + 1);
const started = new Date();
const monotonicStart = process.hrtime.bigint();
const child = spawn(command, argumentsList, {
  cwd: process.cwd(),
  env: process.env,
  stdio: 'inherit',
});
const exit = await new Promise((resolveExit) => {
  child.once('error', () => resolveExit({ code: 1, signal: null, spawnError: true }));
  child.once('exit', (code, signal) => resolveExit({ code: code ?? 1, signal }));
});
const finished = new Date();
const durationMs = Number((process.hrtime.bigint() - monotonicStart) / 1_000_000n);
const passed = exit.code === 0 && exit.signal === null;
await appendWorkflowMetric(metricsPath, {
  name: stageName,
  result: passed ? 'PASS' : 'FAIL',
  finding: passed
    ? null
    : exit.spawnError
      ? 'STAGE_SPAWN_FAILURE'
      : exit.signal
        ? 'STAGE_SIGNAL_FAILURE'
        : 'STAGE_EXIT_NONZERO',
  startedAt: started.toISOString(),
  finishedAt: finished.toISOString(),
  durationMs,
});
if (!passed) process.exitCode = exit.code || 1;
