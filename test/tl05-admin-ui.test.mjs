import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('TL-05 Admin surface keeps administrative and operational sessions separate', async () => {
  const [app, admin, api] = await Promise.all([readFile('apps/dev-preview-web/src/App.tsx', 'utf8'), readFile('apps/dev-preview-web/src/admin/AdminApp.tsx', 'utf8'), readFile('apps/dev-preview-web/src/admin-api.ts', 'utf8')]);
  assert.match(app, /location\.pathname === '\/login'/u);
  assert.match(app, /return <AdminApp/u);
  assert.doesNotMatch(admin, /from .*SessionProvider|<SessionProvider|OperationalSessionGate/iu);
  assert.match(admin, /correo verificado y contraseña administrativa/u);
  assert.match(api, /x-sr-admin-csrf-token/u);
  assert.doesNotMatch(api, /'x-sr-csrf-token'/u);
  assert.match(admin, /branches === null.*Cargando sucursales/u);
});

test('TL-05 first-Branch onboarding requires explicit IANA selection', async () => {
  const source = await readFile('apps/dev-preview-web/src/admin/AdminApp.tsx', 'utf8');
  assert.match(source, /useState\(branch\?\.timeZone \?\? ''\)/u);
  assert.match(source, /<option value="">Selecciona una zona horaria/u);
  assert.match(source, /Usar sugerencia:/u);
  assert.match(source, /disabled=\{busy \|\| !displayName\.trim\(\) \|\| !timeZone\}/u);
  assert.doesNotMatch(source, /useState\('America\/Hermosillo'\)/u);
});

test('TL-05 Admin UI exposes Branch lifecycle through reauthentication only', async () => {
  const [source, api] = await Promise.all([readFile('apps/dev-preview-web/src/admin/AdminApp.tsx', 'utf8'), readFile('apps/dev-preview-web/src/admin-api.ts', 'utf8')]);
  assert.match(source, /Acción sensible · Nivel 2/u);
  assert.match(source, /adminApi\.reauthenticate[\s\S]*adminApi\.deactivateBranch/u);
  assert.match(source, /import \{ Dialog \} from '\.\.\/components\/ui\/overlays\.js'/u);
  assert.match(source, /return <Dialog open title=/u);
  assert.doesNotMatch(source, /role="dialog"|aria-modal="true"|dialogBackdrop/u);
  assert.match(api, /\/api\/admin\/session\/reauthentication/u);
  assert.match(api, /\/deactivation/u); assert.match(api, /\/reactivation/u);
});

test('TL-05 responsive Admin layout defines desktop, 768 and 640 behavior without horizontal page overflow', async () => {
  const css = await readFile('apps/dev-preview-web/src/admin/admin-app.module.css', 'utf8');
  assert.match(css, /@media\(max-width:768px\)/u); assert.match(css, /@media\(max-width:640px\)/u);
  assert.match(css, /minmax\(0,1fr\)/u); assert.match(css, /overflow-wrap:anywhere/u);
});
