import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('TL-07 Admin HTTP exposes distinct Station commands with approved capability and sensitivity boundaries', async () => {
  const source = await readFile('src/modules/access/presentation/admin-stations.controller.ts', 'utf8');
  assert.match(source, /@Controller\('api\/admin\/stations'\)/u);
  for (const capability of ['stations.read', 'stations.manage', 'stations.revoke', 'stations.relink', 'stations.enrollment.issue', 'stations.enrollment.cancel']) assert.match(source, new RegExp(`capability: '${capability.replaceAll('.', '\\.')}'`, 'u'));
  assert.match(source, /issue[\s\S]*stations\.enrollment\.issue[\s\S]*requiresRecentReauthentication: true/u);
  assert.match(source, /cancel[\s\S]*stations\.enrollment\.cancel[\s\S]*allowBranchRestricted: true/u);
  assert.doesNotMatch(source.match(/cancel[\s\S]*?async unlink/u)?.[0] ?? '', /requiresRecentReauthentication/u);
  for (const method of ['unlink', 'relink', 'revoke']) assert.match(source, new RegExp(`${method}[\\s\\S]*?requiresRecentReauthentication: true`, 'u'));
  assert.doesNotMatch(source, /tenantId.*@Body|body.*tenantId/u);
  assert.match(source, /invalidateStationSessionsAtCommit/u);
});

test('TL-07 Station runtime persists digest-only bounded authority and cuts all stale trust', async () => {
  const source = await readFile('src/modules/stations/infrastructure/persistence/kysely-station-administration.runtime.ts', 'utf8');
  assert.match(source, /randomBytes\(32\)/u);
  assert.match(source, /createHash\('sha256'\)\.update\(token\.compact\)\.digest\(\)/u);
  assert.match(source, /now\.getTime\(\) \+ 600_000/u);
  assert.match(source, /manualCode: firstIssue \? token\.presented : null/u);
  assert.match(source, /qrPayload: firstIssue \? `srtaller-enroll:/u);
  assert.match(source, /updateTable\('station_bindings'\)[\s\S]*revoked_at: now/u);
  assert.match(source, /updateTable\('station_credentials'\)[\s\S]*revoked_at: now/u);
  assert.match(source, /invalidateOperationalSessions/u);
  assert.doesNotMatch(source, /token_digest.*mapChallenge|credential_hash.*mapStation/u);
});

test('TL-07 Admin UI is responsive, focus-managed and never implements redemption', async () => {
  const [app, panel, api, css] = await Promise.all([
    readFile('apps/dev-preview-web/src/admin/AdminApp.tsx', 'utf8'),
    readFile('apps/dev-preview-web/src/admin/StationsPanel.tsx', 'utf8'),
    readFile('apps/dev-preview-web/src/admin-api.ts', 'utf8'),
    readFile('apps/dev-preview-web/src/admin/admin-app.module.css', 'utf8'),
  ]);
  assert.match(app, /> Dispositivos</u); assert.match(app, /<StationsPanel/u);
  assert.match(panel, /Vincular dispositivo/u); assert.match(panel, /Renombrar/u); assert.match(panel, /Desvincular/u); assert.match(panel, /Cambiar sucursal/u); assert.match(panel, /Revocar/u); assert.match(panel, /Código manual/u); assert.match(panel, /Código QR de vinculación/u);
  assert.match(panel, /restoreFocusSelector/u); assert.match(panel, /autoComplete="current-password"/u); assert.match(panel, /<Field/u); assert.match(panel, /<Dialog/u);
  assert.match(api, /api\/admin\/stations/u); assert.doesNotMatch(api, /redeem|redemption/u); assert.doesNotMatch(panel, /redeem|redemption/u);
  assert.match(css, /@media\(max-width:768px\)/u); assert.match(css, /@media\(max-width:640px\)/u); assert.match(css, /\.stationGrid/u); assert.match(css, /grid-template-columns:1fr/u);
  assert.doesNotMatch(panel, /credential_hash|token_digest|stationSecret|PIN/u);
});

