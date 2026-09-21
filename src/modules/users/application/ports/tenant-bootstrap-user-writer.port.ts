export interface TenantBootstrapScope {
  readonly tenantId: string;
}

export interface TenantBootstrapUserWriterPort {
  createFirstUser(
    scope: TenantBootstrapScope,
    input: Readonly<{
      userId: string;
      displayName: string;
      occurredAt: string;
    }>,
    transactionContext: object,
  ): Promise<void>;
}
