import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import {
  createPreviewMigrationSnapshot,
  inspectMigrationManifestAtRevision,
} from './lib/migration-state-snapshot.mjs';

function requiredArgument(name) {
  const index = process.argv.indexOf(name);
  const value = index === -1 ? undefined : process.argv[index + 1];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

const journalInput = resolve(requiredArgument('--journal-input'));
const output = resolve(requiredArgument('--output'));
const releaseSha = requiredArgument('--release-sha');
const capturedAt = requiredArgument('--captured-at');
const journal = JSON.parse(await readFile(journalInput, 'utf8'));
if (
  journal?.environment !== 'preview' ||
  journal?.source !== 'authorized-real-journal-read' ||
  !Array.isArray(journal.names)
) {
  throw new Error('Journal input is not an authorized Preview journal export');
}
let existing = null;
try {
  existing = JSON.parse(await readFile(output, 'utf8'));
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}
if (
  existing?.status === 'CAPTURED' &&
  !process.argv.includes('--replace-existing')
) {
  throw new Error('A captured snapshot requires explicit --replace-existing');
}
const manifest = await inspectMigrationManifestAtRevision({ revision: releaseSha });
const snapshot = createPreviewMigrationSnapshot({
  capturedAt,
  journalNames: journal.names,
  manifest,
  releaseSha,
});
await mkdir(dirname(output), { recursive: true });
const temporary = `${output}.${process.pid}.tmp`;
try {
  await writeFile(temporary, `${JSON.stringify(snapshot, null, 2)}\n`, { flag: 'wx' });
  await rename(temporary, output);
} finally {
  await rm(temporary, { force: true });
}
process.stdout.write(`Preview migration snapshot captured for ${releaseSha}\n`);
