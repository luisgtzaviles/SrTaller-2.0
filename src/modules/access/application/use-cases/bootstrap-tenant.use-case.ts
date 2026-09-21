import { randomUUID, timingSafeEqual } from 'node:crypto';

import type { TenantBootstrapAccessWriterPort, TenantBootstrapTransactionPort } from '../ports/tenant-bootstrap-access-writer.port.js';
import { TenantBootstrapTransactionError } from '../ports/tenant-bootstrap-access-writer.port.js';
import type { VerifiedRegistrationBootstrapGrantSourcePort } from '../ports/verified-registration-bootstrap-grant.port.js';
import { STARTER_TENANT_ADMIN_POLICY } from '../../domain/tenant-admin-policy.js';
import {
  TenantBootstrapError,
  parseTenantBootstrapCommand,
  tenantBootstrapResultFromJournal,
  validateVerifiedRegistrationBootstrapGrant,
} from '../../domain/tenant-bootstrap.js';
import type {
  TenantBootstrapCommand,
  TenantBootstrapResult,
  VerifiedRegistrationBootstrapGrant,
} from '../../domain/tenant-bootstrap.js';

type BootstrapScope = Readonly<{ tenantId: string }>;
type BootstrapJournal = Readonly<{
  verifiedRegistrationId: string;
  registrationRevision: number;
  approvedInputDigest: Uint8Array;
  tenantId: string;
  firstUserId: string;
  adminIdentityId: string;
  starterRoleId: string;
  starterPolicyVersion: number;
  starterAssignmentId: string;
  resultTenantStatus: 'ONBOARDING';
  completedAt: string;
}>;

interface TenancyBootstrapWriter {
  lockAndFind(scope: BootstrapScope, registrationId: string, occurredAt: string, context: object): Promise<BootstrapJournal | null>;
  createTenant(scope: BootstrapScope, input: Readonly<{ displayName: string; occurredAt: string }>, context: object): Promise<void>;
  complete(scope: BootstrapScope, journal: BootstrapJournal, context: object): Promise<void>;
}

interface UserBootstrapWriter {
  createFirstUser(scope: BootstrapScope, input: Readonly<{ userId: string; displayName: string; occurredAt: string }>, context: object): Promise<void>;
}

export type BootstrapTenantFailureStage =
  | 'after-lock'
  | 'after-tenant'
  | 'after-user'
  | 'after-identity'
  | 'after-role'
  | 'after-capabilities'
  | 'after-assignment'
  | 'after-audit'
  | 'after-journal';

export interface BootstrapTenantFailureInjector {
  after(stage: BootstrapTenantFailureStage): Promise<void> | void;
}

const noFailure: BootstrapTenantFailureInjector = Object.freeze({ after: () => undefined });

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength &&
    timingSafeEqual(Buffer.from(left), Buffer.from(right));
}

function replayOrConflict(
  journal: BootstrapJournal,
  grant: VerifiedRegistrationBootstrapGrant,
): TenantBootstrapResult {
  if (
    journal.registrationRevision !== grant.registrationRevision ||
    !sameBytes(journal.approvedInputDigest, grant.approvedInputDigest) ||
    journal.tenantId !== grant.tenantId ||
    journal.firstUserId !== grant.firstUserId ||
    journal.adminIdentityId !== grant.adminIdentityId
  ) {
    throw new TenantBootstrapError('TENANT_BOOTSTRAP_IDEMPOTENCY_CONFLICT');
  }
  return tenantBootstrapResultFromJournal(journal);
}

export class BootstrapTenantUseCase {
  constructor(
    private readonly grants: VerifiedRegistrationBootstrapGrantSourcePort,
    private readonly transactions: TenantBootstrapTransactionPort,
    private readonly tenancy: TenancyBootstrapWriter,
    private readonly users: UserBootstrapWriter,
    private readonly access: TenantBootstrapAccessWriterPort,
    private readonly now: () => Date = () => new Date(),
    private readonly createId: () => string = randomUUID,
    private readonly failures: BootstrapTenantFailureInjector = noFailure,
  ) {}

