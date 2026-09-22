import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';

import type { Kysely, Selectable, Transaction } from 'kysely';

import { databasePersistenceCapability } from '../../../../infrastructure/database/database-persistence-capability.js';
import { databaseTransactionCapability } from '../../../../infrastructure/database/database-transaction-capability.js';
import type { AccessAdminInvitationTable, DatabaseSchema } from '../../../../infrastructure/database/database-types.js';
import type { ApplicationDatabaseConnection } from '../../../../infrastructure/runtime/index.js';
import type { AdminInvitationGrant } from '../../domain/admin-invitation.js';
import { digestAdminInvitationGrants } from '../../domain/admin-invitation.js';
import type { AdminInvitationChallengeRecord, AdminInvitationRecord, AdminInvitationRepositoryPort, AdminInvitationWriteResult } from '../../application/ports/admin-invitation-repository.port.js';
import { AdminInvitationError } from '../../application/use-cases/admin-invitation.use-cases.js';

type AccessDatabase = Kysely<DatabaseSchema> | Transaction<DatabaseSchema>;
function fingerprint(value: unknown): Uint8Array { return createHash('sha256').update(JSON.stringify(value)).digest(); }
function sameBytes(left: Uint8Array, right: Uint8Array): boolean { return left.byteLength === right.byteLength && timingSafeEqual(Buffer.from(left), Buffer.from(right)); }
function iso(value: Date | string | null): string | null { return value === null ? null : (value instanceof Date ? value : new Date(value)).toISOString(); }

export class KyselyAdminInvitationRepository implements AdminInvitationRepositoryPort {
  constructor(private readonly connection: ApplicationDatabaseConnection) {}

  async list(tenantId: string): Promise<readonly AdminInvitationRecord[]> {
    return this.connection[databasePersistenceCapability]('access', async (db) => {
      const rows = await db.selectFrom('access_admin_invitations').selectAll().where('tenant_id', '=', tenantId).orderBy('created_at', 'desc').execute();
      return Promise.all(rows.map((row) => this.map(db as unknown as AccessDatabase, row)));
    });
  }

  async issue(input: Parameters<AdminInvitationRepositoryPort['issue']>[0], guard: Parameters<AdminInvitationRepositoryPort['issue']>[1]): Promise<AdminInvitationWriteResult> {
    return this.connection[databaseTransactionCapability]({ isolationLevel: 'serializable', accessMode: 'read write' }, async (raw) => {
      const db = raw as unknown as AccessDatabase; const at = new Date(input.occurredAt);
      const replay = await this.replay(db, input.tenantId, input.clientRequestId, 'ISSUE', input.invitationId, fingerprint({ email: input.normalizedEmail, grants: input.grants, target: input.targetUserId, name: input.proposedDisplayName }));
      if (replay) return Object.freeze({ invitation: replay, deliveryRequired: false });
      if (!await guard.confirmCurrent(raw)) throw new AdminInvitationError('ADMIN_INVITATION_AUTHORITY_CHANGED');
      const authorityRevision = await this.validateAuthorityAndGrants(db, input.tenantId, input.inviterUserId, input.inviterAdminIdentityId, null, input.grants);
      await db.insertInto('access_admin_invitations').values({ tenant_id: input.tenantId, invitation_id: input.invitationId, normalized_email: input.normalizedEmail, email_display: input.emailDisplay, target_user_id: input.targetUserId, proposed_display_name: input.proposedDisplayName, inviter_user_id: input.inviterUserId, inviter_admin_identity_id: input.inviterAdminIdentityId, status: 'PENDING', version: 0, authority_revision: authorityRevision, intended_grants_digest: digestAdminInvitationGrants(input.grants), expires_at: new Date(at.getTime() + 86_400_000), accepted_at: null, revoked_at: null, created_at: at, updated_at: at }).execute();
      await db.insertInto('access_admin_invitation_grants').values(input.grants.map((grant, index) => ({ tenant_id: input.tenantId, invitation_id: input.invitationId, grant_index: index, role_id: grant.roleId, role_version: grant.roleVersion, assignment_scope: grant.assignmentScope, branch_id: grant.branchId, created_at: at }))).execute();
      await this.insertChallengeDispatch(db, input.tenantId, input.invitationId, input.challengeId, input.deliveryId, input.normalizedEmail, input.tokenDigest, at);
      await this.command(db, input.tenantId, input.clientRequestId, 'ISSUE', input.invitationId, fingerprint({ email: input.normalizedEmail, grants: input.grants, target: input.targetUserId, name: input.proposedDisplayName }), 'PENDING', 0, at);
      await this.event(db, { tenantId: input.tenantId, eventType: 'INVITATION_ISSUED', actorUserId: input.inviterUserId, invitationId: input.invitationId, correlationId: input.correlationId, level: 1, at });
      return Object.freeze({ invitation: await this.read(db, input.tenantId, input.invitationId), deliveryRequired: true });
    });
  }

