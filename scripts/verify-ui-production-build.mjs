import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(path));
    if (entry.isFile()) files.push(path);
  }
  return files;
}

const output = await mkdtemp(join(tmpdir(), 'srtaller-ui-production-'));
try {
  const child = spawn('pnpm', ['--filter', '@srtaller/dev-preview-web', 'exec', 'vite', 'build', '--outDir', output, '--emptyOutDir'], {
    cwd: process.cwd(),
    env: { ...process.env, SRT_DEPLOY_ENV: 'production' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stderr = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  const [code] = await once(child, 'exit');
  if (code !== 0) throw new Error(`Production UI build failed: ${stderr}`);

  const files = await listFiles(output);
  const relativeNames = files.map((file) => file.slice(output.length + 1));
  if (relativeNames.some((name) => /UiCatalog/iu.test(name))) throw new Error('Production build contains a catalog chunk.');
  const combined = (await Promise.all(files.map((file) => readFile(file, 'utf8')))).join('\n');
  if (/srt-ui-catalog|UI Catalog V1|Preview \/ Internal catalog/iu.test(combined)) throw new Error('Production build contains catalog route or content.');
  process.stdout.write(`PBI-030 production catalog exclusion verified across ${files.length} files\n`);
} finally {
  await rm(output, { recursive: true, force: true });
}
