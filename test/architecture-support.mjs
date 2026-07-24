import { spawn } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, posix, resolve } from 'node:path';

import { validFiles } from './architecture-fixtures.mjs';

const checker = resolve(process.cwd(), 'scripts/check-architecture.mjs');

export async function createFixture(fixtureCase) {
  const root = await mkdtemp(join(tmpdir(), 'srtaller-dec005-fixture-'));
  const files = { ...validFiles, ...(fixtureCase.files ?? {}) };
  for (const file of fixtureCase.deleteFiles ?? []) {
    delete files[file];
  }
  for (const [file, content] of Object.entries(files)) {
    const destination = resolve(root, file);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, content);
  }
  for (const directory of fixtureCase.emptyDirectories ?? []) {
    await mkdir(resolve(root, directory), { recursive: true });
  }
  for (const directory of fixtureCase.deleteDirectories ?? []) {
    await rm(resolve(root, directory), { force: true, recursive: true });
  }
  return root;
}

export async function createProductFixture() {
  const root = await mkdtemp(join(tmpdir(), 'srtaller-dec005-product-'));
  const projectRoot = process.cwd();
  const policy = JSON.parse(
    await readFile(resolve(projectRoot, 'architecture/dec-005-policy.json'), 'utf8'),
  );
  await cp(resolve(projectRoot, 'src'), resolve(root, 'src'), { recursive: true });
  for (const evidencePath of policy.requiredEvidence) {
    const source = resolve(projectRoot, evidencePath);
    const destination = resolve(root, evidencePath);
    await mkdir(dirname(destination), { recursive: true });
    await cp(source, destination);
  }
  return root;
}

export async function runChecker(root, { fixture = true } = {}) {
  const argumentsList = [checker, '--root', root];
  if (fixture) {
    argumentsList.push('--fixture');
  }
  const child = spawn(
    process.execPath,
    argumentsList,
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );
  let stdout = '';
  let stderr = '';
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (chunk) => {
    stdout += chunk;
  });
  child.stderr.on('data', (chunk) => {
    stderr += chunk;
  });
  const code = await new Promise((resolveCode, reject) => {
    child.once('error', reject);
    child.once('exit', (exitCode) => resolveCode(exitCode ?? 1));
  });
  return { code, stderr, stdout };
}

export function diagnosticsFrom(output) {
  return output
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const ruleEnd = line.indexOf(' ');
      const pathEnd = line.indexOf(': ', ruleEnd + 1);
      if (ruleEnd < 1 || pathEnd < 0) {
        throw new Error('architecture diagnostic does not follow the public format');
      }
      return {
        message: line.slice(pathEnd + 2),
        path: line.slice(ruleEnd + 1, pathEnd),
        rule: line.slice(0, ruleEnd),
      };
    });
}

export function diagnosticPathProblems(output, root) {
  const problems = [];
  const portableRoot = root.replaceAll('\\', '/');
  if (output.includes(portableRoot)) {
    problems.push('diagnostic output contains the physical fixture root');
  }
  if (/\/Users\//u.test(output)) {
    problems.push('diagnostic output contains a local macOS user root');
  }
  if (/[A-Za-z]:[\\/]/u.test(output)) {
    problems.push('diagnostic output contains a Windows drive root');
  }
  if (/file:\/\//iu.test(output)) {
    problems.push('diagnostic output contains a file URL');
  }
  for (const diagnostic of diagnosticsFrom(output)) {
    if (diagnostic.path.startsWith('/')) {
      problems.push(`${diagnostic.rule} path is absolute`);
    }
    if (diagnostic.path.includes('\\')) {
      problems.push(`${diagnostic.rule} path uses a backslash separator`);
    }
    if (posix.normalize(diagnostic.path) !== diagnostic.path) {
      problems.push(`${diagnostic.rule} path is not normalized`);
    }
    if (diagnostic.path.split('/').some((part) => part === '.' || part === '..')) {
      problems.push(`${diagnostic.rule} path escapes or has redundant segments`);
    }
  }
  return problems;
}

export function rulesFrom(output) {
  return [...new Set(output
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => line.split(' ')[0]))]
    .sort();
}

export async function removeFixture(root) {
  await rm(root, { force: true, recursive: true });
}
