import type { TrustedStationContext } from '../../stations/index.js';
import { isTrustedStationContext } from '../../stations/index.js';
import { parsePin } from '../domain/pin-credential.js';
import { parseAccessUserId } from '../domain/role-assignment.js';
import type { AccessUserId } from '../domain/role-assignment.js';

const canonicalUuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

export type PinInputParameter =
  | 'clientRequestId'
  | 'context'
  | 'expectedVersion'
  | 'payload'
  | 'pin'
  | 'userId';

export class PinInputError extends Error {
  constructor(readonly parameter: PinInputParameter) {
    super('Invalid PIN credential input.');
    this.name = 'PinInputError';
  }
}

function exactObject(
  value: unknown,
  allowedKeys: readonly string[],
): Readonly<Record<string, unknown>> {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value) ||
    Object.keys(value).some((key) => !allowedKeys.includes(key))
  ) {
    throw new PinInputError('payload');
  }
  return value as Readonly<Record<string, unknown>>;
}

function userId(value: unknown): AccessUserId {
  try {
    return parseAccessUserId(value as string);
  } catch {
    throw new PinInputError('userId');
  }
}

function pin(value: unknown): string {
  try {
    return parsePin(value);
  } catch {
    throw new PinInputError('pin');
  }
}

function clientRequestId(value: unknown): string {
  if (typeof value !== 'string' || !canonicalUuid.test(value)) {
    throw new PinInputError('clientRequestId');
  }
  return value;
}

export function parseTrustedPinContext(value: unknown): TrustedStationContext {
  if (!isTrustedStationContext(value)) {
    throw new PinInputError('context');
  }
  return value;
}

export function parseAuthenticatePinInput(value: unknown): Readonly<{
  userId: AccessUserId;
  pin: string;
}> {
  const input = exactObject(value, ['pin', 'userId']);
  if (Object.keys(input).length !== 2) {
    throw new PinInputError('payload');
  }
  return Object.freeze({
    userId: userId(input.userId),
    pin: pin(input.pin),
  });
}

export function parseProvisionPinInput(value: unknown): Readonly<{
  userId: AccessUserId;
  pin: string;
  clientRequestId: string;
}> {
  const input = exactObject(value, ['clientRequestId', 'pin', 'userId']);
  if (Object.keys(input).length !== 3) {
    throw new PinInputError('payload');
  }
  return Object.freeze({
    userId: userId(input.userId),
    pin: pin(input.pin),
    clientRequestId: clientRequestId(input.clientRequestId),
  });
}
