import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import {
  EXPECTED_NODE_VERSION,
  EXPECTED_PNPM_VERSION,
  parsePnpmVersion,
  readJson,
  validateRuntimeFacts,
} from './lib/toolchain-contract.mjs';

async function exists(relativePath) {
  try {
    await access(resolve(process.cwd(), relativePath));
    return true;
  } catch {
    return false;
  }
}

const packageManifest = await readJson('package.json');
const nodePin = (await readFile(resolve(process.cwd(), '.node-version'), 'utf8')).trim();
const nvmPin = (await readFile(resolve(process.cwd(), '.nvmrc'), 'utf8')).trim();
const packageManagerVersion = parsePnpmVersion(
  process.env.npm_config_user_agent,
);
const failures = validateRuntimeFacts({
  nodeVersion: process.versions.node,
  packageManagerVersion,
});

if (packageManifest.engines?.node !== EXPECTED_NODE_VERSION) {
  failures.push('package.json engines.node does not match the DEC-004 pin');
}

if (packageManifest.engines?.pnpm !== EXPECTED_PNPM_VERSION) {
  failures.push('package.json engines.pnpm does not match the DEC-004 pin');
}

if (packageManifest.packageManager !== `pnpm@${EXPECTED_PNPM_VERSION}`) {
  failures.push('package.json packageManager does not match the DEC-004 pin');
}

if (nodePin !== EXPECTED_NODE_VERSION || nvmPin !== EXPECTED_NODE_VERSION) {
  failures.push('Node.js pin files do not match the DEC-004 pin');
}

for (const forbiddenPath of [
  'package-lock.json',
  'npm-shrinkwrap.json',
  'yarn.lock',
  'bun.lock',
  'bun.lockb',
]) {
  if (await exists(forbiddenPath)) {
    failures.push(`Forbidden root artifact detected: ${forbiddenPath}`);
  }
}

const workspaceManifest = await readFile(
  resolve(process.cwd(), 'pnpm-workspace.yaml'),
  'utf8',
);
if (workspaceManifest !== 'packages:\n  - .\n  - apps/*\n') {
  failures.push(
    'pnpm-workspace.yaml must contain only the root and authorized app packages',
  );
}

if (failures.length > 0) {
  process.stderr.write(`${failures.join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('DEC-004 install context verified\n');
}
