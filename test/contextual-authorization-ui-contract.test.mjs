import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  OPERATIONAL_CAPABILITY_CATALOG,
  hasOperationalCapability,
  parseSessionCapabilities,
} from '../apps/dev-preview-web/src/session/session-capabilities.mjs';

const [
  appSource,
  accessDeniedSource,
  repairsApiSource,
  shellSource,
  dashboardSource,
  repairsSource,
  detailSource,
  sessionApiSource,
  sessionGateSource,
] = await Promise.all([
  readFile('apps/dev-preview-web/src/App.tsx', 'utf8'),
  readFile('apps/dev-preview-web/src/pages/AccessDeniedPage.tsx', 'utf8'),
  readFile('apps/dev-preview-web/src/api.ts', 'utf8'),
  readFile('apps/dev-preview-web/src/components/shell/ApplicationShell.tsx', 'utf8'),
  readFile('apps/dev-preview-web/src/pages/DashboardPage.tsx', 'utf8'),
  readFile('apps/dev-preview-web/src/pages/RepairsPage.tsx', 'utf8'),
  readFile('apps/dev-preview-web/src/pages/RepairDetailPage.tsx', 'utf8'),
  readFile('apps/dev-preview-web/src/session/session-api.ts', 'utf8'),
  readFile('apps/dev-preview-web/src/session/OperationalSessionGate.tsx', 'utf8'),
]);

test('authenticated capability snapshots accept only a canonical finite set', () => {
  assert.deepEqual(OPERATIONAL_CAPABILITY_CATALOG, [
    'users.read',
    'access_matrix.read',
    'repairs.read',
    'repairs.add_note',
  ]);

  const parsed = parseSessionCapabilities(['repairs.read', 'repairs.add_note'], true);
  assert.deepEqual(parsed, ['repairs.read', 'repairs.add_note']);
  assert.ok(Object.isFrozen(parsed));
  assert.equal(hasOperationalCapability(parsed, 'repairs.read'), true);
  assert.equal(hasOperationalCapability(parsed, 'users.read'), false);

  assert.deepEqual(parseSessionCapabilities([], false), []);
  for (const invalid of [
    undefined,
    ['repairs.write'],
    ['repairs.read', 'repairs.read'],
    ['repairs.add_note', 'repairs.read'],
    ['repairs.read', 1],
  ]) {
    assert.throws(() => parseSessionCapabilities(invalid, true));
  }
  assert.throws(() => parseSessionCapabilities(['repairs.read'], false));
});

test('Session API parses capabilities at the snapshot boundary and clears unauthenticated authority', () => {
  assert.match(sessionApiSource, /readonly capabilities: readonly OperationalCapability\[\]/u);
  assert.match(sessionApiSource, /parseSessionCapabilities\(value\.capabilities, session !== null\)/u);
  assert.match(sessionApiSource, /capabilities,\s+revalidateAfterMs,/u);
  assert.match(sessionGateSource, /readonly capabilities: readonly OperationalCapability\[\]/u);
  assert.match(sessionGateSource, /readonly csrfToken: string/u);
  assert.match(sessionGateSource, /capabilities: snapshot\.capabilities/u);
  assert.match(sessionGateSource, /csrfToken: snapshot\.csrfToken/u);
  assert.equal(
    sessionGateSource.match(/capabilities: EMPTY_CAPABILITIES/gu)?.length,
    2,
    'logout and user switch must remove the prior actor capability snapshot immediately',
  );
  assert.match(sessionGateSource, /setSwitching\(true\)/u);
  assert.doesNotMatch(sessionApiSource, /localStorage|sessionStorage/iu);
});

test('Repairs routes and navigation fail closed before protected pages can fetch', () => {
  assert.match(appSource, /function CapabilityBoundary/u);
  assert.match(appSource, /hasOperationalCapability\(capabilities, capability\)/u);
  assert.match(appSource, /capability="repairs\.read"><RepairsPage/u);
  assert.match(appSource, /path="\/reparaciones\/nueva" element=\{<AccessDeniedPage \/>\}/u);
  assert.match(appSource, /capability="repairs\.read"><RepairDetailPage capabilities=\{capabilities\}/u);
  assert.match(accessDeniedSource, /Acceso no autorizado/u);
  assert.match(accessDeniedSource, /servidor vuelve a verificar cada solicitud/u);

  assert.match(shellSource, /requiredCapability: 'repairs\.read'/u);
  assert.match(shellSource, /navigation\.filter\(\(\{ requiredCapability \}\)/u);
  assert.match(shellSource, /hasOperationalCapability\(capabilities, requiredCapability\)/u);
  assert.doesNotMatch(dashboardSource, /\/reparaciones\/nueva|Nueva reparación/u);
  assert.doesNotMatch(dashboardSource, /PBI-024 no integrado/u);
  assert.match(dashboardSource, /Estación y sesión verificadas/u);
  assert.doesNotMatch(repairsSource, /to="\/reparaciones\/nueva"|Nueva reparación/u);
});

test('Repair reads include cookies and an operational note carries the current CSRF token', () => {
  assert.match(repairsApiSource, /credentials: 'include'/u);
  assert.match(repairsApiSource, /const CSRF_HEADER = 'X-SR-CSRF-Token'/u);
  assert.match(
    repairsApiSource,
    /addRepairOperationalNote\([\s\S]*?csrfToken: string,[\s\S]*?headers: \{ \[CSRF_HEADER\]: csrfToken \}/u,
  );
  assert.match(repairsApiSource, /response\.status === 401[\s\S]*?SESSION_INVALIDATED_EVENT/u);
  assert.match(sessionGateSource, /window\.addEventListener\(SESSION_INVALIDATED_EVENT, invalidate\)/u);
  assert.match(sessionGateSource, /setSnapshot\(null\)[\s\S]*?setPhase\('loading'\)/u);

  assert.match(detailSource, /hasOperationalCapability\(capabilities, 'repairs\.add_note'\)/u);
  assert.match(detailSource, /\{canAddNote \? <form className=\{styles\.noteComposer\}/u);
  assert.match(detailSource, /addRepairOperationalNote\(repair\.id,[\s\S]*?\}, csrfToken\)/u);
  assert.match(detailSource, /error instanceof PreviewApiError && error\.status === 403/u);
  assert.match(detailSource, /repair-note-draft\.\$\{sessionId\}\.\$\{repairId\}/u);
  assert.match(appSource, /sessionId=\{session\.sessionId\}/u);
  assert.doesNotMatch(detailSource, /repair-note-draft\.\$\{repairId\}/u);
});

test('uncataloged Repair writes have no visible controls in the current UI', () => {
  assert.doesNotMatch(
    detailSource,
    /assignRepairTechnician|reassignRepairTechnician|unassignRepairTechnician|listRepairTechnicians|startRepairDiagnosis|moveRepairToWorkshop/u,
  );
  assert.doesNotMatch(
    detailSource,
    />Asignar<|>Cambiar<|Quitar asignación|Iniciar diagnóstico|Mover a Taller/u,
  );
  assert.match(detailSource, /<dt>Técnico<\/dt><dd><span>\{currentTechnician/u);
  assert.match(detailSource, /Historial de asignaciones/u);
});
