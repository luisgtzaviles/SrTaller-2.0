import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import { createVerifiedTreeAttestation } from './lib/verified-tree-attestation.mjs';

function requiredArgument(name) {
  const index = process.argv.indexOf(name);
  const value = index === -1 ? undefined : process.argv[index + 1];
  if (!value) throw new Error(`${name} is required`);
  return resolve(value);
}

const output = requiredArgument('--output');
const attestation = await createVerifiedTreeAttestation();
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(attestation, null, 2)}\n`);
process.stdout.write(`Shadow tree attestation created for ${attestation.sourceCommit}\n`);
