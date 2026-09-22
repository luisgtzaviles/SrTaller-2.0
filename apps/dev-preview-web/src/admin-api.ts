export type AdminCapability = 'branches.read' | 'branches.manage' | 'branches.deactivate' | string;
export interface AdminSession { readonly tenantId: string; readonly sessionId: string; readonly userId: string; readonly displayName: string; readonly reauthenticatedAt: string | null; }
export interface AdminSessionSnapshot { readonly session: AdminSession | null; readonly capabilities: readonly AdminCapability[]; readonly csrfToken: string; }
export interface AdminBranch { readonly tenantId: string; readonly branchId: string; readonly displayName: string; readonly timeZone: string; readonly status: 'ACTIVE' | 'INACTIVE'; readonly version: number; readonly admissionRevision: number; readonly createdAt: string; readonly updatedAt: string; }
export interface AdminRole { readonly roleId: string; readonly roleKey: string; readonly displayName: string; readonly description: string | null; readonly status: 'active' | 'disabled' | 'archived'; readonly version: number; readonly managementMode: 'TENANT_MANAGED' | 'SYSTEM_MANAGED'; readonly capabilityCodes: readonly string[]; }
export interface AdminAssignment { readonly assignmentId: string; readonly userId: string; readonly roleId: string; readonly assignmentScope: 'TENANT_WIDE' | 'BRANCH_RESTRICTED'; readonly branchId: string | null; readonly status: 'active' | 'revoked'; readonly version: number; }
export interface AdminUser { readonly userId: string; readonly displayName: string; readonly operationalIdentifier: string | null; readonly status: 'active' | 'inactive' | 'revoked'; readonly version: number; readonly pinConfigured: boolean; readonly adminIdentity: { readonly adminIdentityId: string; readonly emailDisplay: string; readonly verified: boolean; readonly status: 'active' | 'revoked' } | null; readonly assignments: readonly AdminAssignment[]; }
export interface AdminInvitation { readonly invitationId: string; readonly emailDisplay: string; readonly proposedDisplayName: string | null; readonly status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED'; readonly version: number; readonly expiresAt: string; }
export interface AdminUsersSnapshot { readonly users: readonly AdminUser[]; readonly invitations: readonly AdminInvitation[]; }
export interface AdminRolesSnapshot { readonly capabilities: readonly { readonly capabilityCode: string }[]; readonly roles: readonly AdminRole[]; readonly assignments: readonly AdminAssignment[]; }

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
  listUsers: () => request<AdminUsersSnapshot>('/api/admin/users'),
  listRoles: () => request<AdminRolesSnapshot>('/api/admin/roles'),
  inviteUser: (csrfToken: string, input: unknown) => request<{ item: AdminInvitation }>('/api/admin/invitations', mutation('POST', csrfToken, input)),
  resendInvitation: (csrfToken: string, invitation: AdminInvitation) => request<{ item: AdminInvitation }>(`/api/admin/invitations/${invitation.invitationId}/resend`, mutation('POST', csrfToken, { clientRequestId: crypto.randomUUID(), correlationId: crypto.randomUUID(), expectedVersion: invitation.version })),
  revokeInvitation: (csrfToken: string, invitation: AdminInvitation) => request<{ item: AdminInvitation }>(`/api/admin/invitations/${invitation.invitationId}/revocation`, mutation('POST', csrfToken, { clientRequestId: crypto.randomUUID(), correlationId: crypto.randomUUID(), expectedVersion: invitation.version })),
  createRole: (csrfToken: string, input: unknown) => request<{ item: AdminRole }>('/api/admin/roles', mutation('POST', csrfToken, input)),
  updateRole: (csrfToken: string, role: AdminRole, input: unknown) => request<{ item: AdminRole }>(`/api/admin/roles/${role.roleId}`, mutation('PATCH', csrfToken, input)),
  replaceRoleCapabilities: (csrfToken: string, role: AdminRole, capabilityCodes: readonly string[]) => request<{ item: AdminRole }>(`/api/admin/roles/${role.roleId}/capabilities`, mutation('POST', csrfToken, { clientRequestId: crypto.randomUUID(), expectedVersion: role.version, capabilityCodes })),
  transitionRole: (csrfToken: string, role: AdminRole, active: boolean) => request<{ item: AdminRole }>(`/api/admin/roles/${role.roleId}/${active ? 'reactivation' : 'deactivation'}`, mutation('POST', csrfToken, { clientRequestId: crypto.randomUUID(), correlationId: crypto.randomUUID(), expectedVersion: role.version })),
  assignRole: (csrfToken: string, userId: string, roleId: string, branchId: string | null = null) => request<{ item: AdminAssignment }>('/api/admin/role-assignments', mutation('POST', csrfToken, { clientRequestId: crypto.randomUUID(), userId, roleId, assignmentScope: branchId ? 'BRANCH_RESTRICTED' : 'TENANT_WIDE', branchId })),
  revokeRole: (csrfToken: string, assignment: AdminAssignment) => request<{ item: AdminAssignment }>('/api/admin/role-assignments/revocation', mutation('POST', csrfToken, { clientRequestId: crypto.randomUUID(), assignmentId: assignment.assignmentId, expectedVersion: assignment.version })),
  transitionUser: (csrfToken: string, user: AdminUser, active: boolean) => request<{ item: AdminUser }>(`/api/admin/users/${user.userId}/${active ? 'reactivation' : 'deactivation'}`, mutation('POST', csrfToken, { clientRequestId: crypto.randomUUID(), correlationId: crypto.randomUUID(), expectedVersion: user.version })),
  acceptInvitation: (token: string, password: string) => request<{ status: 'ACCEPTED' }>('/api/public/admin-invitations/acceptance', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, password, clientRequestId: crypto.randomUUID(), correlationId: crypto.randomUUID() }) }),
});
