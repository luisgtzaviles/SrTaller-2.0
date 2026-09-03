import { randomUUID } from 'node:crypto';

import type {
  RepairPersistenceScope,
  RepairRepositoryPort,
  StartRepairDiagnosisRecord,
} from '../ports/repair-repository.port.js';
import {
  RepairWorkflowConcurrencyConflictError,
  RepairWorkflowCustodyConflictError,
  RepairWorkflowIdempotencyConflictError,
  RepairWorkflowStateConflictError,
} from '../ports/repair-repository.port.js';

const canonicalUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const allowedKeys = Object.freeze(['clientRequestId', 'expectedVersion']);

export const localRepairWorkflowActor = Object.freeze({
  id: '00000000-0000-4000-8000-000000000301',
  displayName: 'Operador sintético',
});

export class StartRepairDiagnosisInputError extends Error {
  constructor(readonly parameter: 'repairId' | 'clientRequestId' | 'expectedVersion' | 'payload') {
    super('Invalid start diagnosis input.');
    this.name = 'StartRepairDiagnosisInputError';
  }
}

export class StartRepairDiagnosisNotFoundError extends Error {
  constructor() { super('Repair is not available in the requested context.'); this.name = 'StartRepairDiagnosisNotFoundError'; }
}

export class StartRepairDiagnosisConflictError extends Error {
  constructor(readonly kind: 'idempotency' | 'concurrency' | 'invalid-state' | 'custody-ended') {
    super('Start diagnosis command could not be applied.');
    this.name = 'StartRepairDiagnosisConflictError';
  }
}

function parseRepairId(value: unknown): string {
  if (typeof value !== 'string' || !canonicalUuid.test(value)) throw new StartRepairDiagnosisInputError('repairId');
  return value;
}

function parseRequest(value: unknown): Readonly<{ clientRequestId: string; expectedVersion: number }> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new StartRepairDiagnosisInputError('payload');
  const request = value as Readonly<Record<string, unknown>>;
  if (Object.keys(request).some((key) => !allowedKeys.includes(key))) throw new StartRepairDiagnosisInputError('payload');
  if (typeof request.clientRequestId !== 'string' || !canonicalUuid.test(request.clientRequestId)) throw new StartRepairDiagnosisInputError('clientRequestId');
  if (typeof request.expectedVersion !== 'number' || !Number.isSafeInteger(request.expectedVersion) || request.expectedVersion < 0) throw new StartRepairDiagnosisInputError('expectedVersion');
  return Object.freeze({ clientRequestId: request.clientRequestId, expectedVersion: request.expectedVersion });
}

export class StartRepairDiagnosisUseCase {
  constructor(
    private readonly repository: RepairRepositoryPort,
    private readonly resolveScope: () => RepairPersistenceScope,
    private readonly now: () => Date = () => new Date(),
    private readonly createId: () => string = randomUUID,
  ) {}

  async execute(input: Readonly<{ repairId: unknown; request: unknown }>): Promise<StartRepairDiagnosisRecord> {
    const request = parseRequest(input.request);
    let result;
    try {
      result = await this.repository.startRepairDiagnosis(this.resolveScope(), {
        repairId: parseRepairId(input.repairId),
        transitionId: this.createId(),
        timelineEntryId: this.createId(),
        clientRequestId: request.clientRequestId,
        actorId: localRepairWorkflowActor.id,
        actorDisplayName: localRepairWorkflowActor.displayName,
        occurredAt: this.now(),
        expectedVersion: request.expectedVersion,
        workflowVersion: request.expectedVersion + 1,
        fromState: 'pending',
        toState: 'diagnosing',
      });
    } catch (error: unknown) {
      if (error instanceof RepairWorkflowIdempotencyConflictError) throw new StartRepairDiagnosisConflictError('idempotency');
      if (error instanceof RepairWorkflowConcurrencyConflictError) throw new StartRepairDiagnosisConflictError('concurrency');
      if (error instanceof RepairWorkflowStateConflictError) throw new StartRepairDiagnosisConflictError('invalid-state');
      if (error instanceof RepairWorkflowCustodyConflictError) throw new StartRepairDiagnosisConflictError('custody-ended');
      throw error;
    }
    if (!result) throw new StartRepairDiagnosisNotFoundError();
    return result;
  }
}
