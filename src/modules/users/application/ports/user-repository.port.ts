import type { UserStatus } from '../../domain/user.js';

export interface UserScope {
  readonly tenantId: string;
}
export type UserRecord = Readonly<{ userId: string; tenantId: string; displayName: string; operationalIdentifier: string | null; status: UserStatus; version: number; createdAt: Date; updatedAt: Date }>;
export interface UserRepositoryPort {
  list(scope: UserScope): Promise<readonly UserRecord[]>;
  bootstrap(scope: UserScope, input: Readonly<{ userId: string; displayName: string; operationalIdentifier: string | null; clientRequestId: string; now: Date }>): Promise<UserRecord>;
  transition(scope: UserScope, input: Readonly<{ userId: string; status: UserStatus; expectedVersion: number; now: Date }>): Promise<UserRecord>;
}
