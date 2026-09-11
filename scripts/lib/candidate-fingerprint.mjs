import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstat, readFile, readlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { promisify } from 'node:util';

const execute = promisify(execFile);

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function git(root, argumentsList, options = {}) {
  return execute('git', argumentsList, {
    cwd: root,
    encoding: options.encoding ?? 'buffer',
    maxBuffer: 50 * 1024 * 1024,
  });
}

function bytewiseSort(paths) {
  return [...paths].sort((left, right) =>
    Buffer.from(left).compare(Buffer.from(right)),
  );
}

export function classifyCandidatePath(path) {
  if (path.startsWith('apps/dev-preview-web/src/')) {
    return 'frontend-product-source';
  }
  if (/^src\/infrastructure\/database\/migrations\/[^/]+\.ts$/u.test(path)) {
    return 'migration-source';
  }
  if (path.startsWith('src/')) return 'backend-product-source';
  if (path.startsWith('test/')) return 'test-source';
  if (path.startsWith('docs/')) return 'documentation-source';
  if (path.startsWith('scripts/')) return 'intentional-infrastructure';
  return 'unknown';
}

export async function listUntrackedCandidateFiles(root = process.cwd()) {
  const { stdout } = await git(
    root,
    ['ls-files', '--others', '--exclude-standard', '-z'],
  );
  return bytewiseSort(
    stdout.toString('utf8').split('\0').filter(Boolean),
  );
}

export async function buildUntrackedCandidateManifest(root = process.cwd()) {
  const paths = await listUntrackedCandidateFiles(root);
  const entries = [];
  for (const path of paths) {
    const absolutePath = resolve(root, path);
    const stat = await lstat(absolutePath);
    const content = stat.isSymbolicLink()
      ? Buffer.from(await readlink(absolutePath))
      : await readFile(absolutePath);
    entries.push(Object.freeze({
      path,
      category: classifyCandidatePath(path),
      mode: (stat.mode & 0o7777).toString(8),
      size: content.length,
      sha256: sha256(content),
    }));
  }
  const serialized = entries
    .map(({ path, mode, size, sha256: contentSha256 }) =>
      `${path}\0${mode}\0${size}\0${contentSha256}\n`,
    )
    .join('');
  return Object.freeze({
    entries: Object.freeze(entries),
    sha256: sha256(serialized),
  });
}

export async function createCandidateFingerprint(root = process.cwd()) {
  const [{ stdout: headOutput }, { stdout: diff }, { stdout: status }, untracked] =
    await Promise.all([
      git(root, ['rev-parse', 'HEAD'], { encoding: 'utf8' }),
      git(root, ['diff', '--binary', '--no-ext-diff', 'HEAD', '--']),
      git(root, ['status', '--porcelain=v1', '--untracked-files=all', '-z']),
      buildUntrackedCandidateManifest(root),
    ]);
  const baseHead = headOutput.trim();
  const trackedDiffSha256 = sha256(diff);
  const statusSha256 = sha256(status);
  const candidateSha256 = sha256(JSON.stringify({
    baseHead,
    trackedDiffSha256,
    untrackedManifestSha256: untracked.sha256,
    statusSha256,
  }));
  const categories = {};
  for (const entry of untracked.entries) {
    categories[entry.category] = (categories[entry.category] ?? 0) + 1;
  }
  return Object.freeze({
    baseHead,
    trackedDiffSha256,
    untrackedManifestSha256: untracked.sha256,
    statusSha256,
    candidateSha256,
    untracked: Object.freeze({
      count: untracked.entries.length,
      categories: Object.freeze(categories),
      unknown: Object.freeze(
        untracked.entries
          .filter(({ category }) => category === 'unknown')
          .map(({ path }) => path),
      ),
    }),
  });
}

export function assertCandidatePreflight(fingerprint) {
  if (fingerprint.untracked.unknown.length > 0) {
    throw new Error(
      `Candidate preflight found UNKNOWN untracked paths: ${fingerprint.untracked.unknown.join(', ')}`,
    );
  }
  return fingerprint;
}

export function assertCandidateFingerprintStable(before, after) {
  if (before.candidateSha256 !== after.candidateSha256) {
    throw new Error(
      `Candidate mutated during verification: ${before.candidateSha256} != ${after.candidateSha256}`,
    );
  }
}

export async function verifyCandidateWhitespace(root = process.cwd()) {
  await git(root, ['diff', 'HEAD', '--check']);
  const untracked = await listUntrackedCandidateFiles(root);
  const failures = [];
  for (const path of untracked) {
    try {
      await git(root, ['diff', '--no-index', '--check', '--', '/dev/null', path], {
        encoding: 'utf8',
      });
    } catch (error) {
      if (error.code === 1) {
        const diagnostic = `${error.stdout ?? ''}${error.stderr ?? ''}`.trim();
        if (diagnostic) failures.push(diagnostic);
        continue;
      }
      throw error;
    }
  }
  if (failures.length > 0) {
    throw new Error(`Untracked candidate whitespace check failed:\n${failures.join('\n')}`);
  }
  return Object.freeze({ tracked: 'PASS', untracked: untracked.length });
}