  async resend(input: Parameters<AdminInvitationRepositoryPort['resend']>[0], guard: Parameters<AdminInvitationRepositoryPort['resend']>[1]): Promise<AdminInvitationWriteResult> {
    return this.connection[databaseTransactionCapability]({ isolationLevel: 'serializable', accessMode: 'read write' }, async (raw) => {
      const db = raw as unknown as AccessDatabase; const at = new Date(input.occurredAt); const fp = fingerprint({ invitationId: input.invitationId, expectedVersion: input.expectedVersion });
      const replay = await this.replay(db, input.tenantId, input.clientRequestId, 'RESEND', input.invitationId, fp); if (replay) return Object.freeze({ invitation: replay, deliveryRequired: false });
      if (!await guard.confirmCurrent(raw)) throw new AdminInvitationError('ADMIN_INVITATION_AUTHORITY_CHANGED');
      const current = await db.selectFrom('access_admin_invitations').selectAll().where('tenant_id', '=', input.tenantId).where('invitation_id', '=', input.invitationId).forUpdate().executeTakeFirst();
      if (!current) throw new AdminInvitationError('ADMIN_INVITATION_NOT_FOUND');
      if (current.status !== 'PENDING' || current.version !== input.expectedVersion || at >= current.expires_at) throw new AdminInvitationError('ADMIN_INVITATION_UNAVAILABLE');
      await db.updateTable('access_admin_invitation_challenges').set({ status: 'SUPERSEDED', superseded_at: at, updated_at: at, version: (eb) => eb('version', '+', 1) }).where('tenant_id', '=', input.tenantId).where('invitation_id', '=', input.invitationId).where('status', '=', 'ACTIVE').execute();
      await this.insertChallengeDispatch(db, input.tenantId, input.invitationId, input.challengeId, input.deliveryId, current.normalized_email, input.tokenDigest, at);
      const version = current.version + 1;
      await db.updateTable('access_admin_invitations').set({ version, updated_at: at }).where('tenant_id', '=', input.tenantId).where('invitation_id', '=', input.invitationId).execute();
      await this.command(db, input.tenantId, input.clientRequestId, 'RESEND', input.invitationId, fp, 'PENDING', version, at);
      await this.event(db, { tenantId: input.tenantId, eventType: 'INVITATION_RESENT', actorUserId: current.inviter_user_id, invitationId: input.invitationId, correlationId: input.correlationId, level: 1, at });
      return Object.freeze({ invitation: await this.read(db, input.tenantId, input.invitationId), deliveryRequired: true });
    });
  }

