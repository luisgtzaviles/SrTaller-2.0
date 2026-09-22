import { createHash } from 'node:crypto';

import type { RoleAssignmentScope } from './role-assignment.js';

export type AdminInvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
export type AdminInvitationChallengeStatus = 'ACTIVE' | 'CONSUMED' | 'SUPERSEDED' | 'EXPIRED';

export type AdminInvitationGrant = Readonly<{
  roleId: string;
  roleVersion: number;
  assignmentScope: RoleAssignmentScope;
  branchId: string | null;
}>;

export class AdminInvitationInputError extends Error {
  constructor(readonly field: string) {
    super('Administrative invitation input is invalid.');
    this.name = 'AdminInvitationInputError';
  }

  toJSON(): Readonly<{ code: 'ADMIN_INVITATION_INPUT_INVALID'; name: string }> {
    return Object.freeze({ code: 'ADMIN_INVITATION_INPUT_INVALID', name: this.name });
  }
}

const canonicalUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

export function normalizeAdminInvitationEmail(value: unknown): Readonly<{ normalized: string; display: string }> {
  if (typeof value !== 'string') throw new AdminInvitationInputError('email');
  const display = value.trim();
  const normalized = display.toLowerCase();
  if (display.length < 3 || display.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(display)) throw new AdminInvitationInputError('email');
  return Object.freeze({ normalized, display });
}

export function validateAdminInvitationGrant(value: AdminInvitationGrant): AdminInvitationGrant {
  if (!canonicalUuid.test(value?.roleId) || !Number.isSafeInteger(value.roleVersion) || value.roleVersion < 0 || (value.assignmentScope !== 'TENANT_WIDE' && value.assignmentScope !== 'BRANCH_RESTRICTED') || (value.assignmentScope === 'TENANT_WIDE' && value.branchId !== null) || (value.assignmentScope === 'BRANCH_RESTRICTED' && (typeof value.branchId !== 'string' || !canonicalUuid.test(value.branchId)))) throw new AdminInvitationInputError('grants');
  return Object.freeze({ ...value });
}

export function canonicalizeAdminInvitationGrants(values: readonly AdminInvitationGrant[]): readonly AdminInvitationGrant[] {
  if (!Array.isArray(values) || values.length === 0 || values.length > 32) throw new AdminInvitationInputError('grants');
  const grants = values.map(validateAdminInvitationGrant).sort((left, right) => `${left.roleId}:${left.assignmentScope}:${left.branchId ?? ''}`.localeCompare(`${right.roleId}:${right.assignmentScope}:${right.branchId ?? ''}`));
  if (new Set(grants.map((grant) => `${grant.roleId}:${grant.assignmentScope}:${grant.branchId ?? ''}`)).size !== grants.length) throw new AdminInvitationInputError('grants');
  return Object.freeze(grants);
}

export function digestAdminInvitationGrants(values: readonly AdminInvitationGrant[]): Uint8Array {
  return createHash('sha256').update(JSON.stringify(canonicalizeAdminInvitationGrants(values))).digest();
}

export function adminInvitationExpiresAt(createdAt: string): string {
  const instant = new Date(createdAt);
  if (!Number.isFinite(instant.getTime()) || instant.toISOString() !== createdAt) throw new AdminInvitationInputError('createdAt');
  return new Date(instant.getTime() + 24 * 60 * 60 * 1_000).toISOString();
}

export function invitationStatusAt(status: AdminInvitationStatus, expiresAt: string, now: string): AdminInvitationStatus {
  if (status !== 'PENDING') return status;
  return new Date(now).getTime() >= new Date(expiresAt).getTime() ? 'EXPIRED' : 'PENDING';
}
