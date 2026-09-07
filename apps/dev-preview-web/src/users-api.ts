import { PreviewApiError } from './api.js';

export type ProductUser = Readonly<{
  userId: string;
  displayName: string;
  operationalIdentifier: string | null;
  status: 'active' | 'inactive' | 'revoked';
  version: number;
  createdAt: string;
  updatedAt: string;
  pinConfigured: boolean;
}>;

export type ProductRole = Readonly<{
  roleId: string;
  roleKey: string;
  displayName: string;
  status: 'active' | 'inactive' | 'revoked';
  version: number;
  capabilityCodes: readonly string[];
}>;

export type ProductAccessMatrix = Readonly<{
  capabilities: readonly Readonly<{ capabilityCode: string }>[],
  roles: readonly ProductRole[],
  assignments: readonly Readonly<{
    assignmentId: string;
    userId: string;
    roleId: string;
    status: 'active' | 'revoked';
    version: number;
  }>[],
}>;

const USERS_PATH = '/api/access/administration/users';
const ROLES_PATH = '/api/access/administration/users/roles';

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
  if (!response.ok) throw new PreviewApiError(response.status);
  return response.json() as Promise<Response>;
}

export async function listProductUsers(signal?: AbortSignal): Promise<readonly ProductUser[]> {
  const response = await request<Readonly<{ items: readonly ProductUser[] }>>(USERS_PATH, {
    signal: signal ?? null,
  });
  return response.items;
}

export function createProductUser(
  input: Readonly<{ displayName: string; operationalIdentifier: string | null; clientRequestId: string }>,
  csrfToken: string,
): Promise<ProductUser> {
  return request<ProductUser>(USERS_PATH, {
    method: 'POST',
    headers: { 'X-SR-CSRF-Token': csrfToken },
    body: JSON.stringify(input),
  });
}

export function updateProductUser(
  userId: string,
  input: Readonly<{ displayName: string; operationalIdentifier: string | null; expectedVersion: number }>,
  csrfToken: string,
): Promise<ProductUser> {
  return request<ProductUser>(`${USERS_PATH}/${encodeURIComponent(userId)}`, { method: 'POST', headers: { 'X-SR-CSRF-Token': csrfToken }, body: JSON.stringify(input) });
}

export function listProductAccessMatrix(signal?: AbortSignal): Promise<ProductAccessMatrix> {
  return request<ProductAccessMatrix>(ROLES_PATH, { signal: signal ?? null });
}

export function createProductRole(
  input: Readonly<{ roleKey: string; displayName: string; capabilityCodes: readonly string[] }>,
  csrfToken: string,
): Promise<ProductRole> {
  return request<ProductRole>(ROLES_PATH, {
    method: 'POST',
    headers: { 'X-SR-CSRF-Token': csrfToken },
    body: JSON.stringify(input),
  });
}

export function replaceProductRoleCapabilities(
  roleId: string,
  input: Readonly<{ expectedVersion: number; capabilityCodes: readonly string[] }>,
  csrfToken: string,
): Promise<ProductRole> {
  return request<ProductRole>(`${ROLES_PATH}/${encodeURIComponent(roleId)}/capabilities`, {
    method: 'POST',
    headers: { 'X-SR-CSRF-Token': csrfToken },
    body: JSON.stringify(input),
  });
}

export function assignProductRole(
  userId: string,
  roleId: string,
  csrfToken: string,
): Promise<void> {
  return request<void>(`${USERS_PATH}/${encodeURIComponent(userId)}/roles`, {
    method: 'POST',
    headers: { 'X-SR-CSRF-Token': csrfToken },
    body: JSON.stringify({ roleId }),
  });
}

export function revokeProductRole(userId: string, assignmentId: string, expectedVersion: number, csrfToken: string): Promise<void> {
  return request<void>(`${USERS_PATH}/${encodeURIComponent(userId)}/roles/${encodeURIComponent(assignmentId)}/revoke`, { method: 'POST', headers: { 'X-SR-CSRF-Token': csrfToken }, body: JSON.stringify({ expectedVersion }) });
}

export function provisionProductLocalPin(
  userId: string,
  pin: string,
  csrfToken: string,
): Promise<void> {
  return request<void>(`${USERS_PATH}/${encodeURIComponent(userId)}/pin`, {
    method: 'POST',
    headers: { 'X-SR-CSRF-Token': csrfToken },
    body: JSON.stringify({ pin }),
  });
}

export function transitionProductUser(
  userId: string,
  input: Readonly<{ status: 'active' | 'inactive'; expectedVersion: number }>,
  csrfToken: string,
): Promise<ProductUser> {
  return request<ProductUser>(`${USERS_PATH}/${encodeURIComponent(userId)}/status`, {
    method: 'POST',
    headers: { 'X-SR-CSRF-Token': csrfToken },
    body: JSON.stringify(input),
  });
}

export const capabilityLabel: Readonly<Record<string, string>> = Object.freeze({
  'repairs.read': 'Ver reparaciones',
  'repairs.add_note': 'Agregar notas operativas',
  'users.read': 'Ver usuarios',
  'users.manage': 'Administrar usuarios',
  'access_matrix.read': 'Ver roles y permisos',
  'access_matrix.manage': 'Administrar roles y permisos',
});

export function humanCapabilityLabel(capabilityCode: string): string {
  return capabilityLabel[capabilityCode] ?? 'Permiso disponible';
}
