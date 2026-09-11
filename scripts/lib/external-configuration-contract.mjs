import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { promisify } from 'node:util';

const execute = promisify(execFile);
const forbiddenClientSecret =
  /(?:VITE_|import\.meta\.env\.)(?:[A-Z0-9_]*)(?:SECRET|PASSWORD|TOKEN|PEPPER|SIGNING_KEY|CREDENTIAL)/u;

async function candidateFiles(root) {
  const { stdout } = await execute(
    'git',
    ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
    { cwd: root, encoding: 'buffer' },
  );
  return stdout.toString('utf8').split('\0').filter(Boolean);
}

export async function validateExternalConfigurationCandidate(root = process.cwd()) {
  const files = await candidateFiles(root);
  const problems = [];
  const environmentFiles = files.filter((file) =>
    /(?:^|\/)\.env(?:\.|$)/u.test(file),
  );
  for (const file of environmentFiles) {
    if (file !== '.env.example' && file !== '.env.local.example') {
      problems.push(`${file}: forbidden candidate environment file`);
    }
  }

  const clientFiles = files.filter((file) =>
    /^(?:apps\/dev-preview-web\/src\/|apps\/dev-preview-web\/vite\.config\.ts$|Dockerfile$)/u.test(file),
  );
  for (const file of clientFiles) {
    const source = await readFile(resolve(root, file), 'utf8');
    if (forbiddenClientSecret.test(source)) {
      problems.push(`${file}: forbidden server-only secret reference in client boundary`);
    }
  }

  const example = await readFile(resolve(root, '.env.local.example'), 'utf8');
  for (const line of example.split(/\r?\n/u)) {
    if (!/_PASSWORD=/u.test(line)) continue;
    if (!line.endsWith('=generated-by-local-config')) {
      problems.push('.env.local.example: usable password placeholder is forbidden');
    }
  }

  return Object.freeze({
    filesInspected: files.length,
    problems: Object.freeze(problems),
  });
}
