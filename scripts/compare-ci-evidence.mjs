import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import { compareEvidenceManifests } from './lib/ci-evidence.mjs';

function requiredArgument(name) {
  const index = process.argv.indexOf(name);
  const value = index === -1 ? undefined : process.argv[index + 1];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return resolve(value);
}

const leftPath = requiredArgument('--left');
const rightPath = requiredArgument('--right');
const outputPath = requiredArgument('--output');
const [left, right] = await Promise.all(
  [leftPath, rightPath].map(async (path) =>
    JSON.parse(await readFile(path, 'utf8')),
  ),
);
const comparison = compareEvidenceManifests(left, right);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(comparison, null, 2)}\n`);

if (!comparison.equivalent) {
  process.stderr.write(
    `VC-024 evidence differs: ${comparison.differences.join('; ')}\n`,
  );
  process.exitCode = 1;
} else {
  process.stdout.write(
    `VC-024 executions are equivalent for ${comparison.commit}\n`,
  );
}
