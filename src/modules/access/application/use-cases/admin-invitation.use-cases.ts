import { createHash, randomBytes, randomUUID } from 'node:crypto';

import type { EmailDeliveryPort } from '../../../../infrastructure/email/email-delivery.js';
import type { AdminPasswordHasherPort } from '../ports/admin-password-hasher.port.js';
import type { AdminInvitationMutationGuard, AdminInvitationRepositoryPort, AdminInvitationRecord } from '../ports/admin-invitation-repository.port.js';
import { adminInvitationExpiresAt, canonicalizeAdminInvitationGrants, normalizeAdminInvitationEmail } from '../../domain/admin-invitation.js';
import { parseAdminPassword } from '../../domain/admin-password.js';

export type AdminInvitationErrorCode =
  | 'ADMIN_INVITATION_INVALID'
  | 'ADMIN_INVITATION_NOT_FOUND'
  | 'ADMIN_INVITATION_UNAVAILABLE'
  | 'ADMIN_INVITATION_AUTHORITY_CHANGED';

export class AdminInvitationError extends Error {
  constructor(readonly code: AdminInvitationErrorCode) { super(code); this.name = 'AdminInvitationError'; }
  toJSON() { return Object.freeze({ code: this.code, name: this.name }); }
}

type TokenMaterial = Readonly<{ token: string; digest: Uint8Array }>;
function secureToken(): TokenMaterial {
  const token = randomBytes(32).toString('base64url');
  return Object.freeze({ token, digest: createHash('sha256').update(token).digest() });
}
function digestToken(value: unknown): Uint8Array {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{40,64}$/u.test(value)) throw new AdminInvitationError('ADMIN_INVITATION_UNAVAILABLE');
  return createHash('sha256').update(value).digest();
}

export class AdminInvitationService {
  constructor(
    private readonly repository: AdminInvitationRepositoryPort,
    private readonly passwords: AdminPasswordHasherPort,
    private readonly delivery: EmailDeliveryPort,
    private readonly publicBaseUrl: string,
    private readonly now: () => Date = () => new Date(),
    private readonly createId: () => string = randomUUID,
    private readonly createToken: () => TokenMaterial = secureToken,
  ) {}

  list(tenantId: string) { return this.repository.list(tenantId); }

  async issue(input: Readonly<{
    tenantId: string; inviterUserId: string; inviterAdminIdentityId: string;
    targetUserId: string | null; proposedDisplayName: string | null; email: unknown;
    grants: Parameters<typeof canonicalizeAdminInvitationGrants>[0];
    clientRequestId: string; correlationId: string; guard: AdminInvitationMutationGuard;
  }>): Promise<AdminInvitationRecord> {
    const at = this.now().toISOString();
    const email = normalizeAdminInvitationEmail(input.email);
    const grants = canonicalizeAdminInvitationGrants(input.grants);
    const invitationId = this.createId(); const challengeId = this.createId(); const deliveryId = this.createId();
    const token = this.createToken();
    const invitation = await this.repository.issue({
      tenantId: input.tenantId, inviterUserId: input.inviterUserId,
      inviterAdminIdentityId: input.inviterAdminIdentityId,
      targetUserId: input.targetUserId, proposedDisplayName: input.proposedDisplayName,
      normalizedEmail: email.normalized, emailDisplay: email.display,
      grants, invitationId,
      challengeId, deliveryId, tokenDigest: token.digest,
      clientRequestId: input.clientRequestId, correlationId: input.correlationId,
      occurredAt: at,
    }, input.guard);
    await this.deliver(invitation, challengeId, deliveryId, token.token, at);
    return invitation;
  }

  async resend(input: Readonly<{
    tenantId: string; invitationId: string; expectedVersion: number; clientRequestId: string;
    correlationId: string; guard: AdminInvitationMutationGuard;
  }>): Promise<AdminInvitationRecord> {
    const at = this.now().toISOString(); const challengeId = this.createId(); const deliveryId = this.createId(); const token = this.createToken();
    const invitation = await this.repository.resend({ ...input, challengeId, deliveryId, tokenDigest: token.digest, occurredAt: at }, input.guard);
    await this.deliver(invitation, challengeId, deliveryId, token.token, at);
    return invitation;
  }

  revoke(input: Parameters<AdminInvitationRepositoryPort['revoke']>[0] & Readonly<{ guard: AdminInvitationMutationGuard }>) {
    return this.repository.revoke(input, input.guard);
  }

  async accept(input: Readonly<{ token: unknown; password: unknown; clientRequestId: string; correlationId: string }>): Promise<AdminInvitationRecord> {
    const challenge = await this.repository.findByChallengeDigest(digestToken(input.token));
    if (!challenge) throw new AdminInvitationError('ADMIN_INVITATION_UNAVAILABLE');
    const userId = challenge.targetUserId ?? this.createId();
    const adminIdentityId = this.createId();
    const password = await this.passwords.hash({ tenantId: challenge.tenantId, adminIdentityId, password: parseAdminPassword(input.password) });
    return this.repository.accept({ challenge, userId, adminIdentityId, assignmentIds: [], password, clientRequestId: input.clientRequestId, correlationId: input.correlationId, occurredAt: this.now().toISOString() });
  }

  private async deliver(invitation: AdminInvitationRecord, challengeId: string, deliveryId: string, token: string, occurredAt: string): Promise<void> {
    const result = await this.delivery.deliver({ deliveryId, destination: invitation.emailDisplay, templateKey: 'admin-invitation', templateVersion: 1, actionUrl: `${this.publicBaseUrl}/admin/invitaciones/aceptar?token=${encodeURIComponent(token)}`, expiresAt: adminInvitationExpiresAt(invitation.createdAt) });
    await this.repository.recordDelivery({ tenantId: invitation.tenantId, deliveryId, status: result.status, providerReference: result.providerReference, reasonCode: result.reasonCode, occurredAt });
  }
}
