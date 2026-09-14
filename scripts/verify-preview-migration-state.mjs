import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import {
  evaluatePreviewMigrationState,
  inspectSourceMigrationManifest,
  readPreviewMigrationSnapshot,
} from './lib/migration-state-snapshot.mjs';

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const phase = argument('--phase') ?? 'pre-merge';
const snapshotPath = resolve(
  argument('--snapshot') ?? 'docs/operations/preview-migration-state.snapshot.json',
);
const outputPath = argument('--output') ? resolve(argument('--output')) : null;
const [candidate, snapshot] = await Promise.all([
  inspectSourceMigrationManifest(),
  readPreviewMigrationSnapshot(snapshotPath),
]);
const result = evaluatePreviewMigrationState({ candidate, phase, snapshot });
const evidence = Object.freeze({
  schemaVersion: 1,
  contract: 'WF-004/PREVIEW-MIGRATION-PREFLIGHT',
  candidateManifestSha256: candidate.aggregateSha256,
  candidateMigrations: candidate.migrations.length,
  ...result,
});
if (outputPath) {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`);
}
process.stdout.write(`${JSON.stringify(evidence)}\n`);
if (evidence.blocking) process.exitCode = 1;
