import { Module } from '@nestjs/common';

import type { AssignRoleUseCase } from './application/use-cases/assign-role.use-case.js';
import type { ListAccessMatrixUseCase } from './application/use-cases/list-access-matrix.use-case.js';
import type { ListApplicableUsersUseCase } from './application/use-cases/list-applicable-users.use-case.js';
import type { ResolveEffectiveCapabilitiesUseCase } from './application/use-cases/resolve-effective-capabilities.use-case.js';
import type { RevokeRoleAssignmentUseCase } from './application/use-cases/revoke-role-assignment.use-case.js';
import type { KyselyAccessRepositoryFactory } from './infrastructure/persistence/kysely-access.repository.js';

type RegisteredAccessPersistenceAdapter = KyselyAccessRepositoryFactory;
type RegisteredAccessUseCases =
  | AssignRoleUseCase
  | ListAccessMatrixUseCase
  | ListApplicableUsersUseCase
  | ResolveEffectiveCapabilitiesUseCase
  | RevokeRoleAssignmentUseCase;

@Module({})
export class AccessModule {
  declare private readonly persistenceAdapter: RegisteredAccessPersistenceAdapter;
  declare private readonly useCases: RegisteredAccessUseCases;
}
