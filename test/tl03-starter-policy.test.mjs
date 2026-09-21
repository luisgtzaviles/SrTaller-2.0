import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { STARTER_TENANT_ADMIN_POLICY } from '../dist/modules/access/domain/tenant-admin-policy.js';

const expectedCapabilities = [
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
];

test('starter Tenant Admin policy is exact, protected, versioned and non-operational', () => {
  assert.deepEqual(STARTER_TENANT_ADMIN_POLICY, {
    roleKey: 'tenant_admin',
    displayName: 'Administrador del tenant',
    description: 'Autoridad administrativa inicial protegida por el sistema.',
    managementMode: 'SYSTEM_MANAGED',
    policyVersion: 1,
    capabilityCodes: expectedCapabilities,
  });
  assert.equal(Object.isFrozen(STARTER_TENANT_ADMIN_POLICY), true);
  assert.equal(Object.isFrozen(STARTER_TENANT_ADMIN_POLICY.capabilityCodes), true);
  assert.equal(
    STARTER_TENANT_ADMIN_POLICY.capabilityCodes.some((capability) =>
      capability.startsWith('repairs.') || capability.startsWith('catalog.')),
    false,
  );
});

test('ordinary Role mutation paths reject SYSTEM_MANAGED records', async () => {
  const source = await readFile(
    'src/modules/access/infrastructure/persistence/kysely-access.repository.ts',
    'utf8',
  );
  assert.equal(
    source.match(/current\.management_mode === 'SYSTEM_MANAGED'/gu)?.length,
    2,
  );
  assert.match(source, /ACCESS_PROTECTED_ROLE/u);
  assert.match(source, /management_mode: 'TENANT_MANAGED'/u);
});
