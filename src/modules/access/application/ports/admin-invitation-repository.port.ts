import type { AdminPasswordStoredVerifier } from './admin-password-hasher.port.js';
import type { AdminInvitationGrant, AdminInvitationStatus } from '../../domain/admin-invitation.js';

export type AdminInvitationRecord = Readonly<{
  tenantId: string;
  invitationId: string;
  normalizedEmail: string;
  emailDisplay: string;
  targetUserId: string | null;
  proposedDisplayName: string | null;
  inviterUserId: string;
  inviterAdminIdentityId: string;
  status: AdminInvitationStatus;
  version: number;
  authorityRevision: number;
  grants: readonly AdminInvitationGrant[];
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
}>;

export type AdminInvitationChallengeRecord = Readonly<{
  tenantId: string;
  invitationId: string;
  challengeId: string;
  normalizedEmail: string;
  targetUserId: string | null;
  proposedDisplayName: string | null;
  status: 'ACTIVE' | 'CONSUMED' | 'SUPERSEDED' | 'EXPIRED';
  expiresAt: string;
}>;

export type AdminInvitationWriteResult = Readonly<{
  invitation: AdminInvitationRecord;
  deliveryRequired: boolean;
}>;

export interface AdminInvitationMutationGuard {
  confirmCurrent(transactionContext: object): Promise<boolean>;
}

export interface AdminInvitationRepositoryPort {
  list(tenantId: string): Promise<readonly AdminInvitationRecord[]>;
  issue(input: Readonly<{
    tenantId: string; invitationId: string; challengeId: string; deliveryId: string;
    normalizedEmail: string; emailDisplay: string; targetUserId: string | null;
    proposedDisplayName: string | null; inviterUserId: string; inviterAdminIdentityId: string;
    inviterAdminSessionId: string;
    grants: readonly AdminInvitationGrant[];
    tokenDigest: Uint8Array; clientRequestId: string; correlationId: string; occurredAt: string;
  }>, guard: AdminInvitationMutationGuard): Promise<AdminInvitationWriteResult>;
  resend(input: Readonly<{
    tenantId: string; invitationId: string; challengeId: string; deliveryId: string;
    tokenDigest: Uint8Array; expectedVersion: number; clientRequestId: string;
    correlationId: string; actorUserId: string; actorAdminIdentityId: string;
    actorAdminSessionId: string; occurredAt: string;
  }>, guard: AdminInvitationMutationGuard): Promise<AdminInvitationWriteResult>;
  revoke(input: Readonly<{
    tenantId: string; invitationId: string; expectedVersion: number; clientRequestId: string;
    correlationId: string; actorUserId: string; actorAdminIdentityId: string;
    actorAdminSessionId: string; occurredAt: string;
  }>, guard: AdminInvitationMutationGuard): Promise<AdminInvitationRecord>;
  findByChallengeDigest(tokenDigest: Uint8Array): Promise<AdminInvitationChallengeRecord | null>;
  accept(input: Readonly<{
    challenge: AdminInvitationChallengeRecord; userId: string; adminIdentityId: string;
    assignmentIds: readonly string[]; password: AdminPasswordStoredVerifier;
    clientRequestId: string; correlationId: string; occurredAt: string;
  }>): Promise<AdminInvitationRecord>;
  recordDelivery(input: Readonly<{
    tenantId: string; deliveryId: string; status: 'DELIVERED' | 'FAILED';
    providerReference: string | null; reasonCode: string; occurredAt: string;
  }>): Promise<void>;
}
