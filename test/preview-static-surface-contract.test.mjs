import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  validateAuthorizedPreviewStaticSurface,
} from '../scripts/lib/preview-static-surface-contract.mjs';

const authorizedSource = await readFile('src/preview-static.ts', 'utf8');

test('preview static contract accepts the bounded SPA surface', () => {
  assert.deepEqual(validateAuthorizedPreviewStaticSurface(authorizedSource), []);
});

for (const [name, mutation] of [
  [
    'missing GET guard',
    authorizedSource.replace("request.method !== 'GET' ||\n        ", ''),
  ],
  [
    'broadened exact path',
    authorizedSource.replace("'/reparaciones/nueva',", "'/reparaciones/nueva',\n  '/admin',"),
  ],
  [
    'broadened detail matcher',
    authorizedSource.replace(
      'const previewRepairDetailPath = /^\\/reparaciones\\/[^/]+$/u;',
      'const previewRepairDetailPath = /^\\/.+$/u;',
    ),
  ],
  [
    'controller surface',
    `${authorizedSource}\n@Controller()\nclass PreviewController {}`,
  ],
]) {
  test(`preview static contract rejects ${name}`, () => {
    assert.ok(validateAuthorizedPreviewStaticSurface(mutation).length > 0);
  });
}
