import { parseTenantId } from '../../../tenancy/index.js';
import type {
  RepairDetailRecord,
  RepairPersistenceScope,
  RepairRepositoryPort,
} from '../ports/repair-repository.port.js';

const canonicalUuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

export class GetRepairDetailInputError extends Error {
  constructor() {
    super('Invalid repair id.');
    this.name = 'GetRepairDetailInputError';
  }
}

export class RepairDetailNotFoundError extends Error {
  constructor() {
    super('Repair is not available in the requested context.');
    this.name = 'RepairDetailNotFoundError';
  }
}

export interface GetRepairDetailInput {
  readonly repairId: unknown;
}

function validateRepairId(value: unknown): string {
  if (typeof value !== 'string' || !canonicalUuid.test(value)) {
    throw new GetRepairDetailInputError();
  }
  return value;
}

export class GetRepairDetailUseCase {
  constructor(
    private readonly repository: RepairRepositoryPort,
    private readonly resolveScope: () => RepairPersistenceScope,
  ) {}

  async execute(input: GetRepairDetailInput): Promise<RepairDetailRecord> {
    const repairId = validateRepairId(input.repairId);
    const detail = await this.repository.getRepairById(this.resolveScope(), repairId);
    if (!detail) throw new RepairDetailNotFoundError();
    return detail;
  }
}
