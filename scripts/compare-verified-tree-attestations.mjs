import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { compareVerifiedTreeAttestations } from './lib/verified-tree-attestation.mjs';

function requiredArgument(name) {
  const index = process.argv.indexOf(name);
  const value = index === -1 ? undefined : process.argv[index + 1];
  if (!value) throw new Error(`${name} is required`);
  return resolve(value);
}

const left = JSON.parse(await readFile(requiredArgument('--left'), 'utf8'));
const right = JSON.parse(await readFile(requiredArgument('--right'), 'utf8'));
const output = requiredArgument('--output');
const comparison = compareVerifiedTreeAttestations(left, right);
await writeFile(output, `${JSON.stringify(comparison, null, 2)}\n`);
process.stdout.write(
  `Shadow tree attestation equivalence: ${String(comparison.equivalent)}; exact-main remains full\n`,
);
