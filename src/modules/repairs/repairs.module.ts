import { Module } from '@nestjs/common';

import { AccessModule } from '../access/access.module.js';
import { CONTEXTUAL_AUTHORIZATION_EXECUTOR } from '../access/index.js';
import type { ContextualAuthorizationExecutor } from '../access/index.js';
import { CustomersModule } from '../customers/customers.module.js';
import { CUSTOMER_INTAKE_RUNTIME } from '../customers/index.js';
import type { CustomerIntakeRuntime } from '../customers/index.js';
import { StationsModule } from '../stations/stations.module.js';
import { BRANCH_SETTINGS_RUNTIME } from '../stations/index.js';
import type { BranchSettingsRuntime } from '../stations/index.js';

import { RepairProtectedOperations } from './application/repair-protected-operations.js';
import type { RepairEvidenceStoragePort } from './application/ports/repair-evidence-storage.port.js';
import type { RepairRepositoryPort } from './application/ports/repair-repository.port.js';
import { createKyselyRepairRepository } from './infrastructure/persistence/kysely-repair.repository.js';
import { RepairDatabaseConnection } from './infrastructure/persistence/repair-database-connection.js';
import { LocalRepairEvidenceStorage } from './infrastructure/storage/local-repair-evidence.storage.js';
import { RepairsController } from './presentation/repairs.controller.js';

export const REPAIR_REPOSITORY = Symbol('srtaller.repairs.repository');
export const REPAIR_EVIDENCE_STORAGE = Symbol('srtaller.repairs.evidence-storage');

@Module({
  imports: [AccessModule, CustomersModule, StationsModule],
  controllers: [RepairsController],
  providers: [
    RepairDatabaseConnection,
    {
      provide: REPAIR_EVIDENCE_STORAGE,
      useFactory: (): RepairEvidenceStoragePort => new LocalRepairEvidenceStorage(),
    },
    {
      provide: REPAIR_REPOSITORY,
      inject: [RepairDatabaseConnection],
      useFactory: (database: RepairDatabaseConnection): RepairRepositoryPort =>
        createKyselyRepairRepository(database.connection),
    },
    {
      provide: RepairProtectedOperations,
      inject: [
        CONTEXTUAL_AUTHORIZATION_EXECUTOR,
        REPAIR_REPOSITORY,
        REPAIR_EVIDENCE_STORAGE,
        BRANCH_SETTINGS_RUNTIME,
        CUSTOMER_INTAKE_RUNTIME,
      ],
      useFactory: (
        authorization: ContextualAuthorizationExecutor,
        repository: RepairRepositoryPort,
        storage: RepairEvidenceStoragePort,
        branchSettings: BranchSettingsRuntime,
        customers: CustomerIntakeRuntime,
      ): RepairProtectedOperations => new RepairProtectedOperations(
        authorization,
        repository,
        storage,
        branchSettings,
        customers,
      ),
    },
  ],
})
export class RepairsModule {}
