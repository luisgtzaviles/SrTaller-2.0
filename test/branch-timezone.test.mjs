import assert from 'node:assert/strict';
import test from 'node:test';

import {
  branchLocalCalendarBoundaryToUtc,
  branchLocalCalendarDate,
  parseBranchTimeZone,
  presentOperationalDateTime,
} from '../dist/modules/stations/application/branch-time-zone.js';

test('Branch time zones require IANA identifiers and reject fixed offsets', () => {
  assert.equal(parseBranchTimeZone('America/Hermosillo'), 'America/Hermosillo');
  assert.throws(() => parseBranchTimeZone('-07:00'), TypeError);
  assert.throws(() => parseBranchTimeZone('Etc/GMT+7'), TypeError);
  assert.throws(() => parseBranchTimeZone('not/a-time-zone'), TypeError);
});

test('Branch-local calendar boundaries use IANA rules and leave authoritative instants unchanged', () => {
  const hermosillo = parseBranchTimeZone('America/Hermosillo');
  const cancun = parseBranchTimeZone('America/Cancun');
  const persistedInstant = new Date('2026-08-21T06:30:00.000Z');
  const originalMilliseconds = persistedInstant.getTime();

  assert.equal(branchLocalCalendarDate(persistedInstant, hermosillo), '2026-08-20');
  assert.equal(branchLocalCalendarDate(persistedInstant, cancun), '2026-08-21');
  assert.equal(
    branchLocalCalendarBoundaryToUtc('2026-08-21', hermosillo).toISOString(),
    '2026-08-21T07:00:00.000Z',
  );
  assert.equal(
    branchLocalCalendarBoundaryToUtc('2026-08-21', cancun).toISOString(),
    '2026-08-21T05:00:00.000Z',
  );
  assert.equal(persistedInstant.getTime(), originalMilliseconds);
});

test('Branch-local calendar boundaries include their start, exclude the next start, and follow DST', () => {
  const tijuana = parseBranchTimeZone('America/Tijuana');
  const beforeSpringChange = branchLocalCalendarBoundaryToUtc('2026-03-08', tijuana);
  const afterSpringChange = branchLocalCalendarBoundaryToUtc('2026-03-09', tijuana);
  const beforeFallChange = branchLocalCalendarBoundaryToUtc('2026-11-01', tijuana);
  const afterFallChange = branchLocalCalendarBoundaryToUtc('2026-11-02', tijuana);

  assert.equal(beforeSpringChange.toISOString(), '2026-03-08T08:00:00.000Z');
  assert.equal(afterSpringChange.toISOString(), '2026-03-09T07:00:00.000Z');
  assert.equal(beforeFallChange.toISOString(), '2026-11-01T07:00:00.000Z');
  assert.equal(afterFallChange.toISOString(), '2026-11-02T08:00:00.000Z');
  assert.equal(branchLocalCalendarDate(beforeSpringChange, tijuana), '2026-03-08');
  assert.equal(
    branchLocalCalendarDate(new Date(beforeSpringChange.getTime() - 1), tijuana),
    '2026-03-07',
  );
  assert.equal(branchLocalCalendarDate(afterSpringChange, tijuana), '2026-03-09');
  assert.throws(
    () => branchLocalCalendarBoundaryToUtc('2026-02-30', tijuana),
    TypeError,
  );
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
