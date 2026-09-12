import { Module } from '@nestjs/common';

import { RuntimeInfrastructureModule } from '../../infrastructure/runtime/runtime-infrastructure.module.js';
import { APPLICATION_DATABASE_CONNECTION } from '../../infrastructure/runtime/index.js';
import type { ApplicationDatabaseConnection } from '../../infrastructure/runtime/index.js';
import { AccessModule } from '../access/access.module.js';
import { CONTEXTUAL_AUTHORIZATION_EXECUTOR, TENANT_WIDE_AUTHORIZATION_EXECUTOR } from '../access/index.js';
import type { ContextualAuthorizationExecutor } from '../access/index.js';
import type { TenantWideAuthorizationExecutor } from '../access/index.js';
import { TenancyModule } from '../tenancy/tenancy.module.js';
import { TENANT_SETTINGS_RUNTIME } from '../tenancy/index.js';
import type { TenantSettingsRuntime } from '../tenancy/index.js';
import { CatalogService } from './application/catalog.service.js';
import { CatalogProtectedOperations } from './application/catalog-protected-operations.js';
import { createKyselyCatalogRepository } from './infrastructure/persistence/kysely-catalog.repository.js';
import { CatalogController } from './presentation/catalog.controller.js';

@Module({
  imports: [RuntimeInfrastructureModule, AccessModule, TenancyModule],
  controllers: [CatalogController],
  providers: [{
    provide: CatalogProtectedOperations,
    inject: [CONTEXTUAL_AUTHORIZATION_EXECUTOR, TENANT_WIDE_AUTHORIZATION_EXECUTOR, APPLICATION_DATABASE_CONNECTION, TENANT_SETTINGS_RUNTIME],
    useFactory: (authorization: ContextualAuthorizationExecutor, tenantWideAuthorization: TenantWideAuthorizationExecutor, database: ApplicationDatabaseConnection, tenants: TenantSettingsRuntime) => {
      const repository = createKyselyCatalogRepository(database as never);
      const service = new CatalogService(repository, async (tenantId) => tenants.readOperatingCurrency({ tenantId: tenantId as never }));
      return new CatalogProtectedOperations(authorization, tenantWideAuthorization, service);
    },
  }],
})
export class CatalogModule {}
