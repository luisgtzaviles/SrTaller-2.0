import { Module } from '@nestjs/common';

import { ApplicationDatabaseRuntimeProvider } from './application-database-runtime.provider.js';
import {
  ACCESS_PIN_HASHER_FACTORY,
  ACCESS_ADMIN_PASSWORD_HASHER_FACTORY,
  APPLICATION_DATABASE_CONNECTION,
  LOCAL_RUNTIME_CONFIGURATION,
  SESSION_TRANSPORT_POLICY,
} from './index.js';
import type {
  AccessPinHasherFactory,
  AccessAdminPasswordHasherFactory,
  LocalRuntimeConfiguration,
  SessionTransportPolicy,
} from './index.js';
import { RuntimeEnvironmentReader } from './runtime-environment.reader.js';

@Module({
  providers: [
    RuntimeEnvironmentReader,
    ApplicationDatabaseRuntimeProvider,
    {
      provide: ACCESS_ADMIN_PASSWORD_HASHER_FACTORY,
      inject: [RuntimeEnvironmentReader],
      useFactory: (
        environment: RuntimeEnvironmentReader,
      ): AccessAdminPasswordHasherFactory => Object.freeze({
        create: <Hasher>(adapter: new (pepper: string) => Hasher): Hasher =>
          environment.createAccessAdminPasswordHasher(adapter),
      }),
    },
    {
      provide: APPLICATION_DATABASE_CONNECTION,
      useExisting: ApplicationDatabaseRuntimeProvider,
    },
    {
      provide: ACCESS_PIN_HASHER_FACTORY,
      inject: [RuntimeEnvironmentReader],
      useFactory: (
        environment: RuntimeEnvironmentReader,
      ): AccessPinHasherFactory => Object.freeze({
        create: <Hasher>(adapter: new (pepper: string) => Hasher): Hasher =>
          environment.createAccessPinHasher(adapter),
      }),
    },
    {
      provide: LOCAL_RUNTIME_CONFIGURATION,
      inject: [RuntimeEnvironmentReader],
      useFactory: (
        environment: RuntimeEnvironmentReader,
      ): LocalRuntimeConfiguration => {
        const policy = environment.localRuntimePolicy();
        return Object.freeze({
          enabled: policy.enabled,
          host: policy.host,
          createLocalStationBootstrapCredential: (
            createCredential: Parameters<
              LocalRuntimeConfiguration[
                'createLocalStationBootstrapCredential'
              ]
            >[0],
          ): string => {
            if (!policy.enabled) {
              throw new Error('Local runtime configuration is unavailable.');
            }
            return environment.createLocalStationBootstrapCredential(
              createCredential,
            );
          },
        });
      },
    },
    {
      provide: SESSION_TRANSPORT_POLICY,
      inject: [RuntimeEnvironmentReader],
      useFactory: (
        environment: RuntimeEnvironmentReader,
      ): SessionTransportPolicy => {
        const policy = environment.localRuntimePolicy();
        const isExplicitLocalRequest = (
          input: Readonly<{ host?: string | undefined }>,
        ): boolean => (
          policy.enabled &&
          typeof input.host === 'string' &&
          /^127\.0\.0\.1(?::\d{1,5})?$/u.test(input.host)
        );
        return Object.freeze({
          isExplicitLocalRequest,
          requiresSecureCookies: (input: Parameters<
            SessionTransportPolicy['requiresSecureCookies']
          >[0]): boolean =>
            !isExplicitLocalRequest(input),
        });
      },
    },
  ],
  exports: [
    APPLICATION_DATABASE_CONNECTION,
    ACCESS_PIN_HASHER_FACTORY,
    ACCESS_ADMIN_PASSWORD_HASHER_FACTORY,
    LOCAL_RUNTIME_CONFIGURATION,
    SESSION_TRANSPORT_POLICY,
  ],
})
export class RuntimeInfrastructureModule {}
