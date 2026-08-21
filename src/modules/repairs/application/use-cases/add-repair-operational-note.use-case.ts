import { randomUUID } from 'node:crypto';

import type {
  RepairPersistenceScope,
  RepairRepositoryPort,
  RepairTimelineItemRecord,
} from '../ports/repair-repository.port.js';

const canonicalUuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const allowedRequestKeys = Object.freeze(['body', 'clientRequestId']);

export const repairOperationalNoteBodyMinLength = 3;
export const repairOperationalNoteBodyMaxLength = 4000;
export const localOperationalNoteActor = Object.freeze({
  id: '00000000-0000-4000-8000-00000000d301',
  displayName: 'Operador sintético',
  source: 'local-development',
});

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

export interface AddRepairOperationalNoteInput {
  readonly repairId: unknown;
  readonly request: unknown;
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
    private readonly resolveScope: () => RepairPersistenceScope,
    private readonly now: () => Date = () => new Date(),
    private readonly createId: () => string = randomUUID,
  ) {}

  async execute(input: AddRepairOperationalNoteInput): Promise<RepairTimelineItemRecord> {
    if (typeof input.repairId !== 'string' || !canonicalUuid.test(input.repairId)) {
      throw new AddRepairOperationalNoteInputError('repairId');
    }
    const request = requestPayload(input.request);
    const occurredAt = this.now();
    const result = await this.repository.addOperationalNote(this.resolveScope(), {
      repairId: input.repairId,
      entryId: this.createId(),
      clientRequestId: request.clientRequestId,
      actorId: localOperationalNoteActor.id,
      actorDisplayName: localOperationalNoteActor.displayName,
      body: request.body,
      source: 'local.operational_note',
      occurredAt,
    });
    if (!result) throw new RepairOperationalNoteRepairNotFoundError();
    return result;
  }
}
