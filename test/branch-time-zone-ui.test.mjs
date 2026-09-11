import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  BRANCH_TIME_ZONE_OPTIONS,
  branchTimeZoneOptions,
  humanBranchTimeZoneLabel,
} from '../apps/dev-preview-web/src/branch-time-zones.mjs';

const [apiSource, pageSource, settingsSource, appSource] = await Promise.all([
  readFile('apps/dev-preview-web/src/branch-settings-api.ts', 'utf8'),
  readFile('apps/dev-preview-web/src/pages/BranchSettingsPage.tsx', 'utf8'),
  readFile('apps/dev-preview-web/src/pages/SettingsPage.tsx', 'utf8'),
  readFile('apps/dev-preview-web/src/App.tsx', 'utf8'),
]);

const [repairDetailSource, repairsSource, sessionApiSource, sessionControllerSource] = await Promise.all([
  readFile('apps/dev-preview-web/src/pages/RepairDetailPage.tsx', 'utf8'),
  readFile('apps/dev-preview-web/src/pages/RepairsPage.tsx', 'utf8'),
  readFile('apps/dev-preview-web/src/session/session-api.ts', 'utf8'),
  readFile('src/modules/access/presentation/access-session.controller.ts', 'utf8'),
]);

test('human Branch timezone labels derive their offset from IANA at presentation time', () => {
  assert.equal(
    humanBranchTimeZoneLabel('America/Hermosillo', new Date('2026-09-08T18:30:00.000Z')),
    '(UTC-07:00) Hermosillo',
  );
  assert.equal(
    humanBranchTimeZoneLabel('America/Tijuana', new Date('2026-01-08T18:30:00.000Z')),
    '(UTC-08:00) Tijuana',
  );
  assert.equal(
    humanBranchTimeZoneLabel('America/Tijuana', new Date('2026-09-08T18:30:00.000Z')),
    '(UTC-07:00) Tijuana',
  );
  assert.deepEqual(
    BRANCH_TIME_ZONE_OPTIONS.map(({ timeZone }) => timeZone),
    [
      'America/Tijuana',
      'America/Hermosillo',
      'America/Mazatlan',
      'America/Mexico_City',
      'America/Monterrey',
      'America/Cancun',
    ],
  );
  assert.ok(branchTimeZoneOptions('America/Chihuahua').some(({ timeZone }) => timeZone === 'America/Chihuahua'));
});

test('branch settings UI keeps IANA internal and does not send client authority scope', () => {
  assert.match(apiSource, /const BRANCH_SETTINGS_PATH = '\/api\/access\/administration\/branch';/u);
  assert.match(apiSource, /JSON\.stringify\(\{ timeZone \}\)/u);
  assert.doesNotMatch(apiSource, /JSON\.stringify\([^\n]*(?:tenantId|branchId|stationId)/u);
  assert.match(pageSource, /Zona horaria/u);
  assert.match(pageSource, /Zona IANA:/u);
  assert.match(pageSource, /humanBranchTimeZoneLabel\(option\.timeZone\)/u);
  assert.match(pageSource, /Los instantes históricos siguen en UTC/u);
  assert.match(settingsSource, /to="\/configuracion\/sucursal"/u);
  assert.match(appSource, /path="\/configuracion\/sucursal"[\s\S]*?capability="access_matrix\.manage"/u);
});

test('repair timestamps use the trusted Branch IANA timezone only for presentation', () => {
  assert.match(sessionControllerSource, /timeZone: branch\.timeZone/u);
  assert.match(sessionApiSource, /readonly timeZone: string;/u);
  assert.match(sessionApiSource, /new Intl\.DateTimeFormat\('en-US', \{ timeZone \}\)/u);
  assert.match(repairDetailSource, /timeZone,\s*\}\)\.format\(new Date\(value\)\)/u);
  assert.match(repairDetailSource, /compactTimelineAt\(entry\.occurredAt, timeZone\)/u);
  assert.match(repairDetailSource, /function compactTimelineAt[\s\S]*timeZone,[\s\S]*formatToParts/u);
  assert.match(repairsSource, /function formatReceivedAt\(value: string, timeZone: string\)/u);
  assert.match(repairsSource, /timeZone,\s*\}\)\.format\(new Date\(value\)\)/u);
  assert.doesNotMatch(repairsSource, /timeZone: 'UTC'/u);
});
