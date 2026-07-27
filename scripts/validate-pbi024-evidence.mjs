import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import {
  comparableStationMutationManifest,
} from './lib/ci-evidence.mjs';
import {
  crossCheckPbi024EvidenceArtifacts,
  crossCheckPbi024MutationMaterial,
  validatePbi024EvidenceManifest,
} from './lib/pbi024-evidence-manifest.mjs';

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

async function json(path) {
  return JSON.parse(await readFile(resolve(path), 'utf8'));
}

const manifestPath = argument('--manifest') ??
  'docs/architecture-readiness/pbi-024/evidence/EVIDENCE_MANIFEST.json';
const artifactIndexPath = argument('--artifact-index');
const mutationManifestPath = argument('--mutation-manifest');
const manifest = validatePbi024EvidenceManifest(await json(manifestPath));
const result = {
  manifest: 'PASS',
  schemaVersion: manifest.schemaVersion,
};

if (artifactIndexPath) {
  result.artifacts = crossCheckPbi024EvidenceArtifacts(
    manifest,
    await json(artifactIndexPath),
  );
}
if (mutationManifestPath) {
  const comparable = comparableStationMutationManifest(
    await json(mutationManifestPath),
  );
  result.mutationMaterial = crossCheckPbi024MutationMaterial(
    manifest,
    comparable.materialSha256,
  );
}

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
