import { randomUUID } from 'node:crypto';

import type { MoveRepairToWorkshopRecord, RepairPersistenceScope, RepairRepositoryPort } from '../ports/repair-repository.port.js';
import {
  RepairLocationConcurrencyConflictError,
  RepairLocationConfigurationError,
  RepairLocationCustodyConflictError,
  RepairLocationIdempotencyConflictError,
  RepairLocationStateConflictError,
} from '../ports/repair-repository.port.js';

const canonicalUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const allowedKeys = Object.freeze(['clientRequestId', 'expectedVersion', 'reason']);

export const localRepairLocationActor = Object.freeze({
  id: '00000000-0000-4000-8000-000000000301',
  displayName: 'Operador sintético',
});

export class MoveRepairToWorkshopInputError extends Error {
  constructor(readonly parameter: 'repairId' | 'clientRequestId' | 'expectedVersion' | 'reason' | 'payload') {
    super('Invalid move to workshop input.');
    this.name = 'MoveRepairToWorkshopInputError';
  }
}
export class MoveRepairToWorkshopNotFoundError extends Error {
  constructor() { super('Repair is not available in the requested context.'); this.name = 'MoveRepairToWorkshopNotFoundError'; }
}
export class MoveRepairToWorkshopConflictError extends Error {
  constructor(readonly kind: 'idempotency' | 'concurrency' | 'invalid-location' | 'custody-ended' | 'workshop-unavailable') {
    super('Move to workshop command could not be applied.');
    this.name = 'MoveRepairToWorkshopConflictError';
  }
}

function parseRequest(value: unknown): Readonly<{ clientRequestId: string; expectedVersion: number; reason: string | null }> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new MoveRepairToWorkshopInputError('payload');
  const request = value as Readonly<Record<string, unknown>>;
  if (Object.keys(request).some((key) => !allowedKeys.includes(key))) throw new MoveRepairToWorkshopInputError('payload');
  if (typeof request.clientRequestId !== 'string' || !canonicalUuid.test(request.clientRequestId)) throw new MoveRepairToWorkshopInputError('clientRequestId');
  if (typeof request.expectedVersion !== 'number' || !Number.isSafeInteger(request.expectedVersion) || request.expectedVersion < 0) throw new MoveRepairToWorkshopInputError('expectedVersion');
  if (request.reason !== undefined && request.reason !== null && typeof request.reason !== 'string') throw new MoveRepairToWorkshopInputError('reason');
  const reason = typeof request.reason === 'string' ? request.reason.trim() || null : null;
  if (reason && reason.length > 1000) throw new MoveRepairToWorkshopInputError('reason');
  return Object.freeze({ clientRequestId: request.clientRequestId, expectedVersion: request.expectedVersion, reason });
}

export class MoveRepairToWorkshopUseCase {
  constructor(
    private readonly repository: RepairRepositoryPort,
    private readonly resolveScope: () => RepairPersistenceScope,
    private readonly now: () => Date = () => new Date(),
    private readonly createId: () => string = randomUUID,
  ) {}

  async execute(input: Readonly<{ repairId: unknown; request: unknown }>): Promise<MoveRepairToWorkshopRecord> {
    if (typeof input.repairId !== 'string' || !canonicalUuid.test(input.repairId)) throw new MoveRepairToWorkshopInputError('repairId');
    const request = parseRequest(input.request);
    let result;
    try {
      result = await this.repository.moveRepairToWorkshop(this.resolveScope(), {
        repairId: input.repairId,
        movementId: this.createId(),
        timelineEntryId: this.createId(),
        clientRequestId: request.clientRequestId,
        actorId: localRepairLocationActor.id,
        actorDisplayName: localRepairLocationActor.displayName,
        occurredAt: this.now(),
        expectedVersion: request.expectedVersion,
        locationVersion: request.expectedVersion + 1,
        reason: request.reason,
        fromLocation: { id: '', code: 'pending_area', label: 'Área de pendientes' },
        toLocation: { id: '', code: 'workshop', label: 'Taller' },
      });
    } catch (error: unknown) {
      if (error instanceof RepairLocationIdempotencyConflictError) throw new MoveRepairToWorkshopConflictError('idempotency');
      if (error instanceof RepairLocationConcurrencyConflictError) throw new MoveRepairToWorkshopConflictError('concurrency');
      if (error instanceof RepairLocationStateConflictError) throw new MoveRepairToWorkshopConflictError('invalid-location');
      if (error instanceof RepairLocationCustodyConflictError) throw new MoveRepairToWorkshopConflictError('custody-ended');
      if (error instanceof RepairLocationConfigurationError) throw new MoveRepairToWorkshopConflictError('workshop-unavailable');
      throw error;
    }
    if (!result) throw new MoveRepairToWorkshopNotFoundError();
    return result;
  }
}
