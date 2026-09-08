import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import {
  EXPECTED_NODE_VERSION,
  EXPECTED_PNPM_VERSION,
  EXPECTED_PNPM_WORKSPACE_MANIFEST,
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
const supplyChainPolicy = await readJson('supply-chain-policy.json');
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

if (!(await exists('pnpm-lock.yaml'))) {
  failures.push('The authoritative pnpm-lock.yaml is missing');
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
if (workspaceManifest !== EXPECTED_PNPM_WORKSPACE_MANIFEST) {
  failures.push(
    'pnpm-workspace.yaml must contain only the authorized packages and governed overrides',
  );
}

const policyAllowlist = supplyChainPolicy.allowlist;

if (!Array.isArray(policyAllowlist)) {
  failures.push('The governed dependency lifecycle allowlist must be an array');
} else if (policyAllowlist.length !== 0) {
  failures.push(
    'A non-empty allowlist requires a separately authorized pnpm 11 configuration mechanism',
  );
}

if (supplyChainPolicy.dependencyLifecycleDefault !== 'blocked') {
  failures.push('Dependency lifecycle scripts are not blocked by default');
}

if (packageManifest.pnpm !== undefined) {
  failures.push('Obsolete package.json pnpm settings are not allowed under pnpm 11');
}

if (failures.length > 0) {
  process.stderr.write(`${failures.join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    `DEC-004 toolchain verified: node ${EXPECTED_NODE_VERSION}, pnpm ${EXPECTED_PNPM_VERSION}\n`,
  );
}
