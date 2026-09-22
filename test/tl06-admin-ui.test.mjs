import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('TL-06 Admin shell exposes responsive Users and Roles without mixing PIN/Admin login', async () => {
  const [app, api, css] = await Promise.all([
    readFile('apps/dev-preview-web/src/admin/AdminApp.tsx', 'utf8'),
    readFile('apps/dev-preview-web/src/admin-api.ts', 'utf8'),
    readFile('apps/dev-preview-web/src/admin/admin-app.module.css', 'utf8'),
  ]);
  assert.match(app, /> Usuarios</u);
  assert.match(app, /> Roles</u);
  assert.match(app, /Invitar usuario/u);
  assert.match(app, /Rol protegido/u);
  assert.match(app, /Sin PIN operativo/u);
  assert.match(app, /No existen permisos directos por User/u);
  assert.match(app, /PublicInvitationAcceptance/u);
  assert.match(app, /autoComplete="new-password"/u);
  assert.match(app, /window\.location\.hash\.slice\(1\)/u);
  assert.match(app, /window\.history\.replaceState/u);
  assert.doesNotMatch(app, /location\.search.*token/u);
  assert.match(app, /Sin identidad administrativa/u);
  assert.match(app, /Administración verificada/u);
  assert.match(app, /targetUserId: selectedUser\?\.userId \?\? null/u);
  assert.match(app, /no creará otro User ni modificará su PIN/u);
  assert.match(api, /api\/public\/admin-invitations\/acceptance/u);
  assert.match(css, /@media\(max-width:768px\)/u);
  assert.match(css, /@media\(max-width:640px\)/u);
  assert.match(css, /grid-template-columns:1fr/u);
  assert.doesNotMatch(app, /type="text"[^>]*value=\{password\}/u);
});

test('TL-06 UI uses canonical focus-managed Dialog and labels native controls', async () => {
  const app = await readFile('apps/dev-preview-web/src/admin/AdminApp.tsx', 'utf8');
  assert.match(app, /<Dialog open title="Invitar usuario"/u);
  assert.match(app, /<Field id="invite-email" label="Correo a verificar"/u);
  assert.equal(app.includes('aria-label={`Rol para ${user.displayName}`}'), true);
  assert.equal(app.includes('aria-label={`Quitar ${role?.displayName'), true);
});
