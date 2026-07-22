import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { inspectSource } from './architecture-rules.mjs';

const root = new URL('..', import.meta.url).pathname;
const roots = ['src', 'test', 'scripts'];
const failures = [];

async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.runtime') continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await visit(path);
      continue;
    }
    if (!['.ts', '.mjs'].includes(extname(path))) continue;
    const source = await readFile(path, 'utf8');
    const name = relative(root, path);
    source.split('\n').forEach((line, index) => {
      if (/\s+$/.test(line)) failures.push(`${name}:${index + 1}: trailing whitespace`);
      if (line.includes('\t')) failures.push(`${name}:${index + 1}: tab character`);
    });
    if (name.startsWith('src/')) {
      for (const failure of inspectSource(name, source)) failures.push(`${name}: ${failure}`);
    }
    if (/console\.(?:log|debug)\(/.test(source)) failures.push(`${name}: raw console output is forbidden`);
  }
}

for (const directory of roots) await visit(join(root, directory));

if (failures.length > 0) {
  process.stderr.write(`${failures.join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('Static checks passed.\n');
}