  async revoke(input: Parameters<AdminInvitationRepositoryPort['revoke']>[0], guard: Parameters<AdminInvitationRepositoryPort['revoke']>[1]): Promise<AdminInvitationRecord> {
    return this.connection[databaseTransactionCapability]({ isolationLevel: 'serializable', accessMode: 'read write' }, async (raw) => {
      const db = raw as unknown as AccessDatabase; const at = new Date(input.occurredAt); const fp = fingerprint({ invitationId: input.invitationId, expectedVersion: input.expectedVersion });
      const replay = await this.replay(db, input.tenantId, input.clientRequestId, 'REVOKE', input.invitationId, fp); if (replay) return replay;
      if (!await guard.confirmCurrent(raw)) throw new AdminInvitationError('ADMIN_INVITATION_AUTHORITY_CHANGED');
      const changed = await db.updateTable('access_admin_invitations').set({ status: 'REVOKED', revoked_at: at, updated_at: at, version: input.expectedVersion + 1 }).where('tenant_id', '=', input.tenantId).where('invitation_id', '=', input.invitationId).where('status', '=', 'PENDING').where('version', '=', input.expectedVersion).returningAll().executeTakeFirst();
      if (!changed) throw new AdminInvitationError('ADMIN_INVITATION_UNAVAILABLE');
      await db.updateTable('access_admin_invitation_challenges').set({ status: 'SUPERSEDED', superseded_at: at, updated_at: at, version: (eb) => eb('version', '+', 1) }).where('tenant_id', '=', input.tenantId).where('invitation_id', '=', input.invitationId).where('status', '=', 'ACTIVE').execute();
      await this.command(db, input.tenantId, input.clientRequestId, 'REVOKE', input.invitationId, fp, 'REVOKED', changed.version, at);
      await this.event(db, { tenantId: input.tenantId, eventType: 'INVITATION_REVOKED', actorUserId: input.actorUserId, invitationId: input.invitationId, correlationId: input.correlationId, level: 1, at });
      return this.read(db, input.tenantId, input.invitationId);
    });
  }

  async findByChallengeDigest(tokenDigest: Uint8Array): Promise<AdminInvitationChallengeRecord | null> {
    return this.connection[databasePersistenceCapability]('access', async (db) => {
      const row = await db.selectFrom('access_admin_invitation_challenges as c').innerJoin('access_admin_invitations as i', (join) => join.onRef('i.tenant_id', '=', 'c.tenant_id').onRef('i.invitation_id', '=', 'c.invitation_id')).select(['c.tenant_id', 'c.invitation_id', 'c.challenge_id', 'c.status', 'c.expires_at', 'i.normalized_email', 'i.target_user_id', 'i.proposed_display_name']).where('c.token_digest', '=', tokenDigest).executeTakeFirst();
      return row ? Object.freeze({ tenantId: row.tenant_id, invitationId: row.invitation_id, challengeId: row.challenge_id, normalizedEmail: row.normalized_email, targetUserId: row.target_user_id, proposedDisplayName: row.proposed_display_name, status: row.status, expiresAt: row.expires_at.toISOString() }) : null;
    });
  }