  async execute(value: unknown): Promise<TenantBootstrapResult> {
    const command: TenantBootstrapCommand = parseTenantBootstrapCommand(value);
    const loaded = await this.grants.loadVerifiedGrant(command.verifiedRegistrationId);
    if (!loaded) {
      throw new TenantBootstrapError('TENANT_BOOTSTRAP_GRANT_NOT_VERIFIED');
    }
    const grant = validateVerifiedRegistrationBootstrapGrant(
      loaded,
      command.verifiedRegistrationId,
    );
    const occurredAt = this.now().toISOString();
    const starterRoleId = this.createId();
    const starterAssignmentId = this.createId();
    const eventId = this.createId();
    const scope = Object.freeze({ tenantId: grant.tenantId });

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        return await this.transactions.execute(async (context) => {
          const existing = await this.tenancy.lockAndFind(
            scope,
            grant.verifiedRegistrationId,
            occurredAt,
            context,
          );
          await this.failures.after('after-lock');
          if (existing) return replayOrConflict(existing, grant);

          await this.tenancy.createTenant(scope, {
            displayName: grant.workshopDisplayName,
            occurredAt,
          }, context);
          await this.failures.after('after-tenant');
          await this.users.createFirstUser(scope, {
            userId: grant.firstUserId,
            displayName: grant.personDisplayName,
            occurredAt,
          }, context);
          await this.failures.after('after-user');
          await this.access.createVerifiedAdminIdentity(scope, {
            userId: grant.firstUserId,
            adminIdentityId: grant.adminIdentityId,
            normalizedEmail: grant.normalizedEmail,
            emailDisplay: grant.emailDisplay,
            verifiedAt: grant.verifiedAt,
            passwordVerifier: grant.passwordVerifier,
          }, context);
          await this.failures.after('after-identity');
          await this.access.createStarterRole(scope, {
            starterRoleId,
            occurredAt,
          }, context);
          await this.failures.after('after-role');
          await this.access.grantStarterCapabilities(scope, {
            starterRoleId,
            occurredAt,
          }, context);
          await this.failures.after('after-capabilities');
          await this.access.assignStarterRole(scope, {
            userId: grant.firstUserId,
            starterRoleId,
            starterAssignmentId,
            occurredAt,
          }, context);
          await this.failures.after('after-assignment');
          await this.access.recordCompletedEvent(scope, {
            userId: grant.firstUserId,
            adminIdentityId: grant.adminIdentityId,
            eventId,
            correlationId: command.correlationId,
            occurredAt,
          }, context);
          await this.failures.after('after-audit');

          const journal: BootstrapJournal = Object.freeze({
            verifiedRegistrationId: grant.verifiedRegistrationId,
            registrationRevision: grant.registrationRevision,
            approvedInputDigest: grant.approvedInputDigest,
            tenantId: grant.tenantId,
            firstUserId: grant.firstUserId,
            adminIdentityId: grant.adminIdentityId,
            starterRoleId,
            starterPolicyVersion: STARTER_TENANT_ADMIN_POLICY.policyVersion,
            starterAssignmentId,
            resultTenantStatus: 'ONBOARDING',
            completedAt: occurredAt,
          });
          await this.tenancy.complete(scope, journal, context);
          await this.failures.after('after-journal');
          return tenantBootstrapResultFromJournal(journal);
        });
      } catch (error) {
        if (error instanceof TenantBootstrapError) throw error;
        if (error instanceof TenantBootstrapTransactionError) {
          if (error.retryable && attempt < 3) continue;
          throw new TenantBootstrapError(
            error.retryable
              ? 'TENANT_BOOTSTRAP_CONCURRENCY_EXHAUSTED'
              : 'TENANT_BOOTSTRAP_PERSISTENCE_FAILED',
            error.retryable ? 'conditional' : 'never',
          );
        }
        throw error;
      }
    }
    throw new TenantBootstrapError(
      'TENANT_BOOTSTRAP_CONCURRENCY_EXHAUSTED',
      'conditional',
    );
  }
}
