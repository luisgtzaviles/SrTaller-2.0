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
  description: string | null;
  status: 'active' | 'disabled' | 'archived';
  version: number;
  capabilityCodes: readonly string[];
}>;

export type ProductAccessMatrix = Readonly<{
  capabilities: readonly Readonly<{ capabilityCode: string }>[],
  roles: readonly ProductRole[],
  assignments: readonly ProductRoleAssignment[],
}>;

export type ProductRoleAssignment = Readonly<{
  assignmentId: string;
  userId: string;
  roleId: string;
  status: 'active' | 'revoked';
  version: number;
}>;

const USERS_PATH = '/api/access/administration/users';
const ROLES_PATH = '/api/access/administration/users/roles';
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

async function mutationRequest<Response>(path: string, init: RequestInit): Promise<Response> {
  const response = await request<Response>(path, init);
  requestSessionRevalidation(true);
  return response;
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
  return mutationRequest<ProductUser>(USERS_PATH, {
    method: 'POST',
    headers: { 'X-SR-CSRF-Token': csrfToken },
    body: JSON.stringify(input),
  });
}

export function updateProductUser(
  userId: string,
  input: Readonly<{ displayName: string; operationalIdentifier: string | null; expectedVersion: number; clientRequestId: string }>,
  csrfToken: string,
): Promise<ProductUser> {
  return mutationRequest<ProductUser>(`${USERS_PATH}/${encodeURIComponent(userId)}`, { method: 'POST', headers: { 'X-SR-CSRF-Token': csrfToken }, body: JSON.stringify(input) });
}

export function listProductAccessMatrix(signal?: AbortSignal): Promise<ProductAccessMatrix> {
  return request<ProductAccessMatrix>(ROLES_PATH, { signal: signal ?? null });
}

export function createProductRole(
  input: Readonly<{
    roleKey: string;
    displayName: string;
    description: string | null;
    capabilityCodes: readonly string[];
    clientRequestId: string;
  }>,
  csrfToken: string,
): Promise<ProductRole> {
  return mutationRequest<ProductRole>(ROLES_PATH, {
    method: 'POST',
    headers: { 'X-SR-CSRF-Token': csrfToken },
    body: JSON.stringify(input),
  });
}

export function updateProductRole(
  roleId: string,
  input: Readonly<{
    displayName: string;
    description: string | null;
    expectedVersion: number;
    clientRequestId: string;
  }>,
  csrfToken: string,
): Promise<ProductRole> {
  return mutationRequest<ProductRole>(`${ROLES_PATH}/${encodeURIComponent(roleId)}`, {
    method: 'POST',
    headers: { 'X-SR-CSRF-Token': csrfToken },
    body: JSON.stringify(input),
  });
}

export function replaceProductRoleCapabilities(
  roleId: string,
  input: Readonly<{ expectedVersion: number; capabilityCodes: readonly string[]; clientRequestId: string }>,
  csrfToken: string,
): Promise<ProductRole> {
  return mutationRequest<ProductRole>(`${ROLES_PATH}/${encodeURIComponent(roleId)}/capabilities`, {
    method: 'POST',
    headers: { 'X-SR-CSRF-Token': csrfToken },
    body: JSON.stringify(input),
  });
}

export function assignProductRole(
  userId: string,
  roleId: string,
  clientRequestId: string,
  csrfToken: string,
): Promise<ProductRoleAssignment> {
  return mutationRequest<ProductRoleAssignment>(`${USERS_PATH}/${encodeURIComponent(userId)}/roles`, {
    method: 'POST',
    headers: { 'X-SR-CSRF-Token': csrfToken },
    body: JSON.stringify({ roleId, clientRequestId }),
  });
}

export function revokeProductRole(userId: string, assignmentId: string, expectedVersion: number, clientRequestId: string, csrfToken: string): Promise<ProductRoleAssignment> {
  return mutationRequest<ProductRoleAssignment>(`${USERS_PATH}/${encodeURIComponent(userId)}/roles/${encodeURIComponent(assignmentId)}/revoke`, { method: 'POST', headers: { 'X-SR-CSRF-Token': csrfToken }, body: JSON.stringify({ expectedVersion, clientRequestId }) });
}

export function provisionProductLocalPin(
  userId: string,
  pin: string,
  clientRequestId: string,
  csrfToken: string,
): Promise<void> {
  return mutationRequest<void>(`${USERS_PATH}/${encodeURIComponent(userId)}/pin`, {
    method: 'POST',
    headers: { 'X-SR-CSRF-Token': csrfToken },
    body: JSON.stringify({ pin, clientRequestId }),
  });
}

export function transitionProductUser(
  userId: string,
  input: Readonly<{ status: 'active' | 'inactive'; expectedVersion: number; clientRequestId: string }>,
  csrfToken: string,
): Promise<ProductUser> {
  return mutationRequest<ProductUser>(`${USERS_PATH}/${encodeURIComponent(userId)}/status`, {
    method: 'POST',
    headers: { 'X-SR-CSRF-Token': csrfToken },
    body: JSON.stringify(input),
  });
}

export const capabilityLabel: Readonly<Record<string, string>> = Object.freeze({
  'repairs.read': 'Ver reparaciones',
  'repairs.add_note': 'Agregar notas operativas',
  'repairs.create': 'Crear reparaciones',
  'repairs.correct_intake': 'Corregir equipo de reparaciones',
  'repairs.classify': 'Clasificar problemas de reparaciones',
  'repairs.catalogs.read': 'Ver catálogos de Reparaciones',
  'repairs.catalogs.manage': 'Administrar catálogos de Reparaciones',
  'repairs.configuration.read': 'Ver configuración de Nueva Reparación',
  'repairs.configuration.manage': 'Administrar configuración de Nueva Reparación',
  'users.read': 'Ver usuarios',
  'users.manage': 'Administrar usuarios',
  'access_matrix.read': 'Ver roles y permisos',
  'access_matrix.manage': 'Administrar roles y permisos',
  'price_list.read': 'Consultar Lista de precios',
  'catalog.manage': 'Administrar artículos y clasificación comercial',
  'catalog.items.create': 'Crear artículos',
  'catalog.items.update': 'Editar artículos',
  'catalog.items.deactivate': 'Desactivar/reactivar artículos',
  'catalog.prices.manage': 'Administrar precios base',
  'catalog.branch_prices.manage': 'Administrar precios de la sucursal',
  'catalog.reference_cost.read': 'Ver costos de referencia',
  'catalog.reference_cost.manage': 'Administrar costos de referencia',
  'catalog.configuration.read': 'Ver configuración de campos de carga',
  'catalog.configuration.manage': 'Administrar configuración de campos de carga',
  'catalog.import.read': 'Ver historial de cargas masivas',
  'catalog.import.prepare': 'Preparar importaciones de catálogo',
  'catalog.import.publish': 'Publicar importaciones de catálogo',
  'catalog.items.bulk_retire': 'Retirar artículos de catálogo masivamente',
  'catalog.suppliers.delete': 'Eliminar proveedores sin historial publicado',
});

export function humanCapabilityLabel(capabilityCode: string): string {
  return capabilityLabel[capabilityCode] ?? 'Permiso disponible';
}
