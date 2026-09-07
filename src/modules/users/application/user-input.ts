import { parseTenantId } from '../../tenancy/index.js';
import type { TenantId } from '../../tenancy/index.js';
import { parseUserId, parseUserStatus } from '../domain/user.js';
import type { UserId, UserStatus } from '../domain/user.js';

const canonicalUuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

export class UserInputError extends Error {
  constructor(
    readonly parameter:
      | 'clientRequestId'
      | 'displayName'
      | 'expectedVersion'
      | 'operationalIdentifier'
      | 'payload'
      | 'status'
      | 'tenantId'
      | 'userId',
  ) {
    super('Invalid User Directory input.');
    this.name = 'UserInputError';
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
    throw new UserInputError('payload');
  }
  return value as Readonly<Record<string, unknown>>;
}

export function parseUserScope(value: unknown): Readonly<{ tenantId: TenantId }> {
  const input = exactObject(value, ['tenantId']);
  if (Object.keys(input).length !== 1) {
    throw new UserInputError('tenantId');
  }
  try {
    return Object.freeze({ tenantId: parseTenantId(input.tenantId) });
  } catch {
    throw new UserInputError('tenantId');
  }
}

export function parseUserLookup(value: unknown): UserId {
  try {
    return parseUserId(value as string);
  } catch {
    throw new UserInputError('userId');
  }
}

export function parseProvisionFirstUserInput(value: unknown): Readonly<{
  displayName: string;
  operationalIdentifier: string | null;
  clientRequestId: string;
}> {
  const input = exactObject(value, [
    'clientRequestId',
    'displayName',
    'operationalIdentifier',
  ]);
  if (Object.keys(input).length !== 3) {
    throw new UserInputError('payload');
  }
  if (typeof input.displayName !== 'string') {
    throw new UserInputError('displayName');
  }
  const displayName = input.displayName.trim();
  if (displayName.length < 1 || displayName.length > 160) {
    throw new UserInputError('displayName');
  }
  let operationalIdentifier: string | null = null;
  if (input.operationalIdentifier !== null) {
    if (typeof input.operationalIdentifier !== 'string') {
      throw new UserInputError('operationalIdentifier');
    }
    operationalIdentifier = input.operationalIdentifier.trim();
    if (
      operationalIdentifier.length < 1 ||
      operationalIdentifier.length > 160
    ) {
      throw new UserInputError('operationalIdentifier');
    }
  }
  if (
    typeof input.clientRequestId !== 'string' ||
    !canonicalUuid.test(input.clientRequestId)
  ) {
    throw new UserInputError('clientRequestId');
  }
  return Object.freeze({
    displayName,
    operationalIdentifier,
    clientRequestId: input.clientRequestId,
  });
}

export const parseCreateUserInput = parseProvisionFirstUserInput;

export function parseTransitionUserInput(value: unknown): Readonly<{
  userId: UserId;
  status: UserStatus;
  expectedVersion: number;
  clientRequestId: string;
}> {
  const input = exactObject(value, [
    'clientRequestId',
    'expectedVersion',
    'status',
    'userId',
  ]);
  if (Object.keys(input).length !== 4) {
    throw new UserInputError('payload');
  }
  let userId: UserId;
  let status: UserStatus;
  try {
    userId = parseUserId(input.userId as string);
  } catch {
    throw new UserInputError('userId');
  }
  try {
    status = parseUserStatus(input.status as string);
  } catch {
    throw new UserInputError('status');
  }
  if (
    !Number.isSafeInteger(input.expectedVersion) ||
    (input.expectedVersion as number) < 0
  ) {
    throw new UserInputError('expectedVersion');
  }
  if (
    typeof input.clientRequestId !== 'string' ||
    !canonicalUuid.test(input.clientRequestId)
  ) {
    throw new UserInputError('clientRequestId');
  }
  return Object.freeze({
    userId,
    status,
    expectedVersion: input.expectedVersion as number,
    clientRequestId: input.clientRequestId,
  });
}

export function parseUpdateUserInput(value: unknown): Readonly<{
  displayName: string;
  operationalIdentifier: string | null;
  expectedVersion: number;
}> {
  const input = exactObject(value, ['displayName', 'expectedVersion', 'operationalIdentifier']);
  if (
    Object.keys(input).length !== 3 ||
    typeof input.displayName !== 'string' ||
    !Number.isSafeInteger(input.expectedVersion) ||
    (input.expectedVersion as number) < 0
  ) throw new UserInputError('payload');
  const displayName = input.displayName.trim();
  if (displayName.length < 1 || displayName.length > 160) throw new UserInputError('displayName');
  let operationalIdentifier: string | null = null;
  if (input.operationalIdentifier !== null) {
    if (typeof input.operationalIdentifier !== 'string') throw new UserInputError('operationalIdentifier');
    operationalIdentifier = input.operationalIdentifier.trim();
    if (operationalIdentifier.length < 1 || operationalIdentifier.length > 160) {
      throw new UserInputError('operationalIdentifier');
    }
  }
  return Object.freeze({ displayName, operationalIdentifier, expectedVersion: input.expectedVersion as number });
}
