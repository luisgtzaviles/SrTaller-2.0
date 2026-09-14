import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import { verifyDocsOnlyChange } from './lib/docs-only-verification.mjs';

function requiredArgument(name) {
  const index = process.argv.indexOf(name);
  const value = index === -1 ? undefined : process.argv[index + 1];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

const output = resolve(requiredArgument('--output'));
const result = await verifyDocsOnlyChange({
  base: requiredArgument('--base'),
  head: requiredArgument('--head'),
});
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(result, null, 2)}\n`);
process.stdout.write(`DOCS_ONLY PASS for ${result.head}\n`);