  async accept(input: Parameters<AdminInvitationRepositoryPort['accept']>[0]): Promise<AdminInvitationRecord> {
    return this.connection[databaseTransactionCapability]({ isolationLevel: 'serializable', accessMode: 'read write' }, async (raw) => {
      const db = raw as unknown as AccessDatabase; const at = new Date(input.occurredAt); const fp = fingerprint({ invitationId: input.challenge.invitationId, challengeId: input.challenge.challengeId });
      const replay = await this.replay(db, input.challenge.tenantId, input.clientRequestId, 'ACCEPT', input.challenge.invitationId, fp); if (replay) return replay;
      const invitation = await db.selectFrom('access_admin_invitations').selectAll().where('tenant_id', '=', input.challenge.tenantId).where('invitation_id', '=', input.challenge.invitationId).forUpdate().executeTakeFirst();
      const challenge = await db.selectFrom('access_admin_invitation_challenges').selectAll().where('tenant_id', '=', input.challenge.tenantId).where('challenge_id', '=', input.challenge.challengeId).forUpdate().executeTakeFirst();
      if (!invitation || !challenge || invitation.status !== 'PENDING' || challenge.status !== 'ACTIVE' || at >= invitation.expires_at || at >= challenge.expires_at) throw new AdminInvitationError('ADMIN_INVITATION_UNAVAILABLE');
      const grants = await this.grants(db, invitation.tenant_id, invitation.invitation_id);
      if (!sameBytes(invitation.intended_grants_digest, digestAdminInvitationGrants(grants))) throw new AdminInvitationError('ADMIN_INVITATION_AUTHORITY_CHANGED');
      await this.validateAuthorityAndGrants(db, invitation.tenant_id, invitation.inviter_user_id, invitation.inviter_admin_identity_id, invitation.authority_revision, grants);
      const tenant = await db.selectFrom('tenants').select('lifecycle_status').where('tenant_id', '=', invitation.tenant_id).forShare().executeTakeFirst();
      if (!tenant) throw new AdminInvitationError('ADMIN_INVITATION_AUTHORITY_CHANGED');
      if (invitation.target_user_id === null) await db.insertInto('users').values({ tenant_id: invitation.tenant_id, user_id: input.userId, display_name: invitation.proposed_display_name as string, operational_identifier: null, status: 'active', version: 0, admission_revision: 0, created_at: at, updated_at: at }).execute();
      else {
        const user = await db.selectFrom('users').select(['status']).where('tenant_id', '=', invitation.tenant_id).where('user_id', '=', input.userId).forUpdate().executeTakeFirst();
        if (!user || user.status !== 'active') throw new AdminInvitationError('ADMIN_INVITATION_AUTHORITY_CHANGED');
      }
      await db.insertInto('access_admin_identities').values({ tenant_id: invitation.tenant_id, admin_identity_id: input.adminIdentityId, user_id: input.userId, normalized_email: invitation.normalized_email, email_display: invitation.email_display, verified_at: at, status: 'active', identity_version: 0, created_at: at, updated_at: at }).execute();
      await db.insertInto('access_admin_password_credentials').values({ tenant_id: invitation.tenant_id, admin_identity_id: input.adminIdentityId, user_id: input.userId, status: 'active', algorithm: 'argon2id', profile_version: input.password.profileVersion, pepper_version: input.password.pepperVersion, memory_kib: input.password.memoryKiB, passes: input.password.passes, parallelism: input.password.parallelism, salt: input.password.salt, verifier: input.password.verifier, credential_version: 1, session_revision: 1, created_at: at, updated_at: at, revoked_at: null }).execute();
      for (const grant of grants) await db.insertInto('access_role_assignments').values({ tenant_id: invitation.tenant_id, assignment_id: randomUUID(), user_id: input.userId, role_id: grant.roleId, assignment_scope: grant.assignmentScope, branch_id: grant.branchId, status: 'active', version: 0, assigned_at: at, revoked_at: null }).execute();
      await db.updateTable('access_admin_invitation_challenges').set({ status: 'CONSUMED', consumed_at: at, updated_at: at, version: challenge.version + 1 }).where('tenant_id', '=', invitation.tenant_id).where('challenge_id', '=', challenge.challenge_id).execute();
      await db.updateTable('access_admin_invitations').set({ status: 'ACCEPTED', accepted_at: at, updated_at: at, version: invitation.version + 1 }).where('tenant_id', '=', invitation.tenant_id).where('invitation_id', '=', invitation.invitation_id).execute();
      await this.command(db, invitation.tenant_id, input.clientRequestId, 'ACCEPT', invitation.invitation_id, fp, 'ACCEPTED', invitation.version + 1, at);
      await this.event(db, { tenantId: invitation.tenant_id, eventType: 'INVITATION_ACCEPTED', actorUserId: input.userId, invitationId: invitation.invitation_id, correlationId: input.correlationId, level: 1, at });
      await this.event(db, { tenantId: invitation.tenant_id, eventType: 'ADMIN_IDENTITY_ESTABLISHED', actorUserId: input.userId, targetUserId: input.userId, invitationId: invitation.invitation_id, correlationId: input.correlationId, level: 1, at });
      return this.read(db, invitation.tenant_id, invitation.invitation_id);
    });
  }

