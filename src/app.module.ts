import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';

import { HealthController } from './health/health.controller.js';
import { HealthReadiness } from './health/health-readiness.service.js';
import { HttpCorrelationExceptionFilter } from './infrastructure/runtime/http-correlation-exception.filter.js';
import type { AccessModuleContract } from './modules/access/index.js';
import { AccessModule } from './modules/access/access.module.js';
import { CatalogModule } from './modules/catalog/catalog.module.js';
import { CustomersModule } from './modules/customers/customers.module.js';
import { RepairsModule } from './modules/repairs/repairs.module.js';
import { StationsModule } from './modules/stations/stations.module.js';
import { TenancyModule } from './modules/tenancy/tenancy.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { TechnicalShellService } from './technical-shell.service.js';

@Module({
  controllers: [HealthController],
  imports: [TenancyModule, StationsModule, AccessModule, UsersModule, CustomersModule, RepairsModule, CatalogModule],
  providers: [
    HealthReadiness,
    TechnicalShellService,
    { provide: APP_FILTER, useClass: HttpCorrelationExceptionFilter },
  ],
})
export class AppModule {
  private declare readonly architectureContract: AccessModuleContract;
}
