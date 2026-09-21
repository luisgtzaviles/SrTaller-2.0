import { Module } from '@nestjs/common';

import { AccessModule } from '../access/access.module.js';
import { REGISTRATION_PASSWORD_PROTECTOR, TENANT_BOOTSTRAP_EXECUTOR } from '../access/index.js';
import type { RegistrationPasswordProtector, TenantBootstrapExecutor } from '../access/index.js';
import { RuntimeInfrastructureModule } from '../../infrastructure/runtime/runtime-infrastructure.module.js';
import { APPLICATION_DATABASE_CONNECTION, REGISTRATION_RUNTIME_CONFIGURATION } from '../../infrastructure/runtime/index.js';
import type { ApplicationDatabaseConnection, RegistrationRuntimeConfiguration } from '../../infrastructure/runtime/index.js';
import { KyselyRegistrationRepository } from './infrastructure/persistence/kysely-registration.repository.js';
import { LocalRegistrationEmailDelivery } from './infrastructure/delivery/local-registration-email.delivery.js';
import { ResendRegistrationEmailDelivery } from './infrastructure/delivery/resend-registration-email.delivery.js';
import { PublicRegistrationService } from './application/use-cases/public-registration.use-cases.js';
import { PUBLIC_REGISTRATION_SERVICE, PublicRegistrationController } from './presentation/public-registration.controller.js';

@Module({
  imports: [RuntimeInfrastructureModule, AccessModule],
  controllers: [PublicRegistrationController],
  providers: [{
    provide: PUBLIC_REGISTRATION_SERVICE,
    inject: [
      APPLICATION_DATABASE_CONNECTION,
      REGISTRATION_PASSWORD_PROTECTOR,
      TENANT_BOOTSTRAP_EXECUTOR,
      REGISTRATION_RUNTIME_CONFIGURATION,
    ],
    useFactory: (
      database: ApplicationDatabaseConnection,
      passwords: RegistrationPasswordProtector,
      bootstrap: TenantBootstrapExecutor,
      configuration: RegistrationRuntimeConfiguration,
    ): PublicRegistrationService => {
      const delivery = configuration.mode === 'local'
        ? new LocalRegistrationEmailDelivery()
        : configuration.createResendAdapter(ResendRegistrationEmailDelivery);
      return new PublicRegistrationService(
        new KyselyRegistrationRepository(database as never),
        passwords,
        bootstrap,
        delivery,
        configuration,
      );
    },
  }],
})
export class RegistrationModule {}
