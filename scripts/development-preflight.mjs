import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';

import { runDevelopmentPreflight } from './lib/development-preflight.mjs';

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const projectRoot = process.cwd();
const outputArgument = argument('--output');
const output = outputArgument ? resolve(outputArgument) : null;
if (output) {
  const relation = relative(projectRoot, output);
  const outsideProject =
    relation === '..' || relation.startsWith(`..${sep}`) || isAbsolute(relation);
  if (!outsideProject) {
    throw new Error('Development Preflight evidence must be written outside the repository');
  }
}
const result = await runDevelopmentPreflight({
  projectRoot,
  requireClean: process.argv.includes('--require-clean'),
  requireRuntime: process.argv.includes('--owner-qa'),
});
if (output) {
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(result, null, 2)}\n`);
}
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (result.status !== 'PASS') process.exitCode = 1;
