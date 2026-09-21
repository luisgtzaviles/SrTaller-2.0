import type { CapabilityCode } from './capability.js';

export const STARTER_TENANT_ADMIN_POLICY = Object.freeze({
  roleKey: 'tenant_admin',
  displayName: 'Administrador del tenant',
  description: 'Autoridad administrativa inicial protegida por el sistema.',
  managementMode: 'SYSTEM_MANAGED',
  policyVersion: 1,
  capabilityCodes: Object.freeze([
    'tenant.profile.read',
    'tenant.profile.manage',
    'branches.read',
    'branches.manage',
    'branches.deactivate',
    'users.read',
    'users.manage',
    'access_matrix.read',
    'access_matrix.manage',
    'stations.read',
    'stations.manage',
    'stations.enrollment.issue',
    'stations.enrollment.cancel',
    'stations.revoke',
    'stations.relink',
  ] satisfies readonly CapabilityCode[]),
} as const);
