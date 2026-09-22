export type AdminInvitationUserCommitRecord = Readonly<{
  userId: string;
  status: 'active';
  admissionRevision: number;
}>;

export interface AdminInvitationUserCommitRuntime {
  findActive(
    scope: Readonly<{ tenantId: string; userId: string }>,
    transactionContext: object,
  ): Promise<AdminInvitationUserCommitRecord | null>;
  create(
    scope: Readonly<{ tenantId: string }>,
    input: Readonly<{ userId: string; displayName: string; occurredAt: string }>,
    transactionContext: object,
  ): Promise<AdminInvitationUserCommitRecord>;
}
