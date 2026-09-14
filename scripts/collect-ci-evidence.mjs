import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import {
  collectEvidenceManifest,
  inspectDist,
} from './lib/ci-evidence.mjs';

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const outputPath = resolve(
  argument('--output') ?? 'vc024-evidence-manifest.json',
);
const distOutputPath = resolve(
  argument('--dist-output') ?? 'vc024-dist-manifest.json',
);
const executionLabel =
  process.env.VC024_EXECUTION_LABEL ?? argument('--execution-label');
const workflowRunId =
  process.env.GITHUB_RUN_ID ?? argument('--workflow-run-id');
const postgresqlInput = argument('--postgresql-input');
const pbi039PostgresqlInput = argument('--pbi039-postgresql-input');
const metricsInput = argument('--metrics-input');

const manifest = await collectEvidenceManifest({
  executionLabel,
  initialClean: process.env.VC024_INITIAL_CLEAN === 'true',
  metricsInput,
  pbi039PostgresqlInput,
  postgresqlInput,
  workflowRunId,
});
const distManifest = await inspectDist();

await mkdir(dirname(outputPath), { recursive: true });
await mkdir(dirname(distOutputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
await writeFile(distOutputPath, `${JSON.stringify(distManifest, null, 2)}\n`);
process.stdout.write(
  `VC-024 evidence manifest created for ${manifest.execution.label}\n`,
);
