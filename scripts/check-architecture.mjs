import { resolve } from 'node:path';

import {
  checkArchitecture,
  formatDiagnostics,
} from './lib/architecture-checker.mjs';

const argumentsList = process.argv.slice(2);
let root = process.cwd();
let fixture = false;

for (let index = 0; index < argumentsList.length; index += 1) {
  const argument = argumentsList[index];
  if (argument === '--fixture') {
    fixture = true;
  } else if (argument === '--root') {
    const value = argumentsList[index + 1];
    if (!value) {
      throw new Error('--root requires a path');
    }
    root = resolve(value);
    index += 1;
  } else {
    throw new Error(`Unknown architecture checker argument: ${argument}`);
  }
}

const result = await checkArchitecture({ fixture, root });
if (result.diagnostics.length > 0) {
  process.stderr.write(`${formatDiagnostics(result.diagnostics)}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    `DEC-005 architecture verified (policy ${result.policyVersion}; edges ${result.observedEdges.join(', ')})\n`,
  );
}
