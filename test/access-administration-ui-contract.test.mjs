import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  createPendingProfileUpdate,
  isPendingProfileInput,
  isProfileUpdateConfirmed,
} from '../apps/dev-preview-web/src/pages/pending-profile-update.mjs';

const [apiSource, usersSource, rolesSource] = await Promise.all([
  readFile('apps/dev-preview-web/src/users-api.ts', 'utf8'),
  readFile('apps/dev-preview-web/src/pages/UsersPage.tsx', 'utf8'),
  readFile('apps/dev-preview-web/src/pages/RolesPage.tsx', 'utf8'),
]);

function sourceSection(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(start, -1, `missing source marker: ${startMarker}`);
  assert.notEqual(end, -1, `missing source marker: ${endMarker}`);
  return source.slice(start, end);
}

test('administration mutations revalidate Session authority and fail closed on 401/403', () => {
  assert.match(apiSource, /response\.status === 401 \|\| response\.status === 403/u);
  assert.match(apiSource, /requestSessionRevalidation\(response\.status === 403\)/u);
  assert.match(
    apiSource,
    /async function mutationRequest[\s\S]*?await request<Response>\(path, init\);[\s\S]*?requestSessionRevalidation\(true\)/u,
  );
  for (const operation of [
    'createProductUser',
    'updateProductUser',
    'createProductRole',
    'updateProductRole',
    'replaceProductRoleCapabilities',
    'assignProductRole',
    'revokeProductRole',
    'provisionProductLocalPin',
    'transitionProductUser',
  ]) {
    const start = apiSource.indexOf(`export function ${operation}`);
    assert.notEqual(start, -1, `missing administration operation: ${operation}`);
    const nextExport = apiSource.indexOf('\nexport ', start + 1);
    const section = apiSource.slice(start, nextExport === -1 ? undefined : nextExport);
    assert.match(section, /mutationRequest/u, `${operation} must revalidate the Session snapshot`);
  }
});

test('role assignment UI requires matrix authority and consumes authoritative responses', () => {
  assert.match(usersSource, /const canManageMatrix = hasOperationalCapability\(capabilities, 'access_matrix\.manage'\)/u);
  assert.match(usersSource, /\{canManageMatrix \? <Button[\s\S]*?void revokeRole/u);
  assert.match(usersSource, /\{canManageMatrix && availableRoles\.length > 0/u);

  const assign = sourceSection(usersSource, 'const assignRole = async', '  const revokeRole = async');
  assert.match(assign, /const assigned = await assignProductRole/u);
  assert.match(assign, /assignments: \[\.\.\.current\.assignments, assigned\]/u);
  assert.ok(
    assign.indexOf('await assignProductRole') < assign.indexOf('mutationRequestIds.current.delete'),
    'assignment request identity must survive an ambiguous request failure',
  );

  const revoke = sourceSection(usersSource, 'const revokeRole = async', '  const savePin = async');
  assert.match(revoke, /const revoked = await revokeProductRole/u);
  assert.match(revoke, /assignment\.assignmentId === revoked\.assignmentId \? revoked/u);
  assert.ok(
    revoke.indexOf('await revokeProductRole') < revoke.indexOf('mutationRequestIds.current.delete'),
    'revocation request identity must survive an ambiguous request failure',
  );
});

test('PIN UI keeps a retry identity only while the masked value is unchanged', () => {
  const savePin = sourceSection(usersSource, 'const savePin = async', '  const transitionStatus = async');
  assert.match(savePin, /pinRequestId\.current \?\?= crypto\.randomUUID\(\)/u);
  assert.ok(
    savePin.indexOf('await provisionProductLocalPin') < savePin.indexOf('pinRequestId.current = null'),
    'PIN request identity must clear only after a confirmed response',
  );
  assert.match(usersSource, /type="password"/u);
  assert.match(usersSource, /onChange=\{\(event\) => \{ pinRequestId\.current = null;/u);
  assert.match(usersSource, /PIN configurado\. Usa esta acción sólo para reemplazarlo\./u);
  assert.match(usersSource, /El valor no se conserva ni vuelve a mostrarse\./u);
  assert.doesNotMatch(usersSource, /pinPlaintext|credentialVerifier|lookupDigest/u);
  assert.match(usersSource, /const canManagePin = canManage && canManageMatrix/u);
});

test('profile editing keeps an idempotency key across ambiguous responses', () => {
  assert.match(usersSource, /const pendingProfileUpdate = useRef<PendingProfileUpdate \| null>\(null\)/u);
  assert.match(usersSource, /expectedVersion: command\.expectedVersion/u);
  assert.match(usersSource, /clientRequestId: command\.clientRequestId/u);
  assert.match(usersSource, /const authoritative = await load\(\)/u);
  assert.match(usersSource, /isProfileUpdateConfirmed\(command, confirmed\)/u);
  assert.match(usersSource, /pendingProfileUpdate\.current = null; setEditDisplayName/u);
});

test('profile retry command remains immutable and confirms only the intended committed state', () => {
  const command = createPendingProfileUpdate({
    userId: 'user-a',
    expectedVersion: 3,
    displayName: 'Efrén Demo',
    operationalIdentifier: 'EFREN',
    clientRequestId: 'request-a',
  });
  assert.equal(Object.isFrozen(command), true);
  assert.equal(isPendingProfileInput(command, 'user-a', 'Efrén Demo', 'EFREN'), true);
  assert.equal(isPendingProfileInput(command, 'user-b', 'Efrén Demo', 'EFREN'), false);
  assert.equal(isProfileUpdateConfirmed(command, {
    userId: 'user-a',
    version: 4,
    displayName: 'Efrén Demo',
    operationalIdentifier: 'EFREN',
  }), true);
  assert.equal(isProfileUpdateConfirmed(command, {
    userId: 'user-a',
    version: 3,
    displayName: 'Efrén Demo',
    operationalIdentifier: 'EFREN',
  }), false);
  assert.equal(isProfileUpdateConfirmed(command, {
    userId: 'user-a',
    version: 4,
    displayName: 'Otro nombre',
    operationalIdentifier: 'EFREN',
  }), false);
});

test('role editing reports partial metadata success and reloads authoritative state', () => {
  assert.match(rolesSource, /let metadataCommitted = false/u);
  assert.match(rolesSource, /metadataCommitted = true/u);
  assert.match(rolesSource, /if \(metadataCommitted\) \{[\s\S]*?await load\(\)/u);
  assert.match(rolesSource, /el nombre y la descripción sí se guardaron, pero los permisos no/iu);
  assert.match(usersSource, /No existen permisos directos por usuario/u);
});
