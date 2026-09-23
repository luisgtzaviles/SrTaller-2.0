import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import { validateAuthoritativeDispatchMode } from './lib/tier2-authoritative-ci.mjs';

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const output = resolve(argument('--output') ?? 'AUTHORITATIVE_DISPATCH_MODE.json');
const githubOutput = argument('--github-output');
const result = validateAuthoritativeDispatchMode({
  eventName: argument('--event-name'),
  mode: argument('--mode'),
  testedSha: argument('--tested-sha'),
});
const evidence = Object.freeze({
  ...result,
  contract: 'SR_TALLER_AUTHORITATIVE_DISPATCH_MODE_V1',
  schemaVersion: 1,
  status: 'PASS',
});

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(evidence, null, 2)}\n`);
if (githubOutput) {
  await writeFile(
    resolve(githubOutput),
    [
      `dispatch_mode=${result.mode}`,
      `tier2_shadow_only=${String(result.tier2ShadowOnly)}`,
      '',
    ].join('\n'),
    { flag: 'a' },
  );
}
process.stdout.write(`Authoritative dispatch mode: ${result.mode}\n`);
