import { randomUUID } from 'node:crypto';

import type {
  CorrectedRepairEquipmentRecord,
  RepairEquipmentCorrectionContext,
  RepairRepositoryPort,
} from '../ports/repair-repository.port.js';
import {
  RepairEquipmentCorrectionAuthorizationChangedError,
  RepairEquipmentCorrectionBrandUnavailableError,
  RepairEquipmentCorrectionConcurrencyConflictError,
  RepairEquipmentCorrectionIdempotencyConflictError,
  RepairEquipmentCorrectionModelUnavailableError,
  RepairEquipmentCorrectionNotFoundError,
} from '../ports/repair-repository.port.js';
export { RepairEquipmentCorrectionNotFoundError } from '../ports/repair-repository.port.js';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const allowedKeys = Object.freeze(['clientRequestId', 'expectedVersion', 'deviceBrand', 'canonicalBrandId', 'deviceModel', 'canonicalModelId', 'reason']);

export class CorrectRepairEquipmentInputError extends Error {
  constructor(readonly parameter: string) { super('Repair equipment correction input is invalid.'); this.name = 'CorrectRepairEquipmentInputError'; }
}
export class CorrectRepairEquipmentConflictError extends Error { constructor(readonly kind: 'idempotency' | 'version') { super('Repair equipment correction conflicts with current state.'); this.name = 'CorrectRepairEquipmentConflictError'; } }
export class CorrectRepairEquipmentAuthorizationError extends Error { constructor() { super('Repair equipment correction authorization changed.'); this.name = 'CorrectRepairEquipmentAuthorizationError'; } }

function requiredText(value: unknown, parameter: string, minimum: number, maximum: number): string {
  if (typeof value !== 'string') throw new CorrectRepairEquipmentInputError(parameter);
  const normalized = value.trim().replace(/\s+/gu, ' ');
  if (normalized.length < minimum || normalized.length > maximum) throw new CorrectRepairEquipmentInputError(parameter);
  return normalized;
}
function optionalUuid(value: unknown, parameter: string): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string' || !uuid.test(value)) throw new CorrectRepairEquipmentInputError(parameter);
  return value;
}
function parseRequest(value: unknown) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new CorrectRepairEquipmentInputError('payload');
  const input = value as Readonly<Record<string, unknown>>;
  if (Object.keys(input).some((key) => !allowedKeys.includes(key))) throw new CorrectRepairEquipmentInputError('payload');
  if (typeof input.clientRequestId !== 'string' || !uuid.test(input.clientRequestId)) throw new CorrectRepairEquipmentInputError('clientRequestId');
  if (!Number.isInteger(input.expectedVersion) || Number(input.expectedVersion) < 0) throw new CorrectRepairEquipmentInputError('expectedVersion');
  const canonicalBrandId = optionalUuid(input.canonicalBrandId, 'canonicalBrandId');
  const canonicalModelId = optionalUuid(input.canonicalModelId, 'canonicalModelId');
  if (canonicalModelId && !canonicalBrandId) throw new CorrectRepairEquipmentInputError('canonicalModelId');
  return Object.freeze({
    clientRequestId: input.clientRequestId,
    expectedVersion: Number(input.expectedVersion),
    deviceBrand: requiredText(input.deviceBrand, 'deviceBrand', 1, 160),
    canonicalBrandId,
    deviceModel: requiredText(input.deviceModel, 'deviceModel', 1, 160),
    canonicalModelId,
    reason: requiredText(input.reason, 'reason', 3, 400),
  });
}
function trusted(value: RepairEquipmentCorrectionContext): RepairEquipmentCorrectionContext {
  if (!uuid.test(value.tenantId) || !uuid.test(value.branchId) || !uuid.test(value.stationId) || !uuid.test(value.sessionId) || !uuid.test(value.actorUserId) || value.capability !== 'repairs.correct_intake' || typeof value.actorDisplayName !== 'string' || value.actorDisplayName.trim().length < 1 || !value.commitGuard) throw new Error('Trusted equipment correction context is invalid.');
  return Object.freeze({ ...value, actorDisplayName: value.actorDisplayName.trim() });
}

export class CorrectRepairEquipmentUseCase {
  constructor(
    private readonly repository: RepairRepositoryPort,
    private readonly resolveContext: () => RepairEquipmentCorrectionContext,
    private readonly now: () => Date = () => new Date(),
    private readonly createId: () => string = randomUUID,
  ) {}

  async execute(input: Readonly<{ repairId: unknown; request: unknown }>): Promise<CorrectedRepairEquipmentRecord> {
    if (typeof input.repairId !== 'string' || !uuid.test(input.repairId)) throw new CorrectRepairEquipmentInputError('repairId');
    const request = parseRequest(input.request);
    const context = trusted(this.resolveContext());
    const ids = Array.from({ length: 6 }, () => this.createId());
    if (ids.some((id) => !uuid.test(id)) || new Set(ids).size !== ids.length) throw new Error('Server-generated equipment correction identifiers are invalid.');
    try {
      return await this.repository.correctRepairEquipment(context, {
        correctionId: ids[0]!, repairId: input.repairId, timelineEntryId: ids[1]!, auditEventId: ids[2]!, correlationId: ids[3]!,
        pendingBrandValueId: ids[4]!, pendingModelValueId: ids[5]!, clientRequestId: request.clientRequestId,
        expectedVersion: request.expectedVersion, deviceBrand: request.deviceBrand, canonicalBrandId: request.canonicalBrandId,
        deviceModel: request.deviceModel, canonicalModelId: request.canonicalModelId, reason: request.reason,
        action: 'repair.equipment.corrected', occurredAt: this.now(),
      });
    } catch (error: unknown) {
      if (error instanceof RepairEquipmentCorrectionNotFoundError) throw error;
      if (error instanceof RepairEquipmentCorrectionIdempotencyConflictError) throw new CorrectRepairEquipmentConflictError('idempotency');
      if (error instanceof RepairEquipmentCorrectionConcurrencyConflictError) throw new CorrectRepairEquipmentConflictError('version');
      if (error instanceof RepairEquipmentCorrectionAuthorizationChangedError) throw new CorrectRepairEquipmentAuthorizationError();
      if (error instanceof RepairEquipmentCorrectionBrandUnavailableError) throw new CorrectRepairEquipmentInputError('canonicalBrandId');
      if (error instanceof RepairEquipmentCorrectionModelUnavailableError) throw new CorrectRepairEquipmentInputError('canonicalModelId');
      throw error;
    }
  }
}
