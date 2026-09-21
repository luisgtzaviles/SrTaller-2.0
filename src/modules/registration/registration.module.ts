import { Module } from '@nestjs/common';

import { AccessModule } from '../access/access.module.js';
import { REGISTRATION_PASSWORD_PROTECTOR, TENANT_BOOTSTRAP_EXECUTOR } from '../access/index.js';
import type { RegistrationPasswordProtector, TenantBootstrapExecutor } from '../access/index.js';

@Module({
  imports: [AccessModule],
  providers: [{
    provide: 'REGISTRATION_ACCESS_BOUNDARY',
    inject: [REGISTRATION_PASSWORD_PROTECTOR, TENANT_BOOTSTRAP_EXECUTOR],
    useFactory: (passwords: RegistrationPasswordProtector, bootstrap: TenantBootstrapExecutor) =>
      Object.freeze({ passwords, bootstrap }),
  }],
})
export class RegistrationModule {}
