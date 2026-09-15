import { Module } from '@nestjs/common';

import { RuntimeInfrastructureModule } from '../../infrastructure/runtime/runtime-infrastructure.module.js';
import { APPLICATION_DATABASE_CONNECTION } from '../../infrastructure/runtime/index.js';
import type { ApplicationDatabaseConnection } from '../../infrastructure/runtime/index.js';
import { AccessModule } from '../access/access.module.js';
import { CONTEXTUAL_AUTHORIZATION_EXECUTOR, SENSITIVE_ACTION_LEVEL2_EXECUTOR, TENANT_WIDE_AUTHORIZATION_EXECUTOR } from '../access/index.js';
import type { ContextualAuthorizationExecutor } from '../access/index.js';
import type { SensitiveActionLevel2Executor, TenantWideAuthorizationExecutor } from '../access/index.js';
import { TenancyModule } from '../tenancy/tenancy.module.js';
import { TENANT_SETTINGS_RUNTIME } from '../tenancy/index.js';
import type { TenantSettingsRuntime } from '../tenancy/index.js';
import { CatalogService } from './application/catalog.service.js';
import { CatalogProtectedOperations } from './application/catalog-protected-operations.js';
import { BulkCatalogService } from './application/bulk-catalog.service.js';
import { CatalogRetirementService } from './application/catalog-retirement.service.js';
import { createKyselyCatalogRepository } from './infrastructure/persistence/kysely-catalog.repository.js';
import { createKyselyBulkCatalogRepository } from './infrastructure/persistence/kysely-bulk-catalog.repository.js';
import { createKyselyCatalogRetirementRepository } from './infrastructure/persistence/kysely-catalog-retirement.repository.js';
import { CatalogController } from './presentation/catalog.controller.js';

@Module({
  imports: [RuntimeInfrastructureModule, AccessModule, TenancyModule],
  controllers: [CatalogController],
  providers: [{
    provide: CatalogProtectedOperations,
    inject: [CONTEXTUAL_AUTHORIZATION_EXECUTOR, TENANT_WIDE_AUTHORIZATION_EXECUTOR, SENSITIVE_ACTION_LEVEL2_EXECUTOR, APPLICATION_DATABASE_CONNECTION, TENANT_SETTINGS_RUNTIME],
    useFactory: (authorization: ContextualAuthorizationExecutor, tenantWideAuthorization: TenantWideAuthorizationExecutor, sensitiveLevel2: SensitiveActionLevel2Executor, database: ApplicationDatabaseConnection, tenants: TenantSettingsRuntime) => {
      const repository = createKyselyCatalogRepository(database as never);
      const service = new CatalogService(repository, async (tenantId) => tenants.readOperatingCurrency({ tenantId: tenantId as never }));
      const bulk = new BulkCatalogService(createKyselyBulkCatalogRepository(database as never), async (tenantId) => tenants.readOperatingCurrency({ tenantId: tenantId as never }));
      const retirement = new CatalogRetirementService(createKyselyCatalogRetirementRepository(database as never));
      return new CatalogProtectedOperations(authorization, tenantWideAuthorization, sensitiveLevel2, service, bulk, retirement);
    },
  }],
})
export class CatalogModule {}
