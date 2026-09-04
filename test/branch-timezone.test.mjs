import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseBranchTimeZone,
  presentOperationalDateTime,
} from '../dist/modules/stations/application/branch-time-zone.js';

test('Branch time zones require IANA identifiers and reject fixed offsets', () => {
  assert.equal(parseBranchTimeZone('America/Hermosillo'), 'America/Hermosillo');
  assert.throws(() => parseBranchTimeZone('-07:00'), TypeError);
  assert.throws(() => parseBranchTimeZone('Etc/GMT+7'), TypeError);
  assert.throws(() => parseBranchTimeZone('not/a-time-zone'), TypeError);
});

test('an authoritative instant has branch-specific presentation without mutation', () => {
  const instant = new Date('2026-01-01T07:30:00.000Z');
  const originalMilliseconds = instant.getTime();

  const hermosillo = presentOperationalDateTime(
    instant,
    parseBranchTimeZone('America/Hermosillo'),
  );
  const tijuana = presentOperationalDateTime(
    instant,
    parseBranchTimeZone('America/Tijuana'),
  );

  assert.deepEqual(hermosillo, {
    date: '2026-01-01',
    time: '00:30',
    timeZone: 'America/Hermosillo',
  });
  assert.deepEqual(tijuana, {
    date: '2025-12-31',
    time: '23:30',
    timeZone: 'America/Tijuana',
  });
  assert.equal(instant.getTime(), originalMilliseconds);
  assert.ok(Object.isFrozen(hermosillo));
});
