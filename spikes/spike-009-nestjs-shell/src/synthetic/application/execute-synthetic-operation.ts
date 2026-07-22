import { DomainValidationError } from '../domain/errors.js';
import { RecordNotFoundError, SyntheticFailureError } from './errors.js';
import type { OperationalContext } from './operational-context.js';
import type { AuditPort, UnitOfWork } from './ports.js';
import { SyntheticAuthorizationPolicy } from './authorization-policy.js';

export interface ExecuteSyntheticCommand {
  readonly recordId: string;
  readonly nextValue: string;
  readonly simulateFailure?: boolean;
}

export interface ExecuteSyntheticResult {
  readonly recordId: string;
  readonly value: string;
  readonly version: number;
}

export class ExecuteSyntheticOperation {
  constructor(
    private readonly authorization: SyntheticAuthorizationPolicy,
    private readonly unitOfWork: UnitOfWork,
    private readonly audit: AuditPort,
  ) {}

  async execute(
    context: OperationalContext,
    command: ExecuteSyntheticCommand,
  ): Promise<ExecuteSyntheticResult> {
    try {
      this.authorization.assertCanWrite(context);
      const result = await this.unitOfWork.execute(context, async ({ protectedRecords }) => {
        const record = await protectedRecords.findForUpdate(context, command.recordId);
        if (!record) throw new RecordNotFoundError();
        record.update(command.nextValue);
        await protectedRecords.save(context, record);
        if (command.simulateFailure === true) throw new SyntheticFailureError();
        return { recordId: record.id, value: record.value, version: record.version };
      });
      await this.audit.record(this.auditEvent(context, command.recordId, 'SUCCEEDED'));
      return result;
    } catch (error) {
      await this.audit.record(
        this.auditEvent(
          context,
          command.recordId,
          error instanceof DomainValidationError || error instanceof RecordNotFoundError
            ? 'DENIED'
            : error instanceof SyntheticFailureError
              ? 'FAILED'
              : 'DENIED',
        ),
      );
      throw error;
    }
  }

  private auditEvent(
    context: OperationalContext,
    resourceId: string,
    result: 'SUCCEEDED' | 'DENIED' | 'FAILED',
  ) {
    return {
      actorId: context.userId,
      tenantId: context.tenantId,
      branchId: context.branchId,
      sessionId: context.sessionId,
      serverCorrelationId: context.serverCorrelationId,
      operation: 'synthetic.record.update' as const,
      resourceId,
      control: 'application-policy' as const,
      result,
    };
  }
}
