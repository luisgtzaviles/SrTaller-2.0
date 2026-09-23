import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { promisify } from 'node:util';

import {
  TIER2_CONTRACT,
  TIER2_SHADOW_MODE,
  validateTier2ControlPlane,
} from './lib/tier2-authoritative-ci.mjs';
import { parseWorkUnitDocument } from './lib/work-unit.mjs';

const execute = promisify(execFile);
const projectRoot = process.cwd();

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function requiredEnvironment(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function git(argumentsList) {
  const { stdout } = await execute('git', argumentsList, {
    cwd: projectRoot,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  return stdout.trim();
}

const testedSha = argument('--tested-sha');
const output = resolve(argument('--output') ?? 'TIER2_SHADOW_CONTEXT.json');
const controllerSha = requiredEnvironment('GITHUB_SHA');
const remote = (await git(['ls-remote', '--heads', 'origin', 'refs/heads/main'])).split(/\s+/u);
const liveMainSha = remote[0];
const checklist = parseWorkUnitDocument(
  await readFile(resolve(projectRoot, 'docs/work/ACTIVE_CHECKLIST.md'), 'utf8'),
);
if (checklist.findings.length > 0) {
  throw new Error('ACTIVE_CHECKLIST Work Unit metadata is invalid');
}

const trust = validateTier2ControlPlane({
  controllerSha,
  dependencySubjectSha: checklist.metadata.dependency_subject_sha,
  eventName: requiredEnvironment('GITHUB_EVENT_NAME'),
  liveMainSha,
  ref: requiredEnvironment('GITHUB_REF'),
  repository: requiredEnvironment('GITHUB_REPOSITORY'),
  testedSha,
});
await git(['merge-base', '--is-ancestor', testedSha, liveMainSha]);

const evidence = Object.freeze({
  ...trust,
  contract: TIER2_CONTRACT,
  mode: TIER2_SHADOW_MODE,
  schemaVersion: 1,
  status: 'PASS',
});
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(evidence, null, 2)}\n`, { mode: 0o600 });
process.stdout.write('Tier-2 shadow trusted context verified\n');
