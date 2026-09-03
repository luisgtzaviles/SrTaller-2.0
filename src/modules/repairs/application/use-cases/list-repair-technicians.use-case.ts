import type {
  RepairPersistenceScope,
  RepairRepositoryPort,
  RepairTechnicianRecord,
} from '../ports/repair-repository.port.js';

export class ListRepairTechniciansUseCase {
  constructor(
    private readonly repository: RepairRepositoryPort,
    private readonly resolveScope: () => RepairPersistenceScope,
  ) {}

  execute(): Promise<readonly RepairTechnicianRecord[]> {
    return this.repository.listEligibleTechnicians(this.resolveScope());
  }
}
