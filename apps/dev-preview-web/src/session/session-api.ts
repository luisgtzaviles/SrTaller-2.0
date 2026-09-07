import {
  runCoordinatedSessionMutation,
  runCoordinatedSessionRead,
} from './session-request-coordinator.mjs';

export interface OperationalSessionStation {
  readonly stationId: string;
  readonly branchId: string;
}

export interface OperationalSessionUser {
  readonly userId: string;
  readonly displayName: string;
}

export interface ActiveOperationalSession {
  readonly sessionId: string;
  readonly tenantId: string;
  readonly branchId: string;
  readonly stationId: string;
  readonly userId: string;
  readonly displayName: string;
  readonly issuedAt: string;
  readonly lastActivityAt: string;
  readonly expiresAt: string;
  readonly status: 'active';
}

export interface OperationalSessionSnapshot {
  readonly station: OperationalSessionStation;
  readonly users: readonly OperationalSessionUser[];
  readonly csrfToken: string;
  readonly session: ActiveOperationalSession | null;
  readonly revalidateAfterMs: number | null;
}

export class OperationalSessionApiError extends Error {
  constructor(readonly status: number) {
    super('No fue posible verificar la sesión operativa.');
    this.name = 'OperationalSessionApiError';
  }
}

export class OperationalSessionStateChangedError extends OperationalSessionApiError {
  constructor(readonly snapshot: OperationalSessionSnapshot) {
    super(409);
    this.name = 'OperationalSessionStateChangedError';
  }
}

const SESSION_PATH = '/api/access/session';
const LOCAL_STATION_BOOTSTRAP_PATH = '/api/stations/local-bootstrap';
const CSRF_HEADER = 'X-SR-CSRF-Token';
const CSRF_PATTERN = /^[A-Za-z0-9_-]{43}$/u;

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredString(record: Readonly<Record<string, unknown>>, key: string): string {
  const value = record[key];
  if (typeof value !== 'string' || value.trim() === '') throw new OperationalSessionApiError(0);
  return value;
}

function requiredDate(record: Readonly<Record<string, unknown>>, key: string): string {
  const value = requiredString(record, key);
  if (Number.isNaN(Date.parse(value))) throw new OperationalSessionApiError(0);
  return value;
}

function parseStation(value: unknown): OperationalSessionStation {
  if (!isRecord(value)) throw new OperationalSessionApiError(0);
  return Object.freeze({
    stationId: requiredString(value, 'stationId'),
    branchId: requiredString(value, 'branchId'),
  });
}

function parseUsers(value: unknown): readonly OperationalSessionUser[] {
  if (!Array.isArray(value)) throw new OperationalSessionApiError(0);
  const seen = new Set<string>();
  const users = value.map((entry) => {
    if (!isRecord(entry)) throw new OperationalSessionApiError(0);
    const user = Object.freeze({
      userId: requiredString(entry, 'userId'),
      displayName: requiredString(entry, 'displayName'),
    });
    if (seen.has(user.userId)) throw new OperationalSessionApiError(0);
    seen.add(user.userId);
    return user;
  });
  return Object.freeze(users);
}

function parseActiveSession(
  value: unknown,
  station: OperationalSessionStation,
  users: readonly OperationalSessionUser[],
): ActiveOperationalSession | null {
  if (value === null) return null;
  if (!isRecord(value) || value.status !== 'active') throw new OperationalSessionApiError(0);
  const session = Object.freeze({
    sessionId: requiredString(value, 'sessionId'),
    tenantId: requiredString(value, 'tenantId'),
    branchId: requiredString(value, 'branchId'),
    stationId: requiredString(value, 'stationId'),
    userId: requiredString(value, 'userId'),
    displayName: requiredString(value, 'displayName'),
    issuedAt: requiredDate(value, 'issuedAt'),
    lastActivityAt: requiredDate(value, 'lastActivityAt'),
    expiresAt: requiredDate(value, 'expiresAt'),
    status: 'active' as const,
  });
  const user = users.find((candidate) => candidate.userId === session.userId);
  if (
    session.stationId !== station.stationId ||
    session.branchId !== station.branchId ||
    !user ||
    user.displayName !== session.displayName
  ) throw new OperationalSessionApiError(0);
  return session;
}

