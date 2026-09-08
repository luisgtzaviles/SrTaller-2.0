import { randomUUID } from 'node:crypto';

import type {
  RepairOperationalNoteContext,
  RepairRepositoryPort,
  RepairTimelineItemRecord,
} from '../ports/repair-repository.port.js';
import { RepairOperationalNoteAuthorizationChangedError, RepairOperationalNoteIdempotencyConflictError } from '../ports/repair-repository.port.js';

const canonicalUuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const allowedRequestKeys = Object.freeze(['body', 'clientRequestId']);

export const repairOperationalNoteBodyMinLength = 3;
export const repairOperationalNoteBodyMaxLength = 4000;

export class AddRepairOperationalNoteInputError extends Error {
  constructor(readonly parameter: 'body' | 'clientRequestId' | 'payload' | 'repairId') {
    super('Invalid operational note input.');
    this.name = 'AddRepairOperationalNoteInputError';
  }
}

export class RepairOperationalNoteRepairNotFoundError extends Error {
  constructor() {
    super('Repair is not available in the requested context.');
    this.name = 'RepairOperationalNoteRepairNotFoundError';
  }
}

export class AddRepairOperationalNoteConflictError extends Error {
  constructor() {
    super('Operational note request conflicts with a previous request.');
    this.name = 'AddRepairOperationalNoteConflictError';
  }
}

export class AddRepairOperationalNoteAuthorizationError extends Error {
  constructor() {
    super('Operational note authorization changed before confirmation.');
    this.name = 'AddRepairOperationalNoteAuthorizationError';
  }
}

export interface AddRepairOperationalNoteInput {
  readonly repairId: unknown;
  readonly request: unknown;
}

function trustedContext(
  value: RepairOperationalNoteContext,
): Readonly<RepairOperationalNoteContext> {
  if (
    !canonicalUuid.test(value.tenantId) ||
    !canonicalUuid.test(value.branchId) ||
    !canonicalUuid.test(value.stationId) ||
    !canonicalUuid.test(value.sessionId) ||
    !canonicalUuid.test(value.actorUserId) ||
    value.capability !== 'repairs.add_note' ||
    typeof value.actorDisplayName !== 'string' ||
    value.actorDisplayName.trim().length < 1 ||
    value.actorDisplayName.trim().length > 160 ||
    typeof value.commitGuard !== 'object' ||
    value.commitGuard === null ||
    typeof value.commitGuard.confirmCurrent !== 'function' ||
    typeof value.commitGuard.confirmTemporalCurrent !== 'function'
  ) {
    throw new Error('Trusted operational note context is invalid.');
  }
  return Object.freeze({
    ...value,
    actorDisplayName: value.actorDisplayName.trim(),
  });
}

function requestPayload(value: unknown): Readonly<{ body: string; clientRequestId: string }> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new AddRepairOperationalNoteInputError('payload');
  }
  const request = value as Readonly<Record<string, unknown>>;
  if (Object.keys(request).some((key) => !allowedRequestKeys.includes(key))) {
    throw new AddRepairOperationalNoteInputError('payload');
  }
  if (typeof request.body !== 'string') {
    throw new AddRepairOperationalNoteInputError('body');
  }
  const body = request.body.trim();
  if (
    body.length < repairOperationalNoteBodyMinLength ||
    body.length > repairOperationalNoteBodyMaxLength
  ) {
    throw new AddRepairOperationalNoteInputError('body');
  }
  if (
    typeof request.clientRequestId !== 'string' ||
    !canonicalUuid.test(request.clientRequestId)
  ) {
    throw new AddRepairOperationalNoteInputError('clientRequestId');
  }
  return Object.freeze({ body, clientRequestId: request.clientRequestId });
}

export class AddRepairOperationalNoteUseCase {
  constructor(
    private readonly repository: RepairRepositoryPort,
    private readonly resolveContext: () => RepairOperationalNoteContext,
    private readonly now: () => Date = () => new Date(),
    private readonly createId: () => string = randomUUID,
  ) {}

  async execute(input: AddRepairOperationalNoteInput): Promise<RepairTimelineItemRecord> {
    if (typeof input.repairId !== 'string' || !canonicalUuid.test(input.repairId)) {
      throw new AddRepairOperationalNoteInputError('repairId');
    }
    const request = requestPayload(input.request);
    const context = trustedContext(this.resolveContext());
    const occurredAt = this.now();
    const entryId = this.createId();
    const auditEventId = this.createId();
    const correlationId = this.createId();
    if (
      !canonicalUuid.test(entryId) ||
      !canonicalUuid.test(auditEventId) ||
      !canonicalUuid.test(correlationId) ||
      new Set([entryId, auditEventId, correlationId]).size !== 3
    ) {
      throw new Error('Server-generated operational note identifiers are invalid.');
    }
    let result;
    try {
      result = await this.repository.addOperationalNote(context, {
        repairId: input.repairId,
        entryId,
        auditEventId,
        correlationId,
        clientRequestId: request.clientRequestId,
        body: request.body,
        action: 'repair.operational_note.added',
        resourceType: 'repair',
        result: 'succeeded',
        occurredAt,
      });
    } catch (error: unknown) {
      if (error instanceof RepairOperationalNoteIdempotencyConflictError) {
        throw new AddRepairOperationalNoteConflictError();
      }
      if (error instanceof RepairOperationalNoteAuthorizationChangedError) {
        throw new AddRepairOperationalNoteAuthorizationError();
      }
      throw error;
    }
    if (!result) throw new RepairOperationalNoteRepairNotFoundError();
    return result;
  }
}
