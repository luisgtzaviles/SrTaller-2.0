import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const trackedFiles = execFileSync('git', ['ls-files', '-z'], {
  encoding: 'utf8',
}).split('\0').filter(Boolean);

const trackedEnvironmentFiles = trackedFiles.filter((file) =>
  /(?:^|\/)\.env(?:\.|$)/u.test(file),
);
for (const file of trackedEnvironmentFiles) {
  if (file !== '.env.example' && file !== '.env.local.example') {
    throw new Error(`Tracked environment file is forbidden: ${file}`);
  }
}

const sourceFiles = trackedFiles.filter((file) =>
  /^(?:apps\/dev-preview-web\/src\/|apps\/dev-preview-web\/vite\.config\.ts$|Dockerfile$)/u.test(file),
);
const forbiddenClientSecret = /(?:VITE_|import\.meta\.env\.)(?:[A-Z0-9_]*)(?:SECRET|PASSWORD|TOKEN|PEPPER|SIGNING_KEY|CREDENTIAL)/u;
for (const file of sourceFiles) {
  const source = readFileSync(file, 'utf8');
  if (forbiddenClientSecret.test(source)) {
    throw new Error(`Server-only secret reference is forbidden in client boundary: ${file}`);
  }
}

const example = readFileSync('.env.local.example', 'utf8');
for (const line of example.split(/\r?\n/u)) {
  if (!/_PASSWORD=/u.test(line)) continue;
  if (!line.endsWith('=generated-by-local-config')) {
    throw new Error('.env.local.example must not contain a usable password value');
  }
}

process.stdout.write('External configuration boundary verified\n');
