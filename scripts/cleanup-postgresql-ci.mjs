import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execute = promisify(execFile);
const executionLabel =
  process.env.SR_PG_CI_EXECUTION_LABEL ?? process.argv[2];

if (!/^(?:run-[12]|local-run-[12])$/u.test(executionLabel ?? '')) {
  throw new Error('A governed PostgreSQL CI execution label is required');
}

async function docker(argumentsList) {
  return execute('docker', argumentsList, {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
}

const filters = [
  `label=com.srtaller.pbi023.execution=${executionLabel}`,
  `label=com.srtaller.pbi024.execution=${executionLabel}`,
];
const discovered = await Promise.all(
  filters.map((filter) =>
    docker([
      'ps',
      '--all',
      '--quiet',
      '--filter',
      filter,
    ])),
);
const containers = [
  ...new Set(
    discovered
      .flatMap(({ stdout }) => stdout.trim().split(/\s+/u))
      .filter(Boolean),
  ),
];
if (containers.length > 0) {
  await docker(['rm', '--force', ...containers]);
}

const remaining = await Promise.all(
  filters.map((filter) =>
    docker([
      'ps',
      '--all',
      '--quiet',
      '--filter',
      filter,
    ])),
);
if (remaining.some(({ stdout }) => stdout.trim() !== '')) {
  throw new Error('PostgreSQL CI cleanup left a governed container');
}

process.stdout.write(
  `PostgreSQL CI cleanup PASS for ${executionLabel}\n`,
);
