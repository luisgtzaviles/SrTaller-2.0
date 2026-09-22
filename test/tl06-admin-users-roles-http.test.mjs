import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('TL-06 Admin Users/Roles HTTP stays on Admin Context and derives tenant server-side', async () => {
  const [controller, operations] = await Promise.all([
    readFile('src/modules/access/presentation/admin-users-roles.controller.ts', 'utf8'),
    readFile('src/modules/access/application/admin-users-roles.operations.ts', 'utf8'),
  ]);
  assert.match(controller, /@Controller\('api\/admin'\)/u);
  assert.match(controller, /@Controller\('api\/public\/admin-invitations'\)/u);
  assert.match(operations, /capability: 'users\.read'/u);
  assert.match(operations, /capability: 'users\.manage'/u);
  assert.match(operations, /capability: 'access_matrix\.read'/u);
  assert.match(operations, /capability: 'access_matrix\.manage'/u);
  assert.doesNotMatch(controller, /tenantId/u);
  assert.match(operations, /tenantId: context\.tenantId/u);
  assert.match(operations, /requiresRecentReauthentication: impact\.highImpact/u);
  assert.match(operations, /isControlPlaneCapability/u);
});

test('TL-06 module reuses one invitation service and the shared email provider', async () => {
  const module = await readFile('src/modules/access/access.module.ts', 'utf8');
  assert.match(module, /ADMIN_INVITATION_SERVICE/u);
  assert.match(module, /LocalEmailDelivery/u);
  assert.match(module, /ResendEmailDelivery/u);
  assert.doesNotMatch(module, /new .*InvitationEmailDelivery/u);
});

test('TL-06 sensitive authority changes require Level-2 and post-mutation continuity', async () => {
  const [operations, guard, lifecycle] = await Promise.all([
    readFile('src/modules/access/application/admin-users-roles.operations.ts', 'utf8'),
    readFile('src/modules/access/infrastructure/persistence/kysely-administration-authorization-commit.guard.ts', 'utf8'),
    readFile('src/modules/access/infrastructure/persistence/kysely-admin-lifecycle.repository.ts', 'utf8'),
  ]);
  assert.match(operations, /requiresRecentReauthentication: impact\.highImpact/u);
  assert.match(operations, /requiresRecentReauthentication: administrative/u);
  assert.match(operations, /requiresRecentReauthentication: true/u);
  assert.match(operations, /confirmContinuity: context\.commitGuard\.confirmEffectiveTenantAdmin/u);
  assert.match(operations, /recordAudit/u);
  assert.match(lifecycle, /access_admin_lifecycle_events/u);
  assert.match(lifecycle, /confirmEffectiveTenantAdmin\(raw\)/u);
  assert.match(guard, /forUpdate\('role'\)/u);
  assert.match(lifecycle, /management_mode !== 'TENANT_MANAGED'/u);
});
