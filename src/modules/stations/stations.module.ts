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
import { TenancyModule } from '../tenancy/tenancy.module.js';
import {
  TENANT_LIFECYCLE_COMMIT_RUNTIME,
} from '../tenancy/index.js';
import type {
  TenantLifecycleCommitRuntime,
} from '../tenancy/index.js';
import {
  BRANCH_SETTINGS_RUNTIME,
  BRANCH_ADMINISTRATION_RUNTIME,
  ADMIN_INVITATION_BRANCH_COMMIT_VALIDATOR,
  STATION_ADMINISTRATION_RUNTIME,
  TRUSTED_STATION_ADMISSION_VALIDATOR,
  TRUSTED_STATION_CONTEXT_RESOLVER,
} from './index.js';
import type {
  BranchSettingsRuntime,
  BranchAdministrationRuntime,
  AdminInvitationBranchCommitValidator,
  TrustedStationAdmissionValidator,
  TrustedStationContextResolver,
  StationAdministrationRuntime,
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
import { KyselyBranchAdministrationTransaction } from './infrastructure/persistence/kysely-branch-administration.transaction.js';
import { createKyselyBranchRepository, createTransactionalKyselyBranchRepository } from './infrastructure/persistence/kysely-branch.repository.js';
import { parseBranchId } from './application/ports/branch-repository.port.js';
import { parseTenantId } from '../tenancy/index.js';
import { LocalStationBootstrapController } from './presentation/local-station-bootstrap.controller.js';
import type { KyselyBranchRepositoryFactory } from './infrastructure/persistence/kysely-branch.repository.js';
import { BranchAdministrationService } from './application/branch-administration.service.js';
import { KyselyStationAdministrationRuntime } from './infrastructure/persistence/kysely-station-administration.runtime.js';

type RegisteredStationsPersistenceAdapter = KyselyBranchRepositoryFactory;

const STATIONS_RUNTIME_COMPOSITION = Symbol('srtaller.stations.runtime-composition');
type StationsRuntimeComposition = Readonly<{
  verifier: KyselyStationCredentialVerifier;
  branchRepository: ReturnType<typeof createKyselyBranchRepository>;
  branchTransactions: KyselyBranchAdministrationTransaction;
  stationAdministration: StationAdministrationRuntime;
}>;

@Module({
  imports: [RuntimeInfrastructureModule, TenancyModule],
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
      provide: STATIONS_RUNTIME_COMPOSITION,
      inject: [APPLICATION_DATABASE_CONNECTION],
      useFactory: (database: ApplicationDatabaseConnection): StationsRuntimeComposition =>
        Object.freeze({
          verifier: new KyselyStationCredentialVerifier(database),
          branchRepository: createKyselyBranchRepository(database),
          branchTransactions: new KyselyBranchAdministrationTransaction(
            database as unknown as ConstructorParameters<
              typeof KyselyBranchAdministrationTransaction
            >[0],
          ),
          stationAdministration: new KyselyStationAdministrationRuntime(database as never),
        }),
    },
    {
      provide: STATION_ADMINISTRATION_RUNTIME,
      inject: [STATIONS_RUNTIME_COMPOSITION],
      useFactory: (composition: StationsRuntimeComposition): StationAdministrationRuntime =>
        composition.stationAdministration,
    },
    {
      provide: BRANCH_ADMINISTRATION_RUNTIME,
      inject: [STATIONS_RUNTIME_COMPOSITION, TENANT_LIFECYCLE_COMMIT_RUNTIME],
      useFactory: (
        composition: StationsRuntimeComposition,
        tenants: TenantLifecycleCommitRuntime,
      ): BranchAdministrationRuntime => new BranchAdministrationService(
        composition.branchRepository,
        composition.branchTransactions,
        tenants,
      ),
    },
    {
      provide: BRANCH_SETTINGS_RUNTIME,
      inject: [STATIONS_RUNTIME_COMPOSITION],
      useFactory: (
        composition: StationsRuntimeComposition,
      ): BranchSettingsRuntime => composition.verifier,
    },
    {
      provide: TRUSTED_STATION_CONTEXT_RESOLVER,
      inject: [STATIONS_RUNTIME_COMPOSITION],
      useFactory: (composition: StationsRuntimeComposition): TrustedStationContextResolver =>
        new TrustedStationRequestContextResolver(
          new ResolveTrustedStationContextUseCase(composition.verifier),
        ),
    },
    {
      provide: TRUSTED_STATION_ADMISSION_VALIDATOR,
      inject: [STATIONS_RUNTIME_COMPOSITION],
      useFactory: (
        composition: StationsRuntimeComposition,
      ): TrustedStationAdmissionValidator => composition.verifier,
    },
    {
      provide: ADMIN_INVITATION_BRANCH_COMMIT_VALIDATOR,
      useFactory: (): AdminInvitationBranchCommitValidator => Object.freeze({
        validateActive: async (
          scope: Readonly<{ tenantId: string; branchId: string }>,
          transactionContext: object,
        ) => {
          try {
            const branch = await createTransactionalKyselyBranchRepository(transactionContext as never)
              .findBranchById({ tenantId: parseTenantId(scope.tenantId), branchId: parseBranchId(scope.branchId) });
            return branch?.status === 'ACTIVE';
          } catch {
            return false;
          }
        },
      }),
    },
  ],
  exports: [
    BRANCH_ADMINISTRATION_RUNTIME,
    STATION_ADMINISTRATION_RUNTIME,
    BRANCH_SETTINGS_RUNTIME,
    TRUSTED_STATION_ADMISSION_VALIDATOR,
    TRUSTED_STATION_CONTEXT_RESOLVER,
    ADMIN_INVITATION_BRANCH_COMMIT_VALIDATOR,
  ],
})
export class StationsModule {
  declare private readonly persistenceAdapter: RegisteredStationsPersistenceAdapter;
}
