import { Module } from '@nestjs/common';

import { RuntimeInfrastructureModule } from '../../infrastructure/runtime/runtime-infrastructure.module.js';
import {
  APPLICATION_DATABASE_CONNECTION,
  LOCAL_RUNTIME_CONFIGURATION,
} from '../../infrastructure/runtime/index.js';
import type {
  ApplicationDatabaseConnection,
  LocalRuntimeConfiguration,
} from '../../infrastructure/runtime/index.js';
import {
  BRANCH_SETTINGS_RUNTIME,
  BRANCH_ADMINISTRATION_RUNTIME,
  TRUSTED_STATION_ADMISSION_VALIDATOR,
  TRUSTED_STATION_CONTEXT_RESOLVER,
} from './index.js';
import type {
  BranchSettingsRuntime,
  BranchAdministrationRuntime,
  TrustedStationAdmissionValidator,
  TrustedStationContextResolver,
} from './index.js';
import {
  LOCAL_STATION_BOOTSTRAP_RUNTIME,
} from './application/ports/local-station-bootstrap-runtime.port.js';
import type {
  LocalStationBootstrapRuntime,
} from './application/ports/local-station-bootstrap-runtime.port.js';
import { ResolveTrustedStationContextUseCase } from './application/use-cases/resolve-trusted-station-context.js';
import { localStationBootstrapCredential } from './infrastructure/development/local-station-bootstrap.js';
import { serializeStationCredentialCookie } from './infrastructure/http/station-credential-cookie.js';
import { TrustedStationRequestContextResolver } from './infrastructure/http/trusted-station-request-context.resolver.js';
import { KyselyStationCredentialVerifier } from './infrastructure/persistence/kysely-station-credential.verifier.js';
import { LocalStationBootstrapController } from './presentation/local-station-bootstrap.controller.js';
import type { KyselyBranchRepositoryFactory } from './infrastructure/persistence/kysely-branch.repository.js';
import { BranchAdministrationService } from './application/branch-administration.service.js';

type RegisteredStationsPersistenceAdapter = KyselyBranchRepositoryFactory;

@Module({
  imports: [RuntimeInfrastructureModule],
  controllers: [LocalStationBootstrapController],
  providers: [
    {
      provide: LOCAL_STATION_BOOTSTRAP_RUNTIME,
      inject: [LOCAL_RUNTIME_CONFIGURATION],
      useFactory: (
        configuration: LocalRuntimeConfiguration,
      ): LocalStationBootstrapRuntime => {
        const stationCookie = configuration.enabled
          ? serializeStationCredentialCookie(
              configuration.createLocalStationBootstrapCredential(
                localStationBootstrapCredential,
              ),
              false,
            )
          : null;
        return Object.freeze({
          allowsRequest: (input: Parameters<
            LocalStationBootstrapRuntime['allowsRequest']
          >[0]): boolean => {
            const host = input.host;
            const configuredHost = typeof host === 'string' && (
              host === configuration.host ||
              (
                host.startsWith(`${configuration.host}:`) &&
                /^\d{1,5}$/u.test(host.slice(configuration.host.length + 1))
              )
            );
            return (
              configuration.enabled &&
              input.fetchSite === 'same-origin' &&
              typeof input.origin === 'string' &&
              configuredHost &&
              input.origin === `http://${host}`
            );
          },
          stationCookie: (): string => {
            if (!stationCookie) {
              throw new Error('Local station bootstrap is unavailable.');
            }
            return stationCookie;
          },
        });
      },
    },
    {
      provide: BRANCH_ADMINISTRATION_RUNTIME,
      inject: [APPLICATION_DATABASE_CONNECTION],
      useFactory: (database: ApplicationDatabaseConnection): BranchAdministrationRuntime =>
        new BranchAdministrationService(database as never),
    },
    {
      provide: KyselyStationCredentialVerifier,
      inject: [APPLICATION_DATABASE_CONNECTION],
      useFactory: (database: ApplicationDatabaseConnection) =>
        new KyselyStationCredentialVerifier(database),
    },
    {
      provide: BRANCH_SETTINGS_RUNTIME,
      inject: [KyselyStationCredentialVerifier],
      useFactory: (
        verifier: KyselyStationCredentialVerifier,
      ): BranchSettingsRuntime => verifier,
    },
    {
      provide: TRUSTED_STATION_CONTEXT_RESOLVER,
      inject: [KyselyStationCredentialVerifier],
      useFactory: (verifier: KyselyStationCredentialVerifier): TrustedStationContextResolver =>
        new TrustedStationRequestContextResolver(
          new ResolveTrustedStationContextUseCase(verifier),
        ),
    },
    {
      provide: TRUSTED_STATION_ADMISSION_VALIDATOR,
      inject: [KyselyStationCredentialVerifier],
      useFactory: (
        verifier: KyselyStationCredentialVerifier,
      ): TrustedStationAdmissionValidator => verifier,
    },
  ],
  exports: [
    BRANCH_ADMINISTRATION_RUNTIME,
    BRANCH_SETTINGS_RUNTIME,
    TRUSTED_STATION_ADMISSION_VALIDATOR,
    TRUSTED_STATION_CONTEXT_RESOLVER,
  ],
})
export class StationsModule {
  declare private readonly persistenceAdapter: RegisteredStationsPersistenceAdapter;
}
