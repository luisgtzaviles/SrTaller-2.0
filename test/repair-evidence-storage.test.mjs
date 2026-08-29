import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const { LocalRepairEvidenceStorage } = await import(
  '../dist/modules/repairs/infrastructure/storage/local-repair-evidence.storage.js'
);

test('local repair evidence storage accepts only contained regular UUID PNG files', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'srtaller-evidence-'));
  const root = join(temporary, 'evidence');
  await mkdir(root);
  const validKey = '00000000-0000-4000-8000-000000009001.png';
  const symlinkKey = '00000000-0000-4000-8000-000000009002.png';
  const content = Buffer.from('synthetic-evidence');
  await writeFile(join(root, validKey), content);
  await writeFile(join(temporary, 'outside.png'), content);
  await symlink(join(temporary, 'outside.png'), join(root, symlinkKey));
  const storage = new LocalRepairEvidenceStorage(root);
  try {
    assert.deepEqual(Buffer.from(await storage.read(validKey)), content);
    for (const rejected of [
      '../outside.png', '/tmp/outside.png', 'file:///tmp/outside.png',
      'https://example.test/image.png', 'not-a-uuid.png', symlinkKey,
      '00000000-0000-4000-8000-000000009003.png',
    ]) assert.equal(await storage.read(rejected), null);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});
