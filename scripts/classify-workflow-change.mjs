import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import { inspectWorkflowChanges } from './lib/workflow-change-classifier.mjs';

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const base = argument('--base');
const head = argument('--head');
const output = resolve(argument('--output') ?? 'workflow-change-risk.json');
const githubOutput = argument('--github-output');
const forceFullReason = argument('--force-full-reason') ?? null;

const result = await inspectWorkflowChanges({ base, head, forceFullReason });
const evidence = Object.freeze({
  ...result,
  base,
  head,
});

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(evidence, null, 2)}\n`);

if (githubOutput) {
  await writeFile(
    resolve(githubOutput),
    [
      `docs_only=${String(evidence.enforcedPipeline === 'DOCS_ONLY')}`,
      `risk=${evidence.primaryRisk}`,
      `enforced_pipeline=${evidence.enforcedPipeline}`,
      '',
    ].join('\n'),
    { flag: 'a' },
  );
}

process.stdout.write(`${JSON.stringify(evidence)}\n`);
