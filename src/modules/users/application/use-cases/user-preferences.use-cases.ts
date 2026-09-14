import { parseTenantId } from '../../../tenancy/index.js';
import { parseUserId } from '../../domain/user.js';
import type {
  NewRepairFormMode,
  UserPreferencesMutationGuard,
  UserPreferencesRecord,
  UserPreferencesPatch,
  UserPreferencesRepositoryPort,
  UserPreferencesScope,
} from '../ports/user-preferences-repository.port.js';

export class UserPreferencesInputError extends Error {
  readonly code = 'USER_PREFERENCES_INVALID';

  constructor(readonly parameter: 'newRepairFormMode' | 'payload' | 'scope') {
    super('User preferences input is invalid.');
    this.name = 'UserPreferencesInputError';
  }
}

function exactObject(
  value: unknown,
  keys: readonly string[],
): Readonly<Record<string, unknown>> {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value) ||
    Object.keys(value).length !== keys.length ||
    Object.keys(value).some((key) => !keys.includes(key))
  ) {
    throw new UserPreferencesInputError('payload');
  }
  return value as Readonly<Record<string, unknown>>;
}

function scope(value: unknown): UserPreferencesScope {
  try {
    const candidate = exactObject(value, ['tenantId', 'userId']);
    return Object.freeze({
      tenantId: parseTenantId(candidate.tenantId),
      userId: parseUserId(candidate.userId as string),
    });
  } catch (error: unknown) {
    if (error instanceof UserPreferencesInputError && error.parameter === 'payload') {
      throw new UserPreferencesInputError('scope');
    }
    throw new UserPreferencesInputError('scope');
  }
}

function requestedPatch(value: unknown): UserPreferencesPatch {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new UserPreferencesInputError('payload');
  const input = value as Readonly<Record<string, unknown>>;
  const keys = Object.keys(input);
  if (keys.length < 1 || keys.some((key) => key !== 'newRepairFormMode' && key !== 'priceListShowReferenceCost')) throw new UserPreferencesInputError('payload');
  if ('newRepairFormMode' in input && input.newRepairFormMode !== 'classic' && input.newRepairFormMode !== 'guided_v2') throw new UserPreferencesInputError('newRepairFormMode');
  if ('priceListShowReferenceCost' in input && typeof input.priceListShowReferenceCost !== 'boolean') throw new UserPreferencesInputError('payload');
  return Object.freeze({
    ...(input.newRepairFormMode ? { newRepairFormMode: input.newRepairFormMode as NewRepairFormMode } : {}),
    ...('priceListShowReferenceCost' in input ? { priceListShowReferenceCost: input.priceListShowReferenceCost as boolean } : {}),
  });
}

const defaultPreferences: UserPreferencesRecord = Object.freeze({
  newRepairFormMode: 'classic',
  priceListShowReferenceCost: false,
  updatedAt: null,
});

export class GetUserPreferencesUseCase {
  constructor(private readonly repository: UserPreferencesRepositoryPort) {}

  async execute(value: unknown): Promise<UserPreferencesRecord> {
    return await this.repository.read(scope(value)) ?? defaultPreferences;
  }
}

export class UpdateUserPreferencesUseCase {
  constructor(
    private readonly repository: UserPreferencesRepositoryPort,
    private readonly now: () => Date = () => new Date(),
  ) {}

  execute(
    scopeValue: unknown,
    input: unknown,
    guard?: UserPreferencesMutationGuard,
  ): Promise<UserPreferencesRecord> {
    return this.repository.upsert(
      scope(scopeValue),
      requestedPatch(input),
      this.now(),
      guard,
    );
  }
}
