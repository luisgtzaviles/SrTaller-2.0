import type { ProtectedRecord } from '../domain/protected-record.js';
import type { OperationalContext } from './operational-context.js';

export interface AuthenticatedIdentity {
  readonly credentialId: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly sessionId: string;
}

export interface OperationalContextAuthority {
  authenticate(credentialId: string | undefined): AuthenticatedIdentity;
  resolveContext(
    identity: AuthenticatedIdentity,
    stationId: string | undefined,
    serverCorrelationId: string,
  ): OperationalContext;
}

export interface ProtectedRecordRepository {
  findForUpdate(context: OperationalContext, recordId: string): Promise<ProtectedRecord | null>;
  save(context: OperationalContext, record: ProtectedRecord): Promise<void>;
}

export interface TransactionScope {
  readonly protectedRecords: ProtectedRecordRepository;
}

export interface UnitOfWork {
  execute<T>(
    context: OperationalContext,
    work: (scope: TransactionScope) => Promise<T>,
  ): Promise<T>;
}

export interface AuditEvent {
  readonly actorId: string;
  readonly tenantId: string;
  readonly branchId: string;
  readonly sessionId: string;
  readonly serverCorrelationId: string;
  readonly operation: 'synthetic.record.update';
  readonly resourceId: string;
  readonly control: 'application-policy';
  readonly result: 'SUCCEEDED' | 'DENIED' | 'FAILED';
}

export interface AuditPort {
  record(event: AuditEvent): Promise<void>;
}
