import { createHash, randomUUID } from 'node:crypto';

import type { Kysely, Transaction } from 'kysely';

import { databaseTransactionCapability } from '../../../../infrastructure/database/database-transaction-capability.js';
import type { DatabaseSchema } from '../../../../infrastructure/database/database-types.js';
import type { ApplicationDatabaseConnection } from '../../../../infrastructure/runtime/index.js';
import type { AdminAuthorizationCommitGuard } from '../../index.js';
import { AccessPersistenceError } from '../../application/ports/access-repository.port.js';

type Database = Kysely<DatabaseSchema> | Transaction<DatabaseSchema>;

export class KyselyAdminLifecycleRepository {
  constructor(private readonly connection: ApplicationDatabaseConnection) {}

  async transitionRole(input: Readonly<{ tenantId: string; roleId: string; expectedVersion: number; active: boolean; clientRequestId: string; actorUserId: string; sessionId: string; correlationId: string; occurredAt: string }>, guard: AdminAuthorizationCommitGuard) {
    return this.connection[databaseTransactionCapability]({ isolationLevel: 'serializable', accessMode: 'read write' }, async (raw) => {
      const db = raw as unknown as Database; const at = new Date(input.occurredAt);
      if (!await guard.confirmCurrent(raw)) throw new AccessPersistenceError('ACCESS_AUTHORIZATION_CHANGED');
      const role = await db.selectFrom('access_roles').selectAll().where('tenant_id', '=', input.tenantId).where('role_id', '=', input.roleId).forUpdate().executeTakeFirst();
      if (!role) throw new AccessPersistenceError('ACCESS_REFERENCE_NOT_FOUND');
      if (role.management_mode !== 'TENANT_MANAGED') throw new AccessPersistenceError('ACCESS_PROTECTED_ROLE');
      if (role.version !== input.expectedVersion) throw new AccessPersistenceError('ACCESS_STALE_WRITE');
      const desired = input.active ? 'active' : 'disabled';
      if (role.status === desired) return role;
      const capabilities = await db.selectFrom('access_role_capabilities').select('capability_code').where('tenant_id', '=', input.tenantId).where('role_id', '=', input.roleId).orderBy('capability_code').execute();
      const updated = await db.updateTable('access_roles').set({ status: desired, version: role.version + 1, updated_at: at }).where('tenant_id', '=', input.tenantId).where('role_id', '=', input.roleId).where('version', '=', input.expectedVersion).returningAll().executeTakeFirstOrThrow();
      await db.insertInto('access_role_commands').values({ tenant_id: input.tenantId, client_request_id: input.clientRequestId, command_type: input.active ? 'reactivate' : 'deactivate', role_id: input.roleId, request_fingerprint: createHash('sha256').update(JSON.stringify({ roleId: input.roleId, expectedVersion: input.expectedVersion, active: input.active })).digest(), result_role_key: updated.role_key, result_display_name: updated.display_name, result_description: updated.description, result_status: updated.status, result_version: updated.version, result_capability_codes: capabilities.map(({ capability_code }) => capability_code), result_created_at: updated.created_at, result_updated_at: updated.updated_at, applied_at: at }).execute();
      await this.event(db, { ...input, eventType: input.active ? 'ROLE_REACTIVATED' : 'ROLE_DEACTIVATED', roleId: input.roleId, level: 1, at });
      return updated;
    });
  }

  async revokeAdminIdentity(input: Readonly<{ tenantId: string; targetUserId: string; adminIdentityId: string; actorUserId: string; sessionId: string; correlationId: string; occurredAt: string }>, guard: AdminAuthorizationCommitGuard): Promise<void> {
    await this.connection[databaseTransactionCapability]({ isolationLevel: 'serializable', accessMode: 'read write' }, async (raw) => {
      const db = raw as unknown as Database; const at = new Date(input.occurredAt);
      if (!await guard.confirmCurrent(raw)) throw new AccessPersistenceError('ACCESS_AUTHORIZATION_CHANGED');
      const identity = await db.selectFrom('access_admin_identities').selectAll().where('tenant_id', '=', input.tenantId).where('admin_identity_id', '=', input.adminIdentityId).where('user_id', '=', input.targetUserId).forUpdate().executeTakeFirst();
      if (!identity) throw new AccessPersistenceError('ACCESS_REFERENCE_NOT_FOUND');
      if (identity.status === 'revoked') return;
      await db.updateTable('access_admin_identities').set({ status: 'revoked', identity_version: identity.identity_version + 1, updated_at: at }).where('tenant_id', '=', input.tenantId).where('admin_identity_id', '=', input.adminIdentityId).execute();
      await db.updateTable('access_admin_password_credentials').set({ status: 'revoked', credential_version: (eb) => eb('credential_version', '+', 1), session_revision: (eb) => eb('session_revision', '+', 1), revoked_at: at, updated_at: at }).where('tenant_id', '=', input.tenantId).where('admin_identity_id', '=', input.adminIdentityId).execute();
      await db.updateTable('access_admin_sessions').set({ status: 'revoked', ended_at: at, reauthenticated_at: null, version: (eb) => eb('version', '+', 1) }).where('tenant_id', '=', input.tenantId).where('admin_identity_id', '=', input.adminIdentityId).where('status', '=', 'active').execute();
      if (!await guard.confirmEffectiveTenantAdmin(raw)) throw new AccessPersistenceError('ACCESS_AUTHORIZATION_CHANGED');
      await this.event(db, { ...input, eventType: 'ADMIN_IDENTITY_REVOKED', targetUserId: input.targetUserId, level: 2, at });
    });
  }

  private async event(db: Database, input: Readonly<{ tenantId: string; actorUserId: string; sessionId: string; correlationId: string; eventType: string; targetUserId?: string; roleId?: string; level: 1 | 2; at: Date }>): Promise<void> {
    await db.insertInto('access_admin_lifecycle_events').values({ tenant_id: input.tenantId, event_id: randomUUID(), actor_user_id: input.actorUserId, actor_admin_identity_id: null, session_id: input.sessionId, target_user_id: input.targetUserId ?? null, role_id: input.roleId ?? null, assignment_id: null, invitation_id: null, branch_id: null, event_type: input.eventType, result: 'SUCCEEDED', reason_code: 'COMMAND_APPLIED', sensitivity_level: input.level, correlation_id: input.correlationId, occurred_at: input.at }).execute();
  }
}