  async recordDelivery(input: Parameters<AdminInvitationRepositoryPort['recordDelivery']>[0]): Promise<void> {
    await this.connection[databasePersistenceCapability]('access', async (db) => { await db.updateTable('access_admin_invitation_dispatches').set({ status: input.status, attempt_count: (eb) => eb('attempt_count', '+', 1), provider_reference: input.providerReference, reason_code: input.reasonCode, updated_at: new Date(input.occurredAt) }).where('tenant_id', '=', input.tenantId).where('delivery_id', '=', input.deliveryId).where('status', '=', 'PENDING').execute(); });
  }

  private async validateAuthorityAndGrants(db: AccessDatabase, tenantId: string, inviterUserId: string, identityId: string, authorityRevision: number | null, grants: readonly AdminInvitationGrant[]): Promise<number> {
    const issuer = await db.selectFrom('access_admin_identities as i').innerJoin('users as u', (join) => join.onRef('u.tenant_id', '=', 'i.tenant_id').onRef('u.user_id', '=', 'i.user_id')).innerJoin('access_admin_password_credentials as c', (join) => join.onRef('c.tenant_id', '=', 'i.tenant_id').onRef('c.admin_identity_id', '=', 'i.admin_identity_id')).select(['u.status as user_status', 'u.admission_revision', 'i.status as identity_status', 'i.verified_at', 'c.status as credential_status']).where('i.tenant_id', '=', tenantId).where('i.admin_identity_id', '=', identityId).where('i.user_id', '=', inviterUserId).forShare().executeTakeFirst();
    if (!issuer || issuer.user_status !== 'active' || issuer.identity_status !== 'active' || issuer.credential_status !== 'active' || issuer.verified_at === null || (authorityRevision !== null && issuer.admission_revision !== authorityRevision)) throw new AdminInvitationError('ADMIN_INVITATION_AUTHORITY_CHANGED');
    for (const grant of grants) {
      const role = await db.selectFrom('access_roles').select(['version', 'status']).where('tenant_id', '=', tenantId).where('role_id', '=', grant.roleId).forShare().executeTakeFirst();
      if (!role || role.status !== 'active' || role.version !== grant.roleVersion) throw new AdminInvitationError('ADMIN_INVITATION_AUTHORITY_CHANGED');
      if (grant.branchId) { const branch = await db.selectFrom('branches').select('active').where('tenant_id', '=', tenantId).where('branch_id', '=', grant.branchId).forShare().executeTakeFirst(); if (!branch?.active) throw new AdminInvitationError('ADMIN_INVITATION_AUTHORITY_CHANGED'); }
    }
    return issuer.admission_revision;
  }

  private async insertChallengeDispatch(db: AccessDatabase, tenantId: string, invitationId: string, challengeId: string, deliveryId: string, destination: string, digest: Uint8Array, at: Date): Promise<void> {
    await db.insertInto('access_admin_invitation_challenges').values({ tenant_id: tenantId, challenge_id: challengeId, invitation_id: invitationId, token_digest: digest, status: 'ACTIVE', version: 0, expires_at: new Date(at.getTime() + 86_400_000), consumed_at: null, superseded_at: null, created_at: at, updated_at: at }).execute();
    await db.insertInto('access_admin_invitation_dispatches').values({ tenant_id: tenantId, delivery_id: deliveryId, invitation_id: invitationId, challenge_id: challengeId, template_key: 'admin-invitation', template_version: 1, destination, status: 'PENDING', attempt_count: 0, provider_reference: null, reason_code: 'PENDING_DELIVERY', created_at: at, updated_at: at }).execute();
  }

