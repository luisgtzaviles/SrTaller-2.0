import { PreviewApiError } from './api.js';

export type NewRepairFormMode = 'classic' | 'guided_v2';

export type UserPreferences = Readonly<{
  newRepairFormMode: NewRepairFormMode;
}>;

const PATH = '/api/users/me/preferences';
const SESSION_INVALIDATED_EVENT = 'srtaller:session-invalidated';

function parse(value: unknown): UserPreferences {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value) ||
    Object.keys(value).length !== 1 ||
    !('newRepairFormMode' in value) ||
    (value.newRepairFormMode !== 'classic' && value.newRepairFormMode !== 'guided_v2')
  ) throw new PreviewApiError(0);
  return Object.freeze({ newRepairFormMode: value.newRepairFormMode });
}

async function response(result: Response): Promise<UserPreferences> {
  if (!result.ok) {
    if (result.status === 401 || result.status === 403) {
      window.dispatchEvent(new CustomEvent(SESSION_INVALIDATED_EVENT, {
        detail: { background: result.status === 403 },
      }));
    }
    throw new PreviewApiError(result.status);
  }
  try {
    return parse(await result.json());
  } catch (error: unknown) {
    if (error instanceof PreviewApiError) throw error;
    throw new PreviewApiError(0);
  }
}

export async function getUserPreferences(signal?: AbortSignal): Promise<UserPreferences> {
  return response(await fetch(PATH, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    headers: { Accept: 'application/json' },
    signal: signal ?? null,
  }));
}

export async function updateUserPreferences(
  input: UserPreferences,
  csrfToken: string,
  signal?: AbortSignal,
): Promise<UserPreferences> {
  return response(await fetch(PATH, {
    method: 'PATCH',
    credentials: 'include',
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-SR-CSRF-Token': csrfToken,
    },
    body: JSON.stringify(input),
    signal: signal ?? null,
  }));
}
