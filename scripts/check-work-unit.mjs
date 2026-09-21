import { inspectWorkUnit } from './lib/work-unit.mjs';

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const result = await inspectWorkUnit({
  projectRoot: process.cwd(),
  mode: argument('--mode') ?? 'AUTO',
});

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (result.status !== 'PASS') process.exitCode = 1;
