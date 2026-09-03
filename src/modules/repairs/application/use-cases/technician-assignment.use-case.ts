import { randomUUID } from 'node:crypto';

import type {
  AssignRepairTechnicianRecord,
  RepairPersistenceScope,
  RepairRepositoryPort,
  ReassignRepairTechnicianRecord,
  UnassignRepairTechnicianRecord,
} from '../ports/repair-repository.port.js';
import {
  RepairTechnicianConcurrencyConflictError,
  RepairTechnicianIdempotencyConflictError,
  RepairTechnicianStateConflictError,
  RepairTechnicianEligibilityError,
} from '../ports/repair-repository.port.js';

const canonicalUuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const allowedAssignKeys = Object.freeze(['technicianId', 'clientRequestId', 'expectedVersion']);
const allowedChangeKeys = Object.freeze(['technicianId', 'reason', 'clientRequestId', 'expectedVersion']);
const maxReasonLength = 1000;

export const localTechnicianAssignmentActor = Object.freeze({
  id: '00000000-0000-4000-8000-000000000301',
  displayName: 'Operador sintético',
});

export class TechnicianAssignmentInputError extends Error {
  constructor(readonly parameter: 'repairId' | 'technicianId' | 'clientRequestId' | 'expectedVersion' | 'reason' | 'payload') {
    super('Invalid technician assignment input.');
    this.name = 'TechnicianAssignmentInputError';
  }
}
export class TechnicianAssignmentRepairNotFoundError extends Error {
  constructor() { super('Repair is not available in the requested context.'); this.name = 'TechnicianAssignmentRepairNotFoundError'; }
}
export class TechnicianAssignmentNotFoundError extends Error {
  constructor() { super('No active technician assignment exists.'); this.name = 'TechnicianAssignmentNotFoundError'; }
}
export class TechnicianAssignmentConflictError extends Error {
  constructor(readonly kind: 'idempotency' | 'concurrency' | 'invalid-state' | 'ineligible') {
    super('Technician assignment command could not be applied.');
    this.name = 'TechnicianAssignmentConflictError';
  }
}

type AssignmentRequest = Readonly<{
  technicianId: string | undefined;
  reason: string | null;
  clientRequestId: string;
  expectedVersion: number;
}>;

function objectPayload(input: unknown, keys: readonly string[]): Readonly<Record<string, unknown>> {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) throw new TechnicianAssignmentInputError('payload');
  const payload = input as Readonly<Record<string, unknown>>;
  if (Object.keys(payload).some((key) => !keys.includes(key))) throw new TechnicianAssignmentInputError('payload');
  return payload;
}

function requestPayload(input: unknown, mode: 'assign' | 'change'): AssignmentRequest {
  const payload = objectPayload(input, mode === 'assign' ? allowedAssignKeys : allowedChangeKeys);
  if (mode === 'assign' && (typeof payload.technicianId !== 'string' || !canonicalUuid.test(payload.technicianId))) throw new TechnicianAssignmentInputError('technicianId');
  if (mode === 'change' && payload.technicianId !== undefined && (typeof payload.technicianId !== 'string' || !canonicalUuid.test(payload.technicianId))) throw new TechnicianAssignmentInputError('technicianId');
  if (typeof payload.clientRequestId !== 'string' || !canonicalUuid.test(payload.clientRequestId)) throw new TechnicianAssignmentInputError('clientRequestId');
  if (typeof payload.expectedVersion !== 'number' || !Number.isSafeInteger(payload.expectedVersion) || payload.expectedVersion < 0) throw new TechnicianAssignmentInputError('expectedVersion');
  let reason: string | null = null;
  if (payload.reason !== undefined && payload.reason !== null) {
    if (typeof payload.reason !== 'string' || payload.reason.trim().length > maxReasonLength) throw new TechnicianAssignmentInputError('reason');
    reason = payload.reason.trim() || null;
  }
  return Object.freeze({ technicianId: payload.technicianId as string | undefined, reason, clientRequestId: payload.clientRequestId, expectedVersion: payload.expectedVersion });
}

function repairId(input: unknown): string {
  if (typeof input !== 'string' || !canonicalUuid.test(input)) throw new TechnicianAssignmentInputError('repairId');
  return input;
}

