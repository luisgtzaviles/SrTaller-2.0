import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const page = await readFile(new URL('../apps/dev-preview-web/src/pages/PublicRegistrationPage.tsx', import.meta.url), 'utf8');
const styles = await readFile(new URL('../apps/dev-preview-web/src/pages/public-registration-page.module.css', import.meta.url), 'utf8');
const app = await readFile(new URL('../apps/dev-preview-web/src/App.tsx', import.meta.url), 'utf8');

test('public registration routes are outside the Operational SessionProvider', () => {
  const publicBoundary = app.indexOf("location.pathname === '/registro'");
  const operationalBoundary = app.indexOf('<SessionProvider>');
  assert.ok(publicBoundary >= 0 && operationalBoundary > publicBoundary);
  assert.match(app, /return <PublicRegistrationPage \/>/u);
});

test('registration UI exposes required fields, separate legal evidence and safe states', () => {
  for (const expected of ['personName', 'workshopName', 'email', 'password', 'acceptedDocuments']) assert.match(page, new RegExp(expected, 'u'));
  for (const state of ['Revisa tu correo', 'Verificando correo', 'El enlace no está disponible', 'Correo verificado']) assert.match(page, new RegExp(state, 'u'));
  assert.match(page, /document\.key === 'terms'/u);
  assert.match(page, /admin\.srtaller\.com\/login/u);
  assert.match(page, /window\.history\.replaceState/u);
  assert.doesNotMatch(page, /tenantId|branchId|roleId|capabilit/iu);
});

test('public UI preserves keyboard semantics and responsive light/dark layouts', () => {
  assert.match(page, /<form[\s\S]*onSubmit/u);
  assert.match(page, /type="checkbox" required/u);
  assert.match(page, /role="alert"/u);
  assert.match(styles, /@media \(max-width: 768px\)/u);
  assert.match(styles, /@media \(max-width: 640px\)/u);
  assert.match(styles, /data-theme='dark'/u);
  assert.match(styles, /focus-visible/u);
  assert.doesNotMatch(styles, /width:\s*[1-9][0-9]{3,}px/u);
});
