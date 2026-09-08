import { PreviewApiError } from './api.js';

export type BranchSettings = Readonly<{ timeZone: string }>;

const BRANCH_SETTINGS_PATH = '/api/access/administration/branch';
const SESSION_INVALIDATED_EVENT = 'srtaller:session-invalidated';

function requestSessionRevalidation(background: boolean): void {
  window.dispatchEvent(new CustomEvent(SESSION_INVALIDATED_EVENT, {
    detail: { background },
  }));
}

async function request<Response>(path: string, init: RequestInit = {}): Promise<Response> {
  const response = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      requestSessionRevalidation(response.status === 403);
    }
    throw new PreviewApiError(response.status);
  }
  return response.json() as Promise<Response>;
}

export function getBranchSettings(signal?: AbortSignal): Promise<BranchSettings> {
  return request<BranchSettings>(BRANCH_SETTINGS_PATH, { signal: signal ?? null });
}

export async function updateBranchTimeZone(
  timeZone: string,
  csrfToken: string,
): Promise<BranchSettings> {
  const settings = await request<BranchSettings>(BRANCH_SETTINGS_PATH, {
    method: 'POST',
    headers: { 'X-SR-CSRF-Token': csrfToken },
    body: JSON.stringify({ timeZone }),
  });
  requestSessionRevalidation(true);
  return settings;
}