export class AssignRepairTechnicianUseCase {
  constructor(private readonly repository: RepairRepositoryPort, private readonly resolveScope: () => RepairPersistenceScope, private readonly now: () => Date = () => new Date(), private readonly createId: () => string = randomUUID) {}
  async execute(input: Readonly<{ repairId: unknown; request: unknown }>): Promise<AssignRepairTechnicianRecord> {
    const request = requestPayload(input.request, 'assign');
    let result;
    try {
      result = await this.repository.assignRepairTechnician(this.resolveScope(), { repairId: repairId(input.repairId), assignmentId: this.createId(), technicianId: request.technicianId!, technicianDisplayName: '', clientRequestId: request.clientRequestId, actorId: localTechnicianAssignmentActor.id, actorDisplayName: localTechnicianAssignmentActor.displayName, occurredAt: this.now(), version: request.expectedVersion });
    } catch (error: unknown) {
      if (error instanceof RepairTechnicianIdempotencyConflictError) throw new TechnicianAssignmentConflictError('idempotency');
      if (error instanceof RepairTechnicianConcurrencyConflictError) throw new TechnicianAssignmentConflictError('concurrency');
      if (error instanceof RepairTechnicianStateConflictError) throw new TechnicianAssignmentConflictError('invalid-state');
      if (error instanceof RepairTechnicianEligibilityError) throw new TechnicianAssignmentConflictError('ineligible');
      throw error;
    }
    if (!result) throw new TechnicianAssignmentRepairNotFoundError();
    return result;
  }
}

export class ReassignRepairTechnicianUseCase {
  constructor(private readonly repository: RepairRepositoryPort, private readonly resolveScope: () => RepairPersistenceScope, private readonly now: () => Date = () => new Date(), private readonly createId: () => string = randomUUID) {}
  async execute(input: Readonly<{ repairId: unknown; request: unknown }>): Promise<ReassignRepairTechnicianRecord> {
    const request = requestPayload(input.request, 'change');
    if (!request.technicianId) throw new TechnicianAssignmentInputError('technicianId');
    let result;
    try {
      result = await this.repository.reassignRepairTechnician(this.resolveScope(), { repairId: repairId(input.repairId), assignmentId: this.createId(), technicianId: request.technicianId, technicianDisplayName: '', previousTechnicianId: '', previousTechnicianDisplayName: '', clientRequestId: request.clientRequestId, actorId: localTechnicianAssignmentActor.id, actorDisplayName: localTechnicianAssignmentActor.displayName, occurredAt: this.now(), version: request.expectedVersion, reason: request.reason });
    } catch (error: unknown) {
      if (error instanceof RepairTechnicianIdempotencyConflictError) throw new TechnicianAssignmentConflictError('idempotency');
      if (error instanceof RepairTechnicianConcurrencyConflictError) throw new TechnicianAssignmentConflictError('concurrency');
      if (error instanceof RepairTechnicianStateConflictError) throw new TechnicianAssignmentConflictError('invalid-state');
      if (error instanceof RepairTechnicianEligibilityError) throw new TechnicianAssignmentConflictError('ineligible');
      throw error;
    }
    if (!result) throw new TechnicianAssignmentRepairNotFoundError();
    return result;
  }
}

export class UnassignRepairTechnicianUseCase {
  constructor(private readonly repository: RepairRepositoryPort, private readonly resolveScope: () => RepairPersistenceScope, private readonly now: () => Date = () => new Date()) {}
  async execute(input: Readonly<{ repairId: unknown; request: unknown }>): Promise<UnassignRepairTechnicianRecord> {
    const request = requestPayload(input.request, 'change');
    let result;
    try {
      result = await this.repository.unassignRepairTechnician(this.resolveScope(), { repairId: repairId(input.repairId), assignmentId: '', previousTechnicianId: '', previousTechnicianDisplayName: '', clientRequestId: request.clientRequestId, actorId: localTechnicianAssignmentActor.id, actorDisplayName: localTechnicianAssignmentActor.displayName, occurredAt: this.now(), version: request.expectedVersion, reason: request.reason });
    } catch (error: unknown) {
      if (error instanceof RepairTechnicianIdempotencyConflictError) throw new TechnicianAssignmentConflictError('idempotency');
      if (error instanceof RepairTechnicianConcurrencyConflictError) throw new TechnicianAssignmentConflictError('concurrency');
      if (error instanceof RepairTechnicianStateConflictError) throw new TechnicianAssignmentConflictError('invalid-state');
      throw error;
    }
    if (!result) throw new TechnicianAssignmentRepairNotFoundError();
    return result;
  }
}
