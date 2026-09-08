import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const EXPECTED_NODE_VERSION = '24.18.0';
export const EXPECTED_PNPM_VERSION = '11.15.1';
export const EXPECTED_PNPM_WORKSPACE_MANIFEST = `packages:
  - .
  - apps/dev-preview-web

overrides:
  qs: 6.16.0
`;

export function parsePnpmVersion(userAgent) {
  const match = /^pnpm\/([^\s]+)/u.exec(userAgent ?? '');
  return match?.[1];
}

export function validateRuntimeFacts({ nodeVersion, packageManagerVersion }) {
  const failures = [];

  if (nodeVersion !== EXPECTED_NODE_VERSION) {
    failures.push(
      `Node.js ${EXPECTED_NODE_VERSION} is required; received ${nodeVersion ?? 'unknown'}`,
    );
  }

  if (packageManagerVersion !== EXPECTED_PNPM_VERSION) {
    failures.push(
      `pnpm ${EXPECTED_PNPM_VERSION} is required; received ${packageManagerVersion ?? 'unknown'}`,
    );
  }

  return failures;
}

export async function readJson(relativePath) {
  const absolutePath = resolve(process.cwd(), relativePath);
  return JSON.parse(await readFile(absolutePath, 'utf8'));
}
