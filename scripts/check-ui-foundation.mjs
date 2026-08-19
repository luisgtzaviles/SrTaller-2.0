import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { findLegacyBundleMarkers, validateUiFoundation } from './lib/ui-foundation-contract.mjs';

const failures = [...await validateUiFoundation()];
try {
  const assets = await readdir(resolve(process.cwd(), 'dist/public/assets'));
  for (const asset of assets.filter((name) => /\.(?:css|js)$/u.test(name))) {
    const source = await readFile(resolve(process.cwd(), 'dist/public/assets', asset), 'utf8');
    for (const marker of findLegacyBundleMarkers(source)) failures.push(`dist/public/assets/${asset}: legacy marker ${marker}`);
  }
} catch {
  // Source validation remains useful before build; verify runs this again after build.
}

if (failures.length > 0) {
  process.stderr.write(`${failures.join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('PBI-030 UI foundation contract verified: one visual foundation\n');
}
