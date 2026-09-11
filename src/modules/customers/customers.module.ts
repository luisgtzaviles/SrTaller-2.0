import { Module } from '@nestjs/common';

import { RuntimeInfrastructureModule } from '../../infrastructure/runtime/runtime-infrastructure.module.js';
import { APPLICATION_DATABASE_CONNECTION } from '../../infrastructure/runtime/index.js';
import type { ApplicationDatabaseConnection } from '../../infrastructure/runtime/index.js';
import { CUSTOMER_INTAKE_RUNTIME } from './index.js';
import type { CustomerIntakeRuntime } from './index.js';
import { KyselyCustomerIntakeRepository } from './infrastructure/persistence/kysely-customer-intake.repository.js';

@Module({
  imports: [RuntimeInfrastructureModule],
  providers: [
    {
      provide: KyselyCustomerIntakeRepository,
      inject: [APPLICATION_DATABASE_CONNECTION],
      useFactory: (database: ApplicationDatabaseConnection) => new KyselyCustomerIntakeRepository(database),
    },
    {
      provide: CUSTOMER_INTAKE_RUNTIME,
      inject: [KyselyCustomerIntakeRepository],
      useFactory: (repository: KyselyCustomerIntakeRepository): CustomerIntakeRuntime => repository,
    },
  ],
  exports: [CUSTOMER_INTAKE_RUNTIME],
})
export class CustomersModule {}