  private async command(db: AccessDatabase, tenantId: string, requestId: string, type: 'ISSUE' | 'RESEND' | 'REVOKE' | 'ACCEPT', invitationId: string, fp: Uint8Array, status: AdminInvitationRecord['status'], version: number, at: Date): Promise<void> { await db.insertInto('access_admin_invitation_commands').values({ tenant_id: tenantId, client_request_id: requestId, command_type: type, invitation_id: invitationId, request_fingerprint: fp, result_status: status, result_version: version, applied_at: at }).execute(); }

  private async replay(db: AccessDatabase, tenantId: string, requestId: string, type: string, invitationId: string, fp: Uint8Array): Promise<AdminInvitationRecord | null> {
    const command = await db.selectFrom('access_admin_invitation_commands').selectAll().where('tenant_id', '=', tenantId).where('client_request_id', '=', requestId).executeTakeFirst();
    if (!command) return null;
    const invitationMatches = type === 'ISSUE' || command.invitation_id === invitationId;
    if (command.command_type !== type || !invitationMatches || !sameBytes(command.request_fingerprint, fp)) throw new AdminInvitationError('ADMIN_INVITATION_INVALID');
    return this.read(db, tenantId, command.invitation_id);
  }

  private async grants(db: AccessDatabase, tenantId: string, invitationId: string): Promise<readonly AdminInvitationGrant[]> { const rows = await db.selectFrom('access_admin_invitation_grants').selectAll().where('tenant_id', '=', tenantId).where('invitation_id', '=', invitationId).orderBy('grant_index').execute(); return Object.freeze(rows.map((row) => Object.freeze({ roleId: row.role_id, roleVersion: row.role_version, assignmentScope: row.assignment_scope, branchId: row.branch_id }))); }
  private async read(db: AccessDatabase, tenantId: string, invitationId: string): Promise<AdminInvitationRecord> { const row = await db.selectFrom('access_admin_invitations').selectAll().where('tenant_id', '=', tenantId).where('invitation_id', '=', invitationId).executeTakeFirst(); if (!row) throw new AdminInvitationError('ADMIN_INVITATION_NOT_FOUND'); return this.map(db, row); }
  private async map(db: AccessDatabase, row: Selectable<AccessAdminInvitationTable>): Promise<AdminInvitationRecord> { return Object.freeze({ tenantId: row.tenant_id, invitationId: row.invitation_id, normalizedEmail: row.normalized_email, emailDisplay: row.email_display, targetUserId: row.target_user_id, proposedDisplayName: row.proposed_display_name, inviterUserId: row.inviter_user_id, inviterAdminIdentityId: row.inviter_admin_identity_id, status: row.status, version: row.version, authorityRevision: row.authority_revision, grants: await this.grants(db, row.tenant_id, row.invitation_id), expiresAt: iso(row.expires_at) as string, acceptedAt: iso(row.accepted_at), revokedAt: iso(row.revoked_at), createdAt: iso(row.created_at) as string, updatedAt: iso(row.updated_at) as string }); }
  private async event(db: AccessDatabase, input: Readonly<{ tenantId: string; eventType: string; actorUserId?: string; targetUserId?: string; invitationId?: string; correlationId: string; level: 1 | 2; at: Date }>): Promise<void> { await db.insertInto('access_admin_lifecycle_events').values({ tenant_id: input.tenantId, event_id: randomUUID(), actor_user_id: input.actorUserId ?? null, actor_admin_identity_id: null, session_id: null, target_user_id: input.targetUserId ?? null, role_id: null, assignment_id: null, invitation_id: input.invitationId ?? null, branch_id: null, event_type: input.eventType, result: 'SUCCEEDED', reason_code: 'COMMAND_APPLIED', sensitivity_level: input.level, correlation_id: input.correlationId, occurred_at: input.at }).execute(); }
}
