import { rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const projectRoot = resolve(process.cwd());
const outputDirectory = resolve(projectRoot, 'dist');

if (dirname(outputDirectory) !== projectRoot || outputDirectory === projectRoot) {
  throw new Error('Refusing to clean an unsafe output path');
}

await rm(outputDirectory, { force: true, recursive: true });
process.stdout.write('Removed generated dist output\n');
