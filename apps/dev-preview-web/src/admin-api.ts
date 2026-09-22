export type AdminCapability = 'branches.read' | 'branches.manage' | 'branches.deactivate' | string;
export interface AdminSession { readonly tenantId: string; readonly sessionId: string; readonly userId: string; readonly displayName: string; readonly reauthenticatedAt: string | null; }
export interface AdminSessionSnapshot { readonly session: AdminSession | null; readonly capabilities: readonly AdminCapability[]; readonly csrfToken: string; }
export interface AdminBranch { readonly tenantId: string; readonly branchId: string; readonly displayName: string; readonly timeZone: string; readonly status: 'ACTIVE' | 'INACTIVE'; readonly version: number; readonly admissionRevision: number; readonly createdAt: string; readonly updatedAt: string; }

export class AdminApiError extends Error { constructor(readonly status: number, readonly code: string) { super(code); this.name = 'AdminApiError'; } }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { credentials: 'same-origin', ...init });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { code?: string };
    throw new AdminApiError(response.status, body.code ?? 'ADMIN_REQUEST_FAILED');
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function mutation(method: 'POST' | 'PATCH' | 'DELETE', csrfToken: string, body?: unknown): RequestInit {
  const base = { method, headers: { 'content-type': 'application/json', 'x-sr-admin-csrf-token': csrfToken } };
  return body === undefined ? base : { ...base, body: JSON.stringify(body) };
}

export const adminApi = Object.freeze({
  session: () => request<AdminSessionSnapshot>('/api/admin/session'),
  login: (csrfToken: string, email: string, password: string) => request<AdminSessionSnapshot>('/api/admin/session', mutation('POST', csrfToken, { email, password })),
  logout: (csrfToken: string) => request<void>('/api/admin/session', mutation('DELETE', csrfToken)),
  reauthenticate: (csrfToken: string, password: string) => request<{ reauthenticatedAt: string }>('/api/admin/session/reauthentication', mutation('POST', csrfToken, { password })),
  listBranches: () => request<{ items: readonly AdminBranch[] }>('/api/admin/branches'),
  createBranch: (csrfToken: string, input: Readonly<{ clientRequestId: string; displayName: string; timeZone: string }>) => request<{ item: AdminBranch }>('/api/admin/branches', mutation('POST', csrfToken, input)),
  updateBranch: (csrfToken: string, branchId: string, input: Readonly<{ clientRequestId: string; expectedVersion: number; displayName: string; timeZone: string }>) => request<{ item: AdminBranch }>(`/api/admin/branches/${branchId}`, mutation('PATCH', csrfToken, input)),
  deactivateBranch: (csrfToken: string, branch: AdminBranch) => request<{ item: AdminBranch }>(`/api/admin/branches/${branch.branchId}/deactivation`, mutation('POST', csrfToken, { clientRequestId: crypto.randomUUID(), expectedVersion: branch.version })),
  reactivateBranch: (csrfToken: string, branch: AdminBranch) => request<{ item: AdminBranch }>(`/api/admin/branches/${branch.branchId}/reactivation`, mutation('POST', csrfToken, { clientRequestId: crypto.randomUUID(), expectedVersion: branch.version })),
});
