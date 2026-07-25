import { Module } from '@nestjs/common';

import type { AccessModuleContract } from './modules/access/index.js';
import { AccessModule } from './modules/access/access.module.js';
import { StationsModule } from './modules/stations/stations.module.js';
import { TenancyModule } from './modules/tenancy/tenancy.module.js';
import { TechnicalShellService } from './technical-shell.service.js';

@Module({
  imports: [TenancyModule, StationsModule, AccessModule],
  providers: [TechnicalShellService],
})
export class AppModule {
  private declare readonly architectureContract: AccessModuleContract;
}
