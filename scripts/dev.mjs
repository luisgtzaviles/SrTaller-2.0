import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import { resolve } from 'node:path';

const compilerPath = resolve(
  process.cwd(),
  'node_modules/typescript/bin/tsc',
);
const entrypointPath = resolve(process.cwd(), 'dist/main.js');

await access(compilerPath);

let runtime;
let stopping = false;

const compiler = spawn(
  process.execPath,
  [compilerPath, '-p', 'tsconfig.build.json', '--watch', '--preserveWatchOutput'],
  { stdio: ['ignore', 'pipe', 'inherit'] },
);

function stop(exitCode) {
  if (stopping) {
    return;
  }

  stopping = true;
  runtime?.kill('SIGTERM');
  compiler.kill('SIGTERM');
  process.exitCode = exitCode;
}

compiler.stdout.setEncoding('utf8');
compiler.stdout.on('data', (chunk) => {
  process.stdout.write(chunk);

  if (!runtime && chunk.includes('Watching for file changes')) {
    runtime = spawn(
      process.execPath,
      ['--watch', '--enable-source-maps', entrypointPath],
      { stdio: 'inherit' },
    );
    runtime.once('exit', (code, signal) => {
      if (!stopping && code !== 0) {
        process.stderr.write(
          `Development runtime exited (${signal ?? String(code)})\n`,
        );
        stop(code ?? 1);
      }
    });
  }
});

compiler.once('exit', (code, signal) => {
  if (!stopping) {
    process.stderr.write(
      `TypeScript watch exited (${signal ?? String(code)})\n`,
    );
    stop(code ?? 1);
  }
});

process.once('SIGINT', () => stop(0));
process.once('SIGTERM', () => stop(0));
