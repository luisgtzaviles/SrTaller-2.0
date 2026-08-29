import type { RepairEvidenceStoragePort } from '../ports/repair-evidence-storage.port.js';
import type { RepairPersistenceScope, RepairRepositoryPort } from '../ports/repair-repository.port.js';

const canonicalUuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

export class GetRepairEvidenceContentInputError extends Error {
  constructor() { super('Invalid evidence identity.'); this.name = 'GetRepairEvidenceContentInputError'; }
}

export class RepairEvidenceContentNotFoundError extends Error {
  constructor() { super('Evidence is not available in the requested context.'); this.name = 'RepairEvidenceContentNotFoundError'; }
}

export class GetRepairEvidenceContentUseCase {
  constructor(
    private readonly repository: RepairRepositoryPort,
    private readonly storage: RepairEvidenceStoragePort,
    private readonly resolveScope: () => RepairPersistenceScope,
  ) {}

  async execute(input: Readonly<{ repairId: unknown; evidenceId: unknown }>) {
    if (
      typeof input.repairId !== 'string' || !canonicalUuid.test(input.repairId) ||
      typeof input.evidenceId !== 'string' || !canonicalUuid.test(input.evidenceId)
    ) throw new GetRepairEvidenceContentInputError();
    const record = await this.repository.getRepairEvidenceById(
      this.resolveScope(), input.repairId, input.evidenceId,
    );
    if (!record) throw new RepairEvidenceContentNotFoundError();
    const content = await this.storage.read(record.storageKey);
    if (!content || content.byteLength !== record.sizeBytes) {
      throw new RepairEvidenceContentNotFoundError();
    }
    return Object.freeze({ content, mimeType: record.mimeType, sizeBytes: record.sizeBytes });
  }
}
