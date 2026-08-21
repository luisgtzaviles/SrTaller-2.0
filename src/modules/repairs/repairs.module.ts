import { Module } from '@nestjs/common';

import { ListRepairsUseCase } from './application/use-cases/list-repairs.use-case.js';
import { GetRepairDetailUseCase } from './application/use-cases/get-repair-detail.use-case.js';
import { GetRepairEvidenceContentUseCase } from './application/use-cases/get-repair-evidence-content.use-case.js';
import { AddRepairOperationalNoteUseCase } from './application/use-cases/add-repair-operational-note.use-case.js';
import type { RepairRepositoryPort } from './application/ports/repair-repository.port.js';
import { LocalRepairContext } from './infrastructure/context/local-repair-context.js';
import { createKyselyRepairRepository } from './infrastructure/persistence/kysely-repair.repository.js';
import { RepairDatabaseConnection } from './infrastructure/persistence/repair-database-connection.js';
import { LocalRepairEvidenceStorage } from './infrastructure/storage/local-repair-evidence.storage.js';
import { RepairsController } from './presentation/repairs.controller.js';

export const REPAIR_REPOSITORY = Symbol('srtaller.repairs.repository');
export const REPAIR_EVIDENCE_STORAGE = Symbol('srtaller.repairs.evidence-storage');

@Module({
  controllers: [RepairsController],
  providers: [
    RepairDatabaseConnection,
    LocalRepairContext,
    {
      provide: REPAIR_EVIDENCE_STORAGE,
      useFactory: (): LocalRepairEvidenceStorage => new LocalRepairEvidenceStorage(),
    },
    {
      provide: REPAIR_REPOSITORY,
      inject: [RepairDatabaseConnection],
      useFactory: (database: RepairDatabaseConnection): RepairRepositoryPort =>
        createKyselyRepairRepository(database.connection),
    },
    {
      provide: ListRepairsUseCase,
      inject: [REPAIR_REPOSITORY, LocalRepairContext],
      useFactory: (
        repository: RepairRepositoryPort,
        context: LocalRepairContext,
      ): ListRepairsUseCase => new ListRepairsUseCase(repository, () => context.resolve()),
    },
    {
      provide: GetRepairDetailUseCase,
      inject: [REPAIR_REPOSITORY, LocalRepairContext],
      useFactory: (
        repository: RepairRepositoryPort,
        context: LocalRepairContext,
      ): GetRepairDetailUseCase => new GetRepairDetailUseCase(repository, () => context.resolve()),
    },
    {
      provide: AddRepairOperationalNoteUseCase,
      inject: [REPAIR_REPOSITORY, LocalRepairContext],
      useFactory: (
        repository: RepairRepositoryPort,
        context: LocalRepairContext,
      ): AddRepairOperationalNoteUseCase => new AddRepairOperationalNoteUseCase(
        repository, () => context.resolve(),
      ),
    },
    {
      provide: GetRepairEvidenceContentUseCase,
      inject: [REPAIR_REPOSITORY, REPAIR_EVIDENCE_STORAGE, LocalRepairContext],
      useFactory: (
        repository: RepairRepositoryPort,
        storage: LocalRepairEvidenceStorage,
        context: LocalRepairContext,
      ): GetRepairEvidenceContentUseCase => new GetRepairEvidenceContentUseCase(
        repository, storage, () => context.resolve(),
      ),
    },
  ],
})
export class RepairsModule {}
