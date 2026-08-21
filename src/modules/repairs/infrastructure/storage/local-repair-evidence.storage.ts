import { lstat, readFile, realpath } from 'node:fs/promises';
import { resolve, sep } from 'node:path';

import type { RepairEvidenceStoragePort } from '../../application/ports/repair-evidence-storage.port.js';

const storageKeyPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.png$/u;

export class LocalRepairEvidenceStorage implements RepairEvidenceStoragePort {
  constructor(private readonly root = resolve(process.cwd(), '.runtime/repair-evidence')) {}

  async read(storageKey: string): Promise<Uint8Array | null> {
    if (!storageKeyPattern.test(storageKey)) return null;
    try {
      const canonicalRoot = await realpath(this.root);
      const candidate = resolve(canonicalRoot, storageKey);
      if (!candidate.startsWith(`${canonicalRoot}${sep}`)) return null;
      const stats = await lstat(candidate);
      if (!stats.isFile() || stats.isSymbolicLink()) return null;
      const canonicalCandidate = await realpath(candidate);
      if (!canonicalCandidate.startsWith(`${canonicalRoot}${sep}`)) return null;
      return await readFile(canonicalCandidate);
    } catch {
      return null;
    }
  }
}
