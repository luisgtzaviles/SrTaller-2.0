import { Module } from '@nestjs/common';

import type { AssignRoleUseCase } from './application/use-cases/assign-role.use-case.js';
import type { ListAccessMatrixUseCase } from './application/use-cases/list-access-matrix.use-case.js';
import type { ListApplicableUsersUseCase } from './application/use-cases/list-applicable-users.use-case.js';
import type { ResolveEffectiveCapabilitiesUseCase } from './application/use-cases/resolve-effective-capabilities.use-case.js';
import type { RevokeRoleAssignmentUseCase } from './application/use-cases/revoke-role-assignment.use-case.js';
import type { KyselyAccessRepositoryFactory } from './infrastructure/persistence/kysely-access.repository.js';
import type { KyselyPinCredentialRepositoryFactory } from './infrastructure/persistence/kysely-pin-credential.repository.js';
import type { NodeArgon2PinHasher } from './infrastructure/security/node-argon2-pin-hasher.js';
import type { AuthenticatePinUseCase } from './application/use-cases/authenticate-pin.use-case.js';
import type { ProvisionPinCredentialUseCase } from './application/use-cases/provision-pin-credential.use-case.js';

type RegisteredAccessPersistenceAdapter =
  | KyselyAccessRepositoryFactory
  | KyselyPinCredentialRepositoryFactory;
type RegisteredAccessSecurityAdapter = NodeArgon2PinHasher;
type RegisteredAccessUseCases =
  | AuthenticatePinUseCase
  | AssignRoleUseCase
  | ListAccessMatrixUseCase
  | ListApplicableUsersUseCase
  | ResolveEffectiveCapabilitiesUseCase
  | RevokeRoleAssignmentUseCase
  | ProvisionPinCredentialUseCase;

@Module({})
export class AccessModule {
  declare private readonly persistenceAdapter: RegisteredAccessPersistenceAdapter;
  declare private readonly securityAdapter: RegisteredAccessSecurityAdapter;
  declare private readonly useCases: RegisteredAccessUseCases;
}