function parseSnapshot(value: unknown): OperationalSessionSnapshot {
  if (!isRecord(value)) throw new OperationalSessionApiError(0);
  const station = parseStation(value.station);
  const users = parseUsers(value.users);
  const csrfToken = requiredString(value, 'csrfToken');
  if (!CSRF_PATTERN.test(csrfToken)) throw new OperationalSessionApiError(0);
  const session = parseActiveSession(value.session, station, users);
  const revalidateAfterMs = value.revalidateAfterMs;
  if (session === null) {
    if (revalidateAfterMs !== null) throw new OperationalSessionApiError(0);
  } else if (
    typeof revalidateAfterMs !== 'number' ||
    !Number.isSafeInteger(revalidateAfterMs) ||
    revalidateAfterMs < 1_000 ||
    revalidateAfterMs > 60 * 60 * 1_000
  ) {
    throw new OperationalSessionApiError(0);
  }
  return Object.freeze({
    station,
    users,
    csrfToken,
    session,
    revalidateAfterMs,
  });
}

async function readSnapshot(response: Response): Promise<OperationalSessionSnapshot> {
  if (!response.ok) throw new OperationalSessionApiError(response.status);
  try {
    return parseSnapshot(await response.json());
  } catch (error) {
    if (error instanceof OperationalSessionApiError) throw error;
    throw new OperationalSessionApiError(0);
  }
}

async function requestSnapshot(signal?: AbortSignal): Promise<OperationalSessionSnapshot> {
  const response = await fetch(SESSION_PATH, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    headers: { Accept: 'application/json' },
    signal: signal ?? null,
  });
  return readSnapshot(response);
}

function sessionId(snapshot: OperationalSessionSnapshot): string | null {
  return snapshot.session?.sessionId ?? null;
}

export async function getOperationalSession(signal?: AbortSignal): Promise<OperationalSessionSnapshot> {
  return runCoordinatedSessionRead(
    (exchangeSignal) => requestSnapshot(exchangeSignal),
    signal,
  );
}

export async function bootstrapLocalStation(): Promise<void> {
  return runCoordinatedSessionMutation(async (markMayHaveChanged, signal) => {
    markMayHaveChanged();
    const response = await fetch(LOCAL_STATION_BOOTSTRAP_PATH, {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal,
    });
    if (response.status !== 204) throw new OperationalSessionApiError(response.status);
  });
}

export async function startOrSwitchOperationalSession(
  request: Readonly<{ userId: string; pin: string }>,
  expectedSessionId: string | null,
): Promise<OperationalSessionSnapshot> {
  return runCoordinatedSessionMutation(async (markMayHaveChanged, signal) => {
    const before = await requestSnapshot(signal);
    if (sessionId(before) !== expectedSessionId) {
      throw new OperationalSessionStateChangedError(before);
    }
    markMayHaveChanged();
    const response = await fetch(SESSION_PATH, {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        [CSRF_HEADER]: before.csrfToken,
      },
      body: JSON.stringify({
        userId: request.userId,
        pin: request.pin,
        expectedSessionId,
      }),
      signal,
    });
    const created = await readSnapshot(response);
    if (!created.session) throw new OperationalSessionApiError(0);
    const confirmed = await requestSnapshot(signal);
    if (sessionId(confirmed) !== created.session.sessionId) {
      throw new OperationalSessionStateChangedError(confirmed);
    }
    return confirmed;
  });
}

export async function logoutOperationalSession(
  expectedSessionId: string,
): Promise<OperationalSessionSnapshot> {
  return runCoordinatedSessionMutation(async (markMayHaveChanged, signal) => {
    const before = await requestSnapshot(signal);
    if (sessionId(before) !== expectedSessionId) {
      throw new OperationalSessionStateChangedError(before);
    }
    markMayHaveChanged();
    const response = await fetch(SESSION_PATH, {
      method: 'DELETE',
      credentials: 'include',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        [CSRF_HEADER]: before.csrfToken,
      },
      signal,
    });
    if (response.status !== 204) throw new OperationalSessionApiError(response.status);
    const confirmed = await requestSnapshot(signal);
    if (sessionId(confirmed) === expectedSessionId) {
      throw new OperationalSessionApiError(0);
    }
    return confirmed;
  });
}
